# SigniFi API Documentation

## Base URL
```
BASE_URL
```

---

## Table of Contents
1. [Courses API](#courses-api)
2. [Modules API](#modules-api)
3. [Lessons API](#lessons-api)
4. [Enrollments API](#enrollments-api)
5. [Payments API](#payments-api)
6. [Notifications API](#notifications-api)
7. [Course Categories API](#course-categories-api)
8. [Institutions API](#institutions-api)
9. [Other APIs](#other-apis)
10. [Error Responses](#error-responses)

---

## Courses API

### 1. Get All Courses
**GET** `/api/courses`

Retrieves all courses with optional filtering. Always filters by `is_active = true`.

**Query Parameters:**
- `is_published` (boolean, optional) - Filter by published status (`true` or `false`)
- `educator_id` (integer, optional) - Filter by educator ID
- `institution_id` (integer, optional) - Filter by institution ID
- `category_id` (integer, optional) - Filter by category ID
- `difficulty_level` (string, optional) - Filter by difficulty (`beginner`, `intermediate`, `advanced`, `expert`)
- `is_featured` (boolean, optional) - Filter by featured status
- `language` (string, optional) - Filter by language code
- `search` (string, optional) - Search in title and description
- `limit` (integer, default: 50) - Pagination limit
- `offset` (integer, default: 0) - Pagination offset

**Sample cURL:**
```bash
# Get all published courses
curl BASE_URL/api/courses?is_published=true

# Get courses by educator
curl BASE_URL/api/courses?educator_id=5

# Search courses
curl BASE_URL/api/courses?search=sign%20language&is_published=true
```

**Response (200):**
```json
{
  "message": "Courses retrieved successfully",
  "courses": [
    {
      "course_id": 1,
      "educator_id": 5,
      "institution_id": null,
      "category_id": 2,
      "title": "Basic Filipino Sign Language",
      "slug": "basic-filipino-sign-language",
      "short_description": "Learn the fundamentals of FSL",
      "description": "A comprehensive course...",
      "thumbnail_image_url": "https://...",
      "price": 99.99,
      "currency": "USD",
      "difficulty_level": "beginner",
      "is_published": true,
      "is_active": true,
      "is_featured": false,
      "enrollment_count": 150,
      "average_rating": 4.5,
      "total_reviews": 30,
      "educator_name": "John Doe",
      "institution_name": null,
      "category_name": "Language",
      "created_at": "2024-01-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Important Notes:**
- For mobile app, always use `is_published=true` to get only published courses
- All courses are filtered by `is_active = true` automatically
- Results are ordered by: featured first, then by rating, enrollment count, and creation date

---

### 2. Get Course by ID
**GET** `/api/courses/:id`

Retrieves a course by ID with stats and recent reviews (but not full nested modules/lessons).

**Sample cURL:**
```bash
curl BASE_URL/api/courses/1
```

**Response (200):**
```json
{
  "message": "Course retrieved successfully",
  "course": {
    "course_id": 1,
    "title": "Basic Filipino Sign Language",
    "description": "...",
    "stats": {
      "total_modules": 5,
      "total_lessons": 20,
      "total_duration_minutes": 600
    },
    "recent_reviews": [
      {
        "review_id": 10,
        "rating": 5,
        "title": "Great course!",
        "comment": "Very helpful...",
        "reviewer_name": "Jane Smith",
        "created_at": "2024-01-25T10:00:00.000Z"
      }
    ],
    "educator_name": "John Doe",
    "institution_name": null
  }
}
```

---

### 3. Get Course with Full Nested Structure
**GET** `/api/courses/:id/full`

Retrieves a course with complete nested modules and lessons structure. **Recommended for mobile app.**

**Sample cURL:**
```bash
curl BASE_URL/api/courses/1/full
```

**Response (200):**
```json
{
  "success": true,
  "course": {
    "course_id": 1,
    "title": "Basic Filipino Sign Language",
    "description": "...",
    "educator_name": "John Doe",
    "institution_name": null
  },
  "modules": [
    {
      "module_id": 1,
      "course_id": 1,
      "title": "Introduction to FSL",
      "description": "Learn the basics",
      "order_index": 1,
      "estimated_duration_hours": 2,
      "is_active": true,
      "is_preview": true,
      "lessons": [
        {
          "lesson_id": 1,
          "module_id": 1,
          "title": "Welcome to FSL",
          "description": "Introduction lesson",
          "lesson_type": "video",
          "order_index": 1,
          "video_url": "https://...",
          "estimated_duration_minutes": 15,
          "is_active": true,
          "is_preview": true,
          "requires_completion": true
        },
        {
          "lesson_id": 2,
          "module_id": 1,
          "title": "Basic Signs",
          "lesson_type": "video",
          "order_index": 2,
          "video_url": "https://...",
          "estimated_duration_minutes": 20,
          "is_active": true,
          "is_preview": false,
          "requires_completion": true
        }
      ]
    },
    {
      "module_id": 2,
      "course_id": 1,
      "title": "Common Phrases",
      "order_index": 2,
      "lessons": [...]
    }
  ]
}
```

**Important Notes:**
- Modules are ordered by `order_index ASC`
- Lessons within each module are ordered by `order_index ASC`
- Only active modules and lessons (`is_active = true`) are returned

---

### 4. Get Published Courses (Public)
**GET** `/api/courses/published`

Retrieves all published and active courses (public endpoint, no authentication required). Filters by `is_published = true AND is_active = true`.

**Sample cURL:**
```bash
curl BASE_URL/api/courses/published
```

**Response (200):**
```json
[
  {
    "course_id": 1,
    "title": "Basic Filipino Sign Language",
    "description": "...",
    "price": 99.99,
    "is_published": true,
    "created_at": "2024-01-20T10:30:00.000Z"
  }
]
```

**Important Notes:**
- Only returns courses where `is_published = true AND is_active = true`
- Results are ordered by `created_at DESC`
- This endpoint is for public listings and does not require authentication

---

### 5. Search Published Courses
**GET** `/api/courses/search?q={query}`

Searches published and active courses by title and description. Filters by `is_published = true AND is_active = true`.

**Query Parameters:**
- `q` (string, required) - Search query

**Sample cURL:**
```bash
curl BASE_URL/api/courses/search?q=sign%20language
```

**Response (200):**
```json
[
  {
    "course_id": 1,
    "title": "Basic Filipino Sign Language",
    "description": "...",
    "price": 99.99,
    "is_published": true
  }
]
```

**Important Notes:**
- Only searches courses where `is_published = true AND is_active = true`
- Searches in both `title` and `description` fields (case-insensitive)
- Returns empty array if query is empty or no results found
- Results are ordered by `created_at DESC`
- This endpoint is for public search and does not require authentication

---

### 6. Get My Institution Courses
**GET** `/api/courses/my-institution`

**Auth:** Required (Bearer token)

Retrieves courses from the authenticated user's institution.

**Sample cURL:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  BASE_URL/api/courses/my-institution
```

**Response (200):**
```json
{
  "success": true,
  "institution": {
    "institution_id": 1,
    "name": "University of Example",
    "logo_url": "https://..."
  },
  "courses": [
    {
      "course_id": 1,
      "title": "Basic Filipino Sign Language",
      "educator_name": "John Doe",
      "is_published": true
    }
  ]
}
```

---

### 7. Create Course
**POST** `/api/courses`

**Auth:** Required (Bearer token, Educator role)

Creates a new course. Course is created as draft (`is_published: false`) by default.

**Request Body:**
```json
{
  "educator_id": 5,
  "institution_id": null,
  "category_id": 2,
  "title": "Advanced FSL",
  "slug": "advanced-fsl",
  "short_description": "Advanced course",
  "description": "Full description...",
  "thumbnail_image_url": "https://...",
  "price": 199.99,
  "currency": "USD",
  "difficulty_level": "advanced",
  "is_published": false
}
```

**Required Fields:**
- `educator_id` (number) - ID of the educator
- `title` (string) - Course title
- `slug` (string) - Unique URL slug

**Optional Fields:**
- `institution_id` (number) - Institution ID if educator is affiliated
- `category_id` (number) - Course category ID
- `short_description`, `description` (string) - Course descriptions
- `thumbnail_image_url` (string) - Course thumbnail URL
- `price` (number) - Course price (default: 0)
- `currency` (string) - Currency code (default: "USD")
- `difficulty_level` (string) - One of: `beginner`, `intermediate`, `advanced`, `expert`
- `is_published` (boolean) - Published status (default: false)

**Response (201):**
```json
{
  "message": "Course created successfully",
  "course": {
    "course_id": 10,
    "title": "Advanced FSL",
    "is_published": false,
    "created_at": "2024-01-20T10:30:00.000Z"
  }
}
```

---

### 8. Update Course
**PUT** `/api/courses/:id`

**Auth:** Required (Bearer token, Educator role)

Updates an existing course. All fields are optional.

**Sample cURL:**
```bash
curl -X PUT BASE_URL/api/courses/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Course Title",
    "is_published": true
  }'
```

**Response (200):**
```json
{
  "message": "Course updated successfully",
  "course": {
    "course_id": 1,
    "title": "Updated Course Title",
    "is_published": true
  }
}
```

**Important Notes:**
- When updating course content (modules/lessons), the web app deletes all existing modules/lessons and recreates them
- This means `module_id` and `lesson_id` may change on updates

---

### 9. Delete Course
**DELETE** `/api/courses/:id`

**Auth:** Required (Bearer token, Admin role)

Deletes a course permanently.

**Response (200):**
```json
{
  "message": "Course deleted successfully"
}
```

---

### 10. Get Course Download Manifest
**GET** `/api/courses/:id/download-manifest`

**Auth:** Required (Bearer token, Premium subscription)

Retrieves download manifest for offline course access (Premium feature).

**Response (200):**
```json
{
  "success": true,
  "manifest": {
    "course_id": 1,
    "course_title": "Basic FSL",
    "total_modules": 5,
    "total_lessons": 20,
    "total_size_bytes": 1048576000,
    "modules": [...],
    "downloadable_content": [
      {
        "lesson_id": 1,
        "title": "Welcome Lesson",
        "download_url": "https://...",
        "file_size": 52428800,
        "mime_type": "video/mp4"
      }
    ]
  }
}
```

---

## Modules API

### 1. Get All Modules
**GET** `/api/modules?course_id={course_id}`

Retrieves modules, optionally filtered by course ID. Results are ordered by `order_index ASC` and filtered by `is_active = true`.

**Query Parameters:**
- `course_id` (integer, optional) - Filter by course ID

**Sample cURL:**
```bash
# Get all modules
curl BASE_URL/api/modules

# Get modules for a course
curl BASE_URL/api/modules?course_id=1
```

**Response (200):**
```json
{
  "message": "Modules retrieved successfully",
  "data": [
    {
      "module_id": 1,
      "course_id": 1,
      "title": "Introduction to FSL",
      "description": "Learn the basics",
      "order_index": 1,
      "estimated_duration_hours": 2,
      "is_active": true,
      "is_preview": true,
      "created_at": "2024-01-20T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Get Module by ID
**GET** `/api/modules/:id`

Retrieves a specific module by ID.

**Response (200):**
```json
{
  "message": "Module retrieved successfully",
  "module": {
    "module_id": 1,
    "course_id": 1,
    "title": "Introduction to FSL",
    "description": "...",
    "order_index": 1,
    "is_active": true,
    "is_preview": true
  }
}
```

---

### 3. Create Module
**POST** `/api/modules`

Creates a new course module.

**Request Body:**
```json
{
  "course_id": 1,
  "title": "New Module",
  "description": "Module description",
  "order_index": 1,
  "estimated_duration_hours": 2,
  "is_preview": false
}
```

**Required Fields:**
- `course_id` (number) - ID of the course
- `title` (string) - Module title

**Optional Fields:**
- `description` (string) - Module description
- `order_index` (integer) - Order within course (default: 1)
- `estimated_duration_hours` (number) - Estimated duration
- `is_preview` (boolean) - Whether module is preview (default: false)

**Response (201):**
```json
{
  "message": "Course module created successfully",
  "module": {
    "module_id": 5,
    "course_id": 1,
    "title": "New Module",
    "order_index": 1
  }
}
```

---

### 4. Update Module
**PUT** `/api/modules/:id`

Updates an existing module.

**Request Body:**
```json
{
  "title": "Updated Module Title",
  "description": "Updated description",
  "order_index": 2
}
```

**Response (200):**
```json
{
  "message": "Module updated successfully",
  "module": {
    "module_id": 1,
    "title": "Updated Module Title",
    "order_index": 2
  }
}
```

---

### 5. Delete Module
**DELETE** `/api/modules/:id`

Deletes a module permanently.

**Response (200):**
```json
{
  "message": "Module deleted successfully"
}
```

---

## Lessons API

### 1. Get All Lessons
**GET** `/api/lessons?module_id={module_id}&is_active={true|false}&lesson_type={type}`

Retrieves lessons with optional filtering. Defaults to `is_active = true` and orders by `order_index ASC`.

**Query Parameters:**
- `module_id` (integer, optional) - Filter by module ID
- `is_active` (boolean, optional) - Filter by active status (default: true)
- `lesson_type` (string, optional) - Filter by type (`video`, `document`, `interactive`)

**Sample cURL:**
```bash
# Get all active lessons
curl BASE_URL/api/lessons

# Get lessons for a module
curl BASE_URL/api/lessons?module_id=1

# Get video lessons only
curl BASE_URL/api/lessons?lesson_type=video
```

**Response (200):**
```json
{
  "message": "Lessons retrieved successfully",
  "data": [
    {
      "lesson_id": 1,
      "module_id": 1,
      "title": "Welcome to FSL",
      "description": "Introduction lesson",
      "lesson_type": "video",
      "order_index": 1,
      "video_url": "https://...",
      "estimated_duration_minutes": 15,
      "is_active": true,
      "is_preview": true,
      "requires_completion": true,
      "created_at": "2024-01-20T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Get Lesson by ID
**GET** `/api/lessons/:id`

Retrieves a specific lesson by ID.

**Response (200):**
```json
{
  "message": "Lesson retrieved successfully",
  "lesson": {
    "lesson_id": 1,
    "module_id": 1,
    "title": "Welcome to FSL",
    "lesson_type": "video",
    "video_url": "https://...",
    "order_index": 1,
    "is_active": true
  }
}
```

---

### 3. Create Lesson
**POST** `/api/lessons`

Creates a new lesson.

**Request Body:**
```json
{
  "module_id": 1,
  "title": "New Lesson",
  "description": "Lesson description",
  "lesson_type": "video",
  "order_index": 1,
  "video_url": "https://...",
  "estimated_duration_minutes": 15,
  "is_preview": false,
  "requires_completion": true
}
```

**Required Fields:**
- `module_id` (number) - ID of the module
- `title` (string) - Lesson title
- `lesson_type` (string) - One of: `video`, `document`, `interactive`

**Optional Fields:**
- `description` (string) - Lesson description
- `content` (string) - Lesson content (for document/interactive types)
- `video_url` (string) - Video URL (for video type)
- `streaming_url` (string) - Alternative streaming URL
- `order_index` (integer) - Order within module (default: 1)
- `estimated_duration_minutes` (integer) - Estimated duration
- `is_preview` (boolean) - Whether lesson is preview (default: false)
- `requires_completion` (boolean) - Whether completion is required (default: true)
- `passing_score` (integer) - Passing score for interactive lessons
- `max_attempts` (integer) - Maximum attempts (default: 3)
- `file_path`, `original_filename`, `stored_filename` (string) - File information
- `file_size`, `mime_type` (number, string) - File metadata

**Response (201):**
```json
{
  "message": "Lesson created successfully",
  "lesson": {
    "lesson_id": 10,
    "module_id": 1,
    "title": "New Lesson",
    "lesson_type": "video",
    "order_index": 1
  }
}
```

---

### 4. Update Lesson
**PUT** `/api/lessons/:id`

Updates an existing lesson.

**Response (200):**
```json
{
  "message": "Lesson updated successfully",
  "lesson": {
    "lesson_id": 1,
    "title": "Updated Lesson Title"
  }
}
```

---

### 5. Delete Lesson
**DELETE** `/api/lessons/:id`

Deletes a lesson permanently.

**Response (200):**
```json
{
  "message": "Lesson deleted successfully"
}
```

---

### 6. Mark Lesson as Complete
**POST** `/api/lessons/:id/complete`

**Auth:** Required (Bearer token)

Marks a lesson as complete for an enrolled learner.

**Request Body:**
```json
{
  "enrollment_id": 5,
  "time_spent_seconds": 600,
  "video_watch_time_seconds": 580
}
```

**Required Fields:**
- `enrollment_id` (number) - Enrollment ID

**Optional Fields:**
- `time_spent_seconds` (integer) - Total time spent
- `video_watch_time_seconds` (integer) - Video watch time

**Response (200):**
```json
{
  "success": true,
  "message": "Lesson marked as complete",
  "activity": {
    "activity_id": 10,
    "user_id": 5,
    "lesson_id": 1,
    "enrollment_id": 5,
    "status": "completed",
    "progress_percentage": 100
  },
  "enrollment_progress": {
    "total": 20,
    "completed": 5,
    "progressPercentage": 25
  }
}
```

---

### 7. Get Lesson Progress
**GET** `/api/lessons/:id/progress`

**Auth:** Required (Bearer token)

Retrieves lesson progress for the authenticated user.

**Response (200):**
```json
{
  "success": true,
  "progress": {
    "status": "completed",
    "progress_percentage": 100,
    "time_spent_seconds": 600,
    "video_watch_time_seconds": 580
  }
}
```

---

## Enrollments API

### 1. Create Enrollment
**POST** `/api/enrollments`

Enrolls a learner in a course.

**Request Body:**
```json
{
  "learner_id": 5,
  "course_id": 2,
  "status": "active"
}
```

**Required Fields:**
- `learner_id` (number) - ID of the learner user
- `course_id` (number) - ID of the course

**Optional Fields:**
- `status` (string) - Enrollment status (defaults to "active")

**Response (201):**
```json
{
  "message": "Enrollment created successfully",
  "enrollment": {
    "enroll_id": 10,
    "learner_id": 5,
    "course_id": 2,
    "status": "active",
    "enrolled_at": "2024-01-20T10:30:00.000Z"
  }
}
```

---

### 2. Get All Enrollments
**GET** `/api/enrollments?learner_id={id}&course_id={id}`

Retrieves all enrollments with optional filtering.

**Query Parameters:**
- `learner_id` (integer, optional) - Filter by learner ID
- `course_id` (integer, optional) - Filter by course ID

**Response (200):**
```json
{
  "message": "Enrollments retrieved successfully",
  "enrollments": [
    {
      "enroll_id": 10,
      "learner_id": 5,
      "course_id": 2,
      "status": "active",
      "enrolled_at": "2024-01-20T10:30:00.000Z",
      "learner_name": "John Doe",
      "course_title": "Basic Filipino Sign Language"
    }
  ]
}
```

---

### 3. Get Enrollment by ID
**GET** `/api/enrollments/:id`

Retrieves a specific enrollment by ID.

**Response (200):**
```json
{
  "message": "Enrollment retrieved successfully",
  "enrollment": {
    "enroll_id": 10,
    "learner_id": 5,
    "course_id": 2,
    "status": "active",
    "enrolled_at": "2024-01-20T10:30:00.000Z"
  }
}
```

---

### 4. Update Enrollment
**PUT** `/api/enrollments/:id`

Updates an existing enrollment.

**Response (200):**
```json
{
  "message": "Enrollment updated successfully",
  "enrollment": {
    "enroll_id": 10,
    "status": "completed"
  }
}
```

---

### 5. Delete Enrollment
**DELETE** `/api/enrollments/:id`

Removes a learner's enrollment from a course.

**Response (200):**
```json
{
  "message": "Enrollment deleted successfully"
}
```

---

## Payments API

### 1. Create Payment Intent
**POST** `/api/payments/intent`

**Auth:** Required (Bearer token, Learner role)

Creates a Stripe payment intent for course enrollment.

**Request Body:**
```json
{
  "course_id": 1
}
```

**Response (201):**
```json
{
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_...",
  "currency": "usd",
  "amount": 1999,
  "order_id": 42
}
```

**Notes:**
- Creates a `course_order` (status: pending) and `order_item`
- Creates a Stripe PaymentIntent with metadata: `order_id`, `learner_id`, `course_id`
- Frontend confirms payment using `clientSecret` with Stripe

---

### 2. Stripe Webhook
**POST** `/api/payments/webhook`

Handles Stripe webhook events (raw body, no JSON parsing).

**On `payment_intent.succeeded`:**
- Sets `course_order.status` to `completed`
- Inserts into `payment_transaction` with status `completed`
- Ensures `enrollment` exists for `(learner_id, course_id)` with status `active`

**On `payment_intent.payment_failed`:**
- Sets `course_order.status` to `cancelled`
- Inserts into `payment_transaction` with status `failed`

**Environment Variables:**
- `STRIPE_SECRET_KEY` (required)
- `STRIPE_WEBHOOK_SECRET` (recommended)
- `STRIPE_CURRENCY` (default: `usd`)

---

## Notifications API

### 1. Create Notification
**POST** `/api/notifications`

Creates a new notification for a user.

**Request Body:**
```json
{
  "user_id": 1,
  "title": "New Course Available",
  "message": "A new FSL course has been published",
  "action_url": "/courses/123",
  "action_data": {"cta": "view"},
  "type": "general",
  "is_read": false
}
```

**Required Fields:**
- `user_id` (number) - ID of the user to notify
- `title` (string) - Notification title
- `message` (string) - Notification content

**Response (201):**
```json
{
  "message": "Notification created successfully",
  "notification": {
    "notification_id": 15,
    "user_id": 1,
    "title": "New Course Available",
    "message": "A new FSL course has been published",
    "is_read": false,
    "created_at": "2024-01-20T10:30:00.000Z"
  }
}
```

---

### 2. Get All Notifications
**GET** `/api/notifications?user_id={id}&is_read={true|false}`

Retrieves notifications with optional filtering.

**Response (200):**
```json
{
  "message": "Notifications retrieved successfully",
  "notifications": [...]
}
```

---

### 3. Get Notification by ID
**GET** `/api/notifications/:id`

Retrieves a specific notification by ID.

---

### 4. Update Notification
**PUT** `/api/notifications/:id`

Updates an existing notification.

---

### 5. Delete Notification
**DELETE** `/api/notifications/:id`

Deletes a notification permanently.

---

## Course Categories API

### 1. Create Category
**POST** `/api/course-categories`

**Required:** `name`, `slug`

**Response:** 201 Created, 409 Conflict (duplicate slug/name)

---

### 2. Get Categories
**GET** `/api/course-categories?is_active=true`

---

### 3. Get Category by ID
**GET** `/api/course-categories/:id`

---

### 4. Get Category by Slug
**GET** `/api/course-categories/slug/:slug`

---

### 5. Update Category
**PUT** `/api/course-categories/:id`

---

### 6. Delete Category
**DELETE** `/api/course-categories/:id`

---

## Institutions API

### 1. Create Institution
**POST** `/api/institutions`

**Required:** `name`, `slug`, `email`

**Optional:** `contact_number`, `address`, `city`, `state`, `country`, `postal_code`, `website`, `logo_url`, `banner_image_url`, `description`, `accreditation_info`, `is_active`, `is_verified`

---

### 2. List Institutions
**GET** `/api/institutions`

---

### 3. Get Institution by ID
**GET** `/api/institutions/:id`

---

### 4. Update Institution
**PUT** `/api/institutions/:id`

---

### 5. Delete Institution
**DELETE** `/api/institutions/:id`

---

## Other APIs

### Learning Activities API
**POST** `/api/activities`

**Required:** `user_id`, `lesson_id`, `enrollment_id`, `status`

**Statuses:** `started`, `in_progress`, `completed`, `skipped`

---

### Quiz Attempts API
**POST** `/api/attempts`

**Required:** `user_id`, `lesson_id`, `enrollment_id`

**Optional:** `answers`, `score`, `max_score`, `is_passed`, `time_taken_seconds`

**GET** `/api/attempts?user_id={id}&lesson_id={id}&enrollment_id={id}`

---

### Feedback (Course Reviews) API
**POST** `/api/feedback`

**Required:** `course_id`, `user_id`, `enrollment_id`, `rating`

**Optional:** `title`, `comment`, `is_featured`, `is_verified_purchase`

---

### Minigames API
**POST** `/api/minigames`

**Required:** `name`

**Optional:** `description`, `category`, `difficulty_level` (`easy`, `medium`, `hard`, `expert`), `instructions`, `thumbnail_url`, `game_config`, `points_reward`, `is_active`

---

### Admin Activity Log API
**POST** `/api/admin-activities`

**Required:** `admin_id`, `action`

**Optional:** `target_table`, `target_id`, `old_values`, `new_values`, `ip_address`, `user_agent`

---

## Error Responses

All endpoints can return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields: educator_id, title, and slug are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Educator role required.",
  "required_role": "educator",
  "user_roles": []
}
```

### 404 Not Found
```json
{
  "error": "Course not found"
}
```

### 409 Conflict
```json
{
  "error": "Course with this slug already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Important Notes for Mobile App

### 1. Course Fetching
- **Always filter:** `is_published=true` for public course listings
- **Use full endpoint:** `GET /api/courses/:id/full` for complete nested structure
- **Pagination:** Use `limit` and `offset` for course lists

### 2. File Access
- All storage buckets are **public**
- Use full Supabase Storage URL format: `https://{project-ref}.supabase.co/storage/v1/object/public/{bucket-name}/{path}`
- Videos can be streamed directly from `video_url` or `streaming_url`

### 3. Lesson Completion
- Track completion via `POST /api/lessons/:id/complete`
- Requires `enrollment_id` from enrollment record
- Progress is tracked in `learning_activity` table

### 4. Ordering
- Modules are always sorted by `order_index ASC`
- Lessons are always sorted by `order_index ASC`
- This ensures correct learning sequence

### 5. Institution Context
- If learner is affiliated → Show institution courses via `/api/courses/my-institution`
- If educator is affiliated → Courses are associated with institution
- Institution admins can view all courses by their educators

---

*Last Updated: 2024*
