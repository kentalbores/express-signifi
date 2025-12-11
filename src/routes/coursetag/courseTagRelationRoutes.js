const express = require('express');
const router = express.Router();
const {
    addTagToCourse,
    removeTagFromCourse,
    getCoursesTags
} = require('../../controllers/coursetag/courseTagController');
const { authenticateToken, requireEducator } = require('../../middleware/auth');

/**
 * @swagger
 * /api/courses/{courseId}/tags:
 *   get:
 *     summary: Get all tags for a course
 *     tags: [Course Tags]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 *   post:
 *     summary: Add a tag to a course (educator only)
 *     tags: [Course Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tag_id
 *             properties:
 *               tag_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tag added to course successfully
 */

// Public route
router.get('/:courseId/tags', getCoursesTags);

// Educator routes
router.post('/:courseId/tags', authenticateToken, requireEducator, addTagToCourse);
router.delete('/:courseId/tags/:tagId', authenticateToken, requireEducator, removeTagFromCourse);

module.exports = router;
