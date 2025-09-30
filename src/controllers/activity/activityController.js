const sql = require('../../config/database');

// Helper function to sync activity with self-study performance
const syncWithSelfStudyPerformance = async (activityData) => {
    try {
        const { user_id, lesson_id, status, progress_percentage, time_spent_seconds } = activityData;
        
        // Check if lesson type supports self-study performance tracking
        const lesson = await sql`
            SELECT material_type, estimated_duration_minutes 
            FROM lesson WHERE lesson_id = ${lesson_id}
        `;
        
        if (lesson.length === 0) return { success: false, error: 'Lesson not found' };
        
        const materialType = lesson[0].material_type;
        
        // Only sync for video and document materials (remove quiz/assignment types)
        if (!['video', 'document', 'interactive'].includes(materialType)) {
            return { success: true, message: 'Material type not tracked in self-study performance' };
        }
        
        // Calculate performance metrics based on activity
        const percentage = progress_percentage || 0;
        const isCompleted = status === 'completed' || percentage >= 100;
        const score = isCompleted ? 100 : percentage; // For video/document, completion = 100% score
        
        // Upsert self-study performance record
        const performanceResult = await sql`
            INSERT INTO selfstudy_lesson_performance (
                user_id, lesson_id, lesson_type, score, max_score, percentage,
                time_spent_seconds, is_completed, attempt_number, performance_data
            )
            VALUES (
                ${user_id}, ${lesson_id}, ${materialType}, ${score}, 100, ${percentage},
                ${time_spent_seconds || 0}, ${isCompleted}, 1, 
                ${JSON.stringify({ activity_type: 'learning', material_type: materialType })}
            )
            ON CONFLICT (user_id, lesson_id, attempt_number)
            DO UPDATE SET
                score = GREATEST(selfstudy_lesson_performance.score, ${score}),
                percentage = GREATEST(selfstudy_lesson_performance.percentage, ${percentage}),
                time_spent_seconds = selfstudy_lesson_performance.time_spent_seconds + ${time_spent_seconds || 0},
                is_completed = selfstudy_lesson_performance.is_completed OR ${isCompleted},
                performance_date = NOW(),
                performance_data = ${JSON.stringify({ 
                    activity_type: 'learning', 
                    material_type: materialType,
                    last_activity_sync: new Date().toISOString()
                })}
            RETURNING *
        `;
        
        return { success: true, performance: performanceResult[0] };
    } catch (error) {
        console.error('Error syncing with self-study performance:', error);
        return { success: false, error: error.message };
    }
};

// Create activity with self-study performance integration
const createActivity = async (req, res) => {
    try {
        const { user_id, lesson_id, enrollment_id, status, progress_percentage, time_spent_seconds, video_watch_time_seconds, last_position_seconds } = req.body;
        
        if (!user_id || isNaN(user_id) || !lesson_id || isNaN(lesson_id) || !enrollment_id || isNaN(enrollment_id) || !status) {
            return res.status(400).json({ error: 'Missing required fields: user_id, lesson_id, enrollment_id and status are required' });
        }
        
        if (!['started', 'in_progress', 'completed', 'skipped'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: started, in_progress, completed, skipped' });
        }
        
        // Insert activity record
        const result = await sql`
            INSERT INTO learning_activity (
              user_id, lesson_id, enrollment_id, status, progress_percentage,
              time_spent_seconds, video_watch_time_seconds, last_position_seconds
            )
            VALUES (
              ${user_id}, ${lesson_id}, ${enrollment_id}, ${status}, ${progress_percentage || 0},
              ${time_spent_seconds || 0}, ${video_watch_time_seconds || 0}, ${last_position_seconds || 0}
            )
            RETURNING activity_id, user_id, lesson_id, enrollment_id, status, progress_percentage,
                      time_spent_seconds, video_watch_time_seconds, last_position_seconds, last_accessed
        `;
        
        const activity = result[0];
        
        // Sync with self-study performance for video/document materials
        const syncResult = await syncWithSelfStudyPerformance({
            user_id, lesson_id, status, progress_percentage, time_spent_seconds
        });
        
        res.status(201).json({ 
            message: 'Activity created successfully', 
            activity: activity,
            performance_sync: syncResult.success ? 'synced' : 'not_synced',
            sync_message: syncResult.message || null
        });
    } catch (error) {
        console.error('Error creating activity:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: user_id, lesson_id, or enrollment_id does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List activities (optionally by user_id or lesson_id)
const getAllActivities = async (req, res) => {
    try {
        const { user_id, lesson_id } = req.query;
        let query = `
            SELECT a.activity_id, a.user_id, a.lesson_id, a.enrollment_id, a.status, a.progress_percentage,
                   a.time_spent_seconds, a.video_watch_time_seconds, a.last_position_seconds, a.last_accessed,
                   (u.first_name || ' ' || u.last_name) AS user_name, l.title AS lesson_title
            FROM learning_activity a
            LEFT JOIN useraccount u ON a.user_id = u.user_id
            LEFT JOIN lesson l ON a.lesson_id = l.lesson_id`;
        const conditions = [];
        const values = [];
        if (user_id) { conditions.push('a.user_id = $' + (values.length + 1)); values.push(user_id); }
        if (lesson_id) { conditions.push('a.lesson_id = $' + (values.length + 1)); values.push(lesson_id); }
        if (req.query.status) { conditions.push('a.status = $' + (values.length + 1)); values.push(req.query.status); }
        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY a.last_accessed DESC';
        const activities = await sql.unsafe(query, values);
        res.status(200).json({ message: 'Activities retrieved successfully', activities });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get activity by ID
const getActivityById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid activity ID' });
        const result = await sql`SELECT activity_id, user_id, lesson_id, enrollment_id, status, progress_percentage, time_spent_seconds, video_watch_time_seconds, last_position_seconds, last_accessed FROM learning_activity WHERE activity_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Activity not found' });
        res.status(200).json({ message: 'Activity retrieved successfully', activity: result[0] });
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update activity with self-study performance sync
const updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, lesson_id, enrollment_id, status, progress_percentage, time_spent_seconds, video_watch_time_seconds, last_position_seconds } = req.body;
        
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid activity ID' });
        
        const current = await sql`SELECT user_id, lesson_id, enrollment_id, status, progress_percentage, time_spent_seconds, video_watch_time_seconds, last_position_seconds FROM learning_activity WHERE activity_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Activity not found' });
        
        const updatedUserId = user_id !== undefined ? user_id : current[0].user_id;
        const updatedLessonId = lesson_id !== undefined ? lesson_id : current[0].lesson_id;
        const updatedEnrollmentId = enrollment_id !== undefined ? enrollment_id : current[0].enrollment_id;
        const updatedStatus = status !== undefined ? status : current[0].status;
        const updatedProgress = progress_percentage !== undefined ? progress_percentage : current[0].progress_percentage;
        const updatedTimeSpent = time_spent_seconds !== undefined ? time_spent_seconds : current[0].time_spent_seconds;
        const updatedVideoWatch = video_watch_time_seconds !== undefined ? video_watch_time_seconds : current[0].video_watch_time_seconds;
        const updatedLastPosition = last_position_seconds !== undefined ? last_position_seconds : current[0].last_position_seconds;
        
        if (updatedStatus && !['started', 'in_progress', 'completed', 'skipped'].includes(updatedStatus)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: started, in_progress, completed, skipped' });
        }
        
        const result = await sql`
            UPDATE learning_activity SET 
              user_id = ${updatedUserId}, 
              lesson_id = ${updatedLessonId},
              enrollment_id = ${updatedEnrollmentId},
              status = ${updatedStatus},
              progress_percentage = ${updatedProgress},
              time_spent_seconds = ${updatedTimeSpent},
              video_watch_time_seconds = ${updatedVideoWatch},
              last_position_seconds = ${updatedLastPosition},
              last_accessed = NOW()
            WHERE activity_id = ${id}
            RETURNING activity_id, user_id, lesson_id, enrollment_id, status, progress_percentage,
                      time_spent_seconds, video_watch_time_seconds, last_position_seconds, last_accessed
        `;
        
        const activity = result[0];
        
        // Sync with self-study performance if meaningful changes occurred
        let syncResult = { success: true, message: 'No sync needed' };
        if (status !== undefined || progress_percentage !== undefined || time_spent_seconds !== undefined) {
            syncResult = await syncWithSelfStudyPerformance({
                user_id: updatedUserId, 
                lesson_id: updatedLessonId, 
                status: updatedStatus, 
                progress_percentage: updatedProgress, 
                time_spent_seconds: time_spent_seconds || 0 // Only add new time spent
            });
        }
        
        res.status(200).json({ 
            message: 'Activity updated successfully', 
            activity: activity,
            performance_sync: syncResult.success ? 'synced' : 'not_synced',
            sync_message: syncResult.message || null
        });
    } catch (error) {
        console.error('Error updating activity:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: user_id or lesson_id does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete activity
const deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid activity ID' });
        const result = await sql`DELETE FROM learning_activity WHERE activity_id = ${id} RETURNING activity_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Activity not found' });
        res.status(200).json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get detailed activity analytics with performance metrics
const getActivityAnalytics = async (req, res) => {
    try {
        const { user_id, lesson_id, enrollment_id } = req.query;
        
        if (!user_id && !lesson_id && !enrollment_id) {
            return res.status(400).json({ error: 'At least one filter parameter (user_id, lesson_id, or enrollment_id) is required' });
        }
        
        let query = `
            SELECT 
                a.activity_id, a.user_id, a.lesson_id, a.enrollment_id, a.status,
                a.progress_percentage, a.time_spent_seconds, a.video_watch_time_seconds,
                a.last_position_seconds, a.last_accessed,
                l.title as lesson_title, l.material_type, l.estimated_duration_minutes,
                (u.first_name || ' ' || u.last_name) as user_name,
                slp.percentage as performance_percentage, slp.is_completed as performance_completed,
                slp.score as performance_score, slp.performance_date
            FROM learning_activity a
            LEFT JOIN lesson l ON a.lesson_id = l.lesson_id
            LEFT JOIN useraccount u ON a.user_id = u.user_id
            LEFT JOIN selfstudy_lesson_performance slp ON a.lesson_id = slp.lesson_id AND a.user_id = slp.user_id
            WHERE l.material_type IN ('video', 'document', 'interactive')
        `;
        
        const conditions = [];
        const values = [];
        
        if (user_id) { conditions.push('a.user_id = $' + (values.length + 1)); values.push(user_id); }
        if (lesson_id) { conditions.push('a.lesson_id = $' + (values.length + 1)); values.push(lesson_id); }
        if (enrollment_id) { conditions.push('a.enrollment_id = $' + (values.length + 1)); values.push(enrollment_id); }
        
        if (conditions.length > 0) query += ' AND ' + conditions.join(' AND ');
        query += ' ORDER BY a.last_accessed DESC';
        
        const activities = await sql.unsafe(query, values);
        
        // Calculate summary statistics
        const stats = {
            total_activities: activities.length,
            video_activities: activities.filter(a => a.material_type === 'video').length,
            document_activities: activities.filter(a => a.material_type === 'document').length,
            interactive_activities: activities.filter(a => a.material_type === 'interactive').length,
            completed_activities: activities.filter(a => a.status === 'completed').length,
            total_time_spent_minutes: Math.round(activities.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) / 60),
            total_video_watch_minutes: Math.round(activities.filter(a => a.material_type === 'video').reduce((sum, a) => sum + (a.video_watch_time_seconds || 0), 0) / 60),
            average_completion_rate: activities.length > 0 ? Math.round((activities.filter(a => a.status === 'completed').length / activities.length) * 100) : 0
        };
        
        res.status(200).json({
            message: 'Activity analytics retrieved successfully',
            statistics: stats,
            activities: activities
        });
        
    } catch (error) {
        console.error('Error fetching activity analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get video watching analytics with detailed metrics
const getVideoWatchingAnalytics = async (req, res) => {
    try {
        const { user_id, lesson_id } = req.query;
        
        let query = `
            SELECT 
                a.activity_id, a.user_id, a.lesson_id, a.video_watch_time_seconds,
                a.last_position_seconds, a.progress_percentage, a.status, a.last_accessed,
                l.title as lesson_title, l.estimated_duration_minutes, l.streaming_url,
                l.video_metadata,
                (u.first_name || ' ' || u.last_name) as user_name,
                slp.percentage as performance_percentage, slp.time_spent_seconds as total_study_time
            FROM learning_activity a
            LEFT JOIN lesson l ON a.lesson_id = l.lesson_id
            LEFT JOIN useraccount u ON a.user_id = u.user_id
            LEFT JOIN selfstudy_lesson_performance slp ON a.lesson_id = slp.lesson_id AND a.user_id = slp.user_id
            WHERE l.material_type = 'video'
        `;
        
        const conditions = [];
        const values = [];
        
        if (user_id) { conditions.push('a.user_id = $' + (values.length + 1)); values.push(user_id); }
        if (lesson_id) { conditions.push('a.lesson_id = $' + (values.length + 1)); values.push(lesson_id); }
        
        if (conditions.length > 0) query += ' AND ' + conditions.join(' AND ');
        query += ' ORDER BY a.last_accessed DESC';
        
        const videoActivities = await sql.unsafe(query, values);
        
        // Calculate video-specific metrics
        const videoStats = {
            total_videos_watched: videoActivities.length,
            total_watch_time_minutes: Math.round(videoActivities.reduce((sum, a) => sum + (a.video_watch_time_seconds || 0), 0) / 60),
            completed_videos: videoActivities.filter(a => a.status === 'completed').length,
            average_completion_percentage: videoActivities.length > 0 
                ? Math.round(videoActivities.reduce((sum, a) => sum + (a.progress_percentage || 0), 0) / videoActivities.length) 
                : 0,
            videos_in_progress: videoActivities.filter(a => a.status === 'in_progress').length,
            average_watch_position: videoActivities.length > 0 
                ? Math.round(videoActivities.reduce((sum, a) => sum + (a.last_position_seconds || 0), 0) / videoActivities.length)
                : 0
        };
        
        res.status(200).json({
            message: 'Video watching analytics retrieved successfully',
            video_statistics: videoStats,
            video_activities: videoActivities
        });
        
    } catch (error) {
        console.error('Error fetching video analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createActivity,
    getAllActivities,
    getActivityById,
    updateActivity,
    deleteActivity,
    getActivityAnalytics,
    getVideoWatchingAnalytics
};


