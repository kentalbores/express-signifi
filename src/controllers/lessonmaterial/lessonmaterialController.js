const sql = require('../../config/database');

// Create lesson material
const createLessonMaterial = async (req, res) => {
    try {
        const { lesson_id, file_id, title, description, is_downloadable = true, order_index } = req.body;
        if (!lesson_id || isNaN(lesson_id) || !file_id || isNaN(file_id)) {
            return res.status(400).json({ error: 'Missing required fields: lesson_id (number) and file_id (number) are required' });
        }
        const resolvedOrder = (order_index !== undefined && !isNaN(order_index)) ? order_index : 0;
        const result = await sql`
            INSERT INTO lessonmaterial (lesson_id, file_id, title, description, is_downloadable, order_index)
            VALUES (${lesson_id}, ${file_id}, ${title || null}, ${description || null}, ${is_downloadable}, ${resolvedOrder})
            RETURNING material_id, lesson_id, file_id, title, description, is_downloadable, order_index
        `;
        res.status(201).json({ message: 'Lesson material created successfully', material: result[0] });
    } catch (error) {
        console.error('Error creating lesson material:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid lesson_id: lesson does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List lesson materials (optionally by lesson_id)
const getAllLessonMaterials = async (req, res) => {
    try {
        const { lesson_id } = req.query;
        let query = 'SELECT material_id, lesson_id, file_id, title, description, is_downloadable, order_index FROM lessonmaterial';
        const values = [];
        if (lesson_id) { query += ' WHERE lesson_id = $1'; values.push(lesson_id); }
        query += ' ORDER BY order_index ASC, material_id DESC';
        const materials = await sql.unsafe(query, values);
        res.status(200).json({ message: 'Lesson materials retrieved successfully', materials });
    } catch (error) {
        console.error('Error fetching lesson materials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get lesson material by ID
const getLessonMaterialById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid material ID' });
        const result = await sql`SELECT material_id, lesson_id, file_id, title, description, is_downloadable, order_index FROM lessonmaterial WHERE material_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Lesson material not found' });
        res.status(200).json({ message: 'Lesson material retrieved successfully', material: result[0] });
    } catch (error) {
        console.error('Error fetching lesson material:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update lesson material
const updateLessonMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { lesson_id, file_id, title, description, is_downloadable, order_index } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid material ID' });
        const current = await sql`SELECT lesson_id, file_id, title, description, is_downloadable, order_index FROM lessonmaterial WHERE material_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Lesson material not found' });
        const updatedLessonId = lesson_id !== undefined ? lesson_id : current[0].lesson_id;
        const updatedFileId = file_id !== undefined ? file_id : current[0].file_id;
        const updatedTitle = title !== undefined ? title : current[0].title;
        const updatedDescription = description !== undefined ? description : current[0].description;
        const updatedIsDownloadable = is_downloadable !== undefined ? is_downloadable : current[0].is_downloadable;
        const updatedOrder = order_index !== undefined ? order_index : current[0].order_index;
        const result = await sql`
            UPDATE lessonmaterial SET lesson_id = ${updatedLessonId}, file_id = ${updatedFileId}, title = ${updatedTitle}, description = ${updatedDescription}, is_downloadable = ${updatedIsDownloadable}, order_index = ${updatedOrder}
            WHERE material_id = ${id}
            RETURNING material_id, lesson_id, file_id, title, description, is_downloadable, order_index
        `;
        res.status(200).json({ message: 'Lesson material updated successfully', material: result[0] });
    } catch (error) {
        console.error('Error updating lesson material:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid lesson_id: lesson does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete lesson material
const deleteLessonMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid material ID' });
        const result = await sql`DELETE FROM lessonmaterial WHERE material_id = ${id} RETURNING material_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Lesson material not found' });
        res.status(200).json({ message: 'Lesson material deleted successfully' });
    } catch (error) {
        console.error('Error deleting lesson material:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createLessonMaterial,
    getAllLessonMaterials,
    getLessonMaterialById,
    updateLessonMaterial,
    deleteLessonMaterial
};


