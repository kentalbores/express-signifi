const sql = require('../../config/database');

// Create institution admin
const createInstitutionAdmin = async (req, res) => {
    try {
        const {
            user_id,
            institution_id,
            contact_email,
            department,
            role_title,
            permissions,
            verification_status = 'pending'
        } = req.body;

        const result = await sql`
            INSERT INTO institutionadmin (
                user_id, institution_id, contact_email, department, 
                role_title, permissions, verification_status
            )
            VALUES (
                ${user_id}, ${institution_id}, ${contact_email}, ${department},
                ${role_title}, ${permissions ? JSON.stringify(permissions) : null}, 
                ${verification_status}
            )
            RETURNING *
        `;

        res.status(201).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error creating institution admin:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all institution admins
const getAllInstitutionAdmins = async (req, res) => {
    try {
        const { institution_id, verification_status } = req.query;
        
        let query = sql`
            SELECT ia.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
                   i.name as institution_name
            FROM institutionadmin ia
            JOIN useraccount u ON ia.user_id = u.user_id
            JOIN institution i ON ia.institution_id = i.institution_id
            WHERE 1=1
        `;
        
        if (institution_id) {
            query = sql`
                SELECT ia.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
                       i.name as institution_name
                FROM institutionadmin ia
                JOIN useraccount u ON ia.user_id = u.user_id
                JOIN institution i ON ia.institution_id = i.institution_id
                WHERE ia.institution_id = ${institution_id}
            `;
        }
        
        if (verification_status) {
            query = sql`
                SELECT ia.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
                       i.name as institution_name
                FROM institutionadmin ia
                JOIN useraccount u ON ia.user_id = u.user_id
                JOIN institution i ON ia.institution_id = i.institution_id
                WHERE ia.verification_status = ${verification_status}
            `;
        }

        const result = await query;

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching institution admins:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get institution admin by ID
const getInstitutionAdminById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            SELECT ia.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
                   i.name as institution_name
            FROM institutionadmin ia
            JOIN useraccount u ON ia.user_id = u.user_id
            JOIN institution i ON ia.institution_id = i.institution_id
            WHERE ia.user_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Institution admin not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error fetching institution admin:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update institution admin
const updateInstitutionAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            contact_email,
            department,
            role_title,
            permissions,
            verification_status,
            verified_by
        } = req.body;

        const updates = [];
        const values = [id];
        let paramIndex = 2;

        if (contact_email !== undefined) {
            updates.push(`contact_email = $${paramIndex++}`);
            values.push(contact_email);
        }
        if (department !== undefined) {
            updates.push(`department = $${paramIndex++}`);
            values.push(department);
        }
        if (role_title !== undefined) {
            updates.push(`role_title = $${paramIndex++}`);
            values.push(role_title);
        }
        if (permissions !== undefined) {
            updates.push(`permissions = $${paramIndex++}`);
            values.push(JSON.stringify(permissions));
        }
        if (verification_status !== undefined) {
            updates.push(`verification_status = $${paramIndex++}`);
            values.push(verification_status);
        }
        if (verified_by !== undefined) {
            updates.push(`verified_by = $${paramIndex++}, verified_at = CURRENT_TIMESTAMP`);
            values.push(verified_by);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const result = await sql`
            UPDATE institutionadmin 
            SET ${sql.unsafe(updates.join(', '))}
            WHERE user_id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Institution admin not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error updating institution admin:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete institution admin
const deleteInstitutionAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            DELETE FROM institutionadmin 
            WHERE user_id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Institution admin not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Institution admin deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting institution admin:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get institution admin stats
const getInstitutionAdminStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Get the institution admin's institution
        const admin = await sql`
            SELECT institution_id FROM institutionadmin WHERE user_id = ${id}
        `;

        if (admin.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Institution admin not found'
            });
        }

        const institutionId = admin[0].institution_id;

        const stats = await sql`
            SELECT 
                (SELECT COUNT(*) FROM educator WHERE institution_id = ${institutionId}) as total_educators,
                (SELECT COUNT(*) FROM course c JOIN educator e ON c.educator_id = e.user_id WHERE e.institution_id = ${institutionId}) as total_courses,
                (SELECT COUNT(*) FROM course c JOIN educator e ON c.educator_id = e.user_id WHERE e.institution_id = ${institutionId} AND c.is_published = true) as published_courses,
                (SELECT COUNT(DISTINCT en.learner_id) FROM enrollment en 
                 JOIN course c ON en.course_id = c.course_id 
                 JOIN educator e ON c.educator_id = e.user_id 
                 WHERE e.institution_id = ${institutionId} AND en.status = 'active') as total_students
        `;

        res.status(200).json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching institution admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createInstitutionAdmin,
    getAllInstitutionAdmins,
    getInstitutionAdminById,
    updateInstitutionAdmin,
    deleteInstitutionAdmin,
    getInstitutionAdminStats
};
