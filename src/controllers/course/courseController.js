const sql = require('../../config/database');

// Helper function to check content policy compliance
const checkContentPolicyCompliance = async (courseData) => {
    try {
        // Get active content policies
        const policies = await sql`
            SELECT type, rules FROM content_policy 
            WHERE is_active = true
        `;

        const violations = [];

        for (const policy of policies) {
            const rules = policy.rules || {};
            
            // Check for prohibited content based on policy type
            if (policy.type === 'community') {
                // Check title and description for inappropriate content
                const textToCheck = `${courseData.title || ''} ${courseData.description || ''} ${courseData.short_description || ''}`.toLowerCase();
                
                if (rules.prohibited_words && Array.isArray(rules.prohibited_words)) {
                    for (const word of rules.prohibited_words) {
                        if (textToCheck.includes(word.toLowerCase())) {
                            violations.push(`Contains prohibited content: "${word}"`);
                        }
                    }
                }

                if (rules.max_title_length && courseData.title && courseData.title.length > rules.max_title_length) {
                    violations.push(`Title exceeds maximum length of ${rules.max_title_length} characters`);
                }

                if (rules.min_description_length && courseData.description && courseData.description.length < rules.min_description_length) {
                    violations.push(`Description must be at least ${rules.min_description_length} characters`);
                }
            }

            if (policy.type === 'general') {
                // Check for required fields based on general policy
                if (rules.require_thumbnail && !courseData.thumbnail_image_url) {
                    violations.push('Thumbnail image is required');
                }

                if (rules.require_description && !courseData.description) {
                    violations.push('Course description is required');
                }

                if (rules.min_price !== undefined && courseData.price < rules.min_price) {
                    violations.push(`Course price must be at least ${rules.min_price}`);
                }
            }
        }

        return {
            compliant: violations.length === 0,
            violations: violations
        };
    } catch (error) {
        console.error('Error checking content policy compliance:', error);
        return {
            compliant: true, // Default to compliant if we can't check
            violations: []
        };
    }
};

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

        // Check content policy compliance
        const courseData = {
            title, description, short_description, thumbnail_image_url, price
        };
        const complianceCheck = await checkContentPolicyCompliance(courseData);
        
        if (!complianceCheck.compliant) {
            return res.status(400).json({
                error: 'Course content violates platform policies',
                violations: complianceCheck.violations
            });
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

// Get all courses with enhanced filtering and all fields
const getAllCourses = async (req, res) => {
    try {
    const { 
        is_published, 
        educator_id, 
        institution_id, 
        category_id,
        difficulty_level,
        is_featured,
        language,
        limit = 50, 
        offset = 0,
        search
    } = req.query;

        // Build WHERE conditions dynamically
        let whereClause = sql``;
        const conditions = [];
        
        if (is_published !== undefined) {
            conditions.push(sql`c.is_published = ${is_published === 'true'}`);
        }
        if (educator_id) {
            conditions.push(sql`c.educator_id = ${educator_id}`);
        }
        if (institution_id) {
            conditions.push(sql`c.institution_id = ${institution_id}`);
        }
        if (category_id) {
            conditions.push(sql`c.category_id = ${category_id}`);
        }
        if (difficulty_level) {
            conditions.push(sql`c.difficulty_level = ${difficulty_level}`);
        }
        if (is_featured !== undefined) {
            conditions.push(sql`c.is_featured = ${is_featured === 'true'}`);
        }
        if (language) {
            conditions.push(sql`c.language = ${language}`);
        }
        if (search) {
            const searchPattern = `%${search}%`;
            conditions.push(sql`(c.title ILIKE ${searchPattern} OR c.description ILIKE ${searchPattern})`);
        }

        // Combine conditions with AND
        if (conditions.length > 0) {
            whereClause = conditions.reduce((acc, condition, index) => {
                if (index === 0) {
                    return sql`WHERE ${condition}`;
                }
                return sql`${acc} AND ${condition}`;
            }, sql``);
        }
        
        const courses = await sql`
            SELECT c.course_id, c.educator_id, c.institution_id, c.category_id, c.title, c.slug,
                   c.short_description, c.description, c.thumbnail_image_url, c.promo_video_url,
                   c.price, c.discounted_price, c.currency, c.difficulty_level, 
                   c.estimated_duration_hours, c.language, c.requirements, c.what_you_will_learn,
                   c.target_audience, c.is_published, c.is_active, c.is_featured,
                   c.enrollment_count, c.average_rating, c.total_reviews, c.last_updated,
                   c.published_at, c.created_at, c.updated_at,
                   (u.first_name || ' ' || u.last_name) as educator_name,
                   i.name as institution_name,
                   cc.name as category_name, cc.slug as category_slug
            FROM course c
            LEFT JOIN useraccount u ON c.educator_id = u.user_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
            LEFT JOIN course_category cc ON c.category_id = cc.category_id
            ${whereClause}
            ORDER BY 
                CASE WHEN c.is_featured = true THEN 0 ELSE 1 END,
                c.average_rating DESC, 
                c.enrollment_count DESC,
                c.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;
        
        const countResult = await sql`
            SELECT COUNT(*) as total
            FROM course c
            ${whereClause}
        `;
        
        const total = parseInt(countResult[0].total);

        res.status(200).json({
            message: 'Courses retrieved successfully',
            courses,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: total > parseInt(offset) + parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get course by ID with complete details
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid course ID'
            });
        }

        const result = await sql`
            SELECT c.course_id, c.educator_id, c.institution_id, c.category_id, c.title, c.slug,
                   c.short_description, c.description, c.thumbnail_image_url, c.promo_video_url,
                   c.price, c.discounted_price, c.currency, c.difficulty_level, 
                   c.estimated_duration_hours, c.language, c.requirements, c.what_you_will_learn,
                   c.target_audience, c.is_published, c.is_active, c.is_featured,
                   c.enrollment_count, c.average_rating, c.total_reviews, c.last_updated,
                   c.published_at, c.created_at, c.updated_at,
                   (u.first_name || ' ' || u.last_name) as educator_name, 
                   u.email as educator_email, u.profile_picture_url as educator_avatar,
                   i.name as institution_name, i.email as institution_email,
                   i.website as institution_website, i.logo_url as institution_logo,
                   cc.name as category_name, cc.slug as category_slug,
                   cc.description as category_description, cc.icon_url as category_icon
            FROM course c
            LEFT JOIN useraccount u ON c.educator_id = u.user_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
            LEFT JOIN course_category cc ON c.category_id = cc.category_id
            WHERE c.course_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'Course not found'
            });
        }

        // Get course modules and lessons count
        const moduleStats = await sql`
            SELECT 
                COUNT(DISTINCT cm.module_id) as total_modules,
                COUNT(DISTINCT l.lesson_id) as total_lessons,
                SUM(l.estimated_duration_minutes) as total_duration_minutes
            FROM coursemodule cm
            LEFT JOIN lesson l ON cm.module_id = l.module_id AND l.is_active = true
            WHERE cm.course_id = ${id} AND cm.is_active = true
        `;

        // Get recent course reviews
        const recentReviews = await sql`
            SELECT cr.review_id, cr.rating, cr.title, cr.comment, cr.created_at,
                   (u.first_name || ' ' || u.last_name) as reviewer_name,
                   u.profile_picture_url as reviewer_avatar
            FROM course_review cr
            LEFT JOIN useraccount u ON cr.learner_id = u.user_id
            WHERE cr.course_id = ${id}
            ORDER BY cr.created_at DESC
            LIMIT 5
        `;

        const course = {
            ...result[0],
            stats: moduleStats[0],
            recent_reviews: recentReviews
        };

        res.status(200).json({
            message: 'Course retrieved successfully',
            course
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
            currency,
            difficulty_level,
            estimated_duration_hours,
            language,
            requirements,
            what_you_will_learn,
            target_audience,
            is_published,
            is_featured
        } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid course ID'
            });
        }

        // Validate numeric fields if provided
        if (educator_id !== undefined && isNaN(educator_id)) {
            return res.status(400).json({
                error: 'educator_id must be a valid number'
            });
        }

        if (institution_id !== undefined && isNaN(institution_id)) {
            return res.status(400).json({
                error: 'institution_id must be a valid number'
            });
        }

        if (category_id !== undefined && isNaN(category_id)) {
            return res.status(400).json({
                error: 'category_id must be a valid number'
            });
        }

        // Validate price if provided
        if (price !== undefined && (isNaN(price) || price < 0)) {
            return res.status(400).json({
                error: 'price must be a valid positive number'
            });
        }

        if (discounted_price !== undefined && (isNaN(discounted_price) || discounted_price < 0)) {
            return res.status(400).json({
                error: 'discounted_price must be a valid positive number'
            });
        }

        // Validate difficulty level if provided
        if (difficulty_level !== undefined) {
            const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
            if (!validLevels.includes(difficulty_level)) {
                return res.status(400).json({
                    error: 'Invalid difficulty_level. Must be one of: beginner, intermediate, advanced, expert'
                });
            }
        }

        // Check if at least one field is provided
        if (educator_id === undefined && institution_id === undefined && category_id === undefined &&
            title === undefined && slug === undefined && short_description === undefined &&
            description === undefined && thumbnail_image_url === undefined && promo_video_url === undefined &&
            price === undefined && discounted_price === undefined && currency === undefined &&
            difficulty_level === undefined && estimated_duration_hours === undefined && language === undefined &&
            requirements === undefined && what_you_will_learn === undefined && target_audience === undefined &&
            is_published === undefined && is_featured === undefined) {
            return res.status(400).json({
                error: 'No valid fields provided for update'
            });
        }

        // First, get current course data
        const currentCourse = await sql`
            SELECT educator_id, institution_id, category_id, title, slug, short_description,
                   description, thumbnail_image_url, promo_video_url, price, discounted_price,
                   currency, difficulty_level, estimated_duration_hours, language, requirements,
                   what_you_will_learn, target_audience, is_published, is_featured
            FROM course WHERE course_id = ${id}
        `;

        if (currentCourse.length === 0) {
            return res.status(404).json({
                error: 'Course not found'
            });
        }

        const current = currentCourse[0];

        // Use current values for undefined fields
        const updatedEducatorId = educator_id !== undefined ? educator_id : current.educator_id;
        const updatedInstitutionId = institution_id !== undefined ? institution_id : current.institution_id;
        const updatedCategoryId = category_id !== undefined ? category_id : current.category_id;
        const updatedTitle = title !== undefined ? title : current.title;
        const updatedSlug = slug !== undefined ? slug : current.slug;
        const updatedShortDescription = short_description !== undefined ? short_description : current.short_description;
        const updatedDescription = description !== undefined ? description : current.description;
        const updatedThumbnailImageUrl = thumbnail_image_url !== undefined ? thumbnail_image_url : current.thumbnail_image_url;
        const updatedPromoVideoUrl = promo_video_url !== undefined ? promo_video_url : current.promo_video_url;
        const updatedPrice = price !== undefined ? price : current.price;
        const updatedDiscountedPrice = discounted_price !== undefined ? discounted_price : current.discounted_price;
        const updatedCurrency = currency !== undefined ? currency : current.currency;
        const updatedDifficultyLevel = difficulty_level !== undefined ? difficulty_level : current.difficulty_level;
        const updatedEstimatedDurationHours = estimated_duration_hours !== undefined ? estimated_duration_hours : current.estimated_duration_hours;
        const updatedLanguage = language !== undefined ? language : current.language;
        const updatedRequirements = requirements !== undefined ? requirements : current.requirements;
        const updatedWhatYouWillLearn = what_you_will_learn !== undefined ? what_you_will_learn : current.what_you_will_learn;
        const updatedTargetAudience = target_audience !== undefined ? target_audience : current.target_audience;
        const updatedIsPublished = is_published !== undefined ? is_published : current.is_published;
        const updatedIsFeatured = is_featured !== undefined ? is_featured : current.is_featured;

        // Check content policy compliance for updated data
        const updatedCourseData = {
            title: updatedTitle,
            description: updatedDescription,
            short_description: updatedShortDescription,
            thumbnail_image_url: updatedThumbnailImageUrl,
            price: updatedPrice
        };
        const complianceCheck = await checkContentPolicyCompliance(updatedCourseData);
        
        if (!complianceCheck.compliant) {
            return res.status(400).json({
                error: 'Updated course content violates platform policies',
                violations: complianceCheck.violations
            });
        }

        // Course approval workflow: if publishing for the first time, may require moderation
        if (updatedIsPublished && !current.is_published) {
            // Check if course requires moderation (can be enhanced based on rules)
            const requiresModeration = await sql`
                SELECT COUNT(*) as count FROM course_moderation 
                WHERE course_id = ${id} AND status = 'approved'
            `;
            
            if (requiresModeration[0].count === 0) {
                // Create moderation entry if none exists
                await sql`
                    INSERT INTO course_moderation (course_id, admin_id, status, comments)
                    VALUES (${id}, NULL, 'pending', 'Automatic review required for course publication')
                    ON CONFLICT (course_id) DO NOTHING
                `;
            }
        }

        const result = await sql`
            UPDATE course 
            SET educator_id = ${updatedEducatorId}, 
                institution_id = ${updatedInstitutionId}, 
                category_id = ${updatedCategoryId},
                title = ${updatedTitle}, 
                slug = ${updatedSlug},
                short_description = ${updatedShortDescription},
                description = ${updatedDescription}, 
                thumbnail_image_url = ${updatedThumbnailImageUrl},
                promo_video_url = ${updatedPromoVideoUrl},
                price = ${updatedPrice}, 
                discounted_price = ${updatedDiscountedPrice},
                currency = ${updatedCurrency},
                difficulty_level = ${updatedDifficultyLevel},
                estimated_duration_hours = ${updatedEstimatedDurationHours},
                language = ${updatedLanguage},
                requirements = ${updatedRequirements},
                what_you_will_learn = ${updatedWhatYouWillLearn},
                target_audience = ${updatedTargetAudience},
                is_published = ${updatedIsPublished},
                is_featured = ${updatedIsFeatured},
                last_updated = NOW()
            WHERE course_id = ${id}
            RETURNING *
        `;

        res.status(200).json({
            message: 'Course updated successfully',
            course: result[0]
        });

    } catch (error) {
        console.error('Error updating course:', error);
        
        // Handle foreign key constraint violations
        if (error.code === '23503') {
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
            if (error.constraint === 'course_category_id_fkey' || 
                (error.detail && error.detail.includes('category_id'))) {
                return res.status(400).json({
                    error: 'Invalid category_id: category does not exist'
                });
            }
            return res.status(400).json({
                error: 'Foreign key constraint violation: Referenced record does not exist'
            });
        }

        // Handle unique constraint violations  
        if (error.code === '23505') {
            if (error.constraint === 'course_slug_key' || 
                (error.detail && error.detail.includes('slug'))) {
                return res.status(409).json({
                    error: 'Course with this slug already exists'
                });
            }
            return res.status(409).json({
                error: 'Duplicate value violates unique constraint'
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