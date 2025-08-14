const sql = require('../../config/database');

// Create minigame
const createMinigame = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing required field: name' });
        const result = await sql`INSERT INTO minigame (name, description) VALUES (${name}, ${description || null}) RETURNING game_id, name, description`;
        res.status(201).json({ message: 'Minigame created successfully', game: result[0] });
    } catch (error) {
        console.error('Error creating minigame:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List minigames
const getAllMinigames = async (_req, res) => {
    try {
        const games = await sql`SELECT game_id, name, description FROM minigame ORDER BY game_id DESC`;
        res.status(200).json({ message: 'Minigames retrieved successfully', games });
    } catch (error) {
        console.error('Error fetching minigames:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get by ID
const getMinigameById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid game ID' });
        const result = await sql`SELECT game_id, name, description FROM minigame WHERE game_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Minigame not found' });
        res.status(200).json({ message: 'Minigame retrieved successfully', game: result[0] });
    } catch (error) {
        console.error('Error fetching minigame:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update
const updateMinigame = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid game ID' });
        const current = await sql`SELECT name, description FROM minigame WHERE game_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Minigame not found' });
        const updatedName = name !== undefined ? name : current[0].name;
        const updatedDescription = description !== undefined ? description : current[0].description;
        const result = await sql`
            UPDATE minigame SET name = ${updatedName}, description = ${updatedDescription}
            WHERE game_id = ${id}
            RETURNING game_id, name, description
        `;
        res.status(200).json({ message: 'Minigame updated successfully', game: result[0] });
    } catch (error) {
        console.error('Error updating minigame:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete
const deleteMinigame = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid game ID' });
        const result = await sql`DELETE FROM minigame WHERE game_id = ${id} RETURNING game_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Minigame not found' });
        res.status(200).json({ message: 'Minigame deleted successfully' });
    } catch (error) {
        console.error('Error deleting minigame:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createMinigame,
    getAllMinigames,
    getMinigameById,
    updateMinigame,
    deleteMinigame
};


