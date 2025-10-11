const sql = require('../../config/database');

// Create course category
const createCourseCategory = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            icon_url,
            color,
            is_active = true
        } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ success: false, message: 'name and slug are required' });
        }
        const result = await sql`
            INSERT INTO course_category (
                name, slug, description, icon_url, color, is_active
            )
            VALUES (
                ${name}, ${slug}, ${description || null}, ${icon_url || null}, ${color || null}, ${is_active}
            )
            RETURNING *
        `;

        res.status(201).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error creating course category:', error);
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Course category with this slug or name already exists'
            });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all course categories
const getAllCourseCategories = async (req, res) => {
    try {
        const { is_active } = req.query;
        
        let query = sql`SELECT * FROM course_category`;
        
        if (is_active !== undefined) {
            query = sql`SELECT * FROM course_category WHERE is_active = ${is_active === 'true'}`;
        }

        const result = await query;

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching course categories:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get course category by ID
const getCourseCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            SELECT * FROM course_category 
            WHERE category_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error fetching course category:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get course category by slug
const getCourseCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const result = await sql`
            SELECT * FROM course_category 
            WHERE slug = ${slug}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error fetching course category by slug:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update course category
const updateCourseCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            slug,
            description,
            icon_url,
            color,
            is_active
        } = req.body;

        const updates = [];

        if (name !== undefined) {
            updates.push(sql`name = ${name}`);
        }
        if (slug !== undefined) {
            updates.push(sql`slug = ${slug}`);
        }
        if (description !== undefined) {
            updates.push(sql`description = ${description}`);
        }
        if (icon_url !== undefined) {
            updates.push(sql`icon_url = ${icon_url}`);
        }
        if (color !== undefined) {
            updates.push(sql`color = ${color}`);
        }
        if (is_active !== undefined) {
            updates.push(sql`is_active = ${is_active}`);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const result = await sql`
            UPDATE course_category 
            SET ${sql(updates, ', ')}
            WHERE category_id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('Error updating course category:', error);
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'Course category with this slug or name already exists' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete course category
const deleteCourseCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            DELETE FROM course_category 
            WHERE category_id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course category not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting course category:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createCourseCategory,
    getAllCourseCategories,
    getCourseCategoryById,
    getCourseCategoryBySlug,
    updateCourseCategory,
    deleteCourseCategory
};
