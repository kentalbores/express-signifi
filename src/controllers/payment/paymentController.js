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

// POST /api/payments/intent
// body: { course_id: number }
// auth: Bearer token (learner)
module.exports.createPaymentIntent = async (req, res) => {
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

    // Convert to minor units (e.g., cents)
    const amount = Math.round(priceNumber * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: STRIPE_CURRENCY,
      metadata: {
        learner_id: String(learnerId),
        course_id: String(course.course_id),
        price_at_creation: String(priceNumber),
      },
      description: `Purchase course #${course.course_id} - ${course.title || ''}`.trim(),
      automatic_payment_methods: { enabled: true },
    });

    return res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      currency: STRIPE_CURRENCY,
      amount,
    });
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
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata || {};
      const learnerId = Number(metadata.learner_id);
      const courseId = Number(metadata.course_id);
      const amountReceived = Number(paymentIntent.amount_received || paymentIntent.amount || 0);

      if (!learnerId || !courseId) {
        console.warn('Webhook missing learner_id or course_id in metadata');
      } else {
        // Idempotency: avoid duplicate enrollments
        const existing = await sql`
          SELECT enroll_id FROM enrollment WHERE learner_id = ${learnerId} AND course_id = ${courseId} LIMIT 1
        `;

        let enrollId;
        if (existing.length > 0) {
          enrollId = existing[0].enroll_id;
        } else {
          const enr = await sql`
            INSERT INTO enrollment (learner_id, course_id, status)
            VALUES (${learnerId}, ${courseId}, ${'ongoing'})
            RETURNING enroll_id
          `;
          enrollId = enr[0].enroll_id;
        }

        // Upsert transaction with transaction_id referencing enrollment
        const amountDecimal = amountReceived / 100.0;
        try {
          await sql`
            INSERT INTO "transaction" (transaction_id, method, amount, status)
            VALUES (${enrollId}, ${'stripe'}, ${amountDecimal}, ${'completed'})
            ON CONFLICT (transaction_id) DO UPDATE SET
              method = EXCLUDED.method,
              amount = EXCLUDED.amount,
              status = EXCLUDED.status
          `;
        } catch (txErr) {
          console.error('Error upserting transaction from webhook:', txErr);
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


