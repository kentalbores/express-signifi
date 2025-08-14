const sql = require('../../config/database');

// Create feedback
const createFeedback = async (req, res) => {
    try {
        const { course_id, rating, comment } = req.body;
        if (!course_id || isNaN(course_id) || !rating || isNaN(rating)) {
            return res.status(400).json({ error: 'Missing required fields: course_id and rating must be numbers' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'rating must be between 1 and 5' });
        }
        const result = await sql`
            INSERT INTO feedback (course_id, rating, comment)
            VALUES (${course_id}, ${rating}, ${comment || null})
            RETURNING feedback_id, course_id, rating, comment, created_at
        `;
        res.status(201).json({ message: 'Feedback created successfully', feedback: result[0] });
    } catch (error) {
        console.error('Error creating feedback:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid course_id: course does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid rating value' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List feedback (optionally by course_id)
const getAllFeedback = async (req, res) => {
    try {
        const { course_id } = req.query;
        let query = `
            SELECT f.feedback_id, f.course_id, f.rating, f.comment, f.created_at,
                   c.title AS course_title
            FROM feedback f
            LEFT JOIN course c ON f.course_id = c.course_id`;
        const values = [];
        if (course_id) { query += ' WHERE f.course_id = $1'; values.push(course_id); }
        query += ' ORDER BY f.created_at DESC';
        const feedback = await sql.unsafe(query, values);
        res.status(200).json({ message: 'Feedback retrieved successfully', feedback });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get feedback by ID
const getFeedbackById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid feedback ID' });
        const result = await sql`SELECT feedback_id, course_id, rating, comment, created_at FROM feedback WHERE feedback_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Feedback not found' });
        res.status(200).json({ message: 'Feedback retrieved successfully', feedback: result[0] });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update feedback
const updateFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_id, rating, comment } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid feedback ID' });
        const current = await sql`SELECT course_id, rating, comment FROM feedback WHERE feedback_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Feedback not found' });
        const updatedCourseId = course_id !== undefined ? course_id : current[0].course_id;
        const updatedRating = rating !== undefined ? rating : current[0].rating;
        const updatedComment = comment !== undefined ? comment : current[0].comment;
        if (updatedRating < 1 || updatedRating > 5) {
            return res.status(400).json({ error: 'rating must be between 1 and 5' });
        }
        const result = await sql`
            UPDATE feedback SET course_id = ${updatedCourseId}, rating = ${updatedRating}, comment = ${updatedComment}
            WHERE feedback_id = ${id}
            RETURNING feedback_id, course_id, rating, comment, created_at
        `;
        res.status(200).json({ message: 'Feedback updated successfully', feedback: result[0] });
    } catch (error) {
        console.error('Error updating feedback:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid course_id: course does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid feedback ID' });
        const result = await sql`DELETE FROM feedback WHERE feedback_id = ${id} RETURNING feedback_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Feedback not found' });
        res.status(200).json({ message: 'Feedback deleted successfully' });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createFeedback,
    getAllFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedback
};


