const express = require('express');
const router = express.Router();
const { authenticateToken, requireLearner, requireInstitutionAdmin } = require('../../middleware/auth');
const {
  createLearnerSession,
  getLearnerStatus,
  cancelLearnerSubscription,
  createInstitutionSession,
  getInstitutionStatus,
} = require('../../controllers/subscription/subscriptionController');

// Learner subscription routes
router.post('/create-learner-session', authenticateToken, requireLearner, createLearnerSession);
router.get('/learner-status', authenticateToken, requireLearner, getLearnerStatus);
router.post('/cancel-learner', authenticateToken, requireLearner, cancelLearnerSubscription);

// Institution subscription routes
router.post('/create-institution-session', authenticateToken, requireInstitutionAdmin, createInstitutionSession);
router.get('/institution-status', authenticateToken, requireInstitutionAdmin, getInstitutionStatus);

module.exports = router;
