const express = require('express');
const router = express.Router();
const {
    createActivity,
    getAllActivities,
    getActivityById,
    updateActivity,
    deleteActivity
} = require('../../controllers/activity/activityController');

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

// Activity routes
router.post('/', createActivity);            // POST /api/activities
router.get('/', getAllActivities);           // GET /api/activities
router.get('/:id', getActivityById);         // GET /api/activities/:id
router.put('/:id', updateActivity);          // PUT /api/activities/:id
router.delete('/:id', deleteActivity);       // DELETE /api/activities/:id

module.exports = router;


