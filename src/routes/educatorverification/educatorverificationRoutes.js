const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Educator Verification
 *   description: Educator Verification management endpoints
 */

/**
 * @swagger
 * /api/educator-verifications:
 *   get:
 *     summary: Get all educator verification
 *     tags: [Educator Verification]
 *     responses:
 *       200:
 *         description: Educator Verification retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   post:
 *     summary: Create educator verificatio
 *     tags: [Educator Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Educator Verificatio created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /api/educator-verifications/{id}:
 *   get:
 *     summary: Get educator verificatio by ID
 *     tags: [Educator Verification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Educator Verificatio retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Educator Verificatio not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update educator verificatio
 *     tags: [Educator Verification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Educator Verificatio updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   delete:
 *     summary: Delete educator verificatio
 *     tags: [Educator Verification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Educator Verificatio deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */


const router = express.Router();
const {
    createEducatorVerification,
    getAllEducatorVerifications,
    getEducatorVerificationById,
    updateEducatorVerification,
    deleteEducatorVerification
} = require('../../controllers/educatorverification/educatorverificationController');

// Educator verification routes
router.post('/', createEducatorVerification);                     // POST /api/educator-verifications
router.get('/', getAllEducatorVerifications);                     // GET /api/educator-verifications
router.get('/:id', getEducatorVerificationById);                  // GET /api/educator-verifications/:id
router.put('/:id', updateEducatorVerification);                   // PUT /api/educator-verifications/:id
router.delete('/:id', deleteEducatorVerification);                // DELETE /api/educator-verifications/:id

module.exports = router;


