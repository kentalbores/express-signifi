const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /api/notifications/:
 *   post:
 *     summary: Create notification
 *     tags: [Notifications]
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
 * /api/notifications/:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
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
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
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
 * /api/notifications/{id}:
 *   put:
 *     summary: Update notification
 *     tags: [Notifications]
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
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
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
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
    broadcastNotificationByRole,
    getUserNotificationPreferences,
    updateUserNotificationPreferences,
    markAllNotificationsAsRead,
    getNotificationAnalytics
} = require('../../controllers/notification/notificationController');
const { authenticateToken, requireAdminRole, requireSuperAdmin } = require('../../middleware/auth');

// Basic notification routes
router.post('/', authenticateToken, createNotification);             // POST /api/notifications (authenticated users)
router.get('/', authenticateToken, getAllNotifications);             // GET /api/notifications (authenticated users)
router.get('/:id', authenticateToken, getNotificationById);          // GET /api/notifications/:id (authenticated users)
router.put('/:id', authenticateToken, updateNotification);           // PUT /api/notifications/:id (authenticated users)
router.delete('/:id', authenticateToken, deleteNotification);        // DELETE /api/notifications/:id (authenticated users)

// Role-specific notification features
router.post('/broadcast', authenticateToken, requireAdminRole, broadcastNotificationByRole); // POST /api/notifications/broadcast (admins only)

// User notification preferences
router.get('/preferences/:userId', authenticateToken, getUserNotificationPreferences);      // GET /api/notifications/preferences/:userId
router.put('/preferences/:userId', authenticateToken, updateUserNotificationPreferences);  // PUT /api/notifications/preferences/:userId
router.patch('/mark-all-read/:userId', authenticateToken, markAllNotificationsAsRead);     // PATCH /api/notifications/mark-all-read/:userId

// Analytics (admin only)
router.get('/analytics/overview', authenticateToken, requireAdminRole, getNotificationAnalytics); // GET /api/notifications/analytics/overview

module.exports = router;


