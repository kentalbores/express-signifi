const express = require('express');
const router = express.Router();
const {
    createActivity,
    getAllActivities,
    getActivityById,
    updateActivity,
    deleteActivity,
    getActivityAnalytics,
    getVideoWatchingAnalytics
} = require('../../controllers/activity/activityController');
const { authenticateToken, requireLearner, requireAdminRole } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Learning Activities
 *   description: Learning activity tracking endpoints
 */

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Create learning activity
 *     tags: [Learning Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - lesson_id
 *               - enrollment_id
 *               - status
 *             properties:
 *               user_id:
 *                 type: integer
 *               lesson_id:
 *                 type: integer
 *               enrollment_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [started, in_progress, completed, skipped]
 *               progress_percentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               time_spent_seconds:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Learning activity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   get:
 *     summary: Get all learning activities
 *     tags: [Learning Activities]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: lesson_id
 *         schema:
 *           type: integer
 *         description: Filter by lesson ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [started, in_progress, completed, skipped]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Learning activities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: Get learning activity by ID
 *     tags: [Learning Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Learning activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Learning activity not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update learning activity
 *     tags: [Learning Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [started, in_progress, completed, skipped]
 *               progress_percentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               time_spent_seconds:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Learning activity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Learning activity not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete learning activity
 *     tags: [Learning Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Learning activity deleted successfully
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
 *         description: Learning activity not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Protected activity routes (learners can manage their own activities)
router.post('/', authenticateToken, requireLearner, createActivity);            // POST /api/activities (learners only)
router.get('/', authenticateToken, getAllActivities);           // GET /api/activities (authenticated users)
router.get('/:id', authenticateToken, getActivityById);         // GET /api/activities/:id (authenticated users)
router.put('/:id', authenticateToken, requireLearner, updateActivity);          // PUT /api/activities/:id (learners only)

// New analytics endpoints
router.get('/analytics/detailed', authenticateToken, getActivityAnalytics);    // GET /api/activities/analytics/detailed
router.get('/analytics/video', authenticateToken, getVideoWatchingAnalytics);  // GET /api/activities/analytics/video

// Admin-only routes
router.delete('/:id', authenticateToken, requireAdminRole, deleteActivity);     // DELETE /api/activities/:id (admins only)

module.exports = router;


