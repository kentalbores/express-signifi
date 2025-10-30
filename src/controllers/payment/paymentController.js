const sql = require('../../config/database');
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();

if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY in environment');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// ============================================
// Revenue Stream 2: Course Marketplace Payment
// ============================================

// POST /api/payments/create-course-payment
// body: { course_id: number }
// auth: Bearer token (learner)
// Uses Stripe Connect Destination Charges for 20% platform fee
module.exports.createCoursePayment = async (req, res) => {
  try {
    const learnerId = req.user && req.user.user_id;
    const { course_id } = req.body;

    if (!learnerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!course_id || isNaN(course_id)) {
      return res.status(400).json({ error: 'Invalid course_id' });
    }

    // Fetch course and price
    const courses = await sql`
      SELECT course_id, title, price, is_published
      FROM course
      WHERE course_id = ${course_id}
    `;

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courses[0];
    const priceNumber = Number(course.price || 0);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      return res.status(400).json({ error: 'Invalid course price' });
    }

    // 1) Create a course order (pending) and order item
    const orderNumber = `ORD-${Date.now()}-${learnerId}`;
    const currencyUpper = (STRIPE_CURRENCY || 'usd').toUpperCase();
    const orderRows = await sql`
      INSERT INTO course_order (
        order_number, user_id, subtotal, tax_amount, discount_amount, total_amount, currency, status
      ) VALUES (
        ${orderNumber}, ${learnerId}, ${priceNumber}, ${0}, ${0}, ${priceNumber}, ${currencyUpper}, ${'pending'}
      ) RETURNING order_id
    `;
    const orderId = orderRows[0].order_id;

    await sql`
      INSERT INTO order_item (order_id, course_id, price, discount_amount, final_price)
      VALUES (${orderId}, ${course.course_id}, ${priceNumber}, ${0}, ${priceNumber})
    `;

    // 2) If free course, complete immediately without Stripe
    const amount = Math.round(priceNumber * 100); // minor units
    if (amount === 0) {
      // Complete order
      await sql`UPDATE course_order SET status = ${'completed'} WHERE order_id = ${orderId}`;
      // Record zero-amount transaction
      await sql`
        INSERT INTO payment_transaction (
          order_id, payment_gateway, gateway_transaction_id, payment_method,
          amount, currency, status, gateway_response, completed_at
        ) VALUES (
          ${orderId}, ${'free'}, ${null}, ${'none'},
          ${0}, ${(STRIPE_CURRENCY || 'usd').toUpperCase()}, ${'completed'}, ${null}, NOW()
        )
      `;
      // Ensure enrollment
      const existing = await sql`
        SELECT enroll_id FROM enrollment WHERE learner_id = ${learnerId} AND course_id = ${course.course_id} LIMIT 1
      `;
      if (existing.length === 0) {
        await sql`INSERT INTO enrollment (learner_id, course_id, status) VALUES (${learnerId}, ${course.course_id}, ${'active'})`;
      }
      return res.status(201).json({
        clientSecret: null,
        paymentIntentId: null,
        currency: STRIPE_CURRENCY,
        amount,
        order_id: orderId,
        noPaymentRequired: true
      });
    }

    // 3) Enforce Stripe minimums for common currency (avoid opaque 500s)
    if (STRIPE_CURRENCY === 'usd' && amount > 0 && amount < 50) {
      return res.status(400).json({
        error: 'Amount below Stripe minimum for usd (>= 50 cents). Increase course price or set it to 0 for free checkout.'
      });
    }

    // 4) Get educator and their Stripe account
    const educators = await sql`
      SELECT user_id, payout_details
      FROM educator
      WHERE user_id = ${course.educator_id}
      LIMIT 1
    `;

    if (educators.length === 0) {
      return res.status(400).json({ error: 'Educator not found' });
    }

    const educator = educators[0];
    const payoutDetails = educator.payout_details || {};
    const educatorStripeId = payoutDetails.stripeAccountId;

    if (!educatorStripeId) {
      return res.status(400).json({ 
        error: 'Educator payment account not configured. Please contact support.' 
      });
    }

    // 5) Calculate platform fee (20%)
    const applicationFeeAmount = Math.round(amount * 0.20);

    // 6) Create Stripe PaymentIntent with Connect
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: STRIPE_CURRENCY,
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: educatorStripeId,
        },
        metadata: {
          order_id: String(orderId),
          learner_id: String(learnerId),
          course_id: String(course.course_id),
          educator_id: String(course.educator_id),
          price_at_creation: String(priceNumber),
          payment_type: 'course_purchase'
        },
        description: `Purchase course #${course.course_id} - ${course.title || ''}`.trim(),
        automatic_payment_methods: { enabled: true },
      });

      return res.status(201).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        currency: STRIPE_CURRENCY,
        amount,
        order_id: orderId
      });
    } catch (stripeErr) {
      console.error('Stripe create PaymentIntent error:', stripeErr);
      return res.status(400).json({ error: 'Stripe error', detail: stripeErr && stripeErr.message ? stripeErr.message : 'Unable to create payment intent' });
    }
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/payments/webhook (raw body)
module.exports.stripeWebhook = async (req, res) => {
  let event;

  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      // If no webhook secret configured, accept as-is (not recommended for production)
      event = req.body;
    } else {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    }
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const eventType = event.type;
    const eventData = event.data.object;
    const metadata = eventData.metadata || {};

    // ============================================
    // Course Purchase Payment Success
    // ============================================
    if (eventType === 'payment_intent.succeeded' && metadata.payment_type === 'course_purchase') {
      const paymentIntent = eventData;
      const learnerId = Number(metadata.learner_id);
      const courseId = Number(metadata.course_id);
      const orderId = Number(metadata.order_id);
      const amountReceived = Number(paymentIntent.amount_received || paymentIntent.amount || 0);

      if (!learnerId || !courseId || !orderId) {
        console.warn('Webhook missing learner_id, course_id or order_id in metadata');
      } else {
        // 1) Mark order completed
        await sql`UPDATE course_order SET status = ${'completed'} WHERE order_id = ${orderId}`;

        // 2) Insert payment transaction
        const amountDecimal = amountReceived / 100.0;
        const currencyUpper = (paymentIntent.currency || STRIPE_CURRENCY || 'usd').toUpperCase();
        try {
          await sql`
            INSERT INTO payment_transaction (
              order_id, payment_gateway, gateway_transaction_id, payment_method,
              amount, currency, status, gateway_response, completed_at
            ) VALUES (
              ${orderId}, ${'stripe'}, ${paymentIntent.id}, ${'card'},
              ${amountDecimal}, ${currencyUpper}, ${'completed'}, ${JSON.stringify(paymentIntent)}, NOW()
            )
          `;
        } catch (txErr) {
          console.error('Error creating payment_transaction from webhook:', txErr);
        }

        // 3) Idempotent enrollment creation
        const existing = await sql`
          SELECT enroll_id FROM enrollment WHERE learner_id = ${learnerId} AND course_id = ${courseId} LIMIT 1
        `;
        if (existing.length === 0) {
          try {
            await sql`
              INSERT INTO enrollment (learner_id, course_id, status)
              VALUES (${learnerId}, ${courseId}, ${'active'})
            `;
          } catch (enrErr) {
            console.error('Error creating enrollment from webhook:', enrErr);
          }
        }
      }
    }

    // ============================================
    // Subscription Checkout Completed
    // ============================================
    if (eventType === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionMetadata = session.metadata || {};

      // Handle Learner Subscription
      if (sessionMetadata.learner_id) {
        const learnerId = Number(sessionMetadata.learner_id);
        const planId = sessionMetadata.plan_id || 'premium_monthly';
        const stripeSubscriptionId = session.subscription;
        const stripeCustomerId = session.customer;

        try {
          await sql`
            INSERT INTO learner_subscription (
              learner_id, plan_id, stripe_subscription_id, stripe_customer_id, status
            ) VALUES (
              ${learnerId}, ${planId}, ${stripeSubscriptionId}, ${stripeCustomerId}, 'active'
            )
            ON CONFLICT (learner_id) 
            DO UPDATE SET
              plan_id = ${planId},
              stripe_subscription_id = ${stripeSubscriptionId},
              stripe_customer_id = ${stripeCustomerId},
              status = 'active',
              updated_at = NOW()
          `;
          console.log(`Learner subscription activated for learner_id: ${learnerId}`);
        } catch (err) {
          console.error('Error updating learner subscription:', err);
        }
      }

      // Handle Institution Subscription
      if (sessionMetadata.institution_id) {
        const institutionId = Number(sessionMetadata.institution_id);
        const planId = sessionMetadata.plan_id || 'pro_monthly';
        const stripeSubscriptionId = session.subscription;
        const stripeCustomerId = session.customer;

        // Set limits based on plan
        let learnerLimit = 1000;
        let educatorLimit = 50;
        let adminLimit = 5;

        if (planId.includes('enterprise')) {
          learnerLimit = 10000;
          educatorLimit = 500;
          adminLimit = 20;
        }

        try {
          await sql`
            INSERT INTO institution_subscription (
              institution_id, plan_id, stripe_subscription_id, stripe_customer_id, 
              status, learner_limit, educator_limit, admin_limit
            ) VALUES (
              ${institutionId}, ${planId}, ${stripeSubscriptionId}, ${stripeCustomerId}, 
              'active', ${learnerLimit}, ${educatorLimit}, ${adminLimit}
            )
            ON CONFLICT (institution_id) 
            DO UPDATE SET
              plan_id = ${planId},
              stripe_subscription_id = ${stripeSubscriptionId},
              stripe_customer_id = ${stripeCustomerId},
              status = 'active',
              learner_limit = ${learnerLimit},
              educator_limit = ${educatorLimit},
              admin_limit = ${adminLimit},
              updated_at = NOW()
          `;
          console.log(`Institution subscription activated for institution_id: ${institutionId}`);
        } catch (err) {
          console.error('Error updating institution subscription:', err);
        }
      }
    }

    // ============================================
    // Subscription Invoice Payment Succeeded
    // ============================================
    if (eventType === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const stripeSubscriptionId = invoice.subscription;
      const periodEnd = new Date(invoice.period_end * 1000);
      const periodStart = new Date(invoice.period_start * 1000);

      if (stripeSubscriptionId) {
        // Update learner subscription
        try {
          await sql`
            UPDATE learner_subscription
            SET status = 'active',
                current_period_end = ${periodEnd},
                current_period_start = ${periodStart},
                updated_at = NOW()
            WHERE stripe_subscription_id = ${stripeSubscriptionId}
          `;
        } catch (err) {
          console.error('Error updating learner subscription period:', err);
        }

        // Update institution subscription
        try {
          await sql`
            UPDATE institution_subscription
            SET status = 'active',
                current_period_end = ${periodEnd},
                current_period_start = ${periodStart},
                updated_at = NOW()
            WHERE stripe_subscription_id = ${stripeSubscriptionId}
          `;
        } catch (err) {
          console.error('Error updating institution subscription period:', err);
        }
      }
    }

    // ============================================
    // Subscription Invoice Payment Failed
    // ============================================
    if (eventType === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const stripeSubscriptionId = invoice.subscription;

      if (stripeSubscriptionId) {
        // Update learner subscription
        try {
          await sql`
            UPDATE learner_subscription
            SET status = 'past_due', updated_at = NOW()
            WHERE stripe_subscription_id = ${stripeSubscriptionId}
          `;
        } catch (err) {
          console.error('Error marking learner subscription past_due:', err);
        }

        // Update institution subscription
        try {
          await sql`
            UPDATE institution_subscription
            SET status = 'past_due', updated_at = NOW()
            WHERE stripe_subscription_id = ${stripeSubscriptionId}
          `;
        } catch (err) {
          console.error('Error marking institution subscription past_due:', err);
        }
      }
    }

    // ============================================
    // Subscription Deleted/Canceled
    // ============================================
    if (eventType === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const stripeSubscriptionId = subscription.id;

      // Update learner subscription
      try {
        await sql`
          UPDATE learner_subscription
          SET status = 'canceled', updated_at = NOW()
          WHERE stripe_subscription_id = ${stripeSubscriptionId}
        `;
      } catch (err) {
        console.error('Error canceling learner subscription:', err);
      }

      // Update institution subscription
      try {
        await sql`
          UPDATE institution_subscription
          SET status = 'canceled', updated_at = NOW()
          WHERE stripe_subscription_id = ${stripeSubscriptionId}
        `;
      } catch (err) {
        console.error('Error canceling institution subscription:', err);
      }
    }

    // ============================================
    // Course Payment Failed
    // ============================================
    if (eventType === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata || {};
      const orderId = Number(metadata.order_id);
      const failureReason = paymentIntent.last_payment_error && paymentIntent.last_payment_error.message ? paymentIntent.last_payment_error.message : 'payment_failed';
      if (orderId) {
        try {
          await sql`UPDATE course_order SET status = ${'cancelled'} WHERE order_id = ${orderId}`;
          await sql`
            INSERT INTO payment_transaction (
              order_id, payment_gateway, gateway_transaction_id, payment_method,
              amount, currency, status, gateway_response, failure_reason
            ) VALUES (
              ${orderId}, ${'stripe'}, ${paymentIntent.id}, ${'card'},
              ${0}, ${(paymentIntent.currency || STRIPE_CURRENCY || 'usd').toUpperCase()}, ${'failed'}, ${JSON.stringify(paymentIntent)}, ${failureReason}
            )
          `;
        } catch (err) {
          console.error('Error recording failed transaction:', err);
        }
      }
    }

    // Optionally handle other events like payment_intent.payment_failed
  } catch (handlerErr) {
    console.error('Error handling Stripe webhook:', handlerErr);
    // Still acknowledge to avoid retries if it's not a transient error
  }

  return res.status(200).json({ received: true });
};


