const express = require('express');
const router = express.Router();
const { authenticateToken, requireLearner, requireInstitutionAdmin } = require('../../middleware/auth');
const {
  createLearnerSession,
  getLearnerStatus,
  cancelLearnerSubscription,
  createInstitutionSession,
  getInstitutionStatus,
  cancelInstitutionSubscription,
  getSubscriptionPlans,
} = require('../../controllers/subscription/subscriptionController');

// Public routes (no auth required)
router.get('/plans', getSubscriptionPlans);

// Learner subscription routes
router.post('/create-learner-session', authenticateToken, requireLearner, createLearnerSession);
router.get('/learner-status', authenticateToken, requireLearner, getLearnerStatus);
router.post('/cancel-learner', authenticateToken, requireLearner, cancelLearnerSubscription);

// Institution subscription routes
router.post('/create-institution-session', authenticateToken, requireInstitutionAdmin, createInstitutionSession);
router.get('/institution-status', authenticateToken, requireInstitutionAdmin, getInstitutionStatus);
router.post('/cancel-institution', authenticateToken, requireInstitutionAdmin, cancelInstitutionSubscription);

module.exports = router;
