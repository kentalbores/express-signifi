const sql = require('../../config/database');
const { stripe } = require('../../services/subscriptionService');

const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'php').toLowerCase();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STRIPE_LEARNER_PREMIUM_MONTHLY_PRICE_ID = process.env.STRIPE_LEARNER_PREMIUM_MONTHLY_PRICE_ID;
const STRIPE_LEARNER_PREMIUM_YEARLY_PRICE_ID = process.env.STRIPE_LEARNER_PREMIUM_YEARLY_PRICE_ID;
const STRIPE_INSTITUTION_PRO_MONTHLY_PRICE_ID = process.env.STRIPE_INSTITUTION_PRO_MONTHLY_PRICE_ID;
const STRIPE_INSTITUTION_PRO_YEARLY_PRICE_ID = process.env.STRIPE_INSTITUTION_PRO_YEARLY_PRICE_ID;
// ============================================
// Revenue Stream 1: Learner Subscription
// ============================================

/**
 * POST /api/subscriptions/create-learner-session
 * Create Stripe Checkout session for learner to subscribe to SigniFi Pro
 */
module.exports.createLearnerSession = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    const { planId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    // Verify user is a learner
    const learner = await sql`
      SELECT user_id FROM learner WHERE user_id = ${userId} LIMIT 1
    `;

    if (learner.length === 0) {
      return res.status(403).json({ error: 'Only learners can subscribe to SigniFi Pro' });
    }

    let stripePriceId;
    if (planId === 'premium_monthly') {
      stripePriceId = STRIPE_LEARNER_PREMIUM_MONTHLY_PRICE_ID;
    } else if (planId === 'premium_yearly') {
      stripePriceId = STRIPE_LEARNER_PREMIUM_YEARLY_PRICE_ID;
    } else {
      return res.status(400).json({ error: `Invalid planId: ${planId}` });
    }

    if (!stripePriceId) {
      console.error(`Stripe Price ID not configured for plan: ${planId}`);
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${BASE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/subscription/cancel`,
      metadata: {
        learner_id: String(userId),
        plan_id: planId,
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating learner subscription session:', error);
    return res.status(500).json({ 
      error: 'Failed to create subscription session',
      detail: error.message 
    });
  }
};

/**
 * GET /api/subscriptions/learner-status
 * Get current learner's subscription status
 */
module.exports.getLearnerStatus = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`📊 Checking subscription status for learner_id: ${userId}`);

    const subscription = await sql`
      SELECT * FROM learner_subscription 
      WHERE learner_id = ${userId} 
      LIMIT 1
    `;

    if (subscription.length === 0) {
      console.log(`ℹ️ No subscription found for learner_id: ${userId}, returning free status`);
      return res.status(200).json({
        status: 'free',
        plan_id: 'free',
        isPremium: false,
      });
    }

    const sub = subscription[0];
    const isPremium = sub.status === 'active' || sub.status === 'trialing';

    console.log(`✅ Subscription found for learner_id: ${userId}`, {
      status: sub.status,
      plan_id: sub.plan_id,
      isPremium,
      stripe_subscription_id: sub.stripe_subscription_id,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
    });

    return res.status(200).json({
      status: sub.status,
      plan_id: sub.plan_id,
      isPremium,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      stripe_subscription_id: sub.stripe_subscription_id,
    });
  } catch (error) {
    console.error('❌ Error getting learner subscription status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/subscriptions/cancel-learner
 * Cancel learner subscription (at period end)
 */
module.exports.cancelLearnerSubscription = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await sql`
      SELECT stripe_subscription_id FROM learner_subscription 
      WHERE learner_id = ${userId} 
      LIMIT 1
    `;

    if (subscription.length === 0 || !subscription[0].stripe_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const stripeSubId = subscription[0].stripe_subscription_id;

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(stripeSubId, {
      cancel_at_period_end: true,
    });

    // Update database
    await sql`
      UPDATE learner_subscription
      SET cancel_at_period_end = true, updated_at = NOW()
      WHERE learner_id = ${userId}
    `;

    return res.status(200).json({ 
      message: 'Subscription will be canceled at the end of the billing period' 
    });
  } catch (error) {
    console.error('Error canceling learner subscription:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// ============================================
// Revenue Stream 3: Institution Subscription
// ============================================

/**
 * POST /api/subscriptions/create-institution-session
 * Create Stripe Checkout session for institution admin to upgrade
 */
module.exports.createInstitutionSession = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    const { planId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    // Get institution admin and their institution
    const admin = await sql`
      SELECT institution_id FROM institutionadmin 
      WHERE user_id = ${userId} 
      LIMIT 1
    `;

    if (admin.length === 0) {
      return res.status(403).json({ error: 'Only institution admins can manage subscriptions' });
    }

    const institutionId = admin[0].institution_id;

    // Map planId to Stripe Price ID
    let stripePriceId;
    if (planId === 'pro_monthly') {
      stripePriceId = STRIPE_INSTITUTION_PRO_MONTHLY_PRICE_ID;
    } else if (planId === 'pro_yearly') {
      stripePriceId = STRIPE_INSTITUTION_PRO_YEARLY_PRICE_ID;
    } else {
      return res.status(400).json({ error: `Invalid planId: ${planId}. Valid options: pro_monthly, pro_yearly` });
    }

    if (!stripePriceId) {
      console.error(`Stripe Price ID not configured for plan: ${planId}`);
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${BASE_URL}/institution/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/institution/subscription/cancel`,
      metadata: {
        institution_id: String(institutionId),
        plan_id: planId,
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating institution subscription session:', error);
    return res.status(500).json({ 
      error: 'Failed to create subscription session',
      detail: error.message 
    });
  }
};

/**
 * GET /api/subscriptions/institution-status
 * Get institution subscription status
 */
module.exports.getInstitutionStatus = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get institution admin's institution
    const admin = await sql`
      SELECT institution_id FROM institutionadmin 
      WHERE user_id = ${userId} 
      LIMIT 1
    `;

    if (admin.length === 0) {
      return res.status(403).json({ error: 'Not an institution admin' });
    }

    const institutionId = admin[0].institution_id;

    const subscription = await sql`
      SELECT * FROM institution_subscription 
      WHERE institution_id = ${institutionId} 
      LIMIT 1
    `;

    if (subscription.length === 0) {
      return res.status(200).json({
        status: 'basic_verified',
        plan_id: 'basic_verified',
        learner_limit: 100,
        educator_limit: 10,
        admin_limit: 1,
      });
    }

    const sub = subscription[0];

    return res.status(200).json({
      status: sub.status,
      plan_id: sub.plan_id,
      learner_limit: sub.learner_limit,
      educator_limit: sub.educator_limit,
      admin_limit: sub.admin_limit,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
    });
  } catch (error) {
    console.error('Error getting institution subscription status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/subscriptions/cancel-institution
 * Cancel institution subscription (at period end)
 */
module.exports.cancelInstitutionSubscription = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get institution admin's institution
    const admin = await sql`
      SELECT institution_id FROM institutionadmin 
      WHERE user_id = ${userId} 
      LIMIT 1
    `;

    if (admin.length === 0) {
      return res.status(403).json({ error: 'Not an institution admin' });
    }

    const institutionId = admin[0].institution_id;

    const subscription = await sql`
      SELECT stripe_subscription_id FROM institution_subscription 
      WHERE institution_id = ${institutionId} 
      LIMIT 1
    `;

    if (subscription.length === 0 || !subscription[0].stripe_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const stripeSubId = subscription[0].stripe_subscription_id;

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(stripeSubId, {
      cancel_at_period_end: true,
    });

    // Update database
    await sql`
      UPDATE institution_subscription
      SET cancel_at_period_end = true, updated_at = NOW()
      WHERE institution_id = ${institutionId}
    `;

    return res.status(200).json({ 
      message: 'Subscription will be canceled at the end of the billing period' 
    });
  } catch (error) {
    console.error('Error canceling institution subscription:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans with pricing
 */
module.exports.getSubscriptionPlans = async (req, res) => {
  try {
    // Return hardcoded plans for now (could fetch from Stripe in the future)
    const plans = [
      {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        description: 'Full access to all courses and features',
        price: 199,
        currency: 'PHP',
        interval: 'month',
        stripePriceId: STRIPE_LEARNER_PREMIUM_MONTHLY_PRICE_ID,
        features: [
          'Unlimited Access to All Courses',
          'Advanced Progress Tracking',
          'Offline Course Downloads',
          'Priority Support',
          'Ad-Free Experience'
        ]
      },
      {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        description: 'Full access to all courses and features - Save 16%!',
        price: 1499,
        currency: 'PHP',
        interval: 'year',
        stripePriceId: STRIPE_LEARNER_PREMIUM_YEARLY_PRICE_ID,
        features: [
          'Unlimited Access to All Courses',
          'Advanced Progress Tracking',
          'Offline Course Downloads',
          'Priority Support',
          'Ad-Free Experience',
          'Save 16% compared to monthly'
        ]
      }
    ];

    return res.status(200).json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
