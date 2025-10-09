const sql = require('../../config/database');

// Create a new content policy
const createContentPolicy = async (req, res) => {
    try {
        const { 
            title,
            content,
            policy_type = 'general',
            version = '1.0',
            is_active = true
        } = req.body;

        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({
                error: 'Missing required fields: title and content are required'
            });
        }

        // Validate policy_type enum
        const validPolicyTypes = ['privacy', 'terms', 'community', 'general'];
        if (!validPolicyTypes.includes(policy_type)) {
            return res.status(400).json({
                error: `Invalid policy_type. Must be one of: ${validPolicyTypes.join(', ')}`
            });
        }

        // Get the editor from the authenticated user (must be superadmin)
        const edited_by = req.user.user_id;

        const result = await sql`
            INSERT INTO content_policy (
                title, content, policy_type, version, is_active, edited_by
            )
            VALUES (
                ${title}, ${content}, ${policy_type}, ${version}, ${is_active}, ${edited_by}
            )
            RETURNING policy_id, title, content, policy_type, version, is_active, 
                     edited_by, edited_at, created_at
        `;

        res.status(201).json({
            message: 'Content policy created successfully',
            policy: result[0]
        });

    } catch (error) {
        console.error('Error creating content policy:', error);
        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Invalid edited_by: user does not exist'
            });
        }
        if (error.code === '23514') {
            return res.status(400).json({
                error: 'Invalid policy_type value'
            });
        }
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get all content policies
const getAllContentPolicies = async (req, res) => {
    try {
        const { policy_type, is_active, limit = 50, offset = 0 } = req.query;
        
        // Build WHERE conditions dynamically
        let whereClause = sql``;
        const conditions = [];
        
        if (policy_type) {
            conditions.push(sql`policy_type = ${policy_type}`);
        }
        if (is_active !== undefined) {
            conditions.push(sql`is_active = ${is_active === 'true'}`);
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
        
        const policies = await sql`
            SELECT cp.policy_id, cp.title, cp.content, cp.policy_type, cp.version, 
                   cp.is_active, cp.edited_by, cp.edited_at, cp.created_at,
                   u.first_name, u.last_name
            FROM content_policy cp
            LEFT JOIN useraccount u ON cp.edited_by = u.user_id
            ${whereClause}
            ORDER BY cp.created_at DESC 
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;
        
        const countResult = await sql`
            SELECT COUNT(*) as total
            FROM content_policy
            ${whereClause}
        `;
        
        const total = parseInt(countResult[0].total);

        res.status(200).json({
            message: 'Content policies retrieved successfully',
            policies,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: total > parseInt(offset) + parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching content policies:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get active content policies by type
const getActivePoliciesByType = async (req, res) => {
    try {
        const { type } = req.query;
        
        const validPolicyTypes = ['privacy', 'terms', 'community', 'general'];
        if (type && !validPolicyTypes.includes(type)) {
            return res.status(400).json({
                error: `Invalid policy type. Must be one of: ${validPolicyTypes.join(', ')}`
            });
        }

        let policies;
        
        if (type) {
            policies = await sql`
                SELECT cp.policy_id, cp.title, cp.content, cp.policy_type, cp.version, 
                       cp.is_active, cp.edited_by, cp.edited_at, cp.created_at,
                       u.first_name, u.last_name
                FROM content_policy cp
                LEFT JOIN useraccount u ON cp.edited_by = u.user_id
                WHERE cp.is_active = true AND cp.policy_type = ${type}
                ORDER BY cp.version DESC, cp.created_at DESC
            `;
        } else {
            policies = await sql`
                SELECT cp.policy_id, cp.title, cp.content, cp.policy_type, cp.version, 
                       cp.is_active, cp.edited_by, cp.edited_at, cp.created_at,
                       u.first_name, u.last_name
                FROM content_policy cp
                LEFT JOIN useraccount u ON cp.edited_by = u.user_id
                WHERE cp.is_active = true
                ORDER BY cp.policy_type, cp.version DESC, cp.created_at DESC
            `;
        }

        res.status(200).json({
            message: 'Active content policies retrieved successfully',
            policies
        });

    } catch (error) {
        console.error('Error fetching active content policies:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get content policy by ID
const getContentPolicyById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid policy ID'
            });
        }

        const result = await sql`
            SELECT cp.policy_id, cp.title, cp.content, cp.policy_type, cp.version, 
                   cp.is_active, cp.edited_by, cp.edited_at, cp.created_at,
                   u.first_name, u.last_name
            FROM content_policy cp
            LEFT JOIN useraccount u ON cp.edited_by = u.user_id
            WHERE cp.policy_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'Content policy not found'
            });
        }

        res.status(200).json({
            message: 'Content policy retrieved successfully',
            policy: result[0]
        });

    } catch (error) {
        console.error('Error fetching content policy:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Update content policy
const updateContentPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title,
            content,
            policy_type,
            version,
            is_active
        } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid policy ID'
            });
        }

        // Check if policy exists
        const current = await sql`
            SELECT policy_id, title, content, policy_type, version, is_active
            FROM content_policy WHERE policy_id = ${id}
        `;

        if (current.length === 0) {
            return res.status(404).json({
                error: 'Content policy not found'
            });
        }

        // Validate policy_type if provided
        if (policy_type) {
            const validPolicyTypes = ['privacy', 'terms', 'community', 'general'];
            if (!validPolicyTypes.includes(policy_type)) {
                return res.status(400).json({
                    error: `Invalid policy_type. Must be one of: ${validPolicyTypes.join(', ')}`
                });
            }
        }

        // Merge current values with updates
        const currentPolicy = current[0];
        const updatedPolicy = {
            title: title !== undefined ? title : currentPolicy.title,
            content: content !== undefined ? content : currentPolicy.content,
            policy_type: policy_type !== undefined ? policy_type : currentPolicy.policy_type,
            version: version !== undefined ? version : currentPolicy.version,
            is_active: is_active !== undefined ? is_active : currentPolicy.is_active,
            edited_by: req.user.user_id
        };

        const result = await sql`
            UPDATE content_policy SET
                title = ${updatedPolicy.title},
                content = ${updatedPolicy.content},
                policy_type = ${updatedPolicy.policy_type},
                version = ${updatedPolicy.version},
                is_active = ${updatedPolicy.is_active},
                edited_by = ${updatedPolicy.edited_by},
                edited_at = CURRENT_TIMESTAMP
            WHERE policy_id = ${id}
            RETURNING policy_id, title, content, policy_type, version, is_active, 
                     edited_by, edited_at, created_at
        `;

        res.status(200).json({
            message: 'Content policy updated successfully',
            policy: result[0]
        });

    } catch (error) {
        console.error('Error updating content policy:', error);
        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Invalid edited_by: user does not exist'
            });
        }
        if (error.code === '23514') {
            return res.status(400).json({
                error: 'Invalid policy_type value'
            });
        }
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Delete content policy
const deleteContentPolicy = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid policy ID'
            });
        }

        const result = await sql`
            DELETE FROM content_policy 
            WHERE policy_id = ${id}
            RETURNING policy_id
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'Content policy not found'
            });
        }

        res.status(200).json({
            message: 'Content policy deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting content policy:', error);
        if (error.code === '23503') {
            return res.status(400).json({
                error: 'Cannot delete policy: it is referenced by other records'
            });
        }
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

module.exports = {
    createContentPolicy,
    getAllContentPolicies,
    getActivePoliciesByType,
    getContentPolicyById,
    updateContentPolicy,
    deleteContentPolicy
};
