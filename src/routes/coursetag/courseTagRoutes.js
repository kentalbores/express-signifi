const express = require('express');
const router = express.Router();
const {
    getAllTags,
    getTagById,
    createTag,
    updateTag,
    deleteTag,
    addTagToCourse,
    removeTagFromCourse,
    getCoursesTags,
    getCoursesByTag,
    getPopularTags
} = require('../../controllers/coursetag/courseTagController');
const { authenticateToken, requireAdminRole, requireEducator } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Course Tags
 *   description: Course tagging and categorization endpoints
 */

/**
 * @swagger
 * /api/course-tags:
 *   get:
 *     summary: Get all course tags
 *     tags: [Course Tags]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 *   post:
 *     summary: Create a new tag (admin only)
 *     tags: [Course Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tag created successfully
 */

// Public routes
router.get('/', getAllTags);
router.get('/popular', getPopularTags);
router.get('/course/:courseId', getCoursesTags);  // Get tags for a specific course
router.get('/:id', getTagById);
router.get('/:tagId/courses', getCoursesByTag);

// Admin routes
router.post('/', authenticateToken, requireAdminRole, createTag);
router.put('/:id', authenticateToken, requireAdminRole, updateTag);
router.delete('/:id', authenticateToken, requireAdminRole, deleteTag);

module.exports = router;
