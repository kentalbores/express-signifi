const sql = require('../../config/database');

// Create notification
const createNotification = async (req, res) => {
    try {
        const { user_id, title, message, link, action_url, is_read, type, template_id, action_data } = req.body;
        if (!user_id || isNaN(user_id) || !title || !message) {
            return res.status(400).json({ error: 'Missing required fields: user_id (number), title and message are required' });
        }
        const result = await sql`
            INSERT INTO notification (user_id, template_id, title, message, type, action_url, action_data, is_read)
            VALUES (${user_id}, ${template_id || null}, ${title}, ${message}, ${type || 'general'}, ${action_url || link || null}, ${action_data || null}, ${is_read || false})
            RETURNING notification_id, user_id, template_id, title, message, type, action_url, action_data, is_read, created_at
        `;
        res.status(201).json({ message: 'Notification created successfully', notification: result[0] });
    } catch (error) {
        console.error('Error creating notification:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key reference (user_id or template_id)' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List notifications (optionally by user_id, is_read)
const getAllNotifications = async (req, res) => {
    try {
        const { user_id, is_read } = req.query;
        let query = 'SELECT notification_id, user_id, template_id, title, message, type, action_url, action_data, is_read, created_at FROM notification';
        const conditions = [];
        const values = [];
        if (user_id) { conditions.push('user_id = $' + (values.length + 1)); values.push(user_id); }
        if (is_read !== undefined) { conditions.push('is_read = $' + (values.length + 1)); values.push(is_read === 'true'); }
        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY created_at DESC';
        const notifications = await sql.unsafe(query, values);
        res.status(200).json({ message: 'Notifications retrieved successfully', notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get notification by ID
const getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid notification ID' });
        const result = await sql`SELECT notification_id, user_id, template_id, title, message, type, action_url, action_data, is_read, created_at FROM notification WHERE notification_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Notification not found' });
        res.status(200).json({ message: 'Notification retrieved successfully', notification: result[0] });
    } catch (error) {
        console.error('Error fetching notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update notification
const updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, title, message, link, action_url, is_read, type, template_id, action_data } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid notification ID' });
        const current = await sql`SELECT user_id, template_id, title, message, type, action_url, action_data, is_read FROM notification WHERE notification_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Notification not found' });

        const updatedUserId = user_id !== undefined ? user_id : current[0].user_id;
        const updatedTemplateId = template_id !== undefined ? template_id : current[0].template_id;
        const updatedTitle = title !== undefined ? title : current[0].title;
        const updatedMessage = message !== undefined ? message : current[0].message;
        const updatedType = type !== undefined ? type : current[0].type;
        const updatedActionUrl = (action_url !== undefined ? action_url : (link !== undefined ? link : current[0].action_url));
        const updatedActionData = action_data !== undefined ? action_data : current[0].action_data;
        const updatedIsRead = is_read !== undefined ? is_read : current[0].is_read;

        const result = await sql`
            UPDATE notification SET user_id = ${updatedUserId}, template_id = ${updatedTemplateId}, title = ${updatedTitle}, message = ${updatedMessage}, type = ${updatedType}, action_url = ${updatedActionUrl}, action_data = ${updatedActionData}, is_read = ${updatedIsRead}
            WHERE notification_id = ${id}
            RETURNING notification_id, user_id, template_id, title, message, type, action_url, action_data, is_read, created_at
        `;
        res.status(200).json({ message: 'Notification updated successfully', notification: result[0] });
    } catch (error) {
        console.error('Error updating notification:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key reference (user_id or template_id)' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid notification ID' });
        const result = await sql`DELETE FROM notification WHERE notification_id = ${id} RETURNING notification_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Notification not found' });
        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification
};


