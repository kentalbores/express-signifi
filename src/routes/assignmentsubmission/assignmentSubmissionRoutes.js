const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Assignment Submissions
 *   description: Assignment Submissions management endpoints
 */

/**
 * @swagger
 * /api/assignment-submissions:
 *   get:
 *     summary: Get all assignment submissions
 *     tags: [Assignment Submissions]
 *     responses:
 *       200:
 *         description: Assignment Submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   post:
 *     summary: Create assignment submission
 *     tags: [Assignment Submissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Assignment Submission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /api/assignment-submissions/{id}:
 *   get:
 *     summary: Get assignment submission by ID
 *     tags: [Assignment Submissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assignment Submission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Assignment Submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update assignment submission
 *     tags: [Assignment Submissions]
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
 *         description: Assignment Submission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   delete:
 *     summary: Delete assignment submission
 *     tags: [Assignment Submissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assignment Submission deleted successfully
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
    createAssignmentSubmission,
    getAllAssignmentSubmissions,
    getAssignmentSubmissionById,
    updateAssignmentSubmission,
    deleteAssignmentSubmission
} = require('../../controllers/assignmentsubmission/assignmentSubmissionController');

// Assignment submission routes
router.post('/', createAssignmentSubmission);               // POST /api/assignment-submissions
router.get('/', getAllAssignmentSubmissions);               // GET /api/assignment-submissions
router.get('/:id', getAssignmentSubmissionById);            // GET /api/assignment-submissions/:id
router.put('/:id', updateAssignmentSubmission);             // PUT /api/assignment-submissions/:id
router.delete('/:id', deleteAssignmentSubmission);          // DELETE /api/assignment-submissions/:id

module.exports = router;
