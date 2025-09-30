const sql = require('../../config/database');

// Helper function to get users by role
const getUsersByRole = async (roles, institutionId = null) => {
    try {
        const userQueries = [];
        
        if (roles.includes('learner')) {
            userQueries.push(sql`SELECT user_id FROM learner`);
        }
        
        if (roles.includes('educator')) {
            let educatorQuery = `SELECT user_id FROM educator`;
            if (institutionId) {
                educatorQuery += ` WHERE institution_id = ${institutionId}`;
            }
            userQueries.push(sql.unsafe(educatorQuery));
        }
        
        if (roles.includes('institutionadmin')) {
            let adminQuery = `SELECT user_id FROM institutionadmin`;
            if (institutionId) {
                adminQuery += ` WHERE institution_id = ${institutionId}`;
            }
            userQueries.push(sql.unsafe(adminQuery));
        }
        
        if (roles.includes('superadmin')) {
            userQueries.push(sql`SELECT user_id FROM superadmin`);
        }
        
        // Execute all queries and combine results
        const results = await Promise.all(userQueries);
        const userIds = new Set();
        
        results.forEach(result => {
            result.forEach(row => userIds.add(row.user_id));
        });
        
        return Array.from(userIds);
    } catch (error) {
        console.error('Error getting users by role:', error);
        return [];
    }
};

// Helper function to process notification template
const processNotificationTemplate = async (templateId, variables = {}) => {
    try {
        if (!templateId) return null;
        
        const template = await sql`
            SELECT * FROM notification_template WHERE template_id = ${templateId} AND is_active = true
        `;
        
        if (template.length === 0) return null;
        
        const templateData = template[0];
        let processedTitle = templateData.title;
        let processedContent = templateData.content;
        
        // Replace variables in template
        Object.keys(variables).forEach(key => {
            const placeholder = `{{${key}}}`;
            processedTitle = processedTitle.replace(new RegExp(placeholder, 'g'), variables[key]);
            processedContent = processedContent.replace(new RegExp(placeholder, 'g'), variables[key]);
        });
        
        return {
            title: processedTitle,
            message: processedContent,
            type: templateData.type,
            action_url: templateData.default_action_url
        };
    } catch (error) {
        console.error('Error processing notification template:', error);
        return null;
    }
};

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

// Broadcast notification to multiple users by role
const broadcastNotificationByRole = async (req, res) => {
    try {
        const { roles, institution_id, template_id, title, message, type, action_url, template_variables } = req.body;
        
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({ error: 'Roles array is required' });
        }
        
        const validRoles = ['learner', 'educator', 'institutionadmin', 'superadmin'];
        const invalidRoles = roles.filter(role => !validRoles.includes(role));
        if (invalidRoles.length > 0) {
            return res.status(400).json({ error: `Invalid roles: ${invalidRoles.join(', ')}` });
        }
        
        // Get notification content from template or direct input
        let notificationData = { title, message, type: type || 'general', action_url };
        
        if (template_id) {
            const templateData = await processNotificationTemplate(template_id, template_variables || {});
            if (templateData) {
                notificationData = {
                    title: templateData.title,
                    message: templateData.message,
                    type: templateData.type,
                    action_url: templateData.action_url || action_url
                };
            }
        }
        
        if (!notificationData.title || !notificationData.message) {
            return res.status(400).json({ error: 'Title and message are required (either directly or via template)' });
        }
        
        // Get target users by role
        const userIds = await getUsersByRole(roles, institution_id);
        
        if (userIds.length === 0) {
            return res.status(404).json({ error: 'No users found with specified roles' });
        }
        
        // Create notifications for all target users
        const notifications = [];
        for (const userId of userIds) {
            const result = await sql`
                INSERT INTO notification (user_id, template_id, title, message, type, action_url, is_read)
                VALUES (${userId}, ${template_id || null}, ${notificationData.title}, ${notificationData.message}, 
                        ${notificationData.type}, ${notificationData.action_url || null}, false)
                RETURNING notification_id, user_id, created_at
            `;
            notifications.push(result[0]);
        }
        
        res.status(201).json({
            message: 'Notifications broadcasted successfully',
            notifications_sent: notifications.length,
            target_roles: roles,
            institution_id: institution_id || 'all',
            notifications: notifications
        });
        
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user notification preferences
const getUserNotificationPreferences = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        const preferences = await sql`
            SELECT * FROM user_notification_preference 
            WHERE user_id = ${userId}
        `;
        
        // Default preferences if none exist
        if (preferences.length === 0) {
            const defaultPrefs = {
                email_notifications: true,
                push_notifications: true,
                course_updates: true,
                enrollment_updates: true,
                achievement_notifications: true,
                marketing_notifications: false
            };
            
            return res.status(200).json({
                message: 'Default notification preferences (not yet saved)',
                preferences: defaultPrefs,
                is_default: true
            });
        }
        
        res.status(200).json({
            message: 'Notification preferences retrieved successfully',
            preferences: preferences[0],
            is_default: false
        });
        
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update user notification preferences
const updateUserNotificationPreferences = async (req, res) => {
    try {
        const { userId } = req.params;
        const { 
            email_notifications, 
            push_notifications, 
            course_updates, 
            enrollment_updates, 
            achievement_notifications, 
            marketing_notifications 
        } = req.body;
        
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        const result = await sql`
            INSERT INTO user_notification_preference (
                user_id, email_notifications, push_notifications, course_updates,
                enrollment_updates, achievement_notifications, marketing_notifications
            )
            VALUES (
                ${userId}, ${email_notifications !== undefined ? email_notifications : true}, 
                ${push_notifications !== undefined ? push_notifications : true},
                ${course_updates !== undefined ? course_updates : true},
                ${enrollment_updates !== undefined ? enrollment_updates : true},
                ${achievement_notifications !== undefined ? achievement_notifications : true},
                ${marketing_notifications !== undefined ? marketing_notifications : false}
            )
            ON CONFLICT (user_id) 
            DO UPDATE SET
                email_notifications = COALESCE(${email_notifications}, user_notification_preference.email_notifications),
                push_notifications = COALESCE(${push_notifications}, user_notification_preference.push_notifications),
                course_updates = COALESCE(${course_updates}, user_notification_preference.course_updates),
                enrollment_updates = COALESCE(${enrollment_updates}, user_notification_preference.enrollment_updates),
                achievement_notifications = COALESCE(${achievement_notifications}, user_notification_preference.achievement_notifications),
                marketing_notifications = COALESCE(${marketing_notifications}, user_notification_preference.marketing_notifications),
                updated_at = NOW()
            RETURNING *
        `;
        
        res.status(200).json({
            message: 'Notification preferences updated successfully',
            preferences: result[0]
        });
        
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Mark all notifications as read for a user
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        const result = await sql`
            UPDATE notification 
            SET is_read = true 
            WHERE user_id = ${userId} AND is_read = false
            RETURNING notification_id
        `;
        
        res.status(200).json({
            message: 'All notifications marked as read',
            updated_count: result.length
        });
        
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get notification analytics for admin
const getNotificationAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        
        if (!['7', '30', '90'].includes(period)) {
            return res.status(400).json({ error: 'Invalid period. Must be 7, 30, or 90 days' });
        }
        
        // Get overall notification statistics
        const overallStats = await sql`
            SELECT 
                COUNT(*) as total_notifications,
                COUNT(CASE WHEN is_read = true THEN 1 END) as read_notifications,
                COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications,
                COUNT(DISTINCT user_id) as unique_recipients
            FROM notification 
            WHERE created_at >= NOW() - INTERVAL '${period} days'
        `;
        
        // Get notification statistics by type
        const typeStats = await sql`
            SELECT 
                type,
                COUNT(*) as count,
                COUNT(CASE WHEN is_read = true THEN 1 END) as read_count,
                AVG(CASE WHEN is_read = true AND read_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (read_at - created_at))/3600 
                    ELSE NULL END) as avg_read_time_hours
            FROM notification 
            WHERE created_at >= NOW() - INTERVAL '${period} days'
            GROUP BY type
            ORDER BY count DESC
        `;
        
        // Get daily notification trends
        const dailyTrends = await sql`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as notifications_sent,
                COUNT(DISTINCT user_id) as unique_recipients,
                COUNT(CASE WHEN is_read = true THEN 1 END) as notifications_read
            FROM notification 
            WHERE created_at >= NOW() - INTERVAL '${period} days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;
        
        const readRate = overallStats[0].total_notifications > 0 
            ? Math.round((overallStats[0].read_notifications / overallStats[0].total_notifications) * 100) 
            : 0;
        
        res.status(200).json({
            message: 'Notification analytics retrieved successfully',
            period_days: parseInt(period),
            overall_statistics: {
                ...overallStats[0],
                read_rate_percentage: readRate
            },
            statistics_by_type: typeStats,
            daily_trends: dailyTrends
        });
        
    } catch (error) {
        console.error('Error fetching notification analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
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
};


