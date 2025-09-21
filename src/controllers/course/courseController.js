const sql = require('../../config/database');

// Create a new course
const createCourse = async (req, res) => {
    try {
        const { 
            educator_id, 
            institution_id, 
            category_id,
            title, 
            slug,
            short_description,
            description, 
            thumbnail_image_url,
            promo_video_url,
            price, 
            discounted_price,
            currency = 'USD',
            difficulty_level,
            estimated_duration_hours,
            language = 'en',
            requirements,
            what_you_will_learn,
            target_audience,
            is_published = false,
            is_featured = false
        } = req.body;

        // Validate required fields
        if (!educator_id || !title || !slug) {
            return res.status(400).json({
                error: 'Missing required fields: educator_id, title, and slug are required'
            });
        }

        // Validate educator_id and institution_id are numbers if provided
        if (isNaN(educator_id)) {
            return res.status(400).json({
                error: 'educator_id must be a valid number'
            });
        }

        if (institution_id && isNaN(institution_id)) {
            return res.status(400).json({
                error: 'institution_id must be a valid number'
            });
        }

        if (category_id && isNaN(category_id)) {
            return res.status(400).json({
                error: 'category_id must be a valid number'
            });
        }

        // Validate price if provided
        if (price && (isNaN(price) || price < 0)) {
            return res.status(400).json({
                error: 'price must be a valid positive number'
            });
        }

        // Validate difficulty level if provided
        if (difficulty_level) {
            const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
            if (!validLevels.includes(difficulty_level)) {
                return res.status(400).json({
                    error: 'Invalid difficulty_level. Must be one of: beginner, intermediate, advanced, expert'
                });
            }
        }

        // Insert course into database
        const result = await sql`
            INSERT INTO course (
                educator_id, institution_id, category_id, title, slug, short_description,
                description, thumbnail_image_url, promo_video_url, price, discounted_price,
                currency, difficulty_level, estimated_duration_hours, language, requirements,
                what_you_will_learn, target_audience, is_published, is_featured
            )
            VALUES (
                ${educator_id}, ${institution_id || null}, ${category_id || null}, ${title}, 
                ${slug}, ${short_description || null}, ${description || null}, 
                ${thumbnail_image_url || null}, ${promo_video_url || null}, ${price || 0.00}, 
                ${discounted_price || null}, ${currency}, ${difficulty_level || null}, 
                ${estimated_duration_hours || null}, ${language}, ${requirements || null},
                ${what_you_will_learn || null}, ${target_audience || null}, ${is_published}, ${is_featured}
            )
            RETURNING *
        `;

        const course = result[0];

        res.status(201).json({
            message: 'Course created successfully',
            course: course
        });

    } catch (error) {
        console.error('Error creating course:', error);
        
        // Handle unique constraint violations
        if (error.code === '23505') {
            return res.status(400).json({
                error: 'Course with this slug already exists'
            });
        }
        
        // Handle foreign key constraint violations
        if (error.code === '23503') {
            if (error.constraint === 'course_educator_fkey' || 
                (error.detail && error.detail.includes('educator_id'))) {
                return res.status(400).json({
                    error: 'Invalid educator_id: educator does not exist'
                });
            }
            if (error.constraint === 'course_institution_fkey' || 
                (error.detail && error.detail.includes('institution_id'))) {
                return res.status(400).json({
                    error: 'Invalid institution_id: institution does not exist'
                });
            }
            if (error.constraint === 'course_category_fkey' || 
                (error.detail && error.detail.includes('category_id'))) {
                return res.status(400).json({
                    error: 'Invalid category_id: category does not exist'
                });
            }
            return res.status(400).json({
                error: 'Foreign key constraint violation: Referenced record does not exist'
            });
        }
        
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get all courses
const getAllCourses = async (req, res) => {
    try {
        const { is_published, educator_id, institution_id } = req.query;

        // Base query
        let baseQuery = `
            SELECT c.course_id, c.educator_id, c.institution_id, c.title, c.description, 
                   c.price, c.is_published, c.created_at,
                   (u.first_name || ' ' || u.last_name) as educator_name,
                   i.name as institution_name
            FROM course c
            LEFT JOIN useraccount u ON c.educator_id = u.user_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
        `;

        // Build WHERE conditions
        const conditions = [];
        const values = [];
        
        if (is_published !== undefined) {
            conditions.push('c.is_published = $' + (values.length + 1));
            values.push(is_published === 'true');
        }
        if (educator_id) {
            conditions.push('c.educator_id = $' + (values.length + 1));
            values.push(educator_id);
        }
        if (institution_id) {
            conditions.push('c.institution_id = $' + (values.length + 1));
            values.push(institution_id);
        }

        if (conditions.length > 0) {
            baseQuery += ' WHERE ' + conditions.join(' AND ');
        }
        
        baseQuery += ' ORDER BY c.created_at DESC';

        const courses = await sql.unsafe(baseQuery, values);

        res.status(200).json({
            message: 'Courses retrieved successfully',
            courses: courses
        });

    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get course by ID
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid course ID'
            });
        }

        const result = await sql`
            SELECT c.course_id, c.educator_id, c.institution_id, c.title, c.description, 
                   c.price, c.is_published, c.created_at,
                   (u.first_name || ' ' || u.last_name) as educator_name, u.email as educator_email,
                   i.name as institution_name, i.email as institution_email
            FROM course c
            LEFT JOIN useraccount u ON c.educator_id = u.user_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
            WHERE c.course_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'Course not found'
            });
        }

        res.status(200).json({
            message: 'Course retrieved successfully',
            course: result[0]
        });

    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Update course
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { educator_id, institution_id, title, description, price, is_published } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid course ID'
            });
        }

        // Validate educator_id if provided
        if (educator_id && isNaN(educator_id)) {
            return res.status(400).json({
                error: 'educator_id must be a valid number'
            });
        }

        // Validate institution_id if provided
        if (institution_id && isNaN(institution_id)) {
            return res.status(400).json({
                error: 'institution_id must be a valid number'
            });
        }

        // Validate price if provided
        if (price && (isNaN(price) || price < 0)) {
            return res.status(400).json({
                error: 'price must be a valid positive number'
            });
        }

        // Check if at least one field is provided
        if (educator_id === undefined && institution_id === undefined && 
            title === undefined && description === undefined && 
            price === undefined && is_published === undefined) {
            return res.status(400).json({
                error: 'No valid fields provided for update'
            });
        }

        // First, get current course data
        const currentCourse = await sql`
            SELECT educator_id, institution_id, title, description, price, is_published 
            FROM course WHERE course_id = ${id}
        `;

        if (currentCourse.length === 0) {
            return res.status(404).json({
                error: 'Course not found'
            });
        }

        // Use current values for undefined fields
        const updatedEducatorId = educator_id !== undefined ? educator_id : currentCourse[0].educator_id;
        const updatedInstitutionId = institution_id !== undefined ? institution_id : currentCourse[0].institution_id;
        const updatedTitle = title !== undefined ? title : currentCourse[0].title;
        const updatedDescription = description !== undefined ? description : currentCourse[0].description;
        const updatedPrice = price !== undefined ? price : currentCourse[0].price;
        const updatedIsPublished = is_published !== undefined ? is_published : currentCourse[0].is_published;

        const result = await sql`
            UPDATE course 
            SET educator_id = ${updatedEducatorId}, 
                institution_id = ${updatedInstitutionId}, 
                title = ${updatedTitle}, 
                description = ${updatedDescription}, 
                price = ${updatedPrice}, 
                is_published = ${updatedIsPublished}
            WHERE course_id = ${id}
            RETURNING course_id, educator_id, institution_id, title, description, price, is_published, created_at
        `;

        res.status(200).json({
            message: 'Course updated successfully',
            course: result[0]
        });

    } catch (error) {
        console.error('Error updating course:', error);
        
        // Handle foreign key constraint violations
        if (error.code === '23503') {
            // Check constraint name in detail message if constraint property is not available
            if (error.constraint === 'course_educator_id_fkey' || 
                (error.detail && error.detail.includes('educator_id'))) {
                return res.status(400).json({
                    error: 'Invalid educator_id: educator does not exist'
                });
            }
            if (error.constraint === 'course_institution_id_fkey' || 
                (error.detail && error.detail.includes('institution_id'))) {
                return res.status(400).json({
                    error: 'Invalid institution_id: institution does not exist'
                });
            }
            // Generic foreign key error if we can't determine which field
            return res.status(400).json({
                error: 'Foreign key constraint violation: Referenced record does not exist'
            });
        }
        
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Delete course
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid course ID'
            });
        }

        const result = await sql`
            DELETE FROM course 
            WHERE course_id = ${id}
            RETURNING course_id
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'Course not found'
            });
        }

        res.status(200).json({
            message: 'Course deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting course:', error);
        
        // Handle foreign key constraint violations (if other tables reference this course)
        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Cannot delete course: it is referenced by other records (enrollments, modules, etc.)'
            });
        }
        
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
};