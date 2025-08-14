const sql = require('../../config/database');

// Create attempt
const createAttempt = async (req, res) => {
    try {
        const { user_id, lesson_id, score } = req.body;
        if (!user_id || isNaN(user_id) || !lesson_id || isNaN(lesson_id)) {
            return res.status(400).json({ error: 'Missing required fields: user_id and lesson_id must be numbers' });
        }
        const result = await sql`
            INSERT INTO attempt (user_id, lesson_id, score)
            VALUES (${user_id}, ${lesson_id}, ${score || null})
            RETURNING attempt_id, user_id, lesson_id, score, completed_at
        `;
        res.status(201).json({ message: 'Attempt created successfully', attempt: result[0] });
    } catch (error) {
        console.error('Error creating attempt:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: user_id or lesson_id does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List attempts (optionally by user_id or lesson_id)
const getAllAttempts = async (req, res) => {
    try {
        const { user_id, lesson_id } = req.query;
        let query = `
            SELECT a.attempt_id, a.user_id, a.lesson_id, a.score, a.completed_at,
                   u.full_name AS user_name, l.title AS lesson_title
            FROM attempt a
            LEFT JOIN useraccount u ON a.user_id = u.user_id
            LEFT JOIN lesson l ON a.lesson_id = l.lesson_id`;
        const conditions = [];
        const values = [];
        if (user_id) { conditions.push('a.user_id = $' + (values.length + 1)); values.push(user_id); }
        if (lesson_id) { conditions.push('a.lesson_id = $' + (values.length + 1)); values.push(lesson_id); }
        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY a.completed_at DESC';
        const attempts = await sql.unsafe(query, values);
        res.status(200).json({ message: 'Attempts retrieved successfully', attempts });
    } catch (error) {
        console.error('Error fetching attempts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get attempt by ID
const getAttemptById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid attempt ID' });
        const result = await sql`SELECT attempt_id, user_id, lesson_id, score, completed_at FROM attempt WHERE attempt_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Attempt not found' });
        res.status(200).json({ message: 'Attempt retrieved successfully', attempt: result[0] });
    } catch (error) {
        console.error('Error fetching attempt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update attempt
const updateAttempt = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, lesson_id, score } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid attempt ID' });
        const current = await sql`SELECT user_id, lesson_id, score FROM attempt WHERE attempt_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Attempt not found' });
        const updatedUserId = user_id !== undefined ? user_id : current[0].user_id;
        const updatedLessonId = lesson_id !== undefined ? lesson_id : current[0].lesson_id;
        const updatedScore = score !== undefined ? score : current[0].score;
        const result = await sql`
            UPDATE attempt SET user_id = ${updatedUserId}, lesson_id = ${updatedLessonId}, score = ${updatedScore}
            WHERE attempt_id = ${id}
            RETURNING attempt_id, user_id, lesson_id, score, completed_at
        `;
        res.status(200).json({ message: 'Attempt updated successfully', attempt: result[0] });
    } catch (error) {
        console.error('Error updating attempt:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: user_id or lesson_id does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete attempt
const deleteAttempt = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid attempt ID' });
        const result = await sql`DELETE FROM attempt WHERE attempt_id = ${id} RETURNING attempt_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Attempt not found' });
        res.status(200).json({ message: 'Attempt deleted successfully' });
    } catch (error) {
        console.error('Error deleting attempt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createAttempt,
    getAllAttempts,
    getAttemptById,
    updateAttempt,
    deleteAttempt
};


