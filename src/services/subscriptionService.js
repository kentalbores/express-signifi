const Stripe = require('stripe');
const sql = require('../config/database');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// Get or create learner subscription
async function getOrCreateLearnerSubscription(learnerId) {
  const existing = await sql`
    SELECT * FROM learner_subscription WHERE learner_id = ${learnerId} LIMIT 1
  `;
  if (existing.length > 0) return existing[0];
  
  const newSub = await sql`
    INSERT INTO learner_subscription (learner_id, plan_id, status)
    VALUES (${learnerId}, 'free', 'free') RETURNING *
  `;
  return newSub[0];
}

// Check if learner has premium
async function hasActivePremium(learnerId) {
  const sub = await sql`
    SELECT status FROM learner_subscription 
    WHERE learner_id = ${learnerId} AND status IN ('active', 'trialing') LIMIT 1
  `;
  return sub.length > 0;
}

// Get institution subscription
async function getOrCreateInstitutionSubscription(institutionId) {
  const existing = await sql`
    SELECT * FROM institution_subscription WHERE institution_id = ${institutionId} LIMIT 1
  `;
  if (existing.length > 0) return existing[0];
  
  const newSub = await sql`
    INSERT INTO institution_subscription (institution_id, plan_id, status)
    VALUES (${institutionId}, 'basic_verified', 'active') RETURNING *
  `;
  return newSub[0];
}

module.exports = {
  stripe,
  getOrCreateLearnerSubscription,
  hasActivePremium,
  getOrCreateInstitutionSubscription
};
