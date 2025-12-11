const express = require('express');
const router = express.Router();
const {
    createReview,
    getCourseReviews,
    getReviewById,
    updateReview,
    deleteReview,
    markReviewHelpful,
    getUserReviewForCourse
} = require('../../controllers/coursereview/courseReviewController');
const { authenticateToken } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Course Reviews
 *   description: Course review and rating endpoints
 */

/**
 * @swagger
 * /api/courses/{courseId}/reviews:
 *   get:
 *     summary: Get all reviews for a course
 *     tags: [Course Reviews]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, highest, lowest, helpful]
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *   post:
 *     summary: Create a new review for a course
 *     tags: [Course Reviews]
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       403:
 *         description: User not enrolled in course
 *       409:
 *         description: User already reviewed this course
 */

// Public route - get reviews for a course
router.get('/courses/:courseId/reviews', getCourseReviews);

// Protected routes - require authentication
router.post('/courses/:courseId/reviews', authenticateToken, createReview);
router.get('/courses/:courseId/reviews/me', authenticateToken, getUserReviewForCourse);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   get:
 *     summary: Get a review by ID
 *     tags: [Course Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       404:
 *         description: Review not found
 *   put:
 *     summary: Update a review
 *     tags: [Course Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found or no permission
 *   delete:
 *     summary: Delete a review
 *     tags: [Course Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: No permission to delete
 *       404:
 *         description: Review not found
 */

// Individual review routes
router.get('/reviews/:reviewId', getReviewById);
router.put('/reviews/:reviewId', authenticateToken, updateReview);
router.delete('/reviews/:reviewId', authenticateToken, deleteReview);

/**
 * @swagger
 * /api/reviews/{reviewId}/helpful:
 *   post:
 *     summary: Mark a review as helpful
 *     tags: [Course Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Helpful count updated
 *       404:
 *         description: Review not found
 */

router.post('/reviews/:reviewId/helpful', markReviewHelpful);

module.exports = router;
