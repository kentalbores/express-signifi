const sql = require('../../config/database');

// Get course performance analytics
const getCourseAnalytics = async (req, res) => {
    try {
        const { courseId } = req.params;
        if (!courseId || isNaN(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID' });
        }

        // Get course basic info
        const courseInfo = await sql`
            SELECT c.course_id, c.title, c.price, c.difficulty_level, c.is_published,
                   c.enrollment_count, c.average_rating, c.total_reviews, c.created_at,
                   (u.first_name || ' ' || u.last_name) as educator_name,
                   i.name as institution_name
            FROM course c
            LEFT JOIN useraccount u ON c.educator_id = u.user_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
            WHERE c.course_id = ${courseId}
        `;

        if (courseInfo.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Get enrollment statistics
        const enrollmentStats = await sql`
            SELECT 
                COUNT(*) as total_enrollments,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_enrollments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_enrollments,
                COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_enrollments,
                AVG(EXTRACT(EPOCH FROM (completion_date - enrolled_at))/86400) as avg_completion_days
            FROM enrollment WHERE course_id = ${courseId}
        `;

        // Get lesson performance data
        const lessonPerformance = await sql`
            SELECT 
                l.lesson_id, l.title, l.material_type,
                COUNT(slp.performance_id) as total_attempts,
                COUNT(CASE WHEN slp.is_completed = true THEN 1 END) as completions,
                AVG(slp.percentage) as average_score,
                AVG(slp.time_spent_seconds) as avg_time_spent_seconds
            FROM lesson l
            INNER JOIN course_module cm ON l.module_id = cm.module_id
            LEFT JOIN selfstudy_lesson_performance slp ON l.lesson_id = slp.lesson_id
            WHERE cm.course_id = ${courseId} AND l.is_active = true
            GROUP BY l.lesson_id, l.title, l.material_type
            ORDER BY cm.order_index, l.order_index
        `;

        // Get recent activity trends (last 30 days)
        const activityTrends = await sql`
            SELECT 
                DATE(la.last_accessed) as activity_date,
                COUNT(*) as daily_activities,
                COUNT(DISTINCT la.user_id) as unique_learners,
                AVG(la.progress_percentage) as avg_progress
            FROM learning_activity la
            INNER JOIN lesson l ON la.lesson_id = l.lesson_id
            INNER JOIN course_module cm ON l.module_id = cm.module_id
            WHERE cm.course_id = ${courseId} 
            AND la.last_accessed >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(la.last_accessed)
            ORDER BY activity_date DESC
        `;

        // Get revenue analytics if course has a price
        let revenueData = null;
        if (courseInfo[0].price > 0) {
            const revenue = await sql`
                SELECT 
                    SUM(amount) as total_revenue,
                    COUNT(*) as total_purchases,
                    AVG(amount) as average_order_value
                FROM payment_transaction pt
                INNER JOIN enrollment e ON pt.enrollment_id = e.enrollment_id
                WHERE e.course_id = ${courseId} AND pt.status = 'completed'
            `;
            revenueData = revenue[0];
        }

        res.status(200).json({
            message: 'Course analytics retrieved successfully',
            course: courseInfo[0],
            enrollment_statistics: enrollmentStats[0],
            lesson_performance: lessonPerformance,
            activity_trends: activityTrends,
            revenue_data: revenueData
        });

    } catch (error) {
        console.error('Error fetching course analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get institution analytics
const getInstitutionAnalytics = async (req, res) => {
    try {
        const { institutionId } = req.params;
        if (!institutionId || isNaN(institutionId)) {
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        // Get institution basic info
        const institutionInfo = await sql`
            SELECT institution_id, name, email, website, is_active, is_verified, created_at
            FROM institution WHERE institution_id = ${institutionId}
        `;

        if (institutionInfo.length === 0) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        // Get course statistics
        const courseStats = await sql`
            SELECT 
                COUNT(*) as total_courses,
                COUNT(CASE WHEN is_published = true THEN 1 END) as published_courses,
                COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_courses,
                AVG(enrollment_count) as avg_enrollments_per_course,
                AVG(average_rating) as avg_course_rating,
                SUM(enrollment_count) as total_enrollments
            FROM course WHERE institution_id = ${institutionId}
        `;

        // Get educator statistics
        const educatorStats = await sql`
            SELECT 
                COUNT(DISTINCT e.educator_id) as total_educators,
                COUNT(DISTINCT c.course_id) as courses_created,
                AVG(c.average_rating) as avg_educator_rating
            FROM educator e
            LEFT JOIN course c ON e.educator_id = c.educator_id
            WHERE e.institution_id = ${institutionId}
        `;

        // Get learner performance across all institution courses
        const learnerPerformance = await sql`
            SELECT 
                COUNT(DISTINCT en.learner_id) as total_learners,
                COUNT(DISTINCT CASE WHEN en.status = 'completed' THEN en.learner_id END) as learners_with_completions,
                AVG(slp.percentage) as avg_performance_score,
                SUM(slp.time_spent_seconds) as total_study_time_seconds
            FROM enrollment en
            INNER JOIN course c ON en.course_id = c.course_id
            LEFT JOIN lesson l ON l.module_id IN (
                SELECT module_id FROM course_module WHERE course_id = c.course_id
            )
            LEFT JOIN selfstudy_lesson_performance slp ON l.lesson_id = slp.lesson_id AND slp.user_id = en.learner_id
            WHERE c.institution_id = ${institutionId}
        `;

        // Get revenue analytics
        const revenueAnalytics = await sql`
            SELECT 
                SUM(pt.amount) as total_revenue,
                COUNT(pt.transaction_id) as total_transactions,
                AVG(pt.amount) as average_transaction_value,
                COUNT(DISTINCT en.learner_id) as paying_learners
            FROM payment_transaction pt
            INNER JOIN enrollment en ON pt.enrollment_id = en.enrollment_id
            INNER JOIN course c ON en.course_id = c.course_id
            WHERE c.institution_id = ${institutionId} AND pt.status = 'completed'
        `;

        // Get monthly growth trends (last 12 months)
        const growthTrends = await sql`
            SELECT 
                TO_CHAR(en.enrolled_at, 'YYYY-MM') as month,
                COUNT(*) as new_enrollments,
                COUNT(DISTINCT en.learner_id) as new_learners,
                SUM(c.price) as monthly_revenue
            FROM enrollment en
            INNER JOIN course c ON en.course_id = c.course_id
            WHERE c.institution_id = ${institutionId}
            AND en.enrolled_at >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(en.enrolled_at, 'YYYY-MM')
            ORDER BY month DESC
        `;

        res.status(200).json({
            message: 'Institution analytics retrieved successfully',
            institution: institutionInfo[0],
            course_statistics: courseStats[0],
            educator_statistics: educatorStats[0],
            learner_performance: learnerPerformance[0],
            revenue_analytics: revenueAnalytics[0],
            growth_trends: growthTrends
        });

    } catch (error) {
        console.error('Error fetching institution analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get platform revenue analytics (superadmin only)
const getRevenueAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query; // Default to last 30 days
        
        if (!['7', '30', '90', '365'].includes(period)) {
            return res.status(400).json({ error: 'Invalid period. Must be 7, 30, 90, or 365 days' });
        }

        // Get overall revenue statistics
        const overallRevenue = await sql`
            SELECT 
                SUM(amount) as total_revenue,
                COUNT(*) as total_transactions,
                AVG(amount) as average_transaction_value,
                COUNT(DISTINCT enrollment_id) as unique_enrollments
            FROM payment_transaction 
            WHERE status = 'completed' 
            AND created_at >= NOW() - INTERVAL '${period} days'
        `;

        // Get revenue by course difficulty
        const revenueByDifficulty = await sql`
            SELECT 
                c.difficulty_level,
                SUM(pt.amount) as revenue,
                COUNT(pt.transaction_id) as transactions,
                AVG(pt.amount) as avg_price
            FROM payment_transaction pt
            INNER JOIN enrollment en ON pt.enrollment_id = en.enrollment_id
            INNER JOIN course c ON en.course_id = c.course_id
            WHERE pt.status = 'completed' 
            AND pt.created_at >= NOW() - INTERVAL '${period} days'
            AND c.difficulty_level IS NOT NULL
            GROUP BY c.difficulty_level
        `;

        // Get revenue by institution
        const revenueByInstitution = await sql`
            SELECT 
                i.name as institution_name,
                i.institution_id,
                SUM(pt.amount) as revenue,
                COUNT(pt.transaction_id) as transactions,
                COUNT(DISTINCT en.learner_id) as unique_learners
            FROM payment_transaction pt
            INNER JOIN enrollment en ON pt.enrollment_id = en.enrollment_id
            INNER JOIN course c ON en.course_id = c.course_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
            WHERE pt.status = 'completed' 
            AND pt.created_at >= NOW() - INTERVAL '${period} days'
            GROUP BY i.institution_id, i.name
            ORDER BY revenue DESC
        `;

        // Get daily revenue trends
        const dailyRevenue = await sql`
            SELECT 
                DATE(created_at) as date,
                SUM(amount) as daily_revenue,
                COUNT(*) as daily_transactions,
                COUNT(DISTINCT enrollment_id) as daily_enrollments
            FROM payment_transaction 
            WHERE status = 'completed' 
            AND created_at >= NOW() - INTERVAL '${period} days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

        // Get top performing courses by revenue
        const topCourses = await sql`
            SELECT 
                c.course_id, c.title, c.price,
                SUM(pt.amount) as total_revenue,
                COUNT(pt.transaction_id) as total_sales,
                c.enrollment_count, c.average_rating
            FROM payment_transaction pt
            INNER JOIN enrollment en ON pt.enrollment_id = en.enrollment_id
            INNER JOIN course c ON en.course_id = c.course_id
            WHERE pt.status = 'completed' 
            AND pt.created_at >= NOW() - INTERVAL '${period} days'
            GROUP BY c.course_id, c.title, c.price, c.enrollment_count, c.average_rating
            ORDER BY total_revenue DESC
            LIMIT 10
        `;

        res.status(200).json({
            message: 'Revenue analytics retrieved successfully',
            period_days: parseInt(period),
            overall_revenue: overallRevenue[0],
            revenue_by_difficulty: revenueByDifficulty,
            revenue_by_institution: revenueByInstitution,
            daily_revenue_trends: dailyRevenue,
            top_performing_courses: topCourses
        });

    } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get platform-wide statistics (superadmin only)
const getPlatformAnalytics = async (req, res) => {
    try {
        // Get overall platform statistics
        const platformStats = await sql`
            SELECT 
                (SELECT COUNT(*) FROM useraccount WHERE is_active = true) as total_users,
                (SELECT COUNT(*) FROM learner) as total_learners,
                (SELECT COUNT(*) FROM educator) as total_educators,
                (SELECT COUNT(*) FROM institution WHERE is_active = true) as total_institutions,
                (SELECT COUNT(*) FROM course WHERE is_published = true) as published_courses,
                (SELECT COUNT(*) FROM enrollment) as total_enrollments,
                (SELECT COUNT(*) FROM enrollment WHERE status = 'completed') as completed_enrollments,
                (SELECT SUM(time_spent_seconds) FROM selfstudy_lesson_performance) as total_study_time_seconds
        `;

        // Get growth metrics (comparing to previous period)
        const growthMetrics = await sql`
            SELECT 
                COUNT(CASE WHEN ua.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
                COUNT(CASE WHEN ua.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7d,
                COUNT(CASE WHEN e.enrolled_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_enrollments_30d,
                COUNT(CASE WHEN e.enrolled_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_enrollments_7d
            FROM useraccount ua
            FULL OUTER JOIN enrollment e ON true
        `;

        // Get content statistics
        const contentStats = await sql`
            SELECT 
                COUNT(CASE WHEN l.material_type = 'video' THEN 1 END) as video_lessons,
                COUNT(CASE WHEN l.material_type = 'document' THEN 1 END) as document_lessons,
                COUNT(CASE WHEN l.material_type = 'interactive' THEN 1 END) as interactive_lessons,
                AVG(l.estimated_duration_minutes) as avg_lesson_duration,
                COUNT(DISTINCT cm.course_id) as courses_with_content
            FROM lesson l
            INNER JOIN course_module cm ON l.module_id = cm.module_id
            WHERE l.is_active = true
        `;

        // Get engagement metrics
        const engagementMetrics = await sql`
            SELECT 
                COUNT(DISTINCT la.user_id) as active_learners_30d,
                AVG(la.progress_percentage) as avg_progress,
                AVG(slp.percentage) as avg_performance_score,
                COUNT(DISTINCT CASE WHEN la.last_accessed >= NOW() - INTERVAL '7 days' THEN la.user_id END) as active_learners_7d
            FROM learning_activity la
            LEFT JOIN selfstudy_lesson_performance slp ON la.lesson_id = slp.lesson_id AND la.user_id = slp.user_id
            WHERE la.last_accessed >= NOW() - INTERVAL '30 days'
        `;

        res.status(200).json({
            message: 'Platform analytics retrieved successfully',
            platform_statistics: platformStats[0],
            growth_metrics: growthMetrics[0],
            content_statistics: contentStats[0],
            engagement_metrics: engagementMetrics[0]
        });

    } catch (error) {
        console.error('Error fetching platform analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getCourseAnalytics,
    getInstitutionAnalytics,
    getRevenueAnalytics,
    getPlatformAnalytics
};
