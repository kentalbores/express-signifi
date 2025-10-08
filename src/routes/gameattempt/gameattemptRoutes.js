const express = require('express');
const router = express.Router();
const {
    createGameAttempt,
    getAllGameAttempts,
    getGameAttemptById,
    updateGameAttempt,
    deleteGameAttempt
} = require('../../controllers/gameattempt/gameattemptController');

/**
 * @swagger
 * tags:
 *   name: Game Attempts
 *   description: Mini game attempt tracking endpoints
 */

/**
 * @swagger
 * /api/game-attempts:
 *   post:
 *     summary: Create game attempt
 *     tags: [Game Attempts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - game_id
 *               - score
 *             properties:
 *               user_id:
 *                 type: integer
 *               game_id:
 *                 type: integer
 *               score:
 *                 type: integer
 *                 minimum: 0
 *               max_score:
 *                 type: integer
 *               level_reached:
 *                 type: integer
 *                 default: 1
 *               time_taken_seconds:
 *                 type: integer
 *               game_data:
 *                 type: object
 *                 description: Game-specific data in JSON format
 *               points_earned:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Game attempt created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   get:
 *     summary: Get all game attempts
 *     tags: [Game Attempts]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: game_id
 *         schema:
 *           type: integer
 *         description: Filter by game ID
 *     responses:
 *       200:
 *         description: Game attempts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /api/game-attempts/{id}:
 *   get:
 *     summary: Get game attempt by ID
 *     tags: [Game Attempts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game attempt ID
 *     responses:
 *       200:
 *         description: Game attempt retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Game attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update game attempt
 *     tags: [Game Attempts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game attempt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: integer
 *               level_reached:
 *                 type: integer
 *               time_taken_seconds:
 *                 type: integer
 *               game_data:
 *                 type: object
 *               points_earned:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Game attempt updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Game attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete game attempt
 *     tags: [Game Attempts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game attempt ID
 *     responses:
 *       200:
 *         description: Game attempt deleted successfully
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
 *         description: Game attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Game attempt routes
router.post('/', createGameAttempt);              // POST /api/game-attempts
router.get('/', getAllGameAttempts);              // GET /api/game-attempts
router.get('/:id', getGameAttemptById);           // GET /api/game-attempts/:id
router.put('/:id', updateGameAttempt);            // PUT /api/game-attempts/:id
router.delete('/:id', deleteGameAttempt);         // DELETE /api/game-attempts/:id

module.exports = router;


