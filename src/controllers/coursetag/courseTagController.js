const sql = require('../../config/database');

// Get all course tags
const getAllTags = async (req, res) => {
    try {
        const { search, limit = 50, offset = 0 } = req.query;

        let whereClause = sql``;
        if (search) {
            const searchPattern = `%${search}%`;
            whereClause = sql`WHERE name ILIKE ${searchPattern}`;
        }

        const tags = await sql`
            SELECT tag_id, name, slug, usage_count, created_at
            FROM course_tags
            ${whereClause}
            ORDER BY usage_count DESC, name ASC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        const countResult = await sql`
            SELECT COUNT(*) as total FROM course_tags ${whereClause}
        `;

        res.status(200).json({
            success: true,
            tags,
            pagination: {
                total: parseInt(countResult[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get tag by ID
const getTagById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            SELECT tag_id, name, slug, usage_count, created_at
            FROM course_tags
            WHERE tag_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        res.status(200).json({ success: true, tag: result[0] });

    } catch (error) {
        console.error('Error fetching tag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create a new tag (admin only)
const createTag = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Tag name is required' });
        }

        // Generate slug from name
        const slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const result = await sql`
            INSERT INTO course_tags (name, slug)
            VALUES (${name.trim()}, ${slug})
            RETURNING tag_id, name, slug, usage_count, created_at
        `;

        res.status(201).json({
            success: true,
            message: 'Tag created successfully',
            tag: result[0]
        });

    } catch (error) {
        console.error('Error creating tag:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Tag with this name or slug already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update a tag (admin only)
const updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Tag name is required' });
        }

        const slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const result = await sql`
            UPDATE course_tags
            SET name = ${name.trim()}, slug = ${slug}
            WHERE tag_id = ${id}
            RETURNING tag_id, name, slug, usage_count, created_at
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Tag updated successfully',
            tag: result[0]
        });

    } catch (error) {
        console.error('Error updating tag:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Tag with this name or slug already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a tag (admin only)
const deleteTag = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await sql`
            DELETE FROM course_tags
            WHERE tag_id = ${id}
            RETURNING tag_id
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Tag deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add tag to course
const addTagToCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { tag_id } = req.body;

        if (!tag_id) {
            return res.status(400).json({ error: 'tag_id is required' });
        }

        // Insert relation
        await sql`
            INSERT INTO course_tag_relations (course_id, tag_id)
            VALUES (${courseId}, ${tag_id})
            ON CONFLICT (course_id, tag_id) DO NOTHING
        `;

        // Increment usage count
        await sql`
            UPDATE course_tags
            SET usage_count = usage_count + 1
            WHERE tag_id = ${tag_id}
        `;

        res.status(200).json({
            success: true,
            message: 'Tag added to course successfully'
        });

    } catch (error) {
        console.error('Error adding tag to course:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid course_id or tag_id' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Remove tag from course
const removeTagFromCourse = async (req, res) => {
    try {
        const { courseId, tagId } = req.params;

        const result = await sql`
            DELETE FROM course_tag_relations
            WHERE course_id = ${courseId} AND tag_id = ${tagId}
            RETURNING course_id
        `;

        if (result.length > 0) {
            // Decrement usage count
            await sql`
                UPDATE course_tags
                SET usage_count = GREATEST(usage_count - 1, 0)
                WHERE tag_id = ${tagId}
            `;
        }

        res.status(200).json({
            success: true,
            message: 'Tag removed from course successfully'
        });

    } catch (error) {
        console.error('Error removing tag from course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get tags for a course
const getCoursesTags = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Validate courseId
        if (!courseId || isNaN(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        // Check if the course_tag_relations table exists and query tags
        const tags = await sql`
            SELECT t.tag_id, t.name, t.slug
            FROM course_tags t
            JOIN course_tag_relations ctr ON t.tag_id = ctr.tag_id
            WHERE ctr.course_id = ${parseInt(courseId)}
            ORDER BY t.name ASC
        `;

        res.status(200).json({ success: true, tags });

    } catch (error) {
        console.error('Error fetching course tags:', error);
        
        // Handle specific database errors
        if (error.code === '42P01') {
            // Table does not exist
            console.error('Table course_tag_relations or course_tags does not exist');
            return res.status(200).json({ success: true, tags: [], message: 'Tags feature not available' });
        }
        
        if (error.code === '42703') {
            // Column does not exist
            console.error('Column mismatch in course_tag tables');
            return res.status(200).json({ success: true, tags: [], message: 'Tags feature not available' });
        }
        
        res.status(500).json({ error: 'Failed to fetch course tags' });
    }
};

// Get courses by tag
const getCoursesByTag = async (req, res) => {
    try {
        const { tagId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const courses = await sql`
            SELECT c.course_id, c.title, c.slug, c.short_description,
                   c.thumbnail_image_url, c.price, c.average_rating,
                   c.difficulty_level, c.is_featured,
                   (u.first_name || ' ' || u.last_name) as educator_name
            FROM course c
            JOIN course_tag_relations ctr ON c.course_id = ctr.course_id
            LEFT JOIN useraccount u ON c.educator_id = u.user_id
            WHERE ctr.tag_id = ${tagId} AND c.is_published = true
            ORDER BY c.average_rating DESC, c.enrollment_count DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        const countResult = await sql`
            SELECT COUNT(*) as total
            FROM course_tag_relations
            WHERE tag_id = ${tagId}
        `;

        res.status(200).json({
            success: true,
            courses,
            pagination: {
                total: parseInt(countResult[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Error fetching courses by tag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Popular/trending tags
const getPopularTags = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const tags = await sql`
            SELECT tag_id, name, slug, usage_count
            FROM course_tags
            WHERE usage_count > 0
            ORDER BY usage_count DESC
            LIMIT ${parseInt(limit)}
        `;

        res.status(200).json({ success: true, tags });

    } catch (error) {
        console.error('Error fetching popular tags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAllTags,
    getTagById,
    createTag,
    updateTag,
    deleteTag,
    addTagToCourse,
    removeTagFromCourse,
    getCoursesTags,
    getCoursesByTag,
    getPopularTags
};
