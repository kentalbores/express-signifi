const sql = require('../../config/database');

// Create admin activity (admin_activity_log)
const createAdminActivity = async (req, res) => {
    try {
        const { admin_id, action, target_table, target_id, old_values, new_values, ip_address, user_agent } = req.body;
        if (!admin_id || isNaN(admin_id) || !action) {
            return res.status(400).json({ error: 'Missing required fields: admin_id (number) and action are required' });
        }
        const result = await sql`
            INSERT INTO admin_activity_log (admin_id, action, target_table, target_id, old_values, new_values, ip_address, user_agent)
            VALUES (${admin_id}, ${action}, ${target_table || null}, ${target_id || null}, ${old_values || null}, ${new_values || null}, ${ip_address || null}, ${user_agent || null})
            RETURNING log_id, admin_id, action, target_table, target_id, old_values, new_values, ip_address, user_agent, created_at
        `;
        res.status(201).json({ message: 'Admin activity created successfully', activity: result[0] });
    } catch (error) {
        console.error('Error creating admin activity:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid admin_id: user does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List admin activities (optional filters)
const getAllAdminActivities = async (req, res) => {
    try {
        const { admin_id, target_table } = req.query;
        
        // Build WHERE conditions dynamically
        let whereClause = sql``;
        const conditions = [];
        
        if (admin_id) {
            conditions.push(sql`admin_id = ${admin_id}`);
        }
        if (target_table) {
            conditions.push(sql`target_table = ${target_table}`);
        }
        
        // Combine conditions with AND
        if (conditions.length > 0) {
            whereClause = conditions.reduce((acc, condition, index) => {
                if (index === 0) {
                    return sql`WHERE ${condition}`;
                }
                return sql`${acc} AND ${condition}`;
            }, sql``);
        }
        
        const activities = await sql`
            SELECT log_id, admin_id, action, target_table, target_id, old_values, new_values, ip_address, user_agent, created_at 
            FROM admin_activity_log
            ${whereClause}
            ORDER BY created_at DESC
        `;
        
        res.status(200).json({ message: 'Admin activities retrieved successfully', activities });
    } catch (error) {
        console.error('Error fetching admin activities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get by ID
const getAdminActivityById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid activity ID' });
        const result = await sql`SELECT log_id, admin_id, action, target_table, target_id, old_values, new_values, ip_address, user_agent, created_at FROM admin_activity_log WHERE log_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Admin activity not found' });
        res.status(200).json({ message: 'Admin activity retrieved successfully', activity: result[0] });
    } catch (error) {
        console.error('Error fetching admin activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update
const updateAdminActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_id, action, target_table, target_id, old_values, new_values, ip_address, user_agent } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid activity ID' });
        const current = await sql`SELECT admin_id, action, target_table, target_id, old_values, new_values, ip_address, user_agent FROM admin_activity_log WHERE log_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Admin activity not found' });
        const updatedAdminId = admin_id !== undefined ? admin_id : current[0].admin_id;
        const updatedAction = action !== undefined ? action : current[0].action;
        const updatedTargetTable = target_table !== undefined ? target_table : current[0].target_table;
        const updatedTargetId = target_id !== undefined ? target_id : current[0].target_id;
        const updatedOldValues = old_values !== undefined ? old_values : current[0].old_values;
        const updatedNewValues = new_values !== undefined ? new_values : current[0].new_values;
        const updatedIp = ip_address !== undefined ? ip_address : current[0].ip_address;
        const updatedUa = user_agent !== undefined ? user_agent : current[0].user_agent;
        const result = await sql`
            UPDATE admin_activity_log SET admin_id = ${updatedAdminId}, action = ${updatedAction}, target_table = ${updatedTargetTable}, target_id = ${updatedTargetId}, old_values = ${updatedOldValues}, new_values = ${updatedNewValues}, ip_address = ${updatedIp}, user_agent = ${updatedUa}
            WHERE log_id = ${id}
            RETURNING log_id, admin_id, action, target_table, target_id, old_values, new_values, ip_address, user_agent, created_at
        `;
        res.status(200).json({ message: 'Admin activity updated successfully', activity: result[0] });
    } catch (error) {
        console.error('Error updating admin activity:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid admin_id: user does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete
const deleteAdminActivity = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid activity ID' });
        const result = await sql`DELETE FROM admin_activity_log WHERE log_id = ${id} RETURNING log_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Admin activity not found' });
        res.status(200).json({ message: 'Admin activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting admin activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createAdminActivity,
    getAllAdminActivities,
    getAdminActivityById,
    updateAdminActivity,
    deleteAdminActivity
};


