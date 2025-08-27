const sql = require('../../config/database');

// Create admin activity
const createAdminActivity = async (req, res) => {
    try {
        const { admin_id, action, target_table, target_id } = req.body;
        if (!admin_id || isNaN(admin_id) || !action || !target_table || !target_id || isNaN(target_id)) {
            return res.status(400).json({ error: 'Missing required fields: admin_id (number), action, target_table, target_id (number) are required' });
        }
        const result = await sql`
            INSERT INTO adminactivity (admin_id, action, target_table, target_id)
            VALUES (${admin_id}, ${action}, ${target_table}, ${target_id})
            RETURNING activity_id, admin_id, action, target_table, target_id, timestamp
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
        let query = 'SELECT activity_id, admin_id, action, target_table, target_id, timestamp FROM adminactivity';
        const conditions = [];
        const values = [];
        if (admin_id) { conditions.push('admin_id = $' + (values.length + 1)); values.push(admin_id); }
        if (target_table) { conditions.push('target_table = $' + (values.length + 1)); values.push(target_table); }
        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY timestamp DESC';
        const activities = await sql.unsafe(query, values);
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
        const result = await sql`SELECT activity_id, admin_id, action, target_table, target_id, timestamp FROM adminactivity WHERE activity_id = ${id}`;
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
        const { admin_id, action, target_table, target_id } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid activity ID' });
        const current = await sql`SELECT admin_id, action, target_table, target_id FROM adminactivity WHERE activity_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Admin activity not found' });
        const updatedAdminId = admin_id !== undefined ? admin_id : current[0].admin_id;
        const updatedAction = action !== undefined ? action : current[0].action;
        const updatedTargetTable = target_table !== undefined ? target_table : current[0].target_table;
        const updatedTargetId = target_id !== undefined ? target_id : current[0].target_id;
        const result = await sql`
            UPDATE adminactivity SET admin_id = ${updatedAdminId}, action = ${updatedAction}, target_table = ${updatedTargetTable}, target_id = ${updatedTargetId}
            WHERE activity_id = ${id}
            RETURNING activity_id, admin_id, action, target_table, target_id, timestamp
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
        const result = await sql`DELETE FROM adminactivity WHERE activity_id = ${id} RETURNING activity_id`;
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


