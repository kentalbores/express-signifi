const sql = require('../../config/database');

// Create assignment submission
const createAssignmentSubmission = async (req, res) => {
    try {
        const {
            user_id,
            lesson_id,
            enrollment_id,
            submission_text,
            submitted_files,
            status = 'submitted'
        } = req.body;

        const result = await sql`
            INSERT INTO assignment_submission (
                user_id, lesson_id, enrollment_id, submission_text, 
                submitted_files, status
            )
            VALUES (
                ${user_id}, ${lesson_id}, ${enrollment_id}, ${submission_text},
                ${submitted_files ? JSON.stringify(submitted_files) : null}, ${status}
            )
            RETURNING *
        `;

        res.status(201).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error creating assignment submission:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all assignment submissions
const getAllAssignmentSubmissions = async (req, res) => {
    try {
        const { lesson_id, user_id, enrollment_id, status } = req.query;
        
        let query = sql`SELECT * FROM assignment_submission WHERE 1=1`;
        
        if (lesson_id) {
            query = sql`SELECT * FROM assignment_submission WHERE lesson_id = ${lesson_id}`;
        }
        if (user_id) {
            query = sql`SELECT * FROM assignment_submission WHERE user_id = ${user_id}`;
        }
        if (enrollment_id) {
            query = sql`SELECT * FROM assignment_submission WHERE enrollment_id = ${enrollment_id}`;
        }
        if (status) {
            query = sql`SELECT * FROM assignment_submission WHERE status = ${status}`;
        }

        const result = await query;

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching assignment submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get assignment submission by ID
const getAssignmentSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            SELECT * FROM assignment_submission 
            WHERE submission_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Assignment submission not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error fetching assignment submission:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update assignment submission (mainly for grading)
const updateAssignmentSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status,
            score,
            max_score,
            feedback,
            graded_by
        } = req.body;

        const updates = [];
        const values = [id];
        let paramIndex = 2;

        if (status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(status);
        }
        if (score !== undefined) {
            updates.push(`score = $${paramIndex++}`);
            values.push(score);
        }
        if (max_score !== undefined) {
            updates.push(`max_score = $${paramIndex++}`);
            values.push(max_score);
        }
        if (feedback !== undefined) {
            updates.push(`feedback = $${paramIndex++}`);
            values.push(feedback);
        }
        if (graded_by !== undefined) {
            updates.push(`graded_by = $${paramIndex++}, graded_at = CURRENT_TIMESTAMP`);
            values.push(graded_by);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const result = await sql`
            UPDATE assignment_submission 
            SET ${sql.unsafe(updates.join(', '))}
            WHERE submission_id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Assignment submission not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error updating assignment submission:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete assignment submission
const deleteAssignmentSubmission = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            DELETE FROM assignment_submission 
            WHERE submission_id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Assignment submission not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Assignment submission deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting assignment submission:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createAssignmentSubmission,
    getAllAssignmentSubmissions,
    getAssignmentSubmissionById,
    updateAssignmentSubmission,
    deleteAssignmentSubmission
};
