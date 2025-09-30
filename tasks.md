Refactoring Task List for SigniFi API by Module
Overview
Refactor the Express.js API to align with the updated Supabase schema (updatedSupabaseSchema.txt), focusing on modules from the FDD: Account Management, Self-Study Content Management, Analytics Management, Content Moderation Management, Course Management, and Notification Management. Tasks are grouped by module, based on code files (routes/.js, controllers/.js, middleware/auth.js) and schema changes. Designed for agentic AI execution, with clear dependencies and atomic tasks.
Prerequisites

Backup current Supabase schema/data and commit codebase to refactor/base branch.
Set up staging Supabase DB with updated schema.
Install Joi (validation), Jest, and Supertest (testing).
Update seed.txt with new endpoints for testing.

Module-Based Tasks
Account Management

Task 1.1: Update User Authentication
File: middleware/auth.js
Action: Enhance JWT parsing to extract roles (learner, educator, institution_admin, superadmin) from useraccount and related tables (e.g., superadmin, institution_admin).
Dependency: Updated useraccount table schema.
Effort: 1 day


Task 1.2: Refactor User Account CRUD
Files: routes/userRoutes.js, controllers/userController.js
Action: Update CRUD endpoints (/api/users) to reflect new schema fields (e.g., timezone, language_preference) and FKs (superadmin, institution_admin).
Dependency: Task 1.1 (role extraction).
Effort: 1.5 days


Task 1.3: Implement Role-Based Access Guards
File: middleware/auth.js
Action: Add guard functions (e.g., isSuperAdmin, isEducator) to restrict access based on user roles.
Dependency: Task 1.1 (role extraction).
Effort: 1 day



Self-Study Content Management

Task 2.1: Refactor Lesson Management
Files: routes/lessonRoutes.js, controllers/lessonController.js
Action: Update endpoints (/api/lessons) to include new fields (material_type, file_path, streaming_url, etc.) from updated lesson table; remove lessonmaterial references.
Dependency: Updated lesson table schema.
Effort: 2 days


Task 2.2: Implement Self-Study Performance Tracking
Files: routes/selfStudyPerformanceRoutes.js (new), controllers/selfStudyPerformanceController.js (new)
Action: Create new endpoints (/api/selfstudy-performances) for POSTing performance data (score, percentage, etc.) per selfstudy_lesson_performance table.
Dependency: Task 2.1 (lesson updates).
Effort: 2 days


Task 2.3: Update Minigame Management
Files: routes/minigameRoutes.js, controllers/minigameController.js
Action: Adjust endpoints (/api/minigames) to align with schema; remove game_attempt references if confirmed removed.
Dependency: Updated minigame table schema.
Effort: 1.5 days



Analytics Management

Task 3.1: Refactor Analytics Endpoints
Files: routes/analyticsRoutes.js, controllers/analyticsController.js
Action: Update endpoints (/api/analytics) to use selfstudy_lesson_performance data for course and revenue analytics, per FDD requirements.
Dependency: Task 2.2 (performance tracking).
Effort: 2 days


Task 3.2: Add Validation for Analytics Access
File: middleware/auth.js
Action: Restrict /api/analytics to superadmin and institution_admin roles.
Dependency: Task 1.3 (RBAC guards).
Effort: 0.5 days



Content Moderation Management

Task 4.1: Implement Content Policy Management
Files: routes/contentPolicyRoutes.js (new), controllers/contentPolicyController.js (new)
Action: Create CRUD endpoints (/api/content-policies) for content_policy table (policy_type, edited_by, etc.), per FDD moderation needs.
Dependency: Updated content_policy table schema.
Effort: 1.5 days


Task 4.2: Update Course Moderation
Files: routes/coursemoderationRoutes.js, controllers/coursemoderationController.js
Action: Adjust endpoints (/api/course-moderations) to use superadmin FK for admin_id.
Dependency: Task 1.3 (RBAC guards).
Effort: 1 day



Course Management

Task 5.1: Refactor Course CRUD
Files: routes/courseRoutes.js, controllers/courseController.js
Action: Update endpoints (/api/courses) to reflect schema changes (e.g., remove course_discussion references); add content_policy integration.
Dependency: Task 4.1 (content policy).
Effort: 2 days


Task 5.2: Update Enrollment Management
Files: routes/enrollmentRoutes.js, controllers/enrollmentController.js
Action: Modify endpoints (/api/enrollments) to support self-study tracking; remove quiz/assignment references.
Dependency: Task 2.2 (performance tracking).
Effort: 1.5 days


Task 5.3: Implement Progress Tracking
Files: routes/activityRoutes.js, controllers/activityController.js
Action: Update endpoints (/api/activities) to track progress using selfstudy_lesson_performance data.
Dependency: Task 2.2 (performance tracking).
Effort: 1 day



Notification Management

Task 6.1: Refactor Notification Endpoints
Files: routes/notificationRoutes.js, controllers/notificationController.js
Action: Update endpoints (/api/notifications) to support new user types (e.g., institution_admin notifications).
Dependency: Task 1.1 (role extraction).
Effort: 1 day


Task 6.2: Add Role-Specific Notifications
File: controllers/notificationController.js
Action: Implement logic to send notifications based on user roles (e.g., superadmin moderation alerts).
Dependency: Task 6.1 (endpoint updates).
Effort: 1 day



Cleanup and Testing

Task 7.1: Remove Deprecated Features
Files: All routes/.js, controllers/.js
Action: Delete endpoints for removed tables (e.g., assignmentRoutes.js, quizRoutes.js); add deprecation notes.
Dependency: All module tasks.
Effort: 1.5 days


Task 7.2: Write Unit Tests
Files: All controllers/*.js
Action: Create Jest tests for new/refactored endpoints (e.g., contentPolicyController.create).
Dependency: Task 7.1 (cleanup).
Effort: 2 days


Task 7.3: Run Integration Tests
Files: seed.txt
Action: Update seed.txt with new endpoints; run with Supertest.
Dependency: Task 7.2 (unit tests).
Effort: 2 days


Task 7.4: Update API Documentation
File: API_DOCUMENTATION.md
Action: Add new endpoints (e.g., /api/content-policies); mark deprecated ones.
Dependency: Task 7.1 (cleanup).
Effort: 1 day



Execution Notes for Agentic AI

Sequential Processing: Complete tasks within each module before moving to the next, respecting dependencies.
Context: Use schema files (supabaseSchema.txt, updatedSupabaseSchema.txt), seed.txt, and API_DOCUMENTATION.md for reference.
Code Style: Follow existing Express patterns (e.g., async/await, error handling with try-catch).
Validation: Apply Joi schemas for request bodies (e.g., validate policy_type enum in content_policy).
RBAC: Enforce guards from Task 1.3 across all endpoints.
Output: Commit changes to refactor/<module> branches (e.g., refactor/account-management).
