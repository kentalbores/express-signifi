# SigniFi API Documentation

## Base URL
```
http://54.206.125.253:5000
```

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
  "template_id": null,
  "is_read": false
}
```

**Required Fields:**
- `user_id` (number) - ID of the user to notify
- `title` (string) - Notification title
- `message` (string) - Notification content

**Optional Fields:**
- `action_url` (string) - URL for the notification (alias `link` accepted)
- `action_data` (object) - Arbitrary JSON payload for client actions
- `type` (string) - Defaults to `general`
- `template_id` (number) - Optional reference to `notification_template`
- `is_read` (boolean) - Read status (defaults to false)

**Sample cURL:**
```bash
curl -X POST http://54.206.125.253:5000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "title": "New Course Available",
    "message": "A new FSL course has been published",
    "action_url": "/courses/123",
    "action_data": {"cta": "view"}
  }'
```

**Response (201):**
```json
{
  "message": "Notification created successfully",
  "notification": {
    "notification_id": 15,
    "user_id": 1,
    "title": "New Course Available",
    "message": "A new FSL course has been published",
    "action_url": "/courses/123",
    "action_data": {"cta": "view"},
    "type": "general",
    "template_id": null,
    "is_read": false,
    "created_at": "2024-01-20T10:30:00.000Z"
  }
}
```

---

### 2. Get All Notifications
**GET** `/api/notifications`

Retrieves all notifications with optional filtering.

**Query Parameters:**
- `user_id` (optional) - Filter by specific user
- `is_read` (optional) - Filter by read status ("true" or "false")

**Sample cURL:**
```bash
# Get all notifications
curl http://54.206.125.253:5000/api/notifications

# Get notifications for specific user
curl http://54.206.125.253:5000/api/notifications?user_id=1

# Get unread notifications for user
curl http://54.206.125.253:5000/api/notifications?user_id=1&is_read=false
```

**Response (200):**
```json
{
  "message": "Notifications retrieved successfully",
  "notifications": [
    {
      "notification_id": 15,
      "user_id": 1,
      "title": "New Course Available",
      "message": "A new FSL course has been published",
      "action_url": "/courses/123",
      "action_data": null,
      "type": "general",
      "template_id": null,
      "is_read": false,
      "created_at": "2024-01-20T10:30:00.000Z"
    },
    {
      "notification_id": 14,
      "user_id": 1,
      "title": "Assignment Due",
      "message": "Your assignment is due tomorrow",
      "action_url": "/assignments/456",
      "action_data": null,
      "type": "general",
      "template_id": null,
      "is_read": true,
      "created_at": "2024-01-19T15:20:00.000Z"
    }
  ]
}
```

---

### 3. Get Notification by ID
**GET** `/api/notifications/:id`

Retrieves a specific notification by its ID.

**Sample cURL:**
```bash
curl http://54.206.125.253:5000/api/notifications/15
```

**Response (200):**
```json
{
  "message": "Notification retrieved successfully",
  "notification": {
    "notification_id": 15,
    "user_id": 1,
    "title": "New Course Available",
    "message": "A new FSL course has been published",
    "action_url": "/courses/123",
    "action_data": null,
    "type": "general",
    "template_id": null,
    "is_read": false,
    "created_at": "2024-01-20T10:30:00.000Z"
  }
}
```

---

### 4. Update Notification
**PUT** `/api/notifications/:id`

Updates an existing notification. All fields are optional.

**Sample cURL (Mark as Read):**
```bash
curl -X PUT http://54.206.125.253:5000/api/notifications/15 \
  -H "Content-Type: application/json" \
  -d '{"is_read": true}'
```

**Sample cURL (Update Title and Message):**
```bash
curl -X PUT http://54.206.125.253:5000/api/notifications/15 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Course Available",
    "message": "The FSL course has been updated with new content"
  }'
```

**Response (200):**
```json
{
  "message": "Notification updated successfully",
  "notification": {
    "notification_id": 15,
    "user_id": 1,
    "title": "Updated Course Available",
    "message": "The FSL course has been updated with new content",
    "action_url": "/courses/123",
    "action_data": null,
    "type": "general",
    "template_id": null,
    "is_read": true,
    "created_at": "2024-01-20T10:30:00.000Z"
  }
}
```

---

### 5. Delete Notification
**DELETE** `/api/notifications/:id`

Deletes a notification permanently.

**Sample cURL:**
```bash
curl -X DELETE http://54.206.125.253:5000/api/notifications/15
```

**Response (200):**
```json
{
  "message": "Notification deleted successfully"
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

**Sample cURL:**
```bash
curl -X POST http://54.206.125.253:5000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "learner_id": 5,
    "course_id": 2,
    "status": "active"
  }'
```

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
**GET** `/api/enrollments`

Retrieves all enrollments with optional filtering and joined data.

**Query Parameters:**
- `learner_id` (optional) - Filter by specific learner
- `course_id` (optional) - Filter by specific course

**Sample cURL:**
```bash
# Get all enrollments
curl http://54.206.125.253:5000/api/enrollments

# Get enrollments for specific learner
curl http://54.206.125.253:5000/api/enrollments?learner_id=5

# Get enrollments for specific course
curl http://54.206.125.253:5000/api/enrollments?course_id=2
```

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
    },
    {
      "enroll_id": 9,
      "learner_id": 3,
      "course_id": 2,
      "status": "completed",
      "enrolled_at": "2024-01-15T14:20:00.000Z",
      "learner_name": "Jane Smith",
      "course_title": "Basic Filipino Sign Language"
    }
  ]
}
```

---

### 3. Get Enrollment by ID
**GET** `/api/enrollments/:id`

Retrieves a specific enrollment by its ID.

**Sample cURL:**
```bash
curl http://54.206.125.253:5000/api/enrollments/10
```

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

Updates an existing enrollment. All fields are optional.

**Sample cURL (Update Status):**
```bash
curl -X PUT http://54.206.125.253:5000/api/enrollments/10 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

**Sample cURL (Transfer to Different Course):**
```bash
curl -X PUT http://54.206.125.253:5000/api/enrollments/10 \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 3,
    "status": "active"
  }'
```

**Response (200):**
```json
{
  "message": "Enrollment updated successfully",
  "enrollment": {
    "enroll_id": 10,
    "learner_id": 5,
    "course_id": 3,
  "status": "active",
    "enrolled_at": "2024-01-20T10:30:00.000Z"
  }
}
```

---

### 5. Delete Enrollment
**DELETE** `/api/enrollments/:id`

Removes a learner's enrollment from a course.

**Sample cURL:**
```bash
curl -X DELETE http://54.206.125.253:5000/api/enrollments/10
```

**Response (200):**
```json
{
  "message": "Enrollment deleted successfully"
}
```

---

## Error Responses

All endpoints can return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields: user_id (number), title and message are required"
}
```

### 404 Not Found
```json
{
  "error": "Notification not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Data Types and Constraints

### Notification Fields
- `notification_id`: Auto-generated integer
- `user_id`: Integer (must reference existing user)
- `title`: String (required)
- `message`: Text (required)
- `action_url`: String (optional, alias `link` accepted)
- `action_data`: JSON (optional)
- `type`: String (defaults to `general`)
- `template_id`: Integer (optional)
- `is_read`: Boolean (defaults to false)
- `created_at`: Timestamp (auto-generated)

### Enrollment Fields
- `enroll_id`: Auto-generated integer
- `learner_id`: Integer (must reference existing user with learner role)
- `course_id`: Integer (must reference existing course)
- `status`: String (defaults to "active")
- `enrolled_at`: Timestamp (auto-generated)

### Common Status Values
**Enrollment Status:**
- `"active"` - Student is currently taking the course
- `"completed"` - Student has finished the course
- `"dropped"` - Student has withdrawn from the course
- `"suspended"` - Course is temporarily suspended
- `"refunded"` - Enrollment was refunded

---

## Course Categories API

### 1. Create Category
**POST** `/api/course-categories`

Required: `name`, `slug`

Response codes: 201 Created, 409 Conflict (duplicate slug/name)

### 2. Get Categories
**GET** `/api/course-categories?is_active=true`

### 3. Get Category by ID
**GET** `/api/course-categories/{id}`

### 4. Get Category by Slug
**GET** `/api/course-categories/slug/{slug}`

### 5. Update Category
**PUT** `/api/course-categories/{id}`

### 6. Delete Category
**DELETE** `/api/course-categories/{id}`

---

## Institutions API

### 1. Create Institution
**POST** `/api/institutions`

Required: `name`, `slug`, `email`

Optional: `contact_number`, `address`, `city`, `state`, `country`, `postal_code`, `website`, `logo_url`, `banner_image_url`, `description`, `accreditation_info`, `is_active`, `is_verified`

### 2. List Institutions
**GET** `/api/institutions`

### 3. Get Institution by ID
**GET** `/api/institutions/{id}`

### 4. Update Institution
**PUT** `/api/institutions/{id}`

### 5. Delete Institution
**DELETE** `/api/institutions/{id}`

---

## Lessons API

Types: `video`, `quiz`, `assignment`, `reading`, `interactive`, `live_session`

Create: `POST /api/lessons` (Required: `module_id`, `title`, `lesson_type`; Optional: `content`, `video_url`, `order_index`)

---

## Lesson Materials API

Create: `POST /api/lesson-materials` (Required: `lesson_id`, `file_id`; Optional: `title`, `description`, `is_downloadable`, `order_index`)

---

## Quiz Attempts API

Create: `POST /api/attempts` (Required: `user_id`, `lesson_id`, `enrollment_id`; Optional: `answers`, `score`, `max_score`, `is_passed`, `time_taken_seconds`)

List: `GET /api/attempts?user_id=&lesson_id=&enrollment_id=`

---

## Learning Activities API

Create: `POST /api/activities` (Required: `user_id`, `lesson_id`, `enrollment_id`, `status`)

Statuses: `started`, `in_progress`, `completed`, `skipped`

---

## Minigames API

Create: `POST /api/minigames` (Required: `name`; Optional: `description`, `category`, `difficulty_level` (`easy`, `medium`, `hard`, `expert`), `instructions`, `thumbnail_url`, `game_config`, `points_reward`, `is_active`)

---

## Feedback (Course Reviews) API

Create: `POST /api/feedback` (Required: `course_id`, `user_id`, `enrollment_id`, `rating`; Optional: `title`, `comment`, `is_featured`, `is_verified_purchase`)

---

## Admin Activity Log API

Create: `POST /api/admin-activities` (Required: `admin_id`, `action`; Optional: `target_table`, `target_id`, `old_values`, `new_values`, `ip_address`, `user_agent`)
