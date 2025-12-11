const sql = require('../../config/database');

// Create a new lesson
const createLesson = async (req, res) => {
    try {
        const { 
            module_id, 
            title, 
            description,
            content,
            video_url, 
            video_duration_seconds,
            lesson_type, 
            order_index,
            estimated_duration_minutes,
            is_active = true,
            is_preview = false,
            requires_completion = true,
            passing_score,
            max_attempts = 3,
            material_type,
            original_filename,
            stored_filename,
            file_path,
            file_size,
            mime_type,
            is_downloadable = true,
            streaming_url,
            video_metadata
        } = req.body;

        if (!module_id || isNaN(module_id) || !title || !lesson_type) {
            return res.status(400).json({ error: 'Missing required fields: module_id (number), title and lesson_type are required' });
        }

        // Updated valid types based on new schema
        const validLessonTypes = ['video', 'document', 'interactive'];
        if (!validLessonTypes.includes(lesson_type)) {
            return res.status(400).json({ error: 'Invalid lesson_type. Must be one of: video, document, interactive' });
        }

        // Validate material_type if provided
        const validMaterialTypes = ['video', 'document', 'audio', 'image', 'interactive'];
        if (material_type && !validMaterialTypes.includes(material_type)) {
            return res.status(400).json({ error: 'Invalid material_type. Must be one of: video, document, audio, image, interactive' });
        }

        const resolvedOrderIndex = (order_index !== undefined && !isNaN(order_index)) ? order_index : 1;

        const result = await sql`
            INSERT INTO lesson (
                module_id, title, description, content, video_url, video_duration_seconds,
                lesson_type, order_index, estimated_duration_minutes, is_active, is_preview,
                requires_completion, passing_score, max_attempts, material_type,
                original_filename, stored_filename, file_path, file_size, mime_type,
                is_downloadable, streaming_url, video_metadata
            )
            VALUES (
                ${module_id}, ${title}, ${description || null}, ${content || null}, 
                ${video_url || null}, ${video_duration_seconds || null},
                ${lesson_type}, ${resolvedOrderIndex}, ${estimated_duration_minutes || null}, 
                ${is_active}, ${is_preview}, ${requires_completion}, ${passing_score || null}, 
                ${max_attempts}, ${material_type || null}, ${original_filename || null},
                ${stored_filename || null}, ${file_path || null}, ${file_size || null},
                ${mime_type || null}, ${is_downloadable}, ${streaming_url || null},
                ${video_metadata || null}
            )
            RETURNING lesson_id, module_id, title, description, content, video_url, 
                      video_duration_seconds, lesson_type, order_index, estimated_duration_minutes,
                      is_active, is_preview, requires_completion, passing_score, max_attempts,
                      material_type, original_filename, stored_filename, file_path, file_size,
                      mime_type, is_downloadable, streaming_url, video_metadata, created_at, updated_at
        `;
        res.status(201).json({ message: 'Lesson created successfully', lesson: result[0] });
    } catch (error) {
        console.error('Error creating lesson:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid module_id: module does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid enum value provided' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all lessons (optionally by module_id)
const getAllLessons = async (req, res) => {
    try {
        const { module_id, is_active, lesson_type } = req.query;
        
        // Build WHERE conditions dynamically
        let whereClause = sql``;
        const conditions = [];
        
        // Default to active lessons if not specified
        if (is_active !== undefined) {
            conditions.push(sql`is_active = ${is_active === 'true'}`);
        } else {
            conditions.push(sql`is_active = true`);
        }
        
        if (module_id) {
            conditions.push(sql`module_id = ${module_id}`);
        }
        if (lesson_type) {
            conditions.push(sql`lesson_type = ${lesson_type}`);
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

        const lessons = await sql`
            SELECT lesson_id, module_id, title, description, content, video_url, 
                   video_duration_seconds, lesson_type, order_index, estimated_duration_minutes,
                   is_active, is_preview, requires_completion, passing_score, max_attempts,
                   material_type, original_filename, stored_filename, file_path, file_size,
                   mime_type, is_downloadable, streaming_url, video_metadata, created_at, updated_at
            FROM lesson
            ${whereClause}
            ORDER BY order_index ASC
        `;
        
        res.status(200).json({ message: 'Lessons retrieved successfully', data: lessons });
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get lesson by ID
const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid lesson ID' });

        const result = await sql`
            SELECT lesson_id, module_id, title, description, content, video_url, 
                   video_duration_seconds, lesson_type, order_index, estimated_duration_minutes,
                   is_active, is_preview, requires_completion, passing_score, max_attempts,
                   material_type, original_filename, stored_filename, file_path, file_size,
                   mime_type, is_downloadable, streaming_url, video_metadata, created_at, updated_at
            FROM lesson WHERE lesson_id = ${id} AND is_active = true
        `;
        if (result.length === 0) return res.status(404).json({ error: 'Lesson not found' });
        res.status(200).json({ message: 'Lesson retrieved successfully', lesson: result[0] });
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update lesson
const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            module_id, 
            title, 
            description,
            content, 
            video_url, 
            video_duration_seconds,
            lesson_type, 
            order_index,
            estimated_duration_minutes,
            is_active,
            is_preview,
            requires_completion,
            passing_score,
            max_attempts,
            material_type,
            original_filename,
            stored_filename,
            file_path,
            file_size,
            mime_type,
            is_downloadable,
            streaming_url,
            video_metadata
        } = req.body;
        
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid lesson ID' });

        const current = await sql`
            SELECT module_id, title, description, content, video_url, video_duration_seconds,
                   lesson_type, order_index, estimated_duration_minutes, is_active, is_preview,
                   requires_completion, passing_score, max_attempts, material_type,
                   original_filename, stored_filename, file_path, file_size, mime_type,
                   is_downloadable, streaming_url, video_metadata
            FROM lesson WHERE lesson_id = ${id}
        `;
        if (current.length === 0) return res.status(404).json({ error: 'Lesson not found' });

        // Merge current values with updates
        const currentLesson = current[0];
        const updatedLesson = {
            module_id: module_id !== undefined ? module_id : currentLesson.module_id,
            title: title !== undefined ? title : currentLesson.title,
            description: description !== undefined ? description : currentLesson.description,
            content: content !== undefined ? content : currentLesson.content,
            video_url: video_url !== undefined ? video_url : currentLesson.video_url,
            video_duration_seconds: video_duration_seconds !== undefined ? video_duration_seconds : currentLesson.video_duration_seconds,
            lesson_type: lesson_type !== undefined ? lesson_type : currentLesson.lesson_type,
            order_index: order_index !== undefined ? order_index : currentLesson.order_index,
            estimated_duration_minutes: estimated_duration_minutes !== undefined ? estimated_duration_minutes : currentLesson.estimated_duration_minutes,
            is_active: is_active !== undefined ? is_active : currentLesson.is_active,
            is_preview: is_preview !== undefined ? is_preview : currentLesson.is_preview,
            requires_completion: requires_completion !== undefined ? requires_completion : currentLesson.requires_completion,
            passing_score: passing_score !== undefined ? passing_score : currentLesson.passing_score,
            max_attempts: max_attempts !== undefined ? max_attempts : currentLesson.max_attempts,
            material_type: material_type !== undefined ? material_type : currentLesson.material_type,
            original_filename: original_filename !== undefined ? original_filename : currentLesson.original_filename,
            stored_filename: stored_filename !== undefined ? stored_filename : currentLesson.stored_filename,
            file_path: file_path !== undefined ? file_path : currentLesson.file_path,
            file_size: file_size !== undefined ? file_size : currentLesson.file_size,
            mime_type: mime_type !== undefined ? mime_type : currentLesson.mime_type,
            is_downloadable: is_downloadable !== undefined ? is_downloadable : currentLesson.is_downloadable,
            streaming_url: streaming_url !== undefined ? streaming_url : currentLesson.streaming_url,
            video_metadata: video_metadata !== undefined ? video_metadata : currentLesson.video_metadata
        };

        // Validate lesson_type
        const validLessonTypes = ['video', 'document', 'interactive'];
        if (updatedLesson.lesson_type && !validLessonTypes.includes(updatedLesson.lesson_type)) {
            return res.status(400).json({ error: 'Invalid lesson_type. Must be one of: video, document, interactive' });
        }

        // Validate material_type
        const validMaterialTypes = ['video', 'document', 'audio', 'image', 'interactive'];
        if (updatedLesson.material_type && !validMaterialTypes.includes(updatedLesson.material_type)) {
            return res.status(400).json({ error: 'Invalid material_type. Must be one of: video, document, audio, image, interactive' });
        }

        const result = await sql`
            UPDATE lesson SET 
                module_id = ${updatedLesson.module_id}, 
                title = ${updatedLesson.title}, 
                description = ${updatedLesson.description},
                content = ${updatedLesson.content}, 
                video_url = ${updatedLesson.video_url}, 
                video_duration_seconds = ${updatedLesson.video_duration_seconds},
                lesson_type = ${updatedLesson.lesson_type}, 
                order_index = ${updatedLesson.order_index},
                estimated_duration_minutes = ${updatedLesson.estimated_duration_minutes},
                is_active = ${updatedLesson.is_active},
                is_preview = ${updatedLesson.is_preview},
                requires_completion = ${updatedLesson.requires_completion},
                passing_score = ${updatedLesson.passing_score},
                max_attempts = ${updatedLesson.max_attempts},
                material_type = ${updatedLesson.material_type},
                original_filename = ${updatedLesson.original_filename},
                stored_filename = ${updatedLesson.stored_filename},
                file_path = ${updatedLesson.file_path},
                file_size = ${updatedLesson.file_size},
                mime_type = ${updatedLesson.mime_type},
                is_downloadable = ${updatedLesson.is_downloadable},
                streaming_url = ${updatedLesson.streaming_url},
                video_metadata = ${updatedLesson.video_metadata},
                updated_at = CURRENT_TIMESTAMP
            WHERE lesson_id = ${id}
            RETURNING lesson_id, module_id, title, description, content, video_url, 
                      video_duration_seconds, lesson_type, order_index, estimated_duration_minutes,
                      is_active, is_preview, requires_completion, passing_score, max_attempts,
                      material_type, original_filename, stored_filename, file_path, file_size,
                      mime_type, is_downloadable, streaming_url, video_metadata, created_at, updated_at
        `;
        res.status(200).json({ message: 'Lesson updated successfully', lesson: result[0] });
    } catch (error) {
        console.error('Error updating lesson:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid module_id: module does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid enum value provided' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete lesson
const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid lesson ID' });

        const result = await sql`DELETE FROM lesson WHERE lesson_id = ${id} RETURNING lesson_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Lesson not found' });
        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Cannot delete lesson: it is referenced by other records' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Helper: Recalculate enrollment progress based on completed lessons
const recalculateEnrollmentProgress = async (enrollmentId) => {
    try {
        // Get enrollment details
        const enrollment = await sql`
            SELECT e.enrollment_id, e.course_id, e.learner_id
            FROM enrollment e
            WHERE e.enrollment_id = ${enrollmentId}
        `;
        
        if (!enrollment.length) return null;
        
        const { course_id, learner_id } = enrollment[0];
        
        // Count total lessons in course
        const totalLessons = await sql`
            SELECT COUNT(l.lesson_id) as total
            FROM lesson l
            JOIN coursemodule cm ON l.module_id = cm.module_id
            WHERE cm.course_id = ${course_id} AND l.is_active = true AND l.requires_completion = true
        `;
        
        // Count completed lessons for this enrollment
        const completedLessons = await sql`
            SELECT COUNT(DISTINCT la.lesson_id) as completed
            FROM learning_activity la
            JOIN lesson l ON la.lesson_id = l.lesson_id
            JOIN coursemodule cm ON l.module_id = cm.module_id
            WHERE la.enrollment_id = ${enrollmentId} 
            AND la.status = 'completed'
            AND cm.course_id = ${course_id}
        `;
        
        const total = parseInt(totalLessons[0].total) || 1;
        const completed = parseInt(completedLessons[0].completed) || 0;
        const progressPercentage = Math.round((completed / total) * 100);
        
        // Update enrollment progress
        await sql`
            UPDATE enrollment 
            SET completion_percentage = ${progressPercentage},
                last_accessed = NOW(),
                status = ${progressPercentage >= 100 ? 'completed' : 'active'},
                completion_date = ${progressPercentage >= 100 ? sql`NOW()` : sql`NULL`}
            WHERE enrollment_id = ${enrollmentId}
        `;
        
        return { total, completed, progressPercentage };
    } catch (error) {
        console.error('Error recalculating enrollment progress:', error);
        return null;
    }
};

// Mark lesson as complete
const markLessonComplete = async (req, res) => {
    try {
        const { id } = req.params; // lesson_id
        const { enrollment_id, time_spent_seconds, video_watch_time_seconds } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid lesson ID' });
        }

        if (!enrollment_id || isNaN(enrollment_id)) {
            return res.status(400).json({ error: 'Enrollment ID is required' });
        }

        // Verify enrollment belongs to user
        const enrollment = await sql`
            SELECT enrollment_id, course_id, learner_id 
            FROM enrollment 
            WHERE enrollment_id = ${enrollment_id} AND learner_id = ${userId}
        `;

        if (!enrollment.length) {
            return res.status(403).json({ error: 'You are not enrolled in this course' });
        }

        // Verify lesson belongs to the course
        const lesson = await sql`
            SELECT l.lesson_id, l.module_id, cm.course_id
            FROM lesson l
            JOIN coursemodule cm ON l.module_id = cm.module_id
            WHERE l.lesson_id = ${id}
        `;

        if (!lesson.length) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        if (lesson[0].course_id !== enrollment[0].course_id) {
            return res.status(400).json({ error: 'Lesson does not belong to the enrolled course' });
        }

        // Check if activity already exists
        const existing = await sql`
            SELECT activity_id, time_spent_seconds, video_watch_time_seconds
            FROM learning_activity 
            WHERE user_id = ${userId} 
            AND lesson_id = ${id} 
            AND enrollment_id = ${enrollment_id}
        `;

        let activity;
        if (existing.length > 0) {
            // Update existing activity
            const currentTimeSpent = existing[0].time_spent_seconds || 0;
            const currentVideoTime = existing[0].video_watch_time_seconds || 0;
            
            activity = await sql`
                UPDATE learning_activity
                SET status = 'completed',
                    progress_percentage = 100,
                    time_spent_seconds = ${currentTimeSpent + (time_spent_seconds || 0)},
                    video_watch_time_seconds = ${currentVideoTime + (video_watch_time_seconds || 0)},
                    completed_at = NOW(),
                    last_accessed = NOW()
                WHERE activity_id = ${existing[0].activity_id}
                RETURNING *
            `;
        } else {
            // Create new activity
            activity = await sql`
                INSERT INTO learning_activity (
                    user_id, lesson_id, enrollment_id, status, progress_percentage,
                    time_spent_seconds, video_watch_time_seconds, completed_at, last_accessed
                )
                VALUES (
                    ${userId}, ${id}, ${enrollment_id}, 'completed', 100,
                    ${time_spent_seconds || 0}, ${video_watch_time_seconds || 0}, NOW(), NOW()
                )
                RETURNING *
            `;
        }

        // Recalculate enrollment progress
        const progress = await recalculateEnrollmentProgress(enrollment_id);

        // Update current lesson in enrollment
        await sql`
            UPDATE enrollment 
            SET current_lesson_id = ${id}
            WHERE enrollment_id = ${enrollment_id}
        `;

        res.json({ 
            success: true, 
            message: 'Lesson marked as complete',
            activity: activity[0],
            enrollment_progress: progress
        });
    } catch (error) {
        console.error('Error marking lesson complete:', error);
        res.status(500).json({ error: 'Failed to mark lesson complete' });
    }
};

// Get lesson progress for authenticated user
const getLessonProgress = async (req, res) => {
    try {
        const { id } = req.params; // lesson_id
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid lesson ID' });
        }

        const activity = await sql`
            SELECT la.*, e.course_id
            FROM learning_activity la
            JOIN enrollment e ON la.enrollment_id = e.enrollment_id
            WHERE la.lesson_id = ${id} AND la.user_id = ${userId}
            ORDER BY la.last_accessed DESC
            LIMIT 1
        `;

        if (!activity.length) {
            return res.json({ 
                success: true,
                progress: { status: 'not_started', progress_percentage: 0 }
            });
        }

        res.json({ 
            success: true,
            progress: activity[0]
        });
    } catch (error) {
        console.error('Error fetching lesson progress:', error);
        res.status(500).json({ error: 'Failed to fetch lesson progress' });
    }
};

module.exports = {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
    markLessonComplete,
    getLessonProgress
};


