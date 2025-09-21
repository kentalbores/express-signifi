const sql = require('../../config/database');

// Create course moderation
const createCourseModeration = async (req, res) => {
    try {
        const { course_id, admin_id, status, reviewed_at } = req.body;
        if (!course_id || isNaN(course_id) || !admin_id || isNaN(admin_id) || !status) {
            return res.status(400).json({ error: 'Missing required fields: course_id, admin_id and status are required' });
        }
        if (!['approved', 'rejected', 'flagged', 'under_review', 'requires_changes'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: approved, rejected, flagged, under_review, requires_changes' });
        }
        const result = await sql`
            INSERT INTO coursemoderation (course_id, admin_id, status, reviewed_at)
            VALUES (${course_id}, ${admin_id}, ${status}, ${reviewed_at || null})
            RETURNING moderation_id, course_id, admin_id, status, reviewed_at
        `;
        res.status(201).json({ message: 'Course moderation created successfully', moderation: result[0] });
    } catch (error) {
        console.error('Error creating course moderation:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: course_id or admin_id does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List course moderations (optionally by course_id or admin_id or status)
const getAllCourseModerations = async (req, res) => {
    try {
        const { course_id, admin_id, status } = req.query;
        let query = 'SELECT moderation_id, course_id, admin_id, status, reviewed_at FROM coursemoderation';
        const conditions = [];
        const values = [];
        if (course_id) { conditions.push('course_id = $' + (values.length + 1)); values.push(course_id); }
        if (admin_id) { conditions.push('admin_id = $' + (values.length + 1)); values.push(admin_id); }
        if (status) { conditions.push('status = $' + (values.length + 1)); values.push(status); }
        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY reviewed_at DESC NULLS LAST';
        const moderations = await sql.unsafe(query, values);
        res.status(200).json({ message: 'Course moderations retrieved successfully', moderations });
    } catch (error) {
        console.error('Error fetching course moderations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get by ID
const getCourseModerationById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid moderation ID' });
        const result = await sql`SELECT moderation_id, course_id, admin_id, status, reviewed_at FROM coursemoderation WHERE moderation_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Course moderation not found' });
        res.status(200).json({ message: 'Course moderation retrieved successfully', moderation: result[0] });
    } catch (error) {
        console.error('Error fetching course moderation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update
const updateCourseModeration = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_id, admin_id, status, reviewed_at } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid moderation ID' });
        const current = await sql`SELECT course_id, admin_id, status, reviewed_at FROM coursemoderation WHERE moderation_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Course moderation not found' });
        const updatedCourseId = course_id !== undefined ? course_id : current[0].course_id;
        const updatedAdminId = admin_id !== undefined ? admin_id : current[0].admin_id;
        const updatedStatus = status !== undefined ? status : current[0].status;
        const updatedReviewedAt = reviewed_at !== undefined ? reviewed_at : current[0].reviewed_at;
        if (updatedStatus && !['approved', 'rejected', 'flagged', 'under_review', 'requires_changes'].includes(updatedStatus)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: approved, rejected, flagged, under_review, requires_changes' });
        }
        const result = await sql`
            UPDATE coursemoderation SET course_id = ${updatedCourseId}, admin_id = ${updatedAdminId}, status = ${updatedStatus}, reviewed_at = ${updatedReviewedAt}
            WHERE moderation_id = ${id}
            RETURNING moderation_id, course_id, admin_id, status, reviewed_at
        `;
        res.status(200).json({ message: 'Course moderation updated successfully', moderation: result[0] });
    } catch (error) {
        console.error('Error updating course moderation:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: course_id or admin_id does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete
const deleteCourseModeration = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid moderation ID' });
        const result = await sql`DELETE FROM coursemoderation WHERE moderation_id = ${id} RETURNING moderation_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Course moderation not found' });
        res.status(200).json({ message: 'Course moderation deleted successfully' });
    } catch (error) {
        console.error('Error deleting course moderation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createCourseModeration,
    getAllCourseModerations,
    getCourseModerationById,
    updateCourseModeration,
    deleteCourseModeration
};


