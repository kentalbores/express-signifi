const sql = require('../../config/database');

// Create a new lesson
const createLesson = async (req, res) => {
    try {
        const { module_id, title, video_url, lesson_type, content, order_index } = req.body;
        if (!module_id || isNaN(module_id) || !title || !lesson_type) {
            return res.status(400).json({ error: 'Missing required fields: module_id (number), title and lesson_type are required' });
        }

        const validTypes = ['video', 'quiz', 'assignment', 'reading', 'interactive', 'live_session'];
        if (!validTypes.includes(lesson_type)) {
            return res.status(400).json({ error: 'Invalid lesson_type. Must be one of: video, quiz, assignment, reading, interactive, live_session' });
        }

        const resolvedOrderIndex = (order_index !== undefined && !isNaN(order_index)) ? order_index : 1;

        const result = await sql`
            INSERT INTO lesson (module_id, title, content, video_url, lesson_type, order_index)
            VALUES (${module_id}, ${title}, ${content || null}, ${video_url || null}, ${lesson_type}, ${resolvedOrderIndex})
            RETURNING lesson_id, module_id, title, content, video_url, lesson_type, order_index
        `;
        res.status(201).json({ message: 'Lesson created successfully', lesson: result[0] });
    } catch (error) {
        console.error('Error creating lesson:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid module_id: module does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid lesson_type value' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all lessons (optionally by module_id)
const getAllLessons = async (req, res) => {
    try {
        const { module_id } = req.query;
        let query = 'SELECT lesson_id, module_id, title, content, video_url, lesson_type, order_index FROM lesson';
        const values = [];
        if (module_id) {
            query += ' WHERE module_id = $1';
            values.push(module_id);
        }
        query += ' ORDER BY lesson_id DESC';
        const lessons = await sql.unsafe(query, values);
        res.status(200).json({ message: 'Lessons retrieved successfully', lessons });
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get lesson by ID
const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid lesson ID' });

        const result = await sql`
            SELECT lesson_id, module_id, title, content, video_url, lesson_type, order_index FROM lesson WHERE lesson_id = ${id}
        `;
        if (result.length === 0) return res.status(404).json({ error: 'Lesson not found' });
        res.status(200).json({ message: 'Lesson retrieved successfully', lesson: result[0] });
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update lesson
const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { module_id, title, content, video_url, lesson_type, order_index } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid lesson ID' });

        const current = await sql`SELECT module_id, title, content, video_url, lesson_type, order_index FROM lesson WHERE lesson_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Lesson not found' });

        const updatedModuleId = module_id !== undefined ? module_id : current[0].module_id;
        const updatedTitle = title !== undefined ? title : current[0].title;
        const updatedContent = content !== undefined ? content : current[0].content;
        const updatedVideo = video_url !== undefined ? video_url : current[0].video_url;
        const updatedType = lesson_type !== undefined ? lesson_type : current[0].lesson_type;
        const updatedOrder = order_index !== undefined ? order_index : current[0].order_index;

        if (updatedType && !['video', 'quiz', 'assignment', 'reading', 'interactive', 'live_session'].includes(updatedType)) {
            return res.status(400).json({ error: 'Invalid lesson_type. Must be one of: video, quiz, assignment, reading, interactive, live_session' });
        }

        const result = await sql`
            UPDATE lesson SET module_id = ${updatedModuleId}, title = ${updatedTitle}, content = ${updatedContent}, video_url = ${updatedVideo}, lesson_type = ${updatedType}, order_index = ${updatedOrder}
            WHERE lesson_id = ${id}
            RETURNING lesson_id, module_id, title, content, video_url, lesson_type, order_index
        `;
        res.status(200).json({ message: 'Lesson updated successfully', lesson: result[0] });
    } catch (error) {
        console.error('Error updating lesson:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid module_id: module does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid lesson_type value' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete lesson
const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid lesson ID' });

        const result = await sql`DELETE FROM lesson WHERE lesson_id = ${id} RETURNING lesson_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Lesson not found' });
        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Cannot delete lesson: it is referenced by other records' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson
};


