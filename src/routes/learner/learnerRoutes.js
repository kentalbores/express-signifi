const express = require('express');
const router = express.Router();

const {
  getLearnerProfile,
  updateLearnerProfile,
  getLearnerProgress,
  listEnrollments,
  enrollCourse,
  getEnrollmentProgress,
  listActivity,
  upsertActivity,
  listAttempts,
  submitAttempt,
  listNotifications,
  markAllNotifications,
  markNotification,
  listMinigameAttempts,
  submitMinigameAttempt,
} = require('../../controllers/learner/learnerController');
const { authenticateToken, requireLearner } = require('../../middleware/auth');

// All learner routes require authentication and learner role
const learnerAuth = [authenticateToken, requireLearner];


//remove learnerAuth for now

// Profile
router.get('/profile', getLearnerProfile);
router.patch('/profile', updateLearnerProfile);
router.get('/progress', getLearnerProgress);

// Enrollments
router.get('/enrollments', listEnrollments);
router.post('/enrollments',  enrollCourse);
router.get('/enrollments/:courseId/progress',  getEnrollmentProgress);

// Activity
router.get('/activity',  listActivity);
router.post('/activity',  upsertActivity);

// Attempts
router.get('/attempts',  listAttempts);
router.post('/attempts',  submitAttempt);

// Notifications
router.get('/notifications',  listNotifications);
router.post('/notifications/read-all',  markAllNotifications);
router.post('/notifications/:notificationId/read',  markNotification);

// Minigames
router.get('/minigames/attempts',  listMinigameAttempts);
router.post('/minigames/attempts',  submitMinigameAttempt);

module.exports = router;


