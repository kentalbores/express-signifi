const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Course enrollment management endpoints
 */

/**
 * @swagger
 * /api/enrollments/:
 *   post:
 *     summary: Create enrollment
 *     tags: [Enrollments]
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
 * /api/enrollments/:
 *   get:
 *     summary: Get all enrollments
 *     tags: [Enrollments]
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
 * /api/enrollments/{id}:
 *   get:
 *     summary: Get enrollment by ID
 *     tags: [Enrollments]
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
 * /api/enrollments/{id}:
 *   put:
 *     summary: Update enrollment
 *     tags: [Enrollments]
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
 * /api/enrollments/{id}:
 *   delete:
 *     summary: Delete enrollment
 *     tags: [Enrollments]
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
    createEnrollment,
    getAllEnrollments,
    getEnrollmentById,
    updateEnrollment,
    deleteEnrollment,
    getEnrollmentProgress,
    generateEnrollmentCertificate,
    getEnrollmentAnalytics,
    checkEnrollment
} = require('../../controllers/enrollment/enrollmentController');
const { authenticateToken, requireLearner, requireAdminRole } = require('../../middleware/auth');

// Check enrollment route - must be before /:id to avoid conflict
router.get('/check', authenticateToken, checkEnrollment);           // GET /api/enrollments/check?course_id=X

// Public enrollment routes
router.get('/', authenticateToken, getAllEnrollments);             // GET /api/enrollments (authenticated users)
router.get('/:id', authenticateToken, getEnrollmentById);          // GET /api/enrollments/:id (authenticated users)

// Learner-specific enrollment routes
router.post('/', authenticateToken, requireLearner, createEnrollment);             // POST /api/enrollments (learners only)
router.put('/:id', authenticateToken, requireLearner, updateEnrollment);           // PUT /api/enrollments/:id (learners only)

// New self-study integration routes
router.get('/:id/progress', authenticateToken, getEnrollmentProgress);             // GET /api/enrollments/:id/progress
router.post('/:id/certificate', authenticateToken, requireLearner, generateEnrollmentCertificate); // POST /api/enrollments/:id/certificate
router.get('/analytics/:learner_id', authenticateToken, getEnrollmentAnalytics);   // GET /api/enrollments/analytics/:learner_id

// Admin-only routes
router.delete('/:id', authenticateToken, requireAdminRole, deleteEnrollment);      // DELETE /api/enrollments/:id (admins only)

module.exports = router;


