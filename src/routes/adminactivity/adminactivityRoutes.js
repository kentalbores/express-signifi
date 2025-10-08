const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Admin Activities
 *   description: Admin Activities management endpoints
 */

/**
 * @swagger
 * /api/admin-activities:
 *   get:
 *     summary: Get all admin activities
 *     tags: [Admin Activities]
 *     responses:
 *       200:
 *         description: Admin Activities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   post:
 *     summary: Create admin activitie
 *     tags: [Admin Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Admin Activitie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /api/admin-activities/{id}:
 *   get:
 *     summary: Get admin activitie by ID
 *     tags: [Admin Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin Activitie retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Admin Activitie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update admin activitie
 *     tags: [Admin Activities]
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
 *         description: Admin Activitie updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   delete:
 *     summary: Delete admin activitie
 *     tags: [Admin Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin Activitie deleted successfully
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
    createAdminActivity,
    getAllAdminActivities,
    getAdminActivityById,
    updateAdminActivity,
    deleteAdminActivity
} = require('../../controllers/adminactivity/adminactivityController');

// Admin activity routes
router.post('/', createAdminActivity);                // POST /api/admin-activities
router.get('/', getAllAdminActivities);               // GET /api/admin-activities
router.get('/:id', getAdminActivityById);             // GET /api/admin-activities/:id
router.put('/:id', updateAdminActivity);              // PUT /api/admin-activities/:id
router.delete('/:id', deleteAdminActivity);           // DELETE /api/admin-activities/:id

module.exports = router;


