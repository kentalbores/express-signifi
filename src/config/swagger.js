const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SigniFi API',
      version: '1.0.0',
      description: 'A comprehensive learning management system API for sign language education',
      contact: {
        name: 'SigniFi Team',
        email: 'api@signifi.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.signifi.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'first_name', 'last_name'],
          properties: {
            user_id: {
              type: 'integer',
              description: 'The auto-generated id of the user',
              example: 1
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com'
            },
            password: {
              type: 'string',
              description: 'User password (hashed in database)',
              example: 'SecurePassword123!'
            },
            first_name: {
              type: 'string',
              description: 'User first name',
              example: 'John'
            },
            last_name: {
              type: 'string',
              description: 'User last name',
              example: 'Doe'
            },
            full_name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            phone: {
              type: 'string',
              description: 'User phone number',
              example: '+1-555-123-4567'
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              description: 'User date of birth',
              example: '1990-05-15'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other', 'prefer_not_to_say'],
              description: 'User gender',
              example: 'male'
            },
            profile_picture_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to user profile picture',
              example: 'https://example.com/images/profile/john-doe.jpg'
            },
            cover_photo_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to user cover photo',
              example: 'https://example.com/images/cover/john-doe-cover.jpg'
            },
            bio: {
              type: 'string',
              description: 'User biography',
              example: 'Passionate sign language educator with 5 years of experience'
            },
            location: {
              type: 'string',
              description: 'User location',
              example: 'San Francisco, CA'
            },
            timezone: {
              type: 'string',
              default: 'UTC',
              description: 'User timezone',
              example: 'America/Los_Angeles'
            },
            language_preference: {
              type: 'string',
              default: 'en',
              description: 'User preferred language',
              example: 'en'
            },
            // role removed; roles are inferred by related tables (learner/educator/etc.)
            is_active: {
              type: 'boolean',
              default: true,
              description: 'Whether the user account is active',
              example: true
            },
            is_verified: {
              type: 'boolean',
              default: false,
              description: 'Whether the user is verified',
              example: false
            },
            email_verified: {
              type: 'boolean',
              default: false,
              description: 'Whether the user email is verified',
              example: true
            },
            phone_verified: {
              type: 'boolean',
              default: false,
              description: 'Whether the user phone is verified',
              example: false
            },
            last_login: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
              example: '2023-12-01T10:30:00Z'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2023-11-15T08:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account last update timestamp',
              example: '2023-12-01T10:30:00Z'
            },
          },
        },
        Course: {
          type: 'object',
          required: ['educator_id', 'title', 'slug'],
          properties: {
            course_id: {
              type: 'integer',
              description: 'The auto-generated id of the course',
              example: 101
            },
            educator_id: {
              type: 'integer',
              description: 'ID of the educator who created the course',
              example: 5
            },
            institution_id: {
              type: 'integer',
              description: 'ID of the institution (if applicable)',
              example: 3
            },
            category_id: {
              type: 'integer',
              description: 'ID of the course category',
              example: 2
            },
            title: {
              type: 'string',
              description: 'Course title',
              example: 'Introduction to American Sign Language'
            },
            slug: {
              type: 'string',
              description: 'URL-friendly course identifier',
              example: 'intro-to-asl'
            },
            short_description: {
              type: 'string',
              description: 'Brief course description',
              example: 'Learn the basics of ASL in this comprehensive beginner course'
            },
            description: {
              type: 'string',
              description: 'Detailed course description',
              example: 'This comprehensive course covers the fundamentals of American Sign Language, including basic vocabulary, grammar, and conversation skills. Perfect for beginners who want to start their ASL journey.'
            },
            thumbnail_image_url: {
              type: 'string',
              format: 'uri',
              description: 'Course thumbnail image URL',
              example: 'https://example.com/images/courses/intro-asl-thumb.jpg'
            },
            promo_video_url: {
              type: 'string',
              format: 'uri',
              description: 'Course promotional video URL',
              example: 'https://example.com/videos/courses/intro-asl-promo.mp4'
            },
            price: {
              type: 'number',
              minimum: 0,
              default: 0,
              description: 'Course price',
              example: 49.99
            },
            discounted_price: {
              type: 'number',
              minimum: 0,
              description: 'Discounted course price',
              example: 39.99
            },
            currency: {
              type: 'string',
              default: 'USD',
              description: 'Price currency',
              example: 'USD'
            },
            difficulty_level: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced', 'expert'],
              description: 'Course difficulty level',
              example: 'beginner'
            },
            estimated_duration_hours: {
              type: 'number',
              description: 'Estimated course duration in hours',
              example: 20.5
            },
            language: {
              type: 'string',
              default: 'en',
              description: 'Course language',
              example: 'en'
            },
            requirements: {
              type: 'string',
              description: 'Course requirements',
              example: 'No prior experience required. Just bring enthusiasm to learn!'
            },
            what_you_will_learn: {
              type: 'string',
              description: 'What students will learn',
              example: 'Basic ASL vocabulary, Finger spelling, Simple conversations, ASL grammar basics'
            },
            target_audience: {
              type: 'string',
              description: 'Target audience description',
              example: 'Beginners interested in learning American Sign Language'
            },
            is_published: {
              type: 'boolean',
              default: false,
              description: 'Whether the course is published',
              example: true
            },
            is_featured: {
              type: 'boolean',
              default: false,
              description: 'Whether the course is featured',
              example: false
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Course creation timestamp',
              example: '2023-11-20T09:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Course last update timestamp',
              example: '2023-12-01T14:30:00Z'
            },
          },
        },
        Educator: {
          type: 'object',
          required: ['user_id'],
          properties: {
            user_id: {
              type: 'integer',
              description: 'User ID reference',
              example: 5
            },
            institution_id: {
              type: 'integer',
              description: 'Institution ID (if applicable)',
              example: 3
            },
            employee_id: {
              type: 'string',
              description: 'Employee ID at institution',
              example: 'EMP001'
            },
            title: {
              type: 'string',
              description: 'Professional title',
              example: 'Senior ASL Instructor'
            },
            bio: {
              type: 'string',
              description: 'Educator biography',
              example: 'Certified ASL interpreter with 10+ years of teaching experience. Passionate about making sign language accessible to everyone.'
            },
            specialization: {
              type: 'string',
              description: 'Area of specialization',
              example: 'American Sign Language, Deaf Culture'
            },
            qualifications: {
              type: 'string',
              description: 'Educational qualifications',
              example: 'MA in Deaf Studies, RID Certified Interpreter'
            },
            years_experience: {
              type: 'integer',
              minimum: 0,
              description: 'Years of teaching experience',
              example: 10
            },
            verification_status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'suspended'],
              default: 'pending',
              description: 'Verification status',
              example: 'approved'
            },
            verification_documents: {
              type: 'object',
              description: 'Verification documents (JSON)',
              example: {
                "diploma": "https://example.com/docs/diploma.pdf",
                "certificate": "https://example.com/docs/asl-cert.pdf"
              }
            },
            verified_by: {
              type: 'integer',
              description: 'ID of admin who verified',
              example: 1
            },
            verified_at: {
              type: 'string',
              format: 'date-time',
              description: 'Verification timestamp',
              example: '2023-11-25T14:00:00Z'
            },
            payout_method: {
              type: 'string',
              enum: ['bank_transfer', 'paypal', 'stripe'],
              default: 'bank_transfer',
              description: 'Preferred payout method',
              example: 'bank_transfer'
            },
            payout_details: {
              type: 'object',
              description: 'Payout details (JSON)',
              example: {
                "account_number": "*****1234",
                "routing_number": "*****567"
              }
            },
            total_students: {
              type: 'integer',
              description: 'Total number of students taught',
              example: 150
            },
            total_courses: {
              type: 'integer',
              description: 'Total number of courses created',
              example: 5
            },
            teaching_rating: {
              type: 'number',
              description: 'Average teaching rating',
              example: 4.8
            },
            total_earnings: {
              type: 'number',
              description: 'Total earnings',
              example: 5420.50
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Profile creation timestamp',
              example: '2023-11-15T08:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Profile last update timestamp',
              example: '2023-12-01T10:30:00Z'
            },
          },
        },
        Learner: {
          type: 'object',
          required: ['user_id'],
          properties: {
            user_id: {
              type: 'integer',
              description: 'User ID reference',
              example: 10
            },
            student_id: {
              type: 'string',
              description: 'Student ID number',
              example: 'STU2023001'
            },
            progress_perc: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Learning progress percentage',
              example: 65.5
            },
            status: {
              type: 'string',
              enum: ['new', 'active', 'inactive', 'completed', 'suspended'],
              default: 'new',
              description: 'Learner status',
              example: 'active'
            },
            learning_streak: {
              type: 'integer',
              minimum: 0,
              description: 'Current learning streak in days',
              example: 7
            },
            total_points: {
              type: 'integer',
              minimum: 0,
              description: 'Total points earned',
              example: 1250
            },
            level: {
              type: 'integer',
              minimum: 1,
              description: 'Current learner level',
              example: 3
            },
            preferred_learning_style: {
              type: 'string',
              enum: ['visual', 'hands-on', 'mixed'],
              description: 'Preferred learning style',
              example: 'visual'
            },
            last_session: {
              type: 'string',
              format: 'date-time',
              description: 'Last learning session timestamp',
              example: '2023-12-01T16:45:00Z'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Profile creation timestamp',
              example: '2023-11-15T08:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Profile last update timestamp',
              example: '2023-12-01T16:45:00Z'
            },
          },
        },
        Institution: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            institution_id: {
              type: 'integer',
              description: 'The auto-generated id of the institution',
              example: 3
            },
            name: {
              type: 'string',
              description: 'Institution name',
              example: 'California State University'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Institution email address',
              example: 'admin@csu.edu'
            },
            contact_number: {
              type: 'string',
              description: 'Institution contact number',
              example: '+1-555-987-6543'
            },
            address: {
              type: 'string',
              description: 'Institution address',
              example: '123 University Ave, Los Angeles, CA 90210'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Institution website',
              example: 'https://www.csu.edu'
            },
            logo_url: {
              type: 'string',
              format: 'uri',
              description: 'Institution logo URL',
              example: 'https://example.com/logos/csu-logo.png'
            },
            verification_status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'suspended'],
              default: 'pending',
              description: 'Institution verification status',
              example: 'approved'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Institution creation timestamp',
              example: '2023-10-01T08:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Institution last update timestamp',
              example: '2023-11-15T10:30:00Z'
            },
          },
        },
        Lesson: {
          type: 'object',
          required: ['module_id', 'title', 'lesson_type'],
          properties: {
            lesson_id: {
              type: 'integer',
              description: 'The auto-generated id of the lesson',
              example: 201
            },
            module_id: {
              type: 'integer',
              description: 'ID of the module this lesson belongs to',
              example: 15
            },
            title: {
              type: 'string',
              description: 'Lesson title',
              example: 'Basic Greetings in ASL'
            },
            video_url: {
              type: 'string',
              format: 'uri',
              description: 'Lesson video URL',
              example: 'https://example.com/videos/lessons/basic-greetings.mp4'
            },
            lesson_type: {
              type: 'string',
              enum: ['video', 'quiz', 'drill'],
              description: 'Type of lesson',
              example: 'video'
            },
            content: {
              type: 'string',
              description: 'Lesson content/description',
              example: 'Learn common greeting signs including Hello, Good morning, How are you, and Nice to meet you.'
            },
            duration_minutes: {
              type: 'integer',
              description: 'Lesson duration in minutes',
              example: 15
            },
            order_index: {
              type: 'integer',
              description: 'Order within the module',
              example: 1
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Lesson creation timestamp',
              example: '2023-11-20T10:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Lesson last update timestamp',
              example: '2023-11-25T14:30:00Z'
            },
          },
        },
        Enrollment: {
          type: 'object',
          required: ['learner_id', 'course_id'],
          properties: {
            enroll_id: {
              type: 'integer',
              description: 'The auto-generated id of the enrollment',
              example: 301
            },
            learner_id: {
              type: 'integer',
              description: 'ID of the learner',
              example: 10
            },
            course_id: {
              type: 'integer',
              description: 'ID of the course',
              example: 101
            },
            status: {
              type: 'string',
              enum: ['pending', 'active', 'completed', 'dropped', 'suspended'],
              default: 'pending',
              description: 'Enrollment status',
              example: 'active'
            },
            progress_percentage: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Course completion percentage',
              example: 45.8
            },
            enrolled_at: {
              type: 'string',
              format: 'date-time',
              description: 'Enrollment timestamp',
              example: '2023-11-20T09:00:00Z'
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Course completion timestamp',
              example: null
            },
            last_accessed: {
              type: 'string',
              format: 'date-time',
              description: 'Last access timestamp',
              example: '2023-12-01T16:30:00Z'
            },
          },
        },
        Activity: {
          type: 'object',
          required: ['user_id', 'lesson_id'],
          properties: {
            activity_id: {
              type: 'integer',
              description: 'The auto-generated id of the activity',
              example: 401
            },
            user_id: {
              type: 'integer',
              description: 'ID of the user',
              example: 10
            },
            lesson_id: {
              type: 'integer',
              description: 'ID of the lesson',
              example: 201
            },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'completed', 'failed'],
              default: 'not_started',
              description: 'Activity completion status',
              example: 'completed'
            },
            score: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Activity score percentage',
              example: 85.5
            },
            time_spent_minutes: {
              type: 'integer',
              description: 'Time spent on activity in minutes',
              example: 12
            },
            attempts: {
              type: 'integer',
              description: 'Number of attempts',
              example: 2
            },
            started_at: {
              type: 'string',
              format: 'date-time',
              description: 'Activity start timestamp',
              example: '2023-12-01T16:00:00Z'
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Activity completion timestamp',
              example: '2023-12-01T16:12:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Activity last update timestamp',
              example: '2023-12-01T16:12:00Z'
            },
          },
        },
        Attempt: {
          type: 'object',
          required: ['user_id', 'lesson_id'],
          properties: {
            attempt_id: {
              type: 'integer',
              description: 'The auto-generated id of the attempt',
              example: 501
            },
            user_id: {
              type: 'integer',
              description: 'ID of the user',
              example: 10
            },
            lesson_id: {
              type: 'integer',
              description: 'ID of the lesson',
              example: 201
            },
            score: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Attempt score percentage',
              example: 92.0
            },
            answers: {
              type: 'object',
              description: 'User answers (JSON)',
              example: {
                "question_1": "A",
                "question_2": "Hello sign",
                "question_3": "B"
              }
            },
            time_taken_seconds: {
              type: 'integer',
              description: 'Time taken for attempt in seconds',
              example: 180
            },
            is_passed: {
              type: 'boolean',
              description: 'Whether the attempt passed',
              example: true
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Attempt completion timestamp',
              example: '2023-12-01T16:15:00Z'
            },
          },
        },
        Notification: {
          type: 'object',
          required: ['user_id', 'title', 'message'],
          properties: {
            notification_id: {
              type: 'integer',
              description: 'The auto-generated id of the notification',
              example: 601
            },
            user_id: {
              type: 'integer',
              description: 'ID of the user',
              example: 10
            },
            title: {
              type: 'string',
              description: 'Notification title',
              example: 'New Course Available!'
            },
            message: {
              type: 'string',
              description: 'Notification message',
              example: 'Check out the new Advanced ASL course now available in your dashboard.'
            },
            type: {
              type: 'string',
              enum: ['info', 'success', 'warning', 'error', 'course', 'achievement'],
              default: 'info',
              description: 'Notification type',
              example: 'course'
            },
            link: {
              type: 'string',
              description: 'Associated link URL',
              example: '/courses/advanced-asl'
            },
            is_read: {
              type: 'boolean',
              default: false,
              description: 'Whether notification has been read',
              example: false
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              default: 'medium',
              description: 'Notification priority',
              example: 'medium'
            },
            expires_at: {
              type: 'string',
              format: 'date-time',
              description: 'Notification expiration timestamp',
              example: '2023-12-31T23:59:59Z'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Notification creation timestamp',
              example: '2023-12-01T09:00:00Z'
            },
          },
        },
        GameAttempt: {
          type: 'object',
          required: ['user_id', 'game_id'],
          properties: {
            game_attempt_id: {
              type: 'integer',
              description: 'The auto-generated id of the game attempt',
              example: 701
            },
            user_id: {
              type: 'integer',
              description: 'ID of the user',
              example: 10
            },
            game_id: {
              type: 'integer',
              description: 'ID of the minigame',
              example: 5
            },
            score: {
              type: 'integer',
              minimum: 0,
              description: 'Game score',
              example: 1250
            },
            level_reached: {
              type: 'integer',
              description: 'Highest level reached',
              example: 8
            },
            time_played_seconds: {
              type: 'integer',
              description: 'Time played in seconds',
              example: 300
            },
            achievements: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Achievements unlocked',
              example: ['first_win', 'speed_demon']
            },
            game_data: {
              type: 'object',
              description: 'Additional game-specific data',
              example: {
                "words_guessed": 15,
                "hints_used": 2
              }
            },
            played_at: {
              type: 'string',
              format: 'date-time',
              description: 'Game play timestamp',
              example: '2023-12-01T17:00:00Z'
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Response message',
              example: 'User registered successfully'
            },
            token: {
              type: 'string',
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com'
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'SecurePassword123!'
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com'
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'SecurePassword123!'
            },
            full_name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            first_name: {
              type: 'string',
              description: 'User first name',
              example: 'John'
            },
            last_name: {
              type: 'string',
              description: 'User last name',
              example: 'Doe'
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Invalid credentials'
            },
            code: {
              type: 'string',
              description: 'Error code',
              example: 'AUTH_FAILED'
            },
            details: {
              type: 'object',
              description: 'Additional error details',
              example: {}
            },
          },
        },
        CourseModule: {
          type: 'object',
          required: ['course_id', 'title'],
          properties: {
            module_id: {
              type: 'integer',
              description: 'The auto-generated id of the module',
              example: 15
            },
            course_id: {
              type: 'integer',
              description: 'ID of the course this module belongs to',
              example: 101
            },
            title: {
              type: 'string',
              description: 'Module title',
              example: 'Introduction to Basic Signs'
            },
            description: {
              type: 'string',
              description: 'Module description',
              example: 'This module covers fundamental signs and finger spelling techniques'
            },
            order_index: {
              type: 'integer',
              description: 'Order within the course',
              example: 1
            },
            estimated_duration_hours: {
              type: 'number',
              description: 'Estimated module duration in hours',
              example: 3.5
            },
            is_published: {
              type: 'boolean',
              default: false,
              description: 'Whether the module is published',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Module creation timestamp',
              example: '2023-11-20T09:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Module last update timestamp',
              example: '2023-11-25T15:00:00Z'
            },
          },
        },
        CourseCategory: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            category_id: {
              type: 'integer',
              description: 'The auto-generated id of the category',
              example: 2
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'American Sign Language'
            },
            slug: {
              type: 'string',
              description: 'URL-friendly category identifier',
              example: 'american-sign-language'
            },
            description: {
              type: 'string',
              description: 'Category description',
              example: 'Courses focused on American Sign Language fundamentals and advanced techniques'
            },
            icon_url: {
              type: 'string',
              format: 'uri',
              description: 'Category icon URL',
              example: 'https://example.com/icons/asl-category.svg'
            },
            color: {
              type: 'string',
              description: 'Category color (hex code)',
              example: '#4F46E5'
            },
            is_active: {
              type: 'boolean',
              default: true,
              description: 'Whether the category is active',
              example: true
            },
            course_count: {
              type: 'integer',
              description: 'Number of courses in this category',
              example: 12
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Category creation timestamp',
              example: '2023-10-01T08:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Category last update timestamp',
              example: '2023-11-15T10:30:00Z'
            },
          },
        },
        Payment: {
          type: 'object',
          required: ['course_id'],
          properties: {
            payment_id: {
              type: 'integer',
              description: 'The auto-generated id of the payment',
              example: 801
            },
            user_id: {
              type: 'integer',
              description: 'ID of the user making payment',
              example: 10
            },
            course_id: {
              type: 'integer',
              description: 'ID of the course being purchased',
              example: 101
            },
            amount: {
              type: 'number',
              description: 'Payment amount',
              example: 49.99
            },
            currency: {
              type: 'string',
              description: 'Payment currency',
              example: 'USD'
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
              description: 'Payment status',
              example: 'completed'
            },
            payment_method: {
              type: 'string',
              enum: ['stripe', 'paypal', 'bank_transfer'],
              description: 'Payment method used',
              example: 'stripe'
            },
            transaction_id: {
              type: 'string',
              description: 'External transaction ID',
              example: 'pi_1234567890abcdef'
            },
            metadata: {
              type: 'object',
              description: 'Additional payment metadata',
              example: {
                "stripe_payment_intent": "pi_1234567890abcdef",
                "payment_method_type": "card"
              }
            },
            processed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Payment processing timestamp',
              example: '2023-12-01T11:30:00Z'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Payment creation timestamp',
              example: '2023-12-01T11:25:00Z'
            },
          },
        },
        PaymentIntent: {
          type: 'object',
          properties: {
            clientSecret: {
              type: 'string',
              description: 'Stripe client secret for payment confirmation',
              example: 'pi_1234567890abcdef_secret_xyz'
            },
            paymentIntentId: {
              type: 'string',
              description: 'Stripe payment intent ID',
              example: 'pi_1234567890abcdef'
            },
            currency: {
              type: 'string',
              description: 'Payment currency',
              example: 'usd'
            },
            amount: {
              type: 'integer',
              description: 'Payment amount in cents',
              example: 4999
            },
          },
        },
        Transaction: {
          type: 'object',
          required: ['transaction_id', 'method', 'amount'],
          properties: {
            transaction_id: {
              type: 'integer',
              description: 'Transaction ID (references enrollment)',
              example: 301
            },
            method: {
              type: 'string',
              enum: ['stripe', 'paypal', 'bank_transfer', 'free'],
              description: 'Transaction method',
              example: 'stripe'
            },
            amount: {
              type: 'number',
              description: 'Transaction amount',
              example: 49.99
            },
            currency: {
              type: 'string',
              default: 'USD',
              description: 'Transaction currency',
              example: 'USD'
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
              default: 'pending',
              description: 'Transaction status',
              example: 'completed'
            },
            external_transaction_id: {
              type: 'string',
              description: 'External payment processor transaction ID',
              example: 'pi_1234567890abcdef'
            },
            fees: {
              type: 'number',
              description: 'Transaction fees',
              example: 1.75
            },
            net_amount: {
              type: 'number',
              description: 'Net amount after fees',
              example: 48.24
            },
            processed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction processing timestamp',
              example: '2023-12-01T11:30:00Z'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction creation timestamp',
              example: '2023-12-01T11:25:00Z'
            },
          },
        },
        Achievement: {
          type: 'object',
          required: ['user_id', 'type', 'title'],
          properties: {
            achievement_id: {
              type: 'integer',
              description: 'The auto-generated id of the achievement',
              example: 901
            },
            user_id: {
              type: 'integer',
              description: 'ID of the user who earned the achievement',
              example: 10
            },
            type: {
              type: 'string',
              enum: ['course_completion', 'streak', 'score', 'milestone', 'special'],
              description: 'Achievement type',
              example: 'course_completion'
            },
            title: {
              type: 'string',
              description: 'Achievement title',
              example: 'ASL Beginner'
            },
            description: {
              type: 'string',
              description: 'Achievement description',
              example: 'Completed your first ASL course!'
            },
            icon_url: {
              type: 'string',
              format: 'uri',
              description: 'Achievement icon URL',
              example: 'https://example.com/icons/achievements/asl-beginner.png'
            },
            points: {
              type: 'integer',
              description: 'Points awarded for this achievement',
              example: 100
            },
            rarity: {
              type: 'string',
              enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
              default: 'common',
              description: 'Achievement rarity',
              example: 'common'
            },
            metadata: {
              type: 'object',
              description: 'Additional achievement data',
              example: {
                "course_id": 101,
                "completion_time": "2023-12-01T16:30:00Z"
              }
            },
            earned_at: {
              type: 'string',
              format: 'date-time',
              description: 'Achievement earned timestamp',
              example: '2023-12-01T16:30:00Z'
            },
          },
        },
        Minigame: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            game_id: {
              type: 'integer',
              description: 'The auto-generated id of the minigame',
              example: 5
            },
            name: {
              type: 'string',
              description: 'Minigame name',
              example: 'Sign Language Bingo'
            },
            type: {
              type: 'string',
              enum: ['bingo', 'memory', 'quiz', 'matching', 'spelling'],
              description: 'Minigame type',
              example: 'bingo'
            },
            description: {
              type: 'string',
              description: 'Minigame description',
              example: 'Match the signs to complete your bingo card!'
            },
            difficulty_level: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              default: 'easy',
              description: 'Minigame difficulty',
              example: 'medium'
            },
            max_score: {
              type: 'integer',
              description: 'Maximum possible score',
              example: 2000
            },
            time_limit_seconds: {
              type: 'integer',
              description: 'Time limit in seconds (null for no limit)',
              example: 300
            },
            instructions: {
              type: 'string',
              description: 'Game instructions',
              example: 'Watch the signs and mark them on your bingo card when you see them!'
            },
            thumbnail_url: {
              type: 'string',
              format: 'uri',
              description: 'Minigame thumbnail URL',
              example: 'https://example.com/images/games/bingo-thumb.jpg'
            },
            is_active: {
              type: 'boolean',
              default: true,
              description: 'Whether the minigame is active',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Minigame creation timestamp',
              example: '2023-10-15T09:00:00Z'
            },
          },
        },
        Feedback: {
          type: 'object',
          required: ['course_id', 'rating'],
          properties: {
            feedback_id: {
              type: 'integer',
              description: 'The auto-generated id of the feedback',
              example: 1001
            },
            course_id: {
              type: 'integer',
              description: 'ID of the course being reviewed',
              example: 101
            },
            user_id: {
              type: 'integer',
              description: 'ID of the user providing feedback',
              example: 10
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Course rating (1-5 stars)',
              example: 5
            },
            comment: {
              type: 'string',
              description: 'Optional feedback comment',
              example: 'Excellent course! Very clear explanations and great visual demonstrations.'
            },
            is_verified: {
              type: 'boolean',
              default: false,
              description: 'Whether the feedback is from a verified learner',
              example: true
            },
            is_approved: {
              type: 'boolean',
              default: true,
              description: 'Whether the feedback is approved for display',
              example: true
            },
            helpful_count: {
              type: 'integer',
              default: 0,
              description: 'Number of users who found this feedback helpful',
              example: 12
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Feedback creation timestamp',
              example: '2023-12-01T18:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Feedback last update timestamp',
              example: '2023-12-01T18:00:00Z'
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data',
              example: {}
            },
            meta: {
              type: 'object',
              description: 'Additional metadata',
              example: {
                "total": 100,
                "page": 1,
                "limit": 10
              }
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
