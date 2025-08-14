const express = require('express');
const router = express.Router();
const {
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification
} = require('../../controllers/notification/notificationController');

// Notification routes
router.post('/', createNotification);             // POST /api/notifications
router.get('/', getAllNotifications);             // GET /api/notifications
router.get('/:id', getNotificationById);          // GET /api/notifications/:id
router.put('/:id', updateNotification);           // PUT /api/notifications/:id
router.delete('/:id', deleteNotification);        // DELETE /api/notifications/:id

module.exports = router;


