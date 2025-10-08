const sql = require('../../config/database');

// Create feedback
const createFeedback = async (req, res) => {
    try {
        const { course_id, user_id, enrollment_id, rating, title, comment, is_featured, is_verified_purchase } = req.body;
        if (!course_id || isNaN(course_id) || !user_id || isNaN(user_id) || !enrollment_id || isNaN(enrollment_id) || rating === undefined || isNaN(rating)) {
            return res.status(400).json({ error: 'Missing required fields: course_id, user_id, enrollment_id must be numbers and rating required' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'rating must be between 1 and 5' });
        }
        const result = await sql`
            INSERT INTO course_review (course_id, learner_id, enrollment_id, rating, title, comment, is_featured, is_verified_purchase)
            VALUES (${course_id}, ${user_id}, ${enrollment_id}, ${rating}, ${title || null}, ${comment || null}, ${is_featured || false}, ${is_verified_purchase || true})
            RETURNING review_id, course_id, learner_id as user_id, enrollment_id, rating, title, comment, is_featured, is_verified_purchase, created_at
        `;
        res.status(201).json({ message: 'Feedback created successfully', feedback: result[0] });
    } catch (error) {
        console.error('Error creating feedback:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: course_id, user_id, or enrollment_id does not exist' });
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
            SELECT r.review_id as feedback_id, r.course_id, r.learner_id as user_id, r.enrollment_id, r.rating, r.title, r.comment, r.is_featured, r.is_verified_purchase, r.created_at,
                   c.title AS course_title
            FROM course_review r
            LEFT JOIN course c ON r.course_id = c.course_id`;
        const values = [];
        if (course_id) { query += ' WHERE r.course_id = $1'; values.push(course_id); }
        query += ' ORDER BY r.created_at DESC';
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
        const result = await sql`SELECT review_id as feedback_id, course_id, learner_id as user_id, enrollment_id, rating, title, comment, is_featured, is_verified_purchase, created_at FROM course_review WHERE review_id = ${id}`;
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
        const { course_id, user_id, enrollment_id, rating, title, comment, is_featured, is_verified_purchase } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid feedback ID' });
        const current = await sql`SELECT course_id, learner_id as user_id, enrollment_id, rating, title, comment, is_featured, is_verified_purchase FROM course_review WHERE review_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Feedback not found' });
        const updatedCourseId = course_id !== undefined ? course_id : current[0].course_id;
        const updatedUserId = user_id !== undefined ? user_id : current[0].user_id;
        const updatedEnrollmentId = enrollment_id !== undefined ? enrollment_id : current[0].enrollment_id;
        const updatedRating = rating !== undefined ? rating : current[0].rating;
        const updatedTitle = title !== undefined ? title : current[0].title;
        const updatedComment = comment !== undefined ? comment : current[0].comment;
        const updatedFeatured = is_featured !== undefined ? is_featured : current[0].is_featured;
        const updatedVerified = is_verified_purchase !== undefined ? is_verified_purchase : current[0].is_verified_purchase;
        if (updatedRating < 1 || updatedRating > 5) {
            return res.status(400).json({ error: 'rating must be between 1 and 5' });
        }
        const result = await sql`
            UPDATE course_review SET course_id = ${updatedCourseId}, learner_id = ${updatedUserId}, enrollment_id = ${updatedEnrollmentId}, rating = ${updatedRating}, title = ${updatedTitle}, comment = ${updatedComment}, is_featured = ${updatedFeatured}, is_verified_purchase = ${updatedVerified}
            WHERE review_id = ${id}
            RETURNING review_id as feedback_id, course_id, learner_id as user_id, enrollment_id, rating, title, comment, is_featured, is_verified_purchase, created_at
        `;
        res.status(200).json({ message: 'Feedback updated successfully', feedback: result[0] });
    } catch (error) {
        console.error('Error updating feedback:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: course_id, user_id, or enrollment_id does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid feedback ID' });
        const result = await sql`DELETE FROM course_review WHERE review_id = ${id} RETURNING review_id`;
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


