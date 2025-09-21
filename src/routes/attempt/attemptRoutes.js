const express = require('express');
const router = express.Router();
const {
    createAttempt,
    getAllAttempts,
    getAttemptById,
    updateAttempt,
    deleteAttempt
} = require('../../controllers/attempt/attemptController');

/**
 * @swagger
 * tags:
 *   name: Quiz Attempts
 *   description: Quiz attempt tracking endpoints
 */

/**
 * @swagger
 * /api/attempts:
 *   post:
 *     summary: Create quiz attempt
 *     tags: [Quiz Attempts]
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
 *               - answers
 *               - score
 *               - max_score
 *             properties:
 *               user_id:
 *                 type: integer
 *               lesson_id:
 *                 type: integer
 *               enrollment_id:
 *                 type: integer
 *               answers:
 *                 type: object
 *                 description: Quiz answers in JSON format
 *               score:
 *                 type: integer
 *                 minimum: 0
 *               max_score:
 *                 type: integer
 *                 minimum: 1
 *               time_taken_seconds:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Quiz attempt created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   get:
 *     summary: Get all quiz attempts
 *     tags: [Quiz Attempts]
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
 *         name: enrollment_id
 *         schema:
 *           type: integer
 *         description: Filter by enrollment ID
 *     responses:
 *       200:
 *         description: Quiz attempts retrieved successfully
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
 */

/**
 * @swagger
 * /api/attempts/{id}:
 *   get:
 *     summary: Get quiz attempt by ID
 *     tags: [Quiz Attempts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attempt ID
 *     responses:
 *       200:
 *         description: Quiz attempt retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Quiz attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update quiz attempt
 *     tags: [Quiz Attempts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attempt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: integer
 *               is_passed:
 *                 type: boolean
 *               time_taken_seconds:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Quiz attempt updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Quiz attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete quiz attempt
 *     tags: [Quiz Attempts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attempt ID
 *     responses:
 *       200:
 *         description: Quiz attempt deleted successfully
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
 *         description: Quiz attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Attempt routes
router.post('/', createAttempt);            // POST /api/attempts
router.get('/', getAllAttempts);            // GET /api/attempts
router.get('/:id', getAttemptById);         // GET /api/attempts/:id
router.put('/:id', updateAttempt);          // PUT /api/attempts/:id
router.delete('/:id', deleteAttempt);       // DELETE /api/attempts/:id

module.exports = router;


