const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Mini Games
 *   description: Mini game management endpoints
 */

/**
 * @swagger
 * /api/minigames/:
 *   post:
 *     summary: Create mini game
 *     tags: [Mini Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/minigames/:
 *   get:
 *     summary: Get all mini games
 *     tags: [Mini Games]
 *     responses:
 *       200:
 *         description: Operation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/minigames/{id}:
 *   get:
 *     summary: Get mini game by ID
 *     tags: [Mini Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Operation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/minigames/{id}:
 *   put:
 *     summary: Update mini game
 *     tags: [Mini Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Operation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/minigames/{id}:
 *   delete:
 *     summary: Delete mini game
 *     tags: [Mini Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Operation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */


const router = express.Router();
const {
    createMinigame,
    getAllMinigames,
    getMinigameById,
    updateMinigame,
    deleteMinigame
} = require('../../controllers/minigame/minigameController');

// Minigame routes
router.post('/', createMinigame);            // POST /api/minigames
router.get('/', getAllMinigames);            // GET /api/minigames
router.get('/:id', getMinigameById);         // GET /api/minigames/:id
router.put('/:id', updateMinigame);          // PUT /api/minigames/:id
router.delete('/:id', deleteMinigame);       // DELETE /api/minigames/:id

module.exports = router;


