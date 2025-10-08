const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Course Moderation
 *   description: Course Moderation management endpoints
 */

/**
 * @swagger
 * /api/course-moderations:
 *   get:
 *     summary: Get all course moderation
 *     tags: [Course Moderation]
 *     responses:
 *       200:
 *         description: Course Moderation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   post:
 *     summary: Create course moderatio
 *     tags: [Course Moderation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Course Moderatio created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /api/course-moderations/{id}:
 *   get:
 *     summary: Get course moderatio by ID
 *     tags: [Course Moderation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course Moderatio retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Course Moderatio not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update course moderatio
 *     tags: [Course Moderation]
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
 *         description: Course Moderatio updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   delete:
 *     summary: Delete course moderatio
 *     tags: [Course Moderation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course Moderatio deleted successfully
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
    createCourseModeration,
    getAllCourseModerations,
    getCourseModerationById,
    updateCourseModeration,
    deleteCourseModeration
} = require('../../controllers/coursemoderation/coursemoderationController');
const { authenticateToken, requireSuperAdmin } = require('../../middleware/auth');

// Course moderation routes (all require superadmin authentication)
router.post('/', authenticateToken, requireSuperAdmin, createCourseModeration);               // POST /api/course-moderations (superadmin only)
router.get('/', authenticateToken, requireSuperAdmin, getAllCourseModerations);               // GET /api/course-moderations (superadmin only)
router.get('/:id', authenticateToken, requireSuperAdmin, getCourseModerationById);            // GET /api/course-moderations/:id (superadmin only)
router.put('/:id', authenticateToken, requireSuperAdmin, updateCourseModeration);             // PUT /api/course-moderations/:id (superadmin only)
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteCourseModeration);          // DELETE /api/course-moderations/:id (superadmin only)

module.exports = router;


