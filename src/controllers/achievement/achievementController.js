const sql = require('../../config/database');

// Create user achievement (progress or completion for a definition)
const createAchievement = async (req, res) => {
    try {
        const { user_id, achievement_def_id, progress_data, is_completed, points_earned, earned_at } = req.body;
        if (!user_id || isNaN(user_id) || !achievement_def_id || isNaN(achievement_def_id)) {
            return res.status(400).json({ error: 'Missing required fields: user_id and achievement_def_id must be numbers' });
        }
        const result = await sql`
            INSERT INTO user_achievement (user_id, achievement_def_id, progress_data, is_completed, points_earned, earned_at)
            VALUES (${user_id}, ${achievement_def_id}, ${progress_data || null}, ${is_completed || false}, ${points_earned || 0}, ${earned_at || null})
            RETURNING achievement_id, user_id, achievement_def_id, progress_data, is_completed, points_earned, earned_at, created_at
        `;
        res.status(201).json({ message: 'Achievement created successfully', achievement: result[0] });
    } catch (error) {
        console.error('Error creating achievement:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key (user_id or achievement_def_id) does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List achievements (optionally by user_id)
const getAllAchievements = async (req, res) => {
    try {
        const { user_id } = req.query;
        let query = `
            SELECT a.achievement_id, a.user_id, a.achievement_def_id, a.progress_data, a.is_completed, a.points_earned, a.earned_at, a.created_at,
                   (u.first_name || ' ' || u.last_name) AS user_name,
                   d.name as definition_name, d.description as definition_description, d.category, d.icon_url, d.badge_color, d.points_reward
            FROM user_achievement a
            LEFT JOIN useraccount u ON a.user_id = u.user_id
            LEFT JOIN achievement_definition d ON a.achievement_def_id = d.achievement_def_id`;
        const values = [];
        if (user_id) { query += ' WHERE a.user_id = $1'; values.push(user_id); }
        query += ' ORDER BY a.created_at DESC';
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
        const result = await sql`SELECT achievement_id, user_id, achievement_def_id, progress_data, is_completed, points_earned, earned_at, created_at FROM user_achievement WHERE achievement_id = ${id}`;
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
        const { user_id, achievement_def_id, progress_data, is_completed, points_earned, earned_at } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid achievement ID' });
        const current = await sql`SELECT user_id, achievement_def_id, progress_data, is_completed, points_earned, earned_at FROM user_achievement WHERE achievement_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Achievement not found' });
        const updatedUserId = user_id !== undefined ? user_id : current[0].user_id;
        const updatedDefId = achievement_def_id !== undefined ? achievement_def_id : current[0].achievement_def_id;
        const updatedProgress = progress_data !== undefined ? progress_data : current[0].progress_data;
        const updatedIsCompleted = is_completed !== undefined ? is_completed : current[0].is_completed;
        const updatedPoints = points_earned !== undefined ? points_earned : current[0].points_earned;
        const updatedEarnedAt = earned_at !== undefined ? earned_at : current[0].earned_at;
        const result = await sql`
            UPDATE user_achievement SET user_id = ${updatedUserId}, achievement_def_id = ${updatedDefId}, progress_data = ${updatedProgress}, is_completed = ${updatedIsCompleted}, points_earned = ${updatedPoints}, earned_at = ${updatedEarnedAt}
            WHERE achievement_id = ${id}
            RETURNING achievement_id, user_id, achievement_def_id, progress_data, is_completed, points_earned, earned_at, created_at
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
        const result = await sql`DELETE FROM user_achievement WHERE achievement_id = ${id} RETURNING achievement_id`;
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


