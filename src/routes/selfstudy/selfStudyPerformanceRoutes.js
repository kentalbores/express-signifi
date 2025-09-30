const express = require('express');
const router = express.Router();
const {
    recordPerformance,
    getUserPerformance,
    getLessonPerformanceStats,
    deletePerformance
} = require('../../controllers/selfstudy/selfStudyPerformanceController');
const { authenticateToken, requireLearner, requireAdminRole } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Self-Study Performance
 *   description: Self-study performance tracking endpoints
 */

/**
 * @swagger
 * /api/selfstudy-performances:
 *   post:
 *     summary: Record self-study performance data
 *     tags: [Self-Study Performance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - lesson_identifier
 *             properties:
 *               user_id:
 *                 type: integer
 *               lesson_identifier:
 *                 type: string
 *               lesson_type:
 *                 type: string
 *               score:
 *                 type: integer
 *                 minimum: 0
 *               max_score:
 *                 type: integer
 *                 minimum: 1
 *                 default: 100
 *               percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               time_spent_seconds:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               performance_data:
 *                 type: object
 *               completed_levels:
 *                 type: object
 *               is_completed:
 *                 type: boolean
 *                 default: false
 *               attempt_number:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *     responses:
 *       201:
 *         description: Performance recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 performance:
 *                   type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/selfstudy-performances/{userId}:
 *   get:
 *     summary: Get user performance data
 *     tags: [Self-Study Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: lesson_identifier
 *         schema:
 *           type: string
 *         description: Filter by specific lesson
 *       - in: query
 *         name: lesson_type
 *         schema:
 *           type: string
 *         description: Filter by lesson type
 *       - in: query
 *         name: is_completed
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: User performance retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/selfstudy-performances/lesson/{lessonId}:
 *   get:
 *     summary: Get lesson performance statistics
 *     tags: [Self-Study Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson identifier
 *     responses:
 *       200:
 *         description: Lesson performance statistics retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/selfstudy-performances/performance/{performanceId}:
 *   delete:
 *     summary: Delete performance record
 *     tags: [Self-Study Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: performanceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Performance record ID
 *     responses:
 *       200:
 *         description: Performance record deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Performance record not found
 *       500:
 *         description: Internal server error
 */

// Self-study performance routes
router.post('/', authenticateToken, recordPerformance);                                    // POST /api/selfstudy-performances - Record performance
router.get('/:userId', authenticateToken, getUserPerformance);                            // GET /api/selfstudy-performances/:userId - Get user performance
router.get('/lesson/:lessonId', authenticateToken, requireAdminRole, getLessonPerformanceStats); // GET /api/selfstudy-performances/lesson/:lessonId - Get lesson stats (admin only)
router.delete('/performance/:performanceId', authenticateToken, requireAdminRole, deletePerformance); // DELETE /api/selfstudy-performances/performance/:performanceId - Delete performance (admin only)

module.exports = router;
