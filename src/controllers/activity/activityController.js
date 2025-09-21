const sql = require('../../config/database');

// Create activity
const createActivity = async (req, res) => {
    try {
        const { user_id, lesson_id, enrollment_id, status, progress_percentage, time_spent_seconds, video_watch_time_seconds, last_position_seconds } = req.body;
        if (!user_id || isNaN(user_id) || !lesson_id || isNaN(lesson_id) || !enrollment_id || isNaN(enrollment_id) || !status) {
            return res.status(400).json({ error: 'Missing required fields: user_id, lesson_id, enrollment_id and status are required' });
        }
        if (!['started', 'in_progress', 'completed', 'skipped'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: started, in_progress, completed, skipped' });
        }
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
        res.status(201).json({ message: 'Activity created successfully', activity: result[0] });
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

// Update activity
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
        res.status(200).json({ message: 'Activity updated successfully', activity: result[0] });
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

module.exports = {
    createActivity,
    getAllActivities,
    getActivityById,
    updateActivity,
    deleteActivity
};


