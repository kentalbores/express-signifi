const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Learners
 *   description: Learner profile management endpoints
 */

/**
 * @swagger
 * /api/learner/:
 *   get:
 *     summary: Get all learners
 *     tags: [Learners]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended, graduated]
 *         description: Filter by learner status
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *     responses:
 *       200:
 *         description: Learners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                       student_id:
 *                         type: string
 *                       status:
 *                         type: string
 *                       learning_streak:
 *                         type: integer
 *                       total_points:
 *                         type: integer
 *                       level:
 *                         type: integer
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       email:
 *                         type: string
 *   post:
 *     summary: Create learner profile
 *     tags: [Learners]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User account ID to create learner profile for
 *               student_id:
 *                 type: string
 *                 description: Unique student identifier
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, graduated]
 *                 default: active
 *               preferred_learning_style:
 *                 type: string
 *                 description: Learner's preferred learning style
 *     responses:
 *       201:
 *         description: Learner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/learner/{id}:
 *   get:
 *     summary: Get learner by ID
 *     tags: [Learners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Learner user ID
 *     responses:
 *       200:
 *         description: Learner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Learner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update learner profile
 *     tags: [Learners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Learner user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, graduated]
 *               learning_streak:
 *                 type: integer
 *               total_points:
 *                 type: integer
 *               level:
 *                 type: integer
 *               preferred_learning_style:
 *                 type: string
 *     responses:
 *       200:
 *         description: Learner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Learner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete learner profile
 *     tags: [Learners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Learner user ID
 *     responses:
 *       200:
 *         description: Learner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Learner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/learner/profile:
 *   get:
 *     summary: Get current learner profile
 *     tags: [Learners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learner profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Learner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Update current learner profile
 *     tags: [Learners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /api/learner/enrollments:
 *   get:
 *     summary: List learner enrollments
 *     tags: [Learners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Enroll in a course
 *     tags: [Learners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_id
 *             properties:
 *               course_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /api/learner/activity:
 *   get:
 *     summary: List learning activities
 *     tags: [Learners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create or update learning activity
 *     tags: [Learners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lesson_id
 *               - status
 *             properties:
 *               lesson_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [started, completed]
 *     responses:
 *       201:
 *         description: Activity created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */


const router = express.Router();

const {
  // CRUD operations
  createLearner,
  getAllLearners,
  getLearnerById,
  updateLearner,
  deleteLearner,
  // User-specific operations
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
  markNotification,
  listMinigameAttempts,
  submitMinigameAttempt,
  savePushToken,
} = require('../../controllers/learner/learnerController');
const { authenticateToken, requireLearner } = require('../../middleware/auth');

// All learner routes require authentication and learner role
const learnerAuth = [authenticateToken, requireLearner];


// IMPORTANT: Specific routes MUST come before parameterized routes to avoid matching issues

// Profile (must be before /:id routes)
router.get('/profile', learnerAuth, getLearnerProfile);
router.patch('/profile', learnerAuth, updateLearnerProfile);
router.get('/progress', learnerAuth, getLearnerProgress);

// Enrollments (must be before /:id routes)
router.get('/enrollments', learnerAuth, listEnrollments);
router.post('/enrollments', learnerAuth, enrollCourse);
router.get('/enrollments/:courseId/progress', learnerAuth, getEnrollmentProgress);

// Activity (must be before /:id routes)
router.get('/activity', learnerAuth, listActivity);
router.post('/activity', learnerAuth, upsertActivity);

// Attempts (must be before /:id routes)
router.get('/attempts', learnerAuth, listAttempts);
router.post('/attempts', learnerAuth, submitAttempt);

// Notifications (must be before /:id routes)
router.get('/notifications', learnerAuth, listNotifications);
router.post('/notifications/read-all', learnerAuth, markAllNotifications);
router.post('/notifications/:notificationId/read', learnerAuth, markNotification);
router.post('/push-token', learnerAuth, savePushToken);

// Minigames (must be before /:id routes)
router.get('/minigames/attempts', learnerAuth, listMinigameAttempts);
router.post('/minigames/attempts', learnerAuth, submitMinigameAttempt);

// CRUD routes for learner management (parameterized routes come LAST)
router.post('/', createLearner);                          // POST /api/learner - Create learner
router.get('/', getAllLearners);                          // GET /api/learner - Get all learners
router.get('/:id', getLearnerById);                       // GET /api/learner/:id - Get learner by ID
router.put('/:id', updateLearner);                        // PUT /api/learner/:id - Update learner
router.delete('/:id', deleteLearner);                     // DELETE /api/learner/:id - Delete learner

module.exports = router;


