const sql = require('../../config/database');

// Create super admin
const createSuperAdmin = async (req, res) => {
    try {
        const {
            user_id,
            access_level = 'full',
            permissions
        } = req.body;

        const result = await sql`
            INSERT INTO superadmin (
                user_id, access_level, permissions
            )
            VALUES (
                ${user_id}, ${access_level}, ${permissions ? JSON.stringify(permissions) : null}
            )
            RETURNING *
        `;

        res.status(201).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error creating super admin:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all super admins
const getAllSuperAdmins = async (req, res) => {
    try {
        const result = await sql`
            SELECT s.*, u.first_name, u.last_name, u.email, u.profile_picture_url
            FROM superadmin s
            JOIN useraccount u ON s.user_id = u.user_id
            ORDER BY s.created_at DESC
        `;

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching super admins:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get super admin by ID
const getSuperAdminById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            SELECT s.*, u.first_name, u.last_name, u.email, u.profile_picture_url
            FROM superadmin s
            JOIN useraccount u ON s.user_id = u.user_id
            WHERE s.user_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Super admin not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error fetching super admin:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update super admin
const updateSuperAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            access_level,
            permissions
        } = req.body;

        const updates = [];
        const values = [id];
        let paramIndex = 2;

        if (access_level !== undefined) {
            updates.push(`access_level = $${paramIndex++}`);
            values.push(access_level);
        }
        if (permissions !== undefined) {
            updates.push(`permissions = $${paramIndex++}`);
            values.push(JSON.stringify(permissions));
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const result = await sql`
            UPDATE superadmin 
            SET ${sql.unsafe(updates.join(', '))}
            WHERE user_id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Super admin not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error updating super admin:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete super admin
const deleteSuperAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            DELETE FROM superadmin 
            WHERE user_id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Super admin not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Super admin deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting super admin:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get system stats for super admin dashboard
const getSystemStats = async (req, res) => {
    try {
        const stats = await sql`
            SELECT 
                (SELECT COUNT(*) FROM useraccount) as total_users,
                (SELECT COUNT(*) FROM educator) as total_educators,
                (SELECT COUNT(*) FROM learner) as total_learners,
                (SELECT COUNT(*) FROM institution) as total_institutions,
                (SELECT COUNT(*) FROM course WHERE is_published = true) as published_courses,
                (SELECT COUNT(*) FROM enrollment WHERE status = 'active') as active_enrollments,
                (SELECT SUM(total_amount) FROM course_order WHERE status = 'completed') as total_revenue,
                (SELECT COUNT(*) FROM educator WHERE verification_status = 'pending') as pending_verifications
        `;

        res.status(200).json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createSuperAdmin,
    getAllSuperAdmins,
    getSuperAdminById,
    updateSuperAdmin,
    deleteSuperAdmin,
    getSystemStats
};
