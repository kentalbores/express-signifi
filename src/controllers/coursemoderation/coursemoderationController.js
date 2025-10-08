const sql = require('../../config/database');

// Create course moderation (superadmin only)
const createCourseModeration = async (req, res) => {
    try {
        const { 
            course_id, 
            status, 
            comments,
            changes_required
        } = req.body;

        // Use the authenticated superadmin user as admin_id
        const admin_id = req.user.user_id;

        if (!course_id || isNaN(course_id) || !status) {
            return res.status(400).json({ 
                error: 'Missing required fields: course_id and status are required' 
            });
        }

        // Validate status enum
        const validStatuses = ['approved', 'rejected', 'flagged', 'under_review', 'requires_changes'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }

        // Validate that course exists
        const courseCheck = await sql`
            SELECT course_id, title FROM course WHERE course_id = ${course_id}
        `;
        if (courseCheck.length === 0) {
            return res.status(400).json({
                error: 'Invalid course_id: course does not exist'
            });
        }

        // Validate required fields based on status
        if (status === 'requires_changes' && !changes_required) {
            return res.status(400).json({
                error: 'changes_required field is required when status is "requires_changes"'
            });
        }

        if ((status === 'rejected' || status === 'flagged') && !comments) {
            return res.status(400).json({
                error: 'comments field is required when status is "rejected" or "flagged"'
            });
        }

        const result = await sql`
            INSERT INTO coursemoderation (
                course_id, admin_id, status, comments, changes_required, reviewed_at
            )
            VALUES (
                ${course_id}, ${admin_id}, ${status}, ${comments || null}, 
                ${changes_required || null}, CURRENT_TIMESTAMP
            )
            RETURNING moderation_id, course_id, admin_id, status, comments, 
                     changes_required, reviewed_at
        `;

        // Include course and admin details in response
        const moderationWithDetails = await sql`
            SELECT 
                cm.moderation_id, cm.course_id, cm.admin_id, cm.status, 
                cm.comments, cm.changes_required, cm.reviewed_at,
                c.title as course_title,
                u.first_name, u.last_name
            FROM coursemoderation cm
            LEFT JOIN course c ON cm.course_id = c.course_id
            LEFT JOIN useraccount u ON cm.admin_id = u.user_id
            WHERE cm.moderation_id = ${result[0].moderation_id}
        `;

        res.status(201).json({ 
            message: 'Course moderation created successfully', 
            moderation: moderationWithDetails[0] 
        });

    } catch (error) {
        console.error('Error creating course moderation:', error);
        if (error.code === '23503') {
            return res.status(400).json({ 
                error: 'Invalid foreign key: course_id or admin_id does not exist' 
            });
        }
        if (error.code === '23514') {
            return res.status(400).json({ 
                error: 'Invalid enum value provided' 
            });
        }
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

// List course moderations with enhanced filtering and details
const getAllCourseModerations = async (req, res) => {
    try {
        const { course_id, admin_id, status, limit = 50, offset = 0 } = req.query;
        
        let whereConditions = [];
        let queryParams = [];
        
        if (course_id) {
            whereConditions.push(`cm.course_id = $${queryParams.length + 1}`);
            queryParams.push(course_id);
        }
        
        if (admin_id) {
            whereConditions.push(`cm.admin_id = $${queryParams.length + 1}`);
            queryParams.push(admin_id);
        }
        
        if (status) {
            whereConditions.push(`cm.status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        let query = `
            SELECT 
                cm.moderation_id, cm.course_id, cm.admin_id, cm.status, 
                cm.comments, cm.changes_required, cm.reviewed_at,
                c.title as course_title, c.is_published,
                u.first_name, u.last_name,
                e.first_name as educator_first_name, e.last_name as educator_last_name
            FROM coursemoderation cm
            LEFT JOIN course c ON cm.course_id = c.course_id
            LEFT JOIN useraccount u ON cm.admin_id = u.user_id
            LEFT JOIN useraccount e ON c.educator_id = e.user_id
        `;
        
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        query += ` ORDER BY cm.reviewed_at DESC NULLS LAST
                   LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const moderations = await sql.unsafe(query, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM coursemoderation cm
            ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
        `;
        const countResult = await sql.unsafe(countQuery, queryParams.slice(0, -2));
        const total = parseInt(countResult[0].total);

        res.status(200).json({ 
            message: 'Course moderations retrieved successfully', 
            moderations,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: total > parseInt(offset) + parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching course moderations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get course moderation by ID with detailed information
const getCourseModerationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid moderation ID' });
        }

        const result = await sql`
            SELECT 
                cm.moderation_id, cm.course_id, cm.admin_id, cm.status, 
                cm.comments, cm.changes_required, cm.reviewed_at,
                c.title as course_title, c.description as course_description,
                c.is_published, c.created_at as course_created_at,
                u.first_name, u.last_name, u.email as admin_email,
                e.first_name as educator_first_name, e.last_name as educator_last_name,
                e.email as educator_email
            FROM coursemoderation cm
            LEFT JOIN course c ON cm.course_id = c.course_id
            LEFT JOIN useraccount u ON cm.admin_id = u.user_id
            LEFT JOIN useraccount e ON c.educator_id = e.user_id
            WHERE cm.moderation_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Course moderation not found' });
        }

        res.status(200).json({ 
            message: 'Course moderation retrieved successfully', 
            moderation: result[0] 
        });

    } catch (error) {
        console.error('Error fetching course moderation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update course moderation (superadmin only)
const updateCourseModeration = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            status, 
            comments,
            changes_required
        } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid moderation ID' });
        }

        // Get current moderation record
        const current = await sql`
            SELECT moderation_id, course_id, admin_id, status, comments, changes_required, reviewed_at
            FROM coursemoderation WHERE moderation_id = ${id}
        `;

        if (current.length === 0) {
            return res.status(404).json({ error: 'Course moderation not found' });
        }

        // Merge current values with updates
        const currentModeration = current[0];
        const updatedModeration = {
            status: status !== undefined ? status : currentModeration.status,
            comments: comments !== undefined ? comments : currentModeration.comments,
            changes_required: changes_required !== undefined ? changes_required : currentModeration.changes_required,
            admin_id: req.user.user_id, // Update the reviewing admin
        };

        // Validate status
        if (updatedModeration.status) {
            const validStatuses = ['approved', 'rejected', 'flagged', 'under_review', 'requires_changes'];
            if (!validStatuses.includes(updatedModeration.status)) {
                return res.status(400).json({ 
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
                });
            }
        }

        // Validate required fields based on status
        if (updatedModeration.status === 'requires_changes' && !updatedModeration.changes_required) {
            return res.status(400).json({
                error: 'changes_required field is required when status is "requires_changes"'
            });
        }

        if ((updatedModeration.status === 'rejected' || updatedModeration.status === 'flagged') && !updatedModeration.comments) {
            return res.status(400).json({
                error: 'comments field is required when status is "rejected" or "flagged"'
            });
        }

        const result = await sql`
            UPDATE coursemoderation SET 
                status = ${updatedModeration.status},
                comments = ${updatedModeration.comments},
                changes_required = ${updatedModeration.changes_required},
                admin_id = ${updatedModeration.admin_id},
                reviewed_at = CURRENT_TIMESTAMP
            WHERE moderation_id = ${id}
            RETURNING moderation_id, course_id, admin_id, status, comments, 
                     changes_required, reviewed_at
        `;

        // Get updated record with details
        const updatedWithDetails = await sql`
            SELECT 
                cm.moderation_id, cm.course_id, cm.admin_id, cm.status, 
                cm.comments, cm.changes_required, cm.reviewed_at,
                c.title as course_title,
                u.first_name, u.last_name
            FROM coursemoderation cm
            LEFT JOIN course c ON cm.course_id = c.course_id
            LEFT JOIN useraccount u ON cm.admin_id = u.user_id
            WHERE cm.moderation_id = ${id}
        `;

        res.status(200).json({ 
            message: 'Course moderation updated successfully', 
            moderation: updatedWithDetails[0] 
        });

    } catch (error) {
        console.error('Error updating course moderation:', error);
        if (error.code === '23503') {
            return res.status(400).json({ 
                error: 'Invalid foreign key: course_id or admin_id does not exist' 
            });
        }
        if (error.code === '23514') {
            return res.status(400).json({ 
                error: 'Invalid enum value provided' 
            });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete
const deleteCourseModeration = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid moderation ID' });
        const result = await sql`DELETE FROM coursemoderation WHERE moderation_id = ${id} RETURNING moderation_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Course moderation not found' });
        res.status(200).json({ message: 'Course moderation deleted successfully' });
    } catch (error) {
        console.error('Error deleting course moderation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createCourseModeration,
    getAllCourseModerations,
    getCourseModerationById,
    updateCourseModeration,
    deleteCourseModeration
};


