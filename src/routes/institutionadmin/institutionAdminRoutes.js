const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Institution Admins
 *   description: Institution Admins management endpoints
 */

/**
 * @swagger
 * /api/institution-admins:
 *   get:
 *     summary: Get all institution admins
 *     tags: [Institution Admins]
 *     responses:
 *       200:
 *         description: Institution Admins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   post:
 *     summary: Create institution admin
 *     tags: [Institution Admins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Institution Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /api/institution-admins/{id}:
 *   get:
 *     summary: Get institution admin by ID
 *     tags: [Institution Admins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Institution Admin retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Institution Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update institution admin
 *     tags: [Institution Admins]
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
 *         description: Institution Admin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   delete:
 *     summary: Delete institution admin
 *     tags: [Institution Admins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Institution Admin deleted successfully
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
    createInstitutionAdmin,
    getAllInstitutionAdmins,
    getInstitutionAdminById,
    updateInstitutionAdmin,
    deleteInstitutionAdmin,
    getInstitutionAdminStats
} = require('../../controllers/institutionadmin/institutionAdminController');

// Institution admin routes
router.post('/', createInstitutionAdmin);                  // POST /api/institution-admins
router.get('/', getAllInstitutionAdmins);                  // GET /api/institution-admins
router.get('/:id', getInstitutionAdminById);               // GET /api/institution-admins/:id
router.get('/:id/stats', getInstitutionAdminStats);        // GET /api/institution-admins/:id/stats
router.put('/:id', updateInstitutionAdmin);                // PUT /api/institution-admins/:id
router.delete('/:id', deleteInstitutionAdmin);             // DELETE /api/institution-admins/:id

module.exports = router;
