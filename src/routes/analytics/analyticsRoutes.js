const express = require('express');
const router = express.Router();
const {
    getCourseAnalytics,
    getInstitutionAnalytics,
    getRevenueAnalytics,
    getPlatformAnalytics
} = require('../../controllers/analytics/analyticsController');
const { authenticateToken, requireSuperAdmin, requireAdminRole } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and reporting endpoints
 */

/**
 * @swagger
 * /api/analytics/course/{courseId}:
 *   get:
 *     summary: Get course performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 course:
 *                   type: object
 *                 enrollment_statistics:
 *                   type: object
 *                 lesson_performance:
 *                   type: array
 *                 activity_trends:
 *                   type: array
 *                 revenue_data:
 *                   type: object
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/analytics/institution/{institutionId}:
 *   get:
 *     summary: Get institution analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: institutionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Institution ID
 *     responses:
 *       200:
 *         description: Institution analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 institution:
 *                   type: object
 *                 course_statistics:
 *                   type: object
 *                 educator_statistics:
 *                   type: object
 *                 learner_performance:
 *                   type: object
 *                 revenue_analytics:
 *                   type: object
 *                 growth_trends:
 *                   type: array
 *       404:
 *         description: Institution not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Get platform revenue analytics (superadmin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7, 30, 90, 365]
 *           default: 30
 *         description: Analysis period in days
 *     responses:
 *       200:
 *         description: Revenue analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 period_days:
 *                   type: integer
 *                 overall_revenue:
 *                   type: object
 *                 revenue_by_difficulty:
 *                   type: array
 *                 revenue_by_institution:
 *                   type: array
 *                 daily_revenue_trends:
 *                   type: array
 *                 top_performing_courses:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Superadmin access required
 */

/**
 * @swagger
 * /api/analytics/platform:
 *   get:
 *     summary: Get platform-wide analytics (superadmin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 platform_statistics:
 *                   type: object
 *                 growth_metrics:
 *                   type: object
 *                 content_statistics:
 *                   type: object
 *                 engagement_metrics:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Superadmin access required
 */

// Course analytics - accessible by educators (for their courses) and admins
router.get('/course/:courseId', authenticateToken, getCourseAnalytics);

// Institution analytics - accessible by institution admins and superadmins
router.get('/institution/:institutionId', authenticateToken, requireAdminRole, getInstitutionAnalytics);

// Revenue analytics - superadmin only
router.get('/revenue', authenticateToken, requireSuperAdmin, getRevenueAnalytics);

// Platform analytics - superadmin only
router.get('/platform', authenticateToken, requireSuperAdmin, getPlatformAnalytics);

module.exports = router;
