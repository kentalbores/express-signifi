const sql = require('../../config/database');

// Create a new course module
const createCourseModule = async (req, res) => {
    try {
        const { course_id, title, description, order_index } = req.body;
        if (!course_id || isNaN(course_id) || !title) {
            return res.status(400).json({ error: 'Missing required fields: course_id (number) and title are required' });
        }

        const resolvedOrderIndex = (order_index !== undefined && !isNaN(order_index)) ? order_index : 1;

        const result = await sql`
            INSERT INTO coursemodule (course_id, title, description, order_index)
            VALUES (${course_id}, ${title}, ${description || null}, ${resolvedOrderIndex})
            RETURNING module_id, course_id, title, description, order_index
        `;

        res.status(201).json({
            message: 'Course module created successfully',
            module: result[0]
        });
    } catch (error) {
        console.error('Error creating course module:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid course_id: course does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all modules (optionally by course_id)
const getAllCourseModules = async (req, res) => {
    try {
        const { course_id } = req.query;
        
        let modules;
        if (course_id) {
            modules = await sql`
                SELECT module_id, course_id, title, description 
                FROM coursemodule
                WHERE course_id = ${course_id}
                ORDER BY module_id DESC
            `;
        } else {
            modules = await sql`
                SELECT module_id, course_id, title, description 
                FROM coursemodule
                ORDER BY module_id DESC
            `;
        }
        
        res.status(200).json({ message: 'Modules retrieved successfully', modules });
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get module by ID
const getCourseModuleById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid module ID' });

        const result = await sql`
            SELECT module_id, course_id, title, description FROM coursemodule WHERE module_id = ${id}
        `;
        if (result.length === 0) return res.status(404).json({ error: 'Module not found' });
        res.status(200).json({ message: 'Module retrieved successfully', module: result[0] });
    } catch (error) {
        console.error('Error fetching module:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update module
const updateCourseModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_id, title, description } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid module ID' });

        const current = await sql`SELECT course_id, title, description FROM coursemodule WHERE module_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Module not found' });

        const updatedCourseId = course_id !== undefined ? course_id : current[0].course_id;
        const updatedTitle = title !== undefined ? title : current[0].title;
        const updatedDescription = description !== undefined ? description : current[0].description;

        const result = await sql`
            UPDATE coursemodule SET course_id = ${updatedCourseId}, title = ${updatedTitle}, description = ${updatedDescription}
            WHERE module_id = ${id}
            RETURNING module_id, course_id, title, description
        `;
        res.status(200).json({ message: 'Module updated successfully', module: result[0] });
    } catch (error) {
        console.error('Error updating module:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid course_id: course does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete module
const deleteCourseModule = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid module ID' });

        const result = await sql`DELETE FROM coursemodule WHERE module_id = ${id} RETURNING module_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Module not found' });
        res.status(200).json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.error('Error deleting module:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Cannot delete module: it is referenced by other records' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createCourseModule,
    getAllCourseModules,
    getCourseModuleById,
    updateCourseModule,
    deleteCourseModule
};


