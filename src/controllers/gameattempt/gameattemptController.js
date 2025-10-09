const sql = require('../../config/database');

// Create game attempt
const createGameAttempt = async (req, res) => {
    try {
        const { user_id, game_id, score } = req.body;
        if (!user_id || isNaN(user_id) || !game_id || isNaN(game_id)) {
            return res.status(400).json({ error: 'Missing required fields: user_id and game_id must be numbers' });
        }
        const result = await sql`
            INSERT INTO game_attempt (user_id, game_id, score)
            VALUES (${user_id}, ${game_id}, ${score || 0})
            RETURNING attempt_id, user_id, game_id, score, played_at
        `;
        res.status(201).json({ message: 'Game attempt created successfully', game_attempt: result[0] });
    } catch (error) {
        console.error('Error creating game attempt:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: user_id or game_id does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List game attempts (optionally by user_id or game_id)
const getAllGameAttempts = async (req, res) => {
    try {
        const { user_id, game_id } = req.query;
        
        // Build WHERE conditions dynamically
        let whereClause = sql``;
        const conditions = [];
        
        if (user_id) {
            conditions.push(sql`ga.user_id = ${user_id}`);
        }
        if (game_id) {
            conditions.push(sql`ga.game_id = ${game_id}`);
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
        
        const game_attempts = await sql`
            SELECT ga.attempt_id as game_attempt_id, ga.user_id, ga.game_id, ga.score, ga.played_at,
                   (u.first_name || ' ' || u.last_name) AS user_name, g.name AS game_name
            FROM game_attempt ga
            LEFT JOIN useraccount u ON ga.user_id = u.user_id
            LEFT JOIN minigame g ON ga.game_id = g.game_id
            ${whereClause}
            ORDER BY ga.played_at DESC
        `;
        
        res.status(200).json({ message: 'Game attempts retrieved successfully', game_attempts });
    } catch (error) {
        console.error('Error fetching game attempts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get game attempt by ID
const getGameAttemptById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid game_attempt ID' });
        const result = await sql`SELECT attempt_id as game_attempt_id, user_id, game_id, score, played_at FROM game_attempt WHERE attempt_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Game attempt not found' });
        res.status(200).json({ message: 'Game attempt retrieved successfully', game_attempt: result[0] });
    } catch (error) {
        console.error('Error fetching game attempt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update game attempt
const updateGameAttempt = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, game_id, score } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid game_attempt ID' });
        const current = await sql`SELECT user_id, game_id, score FROM game_attempt WHERE attempt_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Game attempt not found' });
        const updatedUserId = user_id !== undefined ? user_id : current[0].user_id;
        const updatedGameId = game_id !== undefined ? game_id : current[0].game_id;
        const updatedScore = score !== undefined ? score : current[0].score;
        const result = await sql`
            UPDATE game_attempt SET user_id = ${updatedUserId}, game_id = ${updatedGameId}, score = ${updatedScore}
            WHERE attempt_id = ${id}
            RETURNING attempt_id as game_attempt_id, user_id, game_id, score, played_at
        `;
        res.status(200).json({ message: 'Game attempt updated successfully', game_attempt: result[0] });
    } catch (error) {
        console.error('Error updating game attempt:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: user_id or game_id does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete game attempt
const deleteGameAttempt = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid game_attempt ID' });
        const result = await sql`DELETE FROM game_attempt WHERE attempt_id = ${id} RETURNING attempt_id as game_attempt_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Game attempt not found' });
        res.status(200).json({ message: 'Game attempt deleted successfully' });
    } catch (error) {
        console.error('Error deleting game attempt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createGameAttempt,
    getAllGameAttempts,
    getGameAttemptById,
    updateGameAttempt,
    deleteGameAttempt
};


