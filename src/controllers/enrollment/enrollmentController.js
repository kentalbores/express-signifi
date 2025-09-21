const sql = require('../../config/database');

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
        let query = `
            SELECT e.enrollment_id as enroll_id, e.learner_id, e.course_id, e.status, e.enrolled_at,
                   (u.first_name || ' ' || u.last_name) AS learner_name, c.title AS course_title
            FROM enrollment e
            LEFT JOIN useraccount u ON e.learner_id = u.user_id
            LEFT JOIN course c ON e.course_id = c.course_id`;
        const conditions = [];
        const values = [];
        if (learner_id) { conditions.push('e.learner_id = $' + (values.length + 1)); values.push(learner_id); }
        if (course_id) { conditions.push('e.course_id = $' + (values.length + 1)); values.push(course_id); }
        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY e.enrolled_at DESC';
        const enrollments = await sql.unsafe(query, values);
        res.status(200).json({ message: 'Enrollments retrieved successfully', enrollments });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get enrollment by ID
const getEnrollmentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid enrollment ID' });
        const result = await sql`
            SELECT enrollment_id as enroll_id, learner_id, course_id, status, enrolled_at FROM enrollment WHERE enrollment_id = ${id}
        `;
        if (result.length === 0) return res.status(404).json({ error: 'Enrollment not found' });
        res.status(200).json({ message: 'Enrollment retrieved successfully', enrollment: result[0] });
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

module.exports = {
    createEnrollment,
    getAllEnrollments,
    getEnrollmentById,
    updateEnrollment,
    deleteEnrollment
};


