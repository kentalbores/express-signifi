const sql = require('../../config/database');

// Create or update self-study performance record
const recordPerformance = async (req, res) => {
    try {
        console.log('📝 Recording self-study performance:', req.body);
        
        const { 
            user_id,
            lesson_identifier,
            lesson_type,
            score = 0,
            max_score = 100,
            percentage,
            time_spent_seconds = 0,
            performance_data,
            completed_levels,
            is_completed = false,
            attempt_number = 1
        } = req.body;

        // Validate required fields
        if (!user_id || !lesson_identifier) {
            console.error('❌ Missing required fields:', { user_id, lesson_identifier });
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: user_id and lesson_identifier are required'
            });
        }

        // Validate score and percentage constraints
        if (score < 0 || (max_score && score > max_score)) {
            return res.status(400).json({
                success: false,
                error: 'Score must be non-negative and not exceed max_score'
            });
        }

        if (max_score <= 0) {
            return res.status(400).json({
                success: false,
                error: 'max_score must be greater than 0'
            });
        }

        // Calculate percentage if not provided
        const calculatedPercentage = percentage !== undefined ? percentage : (score / max_score) * 100;

        if (calculatedPercentage < 0 || calculatedPercentage > 100) {
            return res.status(400).json({
                success: false,
                error: 'Percentage must be between 0 and 100'
            });
        }

        // Check if performance record already exists for this user and lesson
        const existingRecord = await sql`
            SELECT performance_id, attempt_number 
            FROM selfstudy_lesson_performance 
            WHERE user_id = ${user_id} AND lesson_identifier = ${lesson_identifier}
            ORDER BY attempt_number DESC 
            LIMIT 1
        `;

        let result;
        if (existingRecord.length > 0) {
            // Update existing record or create new attempt
            const shouldCreateNewAttempt = attempt_number > existingRecord[0].attempt_number;
            
                if (shouldCreateNewAttempt) {
                // Create new attempt
                result = await sql`
                    INSERT INTO selfstudy_lesson_performance (
                        user_id, lesson_identifier, lesson_type, score, max_score, percentage,
                        time_spent_seconds, performance_data, completed_levels, is_completed,
                        attempt_number, started_at, completed_at
                    )
                    VALUES (
                        ${user_id}, ${lesson_identifier}, ${lesson_type || null}, ${score}, 
                        ${max_score}, ${calculatedPercentage}, ${time_spent_seconds},
                        ${performance_data || null}, ${completed_levels || null}, ${is_completed},
                        ${attempt_number}, NOW(), 
                        ${is_completed ? sql`NOW()` : null}
                    )
                    RETURNING performance_id, user_id, lesson_identifier, lesson_type, score, 
                             max_score, percentage, time_spent_seconds, performance_data,
                             completed_levels, is_completed, attempt_number, started_at, completed_at
                `;
            } else {
                // Update existing attempt
                result = await sql`
                    UPDATE selfstudy_lesson_performance SET
                        lesson_type = ${lesson_type || null},
                        score = ${score},
                        max_score = ${max_score},
                        percentage = ${calculatedPercentage},
                        time_spent_seconds = ${time_spent_seconds},
                        performance_data = ${performance_data || null},
                        completed_levels = ${completed_levels || null},
                        is_completed = ${is_completed},
                        completed_at = ${is_completed ? sql`NOW()` : null}
                    WHERE user_id = ${user_id} AND lesson_identifier = ${lesson_identifier} 
                          AND attempt_number = ${attempt_number}
                    RETURNING performance_id, user_id, lesson_identifier, lesson_type, score, 
                             max_score, percentage, time_spent_seconds, performance_data,
                             completed_levels, is_completed, attempt_number, started_at, completed_at
                `;
            }
        } else {
            // Create new performance record
            result = await sql`
                INSERT INTO selfstudy_lesson_performance (
                    user_id, lesson_identifier, lesson_type, score, max_score, percentage,
                    time_spent_seconds, performance_data, completed_levels, is_completed,
                    attempt_number, started_at, completed_at
                )
                VALUES (
                    ${user_id}, ${lesson_identifier}, ${lesson_type || null}, ${score}, 
                    ${max_score}, ${calculatedPercentage}, ${time_spent_seconds},
                    ${performance_data || null}, ${completed_levels || null}, ${is_completed},
                    ${attempt_number}, NOW(), 
                    ${is_completed ? sql`NOW()` : null}
                )
                RETURNING performance_id, user_id, lesson_identifier, lesson_type, score, 
                         max_score, percentage, time_spent_seconds, performance_data,
                         completed_levels, is_completed, attempt_number, started_at, completed_at
            `;
        }

        console.log('✅ Performance recorded successfully:', result[0]);
        
        res.status(201).json({
            success: true,
            message: 'Performance recorded successfully',
            performance: result[0]
        });

    } catch (error) {
        console.error('❌ Error recording performance:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            position: error.position
        });
        
        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                error: 'Invalid user_id: user does not exist'
            });
        }
        
        if (error.code === '42P01') {
            return res.status(500).json({
                success: false,
                error: 'Database table not found. Please ensure the selfstudy_lesson_performance table exists.'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get user performance data
const getUserPerformance = async (req, res) => {
    try {
        const { userId } = req.params;
        const { lesson_identifier, lesson_type, is_completed, limit = 50, offset = 0 } = req.query;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID'
            });
        }

        // Build WHERE conditions dynamically
        const conditions = [sql`user_id = ${userId}`];

        if (lesson_identifier) {
            conditions.push(sql`lesson_identifier = ${lesson_identifier}`);
        }
        if (lesson_type) {
            conditions.push(sql`lesson_type = ${lesson_type}`);
        }
        if (is_completed !== undefined) {
            conditions.push(sql`is_completed = ${is_completed === 'true'}`);
        }

        // Combine conditions with AND
        const whereClause = conditions.reduce((acc, condition, index) => {
            if (index === 0) {
                return sql`WHERE ${condition}`;
            }
            return sql`${acc} AND ${condition}`;
        }, sql``);

        const performances = await sql`
            SELECT performance_id, user_id, lesson_identifier, lesson_type, score, 
                   max_score, percentage, time_spent_seconds, performance_data,
                   completed_levels, is_completed, attempt_number, started_at, completed_at
            FROM selfstudy_lesson_performance
            ${whereClause}
            ORDER BY started_at DESC, attempt_number DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        const countResult = await sql`
            SELECT COUNT(*) as total
            FROM selfstudy_lesson_performance
            ${whereClause}
        `;
        const total = parseInt(countResult[0].total);

        res.status(200).json({
            success: true,
            message: 'User performance retrieved successfully',
            performances,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: total > parseInt(offset) + parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching user performance:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Get lesson performance statistics
const getLessonPerformanceStats = async (req, res) => {
    try {
        const { lessonId } = req.params;

        if (!lessonId) {
            return res.status(400).json({
                success: false,
                error: 'Lesson identifier is required'
            });
        }

        // Get aggregated statistics for the lesson
        const stats = await sql`
            SELECT 
                COUNT(*) as total_attempts,
                COUNT(DISTINCT user_id) as unique_users,
                AVG(score) as average_score,
                AVG(percentage) as average_percentage,
                AVG(time_spent_seconds) as average_time_spent,
                MAX(score) as highest_score,
                MIN(score) as lowest_score,
                COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_attempts,
                COUNT(CASE WHEN is_completed = false THEN 1 END) as incomplete_attempts
            FROM selfstudy_lesson_performance
            WHERE lesson_identifier = ${lessonId}
        `;

        // Get completion rate by user (best attempt per user)
        const completionStats = await sql`
            WITH best_attempts AS (
                SELECT user_id, 
                       MAX(percentage) as best_percentage,
                       MAX(CASE WHEN is_completed THEN 1 ELSE 0 END) as completed
                FROM selfstudy_lesson_performance
                WHERE lesson_identifier = ${lessonId}
                GROUP BY user_id
            )
            SELECT 
                COUNT(*) as total_unique_users,
                COUNT(CASE WHEN completed = 1 THEN 1 END) as users_completed,
                AVG(best_percentage) as average_best_percentage
            FROM best_attempts
        `;

        // Get recent attempts
        const recentAttempts = await sql`
            SELECT sp.performance_id, sp.user_id, sp.score, sp.percentage, 
                   sp.time_spent_seconds, sp.is_completed, sp.started_at, sp.completed_at,
                   u.first_name, u.last_name
            FROM selfstudy_lesson_performance sp
            LEFT JOIN useraccount u ON sp.user_id = u.user_id
            WHERE sp.lesson_identifier = ${lessonId}
            ORDER BY sp.started_at DESC
            LIMIT 10
        `;

        const result = {
            lesson_identifier: lessonId,
            overall_stats: stats[0],
            completion_stats: completionStats[0],
            recent_attempts: recentAttempts
        };

        res.status(200).json({
            success: true,
            message: 'Lesson performance statistics retrieved successfully',
            stats: result
        });

    } catch (error) {
        console.error('Error fetching lesson performance stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Delete performance record
const deletePerformance = async (req, res) => {
    try {
        const { performanceId } = req.params;

        if (!performanceId || isNaN(performanceId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid performance ID'
            });
        }

        const result = await sql`
            DELETE FROM selfstudy_lesson_performance 
            WHERE performance_id = ${performanceId}
            RETURNING performance_id
        `;

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Performance record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Performance record deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting performance:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

module.exports = {
    recordPerformance,
    getUserPerformance,
    getLessonPerformanceStats,
    deletePerformance
};
