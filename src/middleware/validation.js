const Joi = require('joi');

// Generic validation middleware
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }
        next();
    };
};

// Course validation schemas
const courseSchemas = {
    create: Joi.object({
        educator_id: Joi.number().integer().required(),
        institution_id: Joi.number().integer().optional(),
        category_id: Joi.number().integer().optional(),
        title: Joi.string().min(3).max(200).required(),
        slug: Joi.string().min(3).max(200).required(),
        short_description: Joi.string().max(500).optional(),
        description: Joi.string().optional(),
        thumbnail_image_url: Joi.string().uri().optional(),
        promo_video_url: Joi.string().uri().optional(),
        price: Joi.number().min(0).optional(),
        discounted_price: Joi.number().min(0).optional(),
        currency: Joi.string().length(3).default('USD'),
        difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
        estimated_duration_hours: Joi.number().min(0).optional(),
        language: Joi.string().length(2).default('en'),
        requirements: Joi.string().optional(),
        what_you_will_learn: Joi.string().optional(),
        target_audience: Joi.string().optional(),
        is_published: Joi.boolean().default(false),
        is_featured: Joi.boolean().default(false)
    }),
    
    update: Joi.object({
        educator_id: Joi.number().integer().optional(),
        institution_id: Joi.number().integer().optional(),
        category_id: Joi.number().integer().optional(),
        title: Joi.string().min(3).max(200).optional(),
        slug: Joi.string().min(3).max(200).optional(),
        short_description: Joi.string().max(500).optional(),
        description: Joi.string().optional(),
        thumbnail_image_url: Joi.string().uri().optional(),
        promo_video_url: Joi.string().uri().optional(),
        price: Joi.number().min(0).optional(),
        discounted_price: Joi.number().min(0).optional(),
        currency: Joi.string().length(3).optional(),
        difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
        estimated_duration_hours: Joi.number().min(0).optional(),
        language: Joi.string().length(2).optional(),
        requirements: Joi.string().optional(),
        what_you_will_learn: Joi.string().optional(),
        target_audience: Joi.string().optional(),
        is_published: Joi.boolean().optional(),
        is_featured: Joi.boolean().optional()
    }).min(1)
};

// Enrollment validation schemas
const enrollmentSchemas = {
    create: Joi.object({
        learner_id: Joi.number().integer().required(),
        course_id: Joi.number().integer().required(),
        status: Joi.string().valid('active', 'completed', 'paused', 'cancelled').default('active')
    }),
    
    update: Joi.object({
        learner_id: Joi.number().integer().optional(),
        course_id: Joi.number().integer().optional(),
        status: Joi.string().valid('active', 'completed', 'paused', 'cancelled').optional()
    }).min(1)
};

// Activity validation schemas
const activitySchemas = {
    create: Joi.object({
        user_id: Joi.number().integer().required(),
        lesson_id: Joi.number().integer().required(),
        enrollment_id: Joi.number().integer().required(),
        status: Joi.string().valid('started', 'in_progress', 'completed', 'skipped').required(),
        progress_percentage: Joi.number().min(0).max(100).default(0),
        time_spent_seconds: Joi.number().min(0).default(0),
        video_watch_time_seconds: Joi.number().min(0).default(0),
        last_position_seconds: Joi.number().min(0).default(0)
    }),
    
    update: Joi.object({
        user_id: Joi.number().integer().optional(),
        lesson_id: Joi.number().integer().optional(),
        enrollment_id: Joi.number().integer().optional(),
        status: Joi.string().valid('started', 'in_progress', 'completed', 'skipped').optional(),
        progress_percentage: Joi.number().min(0).max(100).optional(),
        time_spent_seconds: Joi.number().min(0).optional(),
        video_watch_time_seconds: Joi.number().min(0).optional(),
        last_position_seconds: Joi.number().min(0).optional()
    }).min(1)
};

// Self-study performance validation schemas
const selfStudySchemas = {
    create: Joi.object({
        user_id: Joi.number().integer().required(),
        lesson_identifier: Joi.string().required(),
        lesson_type: Joi.string().valid('video', 'document', 'interactive').optional(),
        score: Joi.number().min(0).default(0),
        max_score: Joi.number().min(1).default(100),
        percentage: Joi.number().min(0).max(100).optional(),
        time_spent_seconds: Joi.number().min(0).default(0),
        performance_data: Joi.object().optional(),
        completed_levels: Joi.object().optional(),
        is_completed: Joi.boolean().default(false),
        attempt_number: Joi.number().integer().min(1).default(1)
    })
};

// Notification validation schemas
const notificationSchemas = {
    create: Joi.object({
        user_id: Joi.number().integer().required(),
        title: Joi.string().min(1).max(200).required(),
        message: Joi.string().min(1).max(1000).required(),
        type: Joi.string().valid('general', 'course', 'enrollment', 'achievement', 'system').default('general'),
        action_url: Joi.string().uri().optional(),
        template_id: Joi.number().integer().optional(),
        action_data: Joi.object().optional(),
        is_read: Joi.boolean().default(false)
    }),
    
    broadcast: Joi.object({
        roles: Joi.array().items(Joi.string().valid('learner', 'educator', 'institutionadmin', 'superadmin')).min(1).required(),
        institution_id: Joi.number().integer().optional(),
        template_id: Joi.number().integer().optional(),
        title: Joi.string().min(1).max(200).optional(),
        message: Joi.string().min(1).max(1000).optional(),
        type: Joi.string().valid('general', 'course', 'enrollment', 'achievement', 'system').default('general'),
        action_url: Joi.string().uri().optional(),
        template_variables: Joi.object().optional()
    })
};

// User validation schemas
const userSchemas = {
    create: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        first_name: Joi.string().min(1).max(50).required(),
        last_name: Joi.string().min(1).max(50).required(),
        phone: Joi.string().optional(),
        date_of_birth: Joi.date().optional(),
        gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
        bio: Joi.string().max(1000).optional(),
        location: Joi.string().max(100).optional(),
        timezone: Joi.string().optional(),
        language_preference: Joi.string().length(2).default('en'),
        cover_photo_url: Joi.string().uri().optional()
    }),
    
    update: Joi.object({
        email: Joi.string().email().optional(),
        first_name: Joi.string().min(1).max(50).optional(),
        last_name: Joi.string().min(1).max(50).optional(),
        phone: Joi.string().optional(),
        bio: Joi.string().max(1000).optional(),
        location: Joi.string().max(100).optional(),
        timezone: Joi.string().optional(),
        language_preference: Joi.string().length(2).optional(),
        cover_photo_url: Joi.string().uri().optional(),
        is_active: Joi.boolean().optional()
    }).min(1)
};

// Authentication validation schemas
const authSchemas = {
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(1).required()
    }),
    
    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        first_name: Joi.string().min(1).max(50).required(),
        last_name: Joi.string().min(1).max(50).required(),
        phone: Joi.string().optional(),
        date_of_birth: Joi.date().optional()
    })
};

// Parameter validation schemas
const paramSchemas = {
    id: Joi.object({
        id: Joi.number().integer().min(1).required()
    }),
    
    userId: Joi.object({
        userId: Joi.number().integer().min(1).required()
    }),
    
    courseId: Joi.object({
        courseId: Joi.number().integer().min(1).required()
    }),
    
    institutionId: Joi.object({
        institutionId: Joi.number().integer().min(1).required()
    })
};

// Query validation schemas
const querySchemas = {
    pagination: Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    }).unknown(true), // Allow other query parameters
    
    courseFilters: Joi.object({
        is_published: Joi.boolean().optional(),
        educator_id: Joi.number().integer().optional(),
        institution_id: Joi.number().integer().optional(),
        category_id: Joi.number().integer().optional(),
        difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
        is_featured: Joi.boolean().optional(),
        language: Joi.string().length(2).optional(),
        search: Joi.string().min(1).max(100).optional(),
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    }),
    
    analytics: Joi.object({
        period: Joi.string().valid('7', '30', '90', '365').default('30')
    }).unknown(true)
};

// Export validation functions
module.exports = {
    validate,
    schemas: {
        course: courseSchemas,
        enrollment: enrollmentSchemas,
        activity: activitySchemas,
        selfStudy: selfStudySchemas,
        notification: notificationSchemas,
        user: userSchemas,
        auth: authSchemas,
        params: paramSchemas,
        query: querySchemas
    }
};
