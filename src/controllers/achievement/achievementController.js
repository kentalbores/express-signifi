const sql = require('../../config/database');

// Create achievement
const createAchievement = async (req, res) => {
    try {
        const { user_id, type, description, awarded_at } = req.body;
        if (!user_id || isNaN(user_id) || !type) {
            return res.status(400).json({ error: 'Missing required fields: user_id (number) and type are required' });
        }
        const result = await sql`
            INSERT INTO achievement (user_id, type, description, awarded_at)
            VALUES (${user_id}, ${type}, ${description || null}, ${awarded_at || null})
            RETURNING achievement_id, user_id, type, description, awarded_at
        `;
        res.status(201).json({ message: 'Achievement created successfully', achievement: result[0] });
    } catch (error) {
        console.error('Error creating achievement:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid user_id: user does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List achievements (optionally by user_id)
const getAllAchievements = async (req, res) => {
    try {
        const { user_id } = req.query;
        let query = `
            SELECT a.achievement_id, a.user_id, a.type, a.description, a.awarded_at,
                   u.full_name AS user_name
            FROM achievement a
            LEFT JOIN useraccount u ON a.user_id = u.user_id`;
        const values = [];
        if (user_id) { query += ' WHERE a.user_id = $1'; values.push(user_id); }
        query += ' ORDER BY a.awarded_at DESC';
        const achievements = await sql.unsafe(query, values);
        res.status(200).json({ message: 'Achievements retrieved successfully', achievements });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get achievement by ID
const getAchievementById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid achievement ID' });
        const result = await sql`SELECT achievement_id, user_id, type, description, awarded_at FROM achievement WHERE achievement_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Achievement not found' });
        res.status(200).json({ message: 'Achievement retrieved successfully', achievement: result[0] });
    } catch (error) {
        console.error('Error fetching achievement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update achievement
const updateAchievement = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, type, description, awarded_at } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid achievement ID' });
        const current = await sql`SELECT user_id, type, description, awarded_at FROM achievement WHERE achievement_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Achievement not found' });
        const updatedUserId = user_id !== undefined ? user_id : current[0].user_id;
        const updatedType = type !== undefined ? type : current[0].type;
        const updatedDescription = description !== undefined ? description : current[0].description;
        const updatedAwardedAt = awarded_at !== undefined ? awarded_at : current[0].awarded_at;
        const result = await sql`
            UPDATE achievement SET user_id = ${updatedUserId}, type = ${updatedType}, description = ${updatedDescription}, awarded_at = ${updatedAwardedAt}
            WHERE achievement_id = ${id}
            RETURNING achievement_id, user_id, type, description, awarded_at
        `;
        res.status(200).json({ message: 'Achievement updated successfully', achievement: result[0] });
    } catch (error) {
        console.error('Error updating achievement:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid user_id: user does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete achievement
const deleteAchievement = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid achievement ID' });
        const result = await sql`DELETE FROM achievement WHERE achievement_id = ${id} RETURNING achievement_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Achievement not found' });
        res.status(200).json({ message: 'Achievement deleted successfully' });
    } catch (error) {
        console.error('Error deleting achievement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createAchievement,
    getAllAchievements,
    getAchievementById,
    updateAchievement,
    deleteAchievement
};


