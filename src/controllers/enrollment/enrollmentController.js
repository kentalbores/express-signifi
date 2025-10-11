const sql = require('../../config/database');

// Helper function to calculate enrollment progress using self-study performance
const calculateEnrollmentProgress = async (enrollmentId, learnerId, courseId) => {
    try {
        // Get total lessons in the course
        const totalLessons = await sql`
            SELECT COUNT(*) as total
            FROM lesson l
            INNER JOIN course_module cm ON l.module_id = cm.module_id
            WHERE cm.course_id = ${courseId} AND l.is_active = true
        `;

        // Get completed lessons from self-study performance
        const completedLessons = await sql`
            SELECT COUNT(DISTINCT l.lesson_id) as completed
            FROM lesson l
            INNER JOIN course_module cm ON l.module_id = cm.module_id
            INNER JOIN selfstudy_lesson_performance slp ON l.lesson_id = slp.lesson_id
            WHERE cm.course_id = ${courseId} 
            AND slp.user_id = ${learnerId}
            AND slp.is_completed = true
            AND l.is_active = true
        `;

        // Get average performance metrics
        const performanceMetrics = await sql`
            SELECT 
                AVG(slp.percentage) as avg_score,
                SUM(slp.time_spent_seconds) as total_time_spent,
                COUNT(*) as lessons_attempted
            FROM lesson l
            INNER JOIN course_module cm ON l.module_id = cm.module_id
            INNER JOIN selfstudy_lesson_performance slp ON l.lesson_id = slp.lesson_id
            WHERE cm.course_id = ${courseId} 
            AND slp.user_id = ${learnerId}
            AND l.is_active = true
        `;

        const total = parseInt(totalLessons[0]?.total || 0);
        const completed = parseInt(completedLessons[0]?.completed || 0);
        const metrics = performanceMetrics[0] || {};

        return {
            total_lessons: total,
            completed_lessons: completed,
            progress_percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            is_completed: completed >= total && total > 0,
            average_score: Math.round(parseFloat(metrics.avg_score || 0)),
            total_time_spent_seconds: parseInt(metrics.total_time_spent || 0),
            lessons_attempted: parseInt(metrics.lessons_attempted || 0)
        };
    } catch (error) {
        console.error('Error calculating enrollment progress:', error);
        return {
            total_lessons: 0,
            completed_lessons: 0,
            progress_percentage: 0,
            is_completed: false,
            average_score: 0,
            total_time_spent_seconds: 0,
            lessons_attempted: 0
        };
    }
};

// Helper function to generate certificate for completed enrollment
const generateCertificate = async (enrollmentId, learnerId, courseId) => {
    try {
        // Check if certificate already exists
        const existingCert = await sql`
            SELECT certificate_id FROM enrollment_certificate 
            WHERE enrollment_id = ${enrollmentId}
        `;

        if (existingCert.length > 0) {
            return { exists: true, certificate_id: existingCert[0].certificate_id };
        }

        // Get course and learner information
        const courseInfo = await sql`
            SELECT c.title, c.estimated_duration_hours, 
                   (u.first_name || ' ' || u.last_name) as educator_name,
                   i.name as institution_name
            FROM course c
            LEFT JOIN useraccount u ON c.educator_id = u.user_id
            LEFT JOIN institution i ON c.institution_id = i.institution_id
            WHERE c.course_id = ${courseId}
        `;

        const learnerInfo = await sql`
            SELECT first_name, last_name, email
            FROM useraccount WHERE user_id = ${learnerId}
        `;

        if (courseInfo.length === 0 || learnerInfo.length === 0) {
            return { success: false, error: 'Course or learner not found' };
        }

        // Calculate final metrics
        const progress = await calculateEnrollmentProgress(enrollmentId, learnerId, courseId);

        // Generate certificate
        const certificate = await sql`
            INSERT INTO enrollment_certificate (
                enrollment_id, learner_id, course_id, certificate_code,
                completion_date, final_score, total_hours_studied, 
                course_title, learner_name, educator_name, institution_name
            )
            VALUES (
                ${enrollmentId}, ${learnerId}, ${courseId},
                'CERT-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 10)),
                NOW(), ${progress.average_score}, 
                ${Math.round(progress.total_time_spent_seconds / 3600)},
                ${courseInfo[0].title},
                ${learnerInfo[0].first_name + ' ' + learnerInfo[0].last_name},
                ${courseInfo[0].educator_name || 'Unknown'},
                ${courseInfo[0].institution_name || 'Independent'}
            )
            RETURNING *
        `;

        return { success: true, certificate: certificate[0] };
    } catch (error) {
        console.error('Error generating certificate:', error);
        return { success: false, error: 'Failed to generate certificate' };
    }
};

// Enroll a learner in a course
const createEnrollment = async (req, res) => {
    try {
        const { learner_id, course_id, status } = req.body;
        if (!learner_id || isNaN(learner_id) || !course_id || isNaN(course_id)) {
            return res.status(400).json({ error: 'Missing required fields: learner_id and course_id must be numbers' });
        }

        const normalizedStatus = status || 'active';
        const result = await sql`
            INSERT INTO enrollment (learner_id, course_id, status)
            VALUES (${learner_id}, ${course_id}, ${normalizedStatus})
            RETURNING enrollment_id as enroll_id, learner_id, course_id, status, enrolled_at
        `;
        res.status(201).json({ message: 'Enrollment created successfully', enrollment: result[0] });
    } catch (error) {
        console.error('Error creating enrollment:', error);
        if (error.code === '23503') {
            if (error.detail && error.detail.includes('learner_id')) return res.status(400).json({ error: 'Invalid learner_id: user does not exist' });
            if (error.detail && error.detail.includes('course_id')) return res.status(400).json({ error: 'Invalid course_id: course does not exist' });
            return res.status(400).json({ error: 'Foreign key constraint violation' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all enrollments (optionally by learner_id or course_id)
const getAllEnrollments = async (req, res) => {
    try {
        const { learner_id, course_id } = req.query;
        
        // Build WHERE conditions dynamically
        let whereClause = sql``;
        const conditions = [];
        
        if (learner_id) {
            conditions.push(sql`e.learner_id = ${learner_id}`);
        }
        if (course_id) {
            conditions.push(sql`e.course_id = ${course_id}`);
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
        
        const enrollments = await sql`
            SELECT e.enrollment_id as enroll_id, e.learner_id, e.course_id, e.status, e.enrolled_at,
                   (u.first_name || ' ' || u.last_name) AS learner_name, c.title AS course_title
            FROM enrollment e
            LEFT JOIN useraccount u ON e.learner_id = u.user_id
            LEFT JOIN course c ON e.course_id = c.course_id
            ${whereClause}
            ORDER BY e.enrolled_at DESC
        `;
        
        res.status(200).json({ message: 'Enrollments retrieved successfully', enrollments });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get enrollment by ID with progress tracking
const getEnrollmentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid enrollment ID' });
        
        const result = await sql`
            SELECT e.enrollment_id as enroll_id, e.learner_id, e.course_id, e.status, e.enrolled_at,
                   c.title as course_title, c.difficulty_level, c.estimated_duration_hours,
                   (u.first_name || ' ' || u.last_name) as learner_name
            FROM enrollment e
            LEFT JOIN course c ON e.course_id = c.course_id
            LEFT JOIN useraccount u ON e.learner_id = u.user_id
            WHERE e.enrollment_id = ${id}
        `;
        
        if (result.length === 0) return res.status(404).json({ error: 'Enrollment not found' });
        
        const enrollment = result[0];
        
        // Add progress tracking
        const progress = await calculateEnrollmentProgress(
            enrollment.enroll_id, 
            enrollment.learner_id, 
            enrollment.course_id
        );
        
        res.status(200).json({ 
            message: 'Enrollment retrieved successfully', 
            enrollment: {
                ...enrollment,
                progress: progress
            }
        });
    } catch (error) {
        console.error('Error fetching enrollment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update enrollment
const updateEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const { learner_id, course_id, status } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid enrollment ID' });

        const current = await sql`SELECT learner_id, course_id, status FROM enrollment WHERE enrollment_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Enrollment not found' });

        const updatedLearnerId = learner_id !== undefined ? learner_id : current[0].learner_id;
        const updatedCourseId = course_id !== undefined ? course_id : current[0].course_id;
        const updatedStatus = status !== undefined ? status : current[0].status;

        const result = await sql`
            UPDATE enrollment SET learner_id = ${updatedLearnerId}, course_id = ${updatedCourseId}, status = ${updatedStatus}
            WHERE enrollment_id = ${id}
            RETURNING enrollment_id as enroll_id, learner_id, course_id, status, enrolled_at
        `;
        res.status(200).json({ message: 'Enrollment updated successfully', enrollment: result[0] });
    } catch (error) {
        console.error('Error updating enrollment:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: learner_id or course_id does not exist' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete enrollment
const deleteEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid enrollment ID' });
        const result = await sql`DELETE FROM enrollment WHERE enrollment_id = ${id} RETURNING enrollment_id as enroll_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Enrollment not found' });
        res.status(200).json({ message: 'Enrollment deleted successfully' });
    } catch (error) {
        console.error('Error deleting enrollment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get enrollment progress with detailed analytics
const getEnrollmentProgress = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid enrollment ID' });
        
        const enrollment = await sql`
            SELECT enrollment_id, learner_id, course_id, status 
            FROM enrollment WHERE enrollment_id = ${id}
        `;
        
        if (enrollment.length === 0) return res.status(404).json({ error: 'Enrollment not found' });
        
        const progress = await calculateEnrollmentProgress(
            enrollment[0].enrollment_id,
            enrollment[0].learner_id,
            enrollment[0].course_id
        );
        
        // Get lesson-by-lesson breakdown
        const lessonProgress = await sql`
            SELECT l.lesson_id, l.title, l.material_type, l.estimated_duration_minutes,
                   slp.percentage, slp.is_completed, slp.time_spent_seconds, slp.attempt_number,
                   slp.performance_date as last_accessed
            FROM lesson l
            INNER JOIN course_module cm ON l.module_id = cm.module_id
            LEFT JOIN selfstudy_lesson_performance slp ON l.lesson_id = slp.lesson_id 
                AND slp.user_id = ${enrollment[0].learner_id}
            WHERE cm.course_id = ${enrollment[0].course_id} AND l.is_active = true
            ORDER BY cm.order_index, l.order_index
        `;
        
        res.status(200).json({
            message: 'Enrollment progress retrieved successfully',
            enrollment_id: id,
            overall_progress: progress,
            lesson_progress: lessonProgress
        });
    } catch (error) {
        console.error('Error fetching enrollment progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Generate certificate for completed enrollment
const generateEnrollmentCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid enrollment ID' });
        
        const enrollment = await sql`
            SELECT enrollment_id, learner_id, course_id, status 
            FROM enrollment WHERE enrollment_id = ${id}
        `;
        
        if (enrollment.length === 0) return res.status(404).json({ error: 'Enrollment not found' });
        
        // Check if enrollment is completed
        const progress = await calculateEnrollmentProgress(
            enrollment[0].enrollment_id,
            enrollment[0].learner_id,
            enrollment[0].course_id
        );
        
        if (!progress.is_completed) {
            return res.status(400).json({ 
                error: 'Cannot generate certificate: course not completed',
                progress: progress.progress_percentage
            });
        }
        
        const certificateResult = await generateCertificate(
            enrollment[0].enrollment_id,
            enrollment[0].learner_id,
            enrollment[0].course_id
        );
        
        if (!certificateResult.success && !certificateResult.exists) {
            return res.status(500).json({ error: certificateResult.error });
        }
        
        // Update enrollment status to completed if certificate generated
        if (certificateResult.success) {
            await sql`
                UPDATE enrollment SET status = 'completed', completion_date = NOW()
                WHERE enrollment_id = ${id}
            `;
        }
        
        res.status(200).json({
            message: certificateResult.exists ? 'Certificate already exists' : 'Certificate generated successfully',
            certificate: certificateResult.certificate || { certificate_id: certificateResult.certificate_id }
        });
    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get learner's enrollment analytics
const getEnrollmentAnalytics = async (req, res) => {
    try {
        const { learner_id } = req.params;
        if (!learner_id || isNaN(learner_id)) return res.status(400).json({ error: 'Invalid learner ID' });
        
        // Get enrollment summary
        const summary = await sql`
            SELECT 
                COUNT(*) as total_enrollments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_courses,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_courses,
                COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_courses
            FROM enrollment WHERE learner_id = ${learner_id}
        `;
        
        // Get detailed enrollments with progress
        const enrollments = await sql`
            SELECT e.enrollment_id, e.course_id, e.status, e.enrolled_at,
                   c.title, c.difficulty_level, c.estimated_duration_hours
            FROM enrollment e
            LEFT JOIN course c ON e.course_id = c.course_id
            WHERE e.learner_id = ${learner_id}
            ORDER BY e.enrolled_at DESC
        `;
        
        // Calculate progress for each enrollment
        const enrollmentsWithProgress = await Promise.all(
            enrollments.map(async (enrollment) => {
                const progress = await calculateEnrollmentProgress(
                    enrollment.enrollment_id,
                    learner_id,
                    enrollment.course_id
                );
                return { ...enrollment, progress };
            })
        );
        
        // Calculate learning statistics
        const totalTimeSpent = enrollmentsWithProgress.reduce((sum, e) => 
            sum + (e.progress.total_time_spent_seconds || 0), 0);
        const averageScore = enrollmentsWithProgress.length > 0 
            ? Math.round(enrollmentsWithProgress.reduce((sum, e) => 
                sum + (e.progress.average_score || 0), 0) / enrollmentsWithProgress.length)
            : 0;
        
        res.status(200).json({
            message: 'Enrollment analytics retrieved successfully',
            learner_id: learner_id,
            summary: summary[0],
            statistics: {
                total_time_spent_hours: Math.round(totalTimeSpent / 3600),
                average_score: averageScore,
                completion_rate: summary[0].total_enrollments > 0 
                    ? Math.round((summary[0].completed_courses / summary[0].total_enrollments) * 100) 
                    : 0
            },
            enrollments: enrollmentsWithProgress
        });
    } catch (error) {
        console.error('Error fetching enrollment analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createEnrollment,
    getAllEnrollments,
    getEnrollmentById,
    updateEnrollment,
    deleteEnrollment,
    getEnrollmentProgress,
    generateEnrollmentCertificate,
    getEnrollmentAnalytics
};


