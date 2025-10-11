const sql = require('../../config/database');

// Create minigame
const createMinigame = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            difficulty_level,
            instructions,
            thumbnail_url,
            game_config,
            points_reward = 0,
            is_active = true
        } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Missing required field: name' });
        if (difficulty_level) {
            const valid = ['easy', 'medium', 'hard', 'expert'];
            if (!valid.includes(difficulty_level)) {
                return res.status(400).json({ success: false, error: 'Invalid difficulty_level. Must be easy, medium, hard, or expert' });
            }
        }
        const result = await sql`
            INSERT INTO minigame (
              name, description, category, difficulty_level, instructions, thumbnail_url, game_config, points_reward, is_active
            )
            VALUES (
              ${name}, ${description || null}, ${category || null}, ${difficulty_level || null}, ${instructions || null},
              ${thumbnail_url || null}, ${game_config || null}, ${points_reward}, ${is_active}
            )
            RETURNING game_id, name, description, category, difficulty_level, instructions, thumbnail_url, game_config, points_reward, is_active, created_at
        `;
        res.status(201).json({ success: true, message: 'Minigame created successfully', data: result[0] });
    } catch (error) {
        console.error('Error creating minigame:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// List minigames
const getAllMinigames = async (_req, res) => {
    try {
        const games = await sql`SELECT game_id, name, description, category, difficulty_level, instructions, thumbnail_url, game_config, points_reward, is_active, created_at FROM minigame ORDER BY game_id DESC`;
        res.status(200).json({ success: true, message: 'Minigames retrieved successfully', data: games });
    } catch (error) {
        console.error('Error fetching minigames:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Get by ID
const getMinigameById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid game ID' });
        const result = await sql`SELECT game_id, name, description, category, difficulty_level, instructions, thumbnail_url, game_config, points_reward, is_active, created_at FROM minigame WHERE game_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ success: false, error: 'Minigame not found' });
        res.status(200).json({ success: true, message: 'Minigame retrieved successfully', data: result[0] });
    } catch (error) {
        console.error('Error fetching minigame:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Update
const updateMinigame = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, difficulty_level, instructions, thumbnail_url, game_config, points_reward, is_active } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid game ID' });
        const current = await sql`SELECT name, description, category, difficulty_level, instructions, thumbnail_url, game_config, points_reward, is_active FROM minigame WHERE game_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ success: false, error: 'Minigame not found' });
        const updatedName = name !== undefined ? name : current[0].name;
        const updatedDescription = description !== undefined ? description : current[0].description;
        const updatedCategory = category !== undefined ? category : current[0].category;
        const updatedDifficulty = difficulty_level !== undefined ? difficulty_level : current[0].difficulty_level;
        if (updatedDifficulty) {
            const valid = ['easy', 'medium', 'hard', 'expert'];
            if (!valid.includes(updatedDifficulty)) return res.status(400).json({ success: false, error: 'Invalid difficulty_level. Must be easy, medium, hard, or expert' });
        }
        const updatedInstructions = instructions !== undefined ? instructions : current[0].instructions;
        const updatedThumb = thumbnail_url !== undefined ? thumbnail_url : current[0].thumbnail_url;
        const updatedConfig = game_config !== undefined ? game_config : current[0].game_config;
        const updatedPoints = points_reward !== undefined ? points_reward : current[0].points_reward;
        const updatedActive = is_active !== undefined ? is_active : current[0].is_active;
        const result = await sql`
            UPDATE minigame SET name = ${updatedName}, description = ${updatedDescription}, category = ${updatedCategory}, difficulty_level = ${updatedDifficulty}, instructions = ${updatedInstructions}, thumbnail_url = ${updatedThumb}, game_config = ${updatedConfig}, points_reward = ${updatedPoints}, is_active = ${updatedActive}
            WHERE game_id = ${id}
            RETURNING game_id, name, description, category, difficulty_level, instructions, thumbnail_url, game_config, points_reward, is_active, created_at
        `;
        res.status(200).json({ success: true, message: 'Minigame updated successfully', data: result[0] });
    } catch (error) {
        console.error('Error updating minigame:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Delete
const deleteMinigame = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid game ID' });
        const result = await sql`DELETE FROM minigame WHERE game_id = ${id} RETURNING game_id`;
        if (result.length === 0) return res.status(404).json({ success: false, error: 'Minigame not found' });
        res.status(200).json({ success: true, message: 'Minigame deleted successfully' });
    } catch (error) {
        console.error('Error deleting minigame:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

module.exports = {
    createMinigame,
    getAllMinigames,
    getMinigameById,
    updateMinigame,
    deleteMinigame
};


