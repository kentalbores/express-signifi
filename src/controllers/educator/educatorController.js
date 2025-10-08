const sql = require('../../config/database');

// Create educator profile
const createEducator = async (req, res) => {
    try {
        const {
            user_id,
            institution_id,
            employee_id,
            title,
            bio,
            specialization,
            qualifications,
            years_experience,
            verification_documents,
            payout_method = 'bank_transfer',
            payout_details
        } = req.body;

        const result = await sql`
            INSERT INTO educator (
                user_id, institution_id, employee_id, title, bio, 
                specialization, qualifications, years_experience,
                verification_documents, payout_method, payout_details
            )
            VALUES (
                ${user_id}, ${institution_id}, ${employee_id}, ${title}, ${bio},
                ${specialization}, ${qualifications}, ${years_experience},
                ${verification_documents ? JSON.stringify(verification_documents) : null}, 
                ${payout_method}, ${payout_details ? JSON.stringify(payout_details) : null}
            )
            RETURNING *
        `;

        res.status(201).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error creating educator:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all educators
const getAllEducators = async (req, res) => {
    try {
        const { institution_id, verification_status } = req.query;
        
        let query = sql`
            SELECT e.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
                   i.name as institution_name
            FROM educator e
            JOIN useraccount u ON e.user_id = u.user_id
            LEFT JOIN institution i ON e.institution_id = i.institution_id
            WHERE 1=1
        `;
        
        if (institution_id) {
            query = sql`
                SELECT e.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
                       i.name as institution_name
                FROM educator e
                JOIN useraccount u ON e.user_id = u.user_id
                LEFT JOIN institution i ON e.institution_id = i.institution_id
                WHERE e.institution_id = ${institution_id}
            `;
        }
        
        if (verification_status) {
            query = sql`
                SELECT e.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
                       i.name as institution_name
                FROM educator e
                JOIN useraccount u ON e.user_id = u.user_id
                LEFT JOIN institution i ON e.institution_id = i.institution_id
                WHERE e.verification_status = ${verification_status}
            `;
        }

        const result = await query;

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching educators:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get educator by ID
const getEducatorById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            SELECT e.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
                   i.name as institution_name
            FROM educator e
            JOIN useraccount u ON e.user_id = u.user_id
            LEFT JOIN institution i ON e.institution_id = i.institution_id
            WHERE e.user_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Educator not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error fetching educator:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update educator profile
const updateEducator = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            institution_id,
            employee_id,
            title,
            bio,
            specialization,
            qualifications,
            years_experience,
            verification_status,
            verification_documents,
            verified_by,
            payout_method,
            payout_details
        } = req.body;

        const updates = [];
        const values = [id];
        let paramIndex = 2;

        if (institution_id !== undefined) {
            updates.push(`institution_id = $${paramIndex++}`);
            values.push(institution_id);
        }
        if (employee_id !== undefined) {
            updates.push(`employee_id = $${paramIndex++}`);
            values.push(employee_id);
        }
        if (title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(title);
        }
        if (bio !== undefined) {
            updates.push(`bio = $${paramIndex++}`);
            values.push(bio);
        }
        if (specialization !== undefined) {
            updates.push(`specialization = $${paramIndex++}`);
            values.push(specialization);
        }
        if (qualifications !== undefined) {
            updates.push(`qualifications = $${paramIndex++}`);
            values.push(qualifications);
        }
        if (years_experience !== undefined) {
            updates.push(`years_experience = $${paramIndex++}`);
            values.push(years_experience);
        }
        if (verification_status !== undefined) {
            updates.push(`verification_status = $${paramIndex++}`);
            values.push(verification_status);
        }
        if (verification_documents !== undefined) {
            updates.push(`verification_documents = $${paramIndex++}`);
            values.push(JSON.stringify(verification_documents));
        }
        if (verified_by !== undefined) {
            updates.push(`verified_by = $${paramIndex++}, verified_at = CURRENT_TIMESTAMP`);
            values.push(verified_by);
        }
        if (payout_method !== undefined) {
            updates.push(`payout_method = $${paramIndex++}`);
            values.push(payout_method);
        }
        if (payout_details !== undefined) {
            updates.push(`payout_details = $${paramIndex++}`);
            values.push(JSON.stringify(payout_details));
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const result = await sql`
            UPDATE educator 
            SET ${sql.unsafe(updates.join(', '))}
            WHERE user_id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Educator not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error updating educator:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete educator
const deleteEducator = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            DELETE FROM educator 
            WHERE user_id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Educator not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Educator deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting educator:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get educator stats
const getEducatorStats = async (req, res) => {
    try {
        const { id } = req.params;

        const stats = await sql`
            SELECT 
                e.total_students,
                e.total_courses,
                e.teaching_rating,
                e.total_earnings,
                COUNT(DISTINCT c.course_id) as published_courses,
                COUNT(DISTINCT en.learner_id) as enrolled_students,
                AVG(cr.rating) as average_rating,
                COUNT(cr.review_id) as total_reviews
            FROM educator e
            LEFT JOIN course c ON e.user_id = c.educator_id AND c.is_published = true
            LEFT JOIN enrollment en ON c.course_id = en.course_id AND en.status = 'active'
            LEFT JOIN course_review cr ON c.course_id = cr.course_id
            WHERE e.user_id = ${id}
            GROUP BY e.user_id, e.total_students, e.total_courses, e.teaching_rating, e.total_earnings
        `;

        if (stats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Educator not found'
            });
        }

        res.status(200).json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching educator stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createEducator,
    getAllEducators,
    getEducatorById,
    updateEducator,
    deleteEducator,
    getEducatorStats
};
