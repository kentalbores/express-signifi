const sql = require('../../config/database');
const bcrypt = require('bcrypt');
const { getUserRoles, clearUserRoleCache } = require('../../middleware/auth');

// Create a new user account
const createUser = async (req, res) => {
    try {
        const { 
            email, 
            password, 
            first_name, 
            last_name, 
            phone,
            date_of_birth,
            gender,
            profile_picture_url,
            bio,
            location,
            timezone = 'UTC',
            language_preference = 'en'
        } = req.body;

        // Validate required fields
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                error: 'Missing required fields: email, password, first_name, and last_name are required'
            });
        }

        // Validate gender if provided
        if (gender) {
            const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
            if (!validGenders.includes(gender)) {
                return res.status(400).json({
                    error: 'Invalid gender. Must be one of: male, female, other, prefer_not_to_say'
                });
            }
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user into database
        const result = await sql`
            INSERT INTO useraccount (
                email, password, first_name, last_name, phone, date_of_birth,
                gender, profile_picture_url, bio, location, timezone, language_preference
            )
            VALUES (
                ${email}, ${hashedPassword}, ${first_name}, ${last_name}, ${phone || null},
                ${date_of_birth || null}, ${gender || null}, ${profile_picture_url || null}, ${bio || null}, 
                ${location || null}, ${timezone || 'UTC'}, ${language_preference || 'en'}
            )
            RETURNING user_id, email, first_name, last_name, phone, date_of_birth,
                     gender, profile_picture_url, bio, location, timezone, 
                     language_preference, is_active, is_verified, created_at
        `;

        const user = result[0];

        res.status(201).json({
            message: 'User created successfully',
            user: user
        });

    } catch (error) {
        console.error('Error creating user:', error);
        
        // Handle unique constraint violation (duplicate email)
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'User with this email already exists'
            });
        }
        
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const { is_active, is_verified } = req.query;
        
        // Build WHERE conditions dynamically
        let whereClause = sql``;
        const conditions = [];
        
        if (is_active !== undefined) {
            conditions.push(sql`is_active = ${is_active === 'true'}`);
        }
        if (is_verified !== undefined) {
            conditions.push(sql`is_verified = ${is_verified === 'true'}`);
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
        
        const users = await sql`
            SELECT user_id, email, first_name, last_name, phone, date_of_birth,
                   gender, profile_picture_url, bio, location, timezone, 
                   language_preference, is_active, is_verified, email_verified,
                   phone_verified, last_login, created_at, updated_at
            FROM useraccount
            ${whereClause}
            ORDER BY created_at DESC
        `;

        res.status(200).json({
            message: 'Users retrieved successfully',
            users: users
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid user ID'
            });
        }

        const result = await sql`
            SELECT user_id, email, first_name, last_name, phone, date_of_birth,
                   gender, profile_picture_url, cover_photo_url, bio, location, 
                   timezone, language_preference, is_active, is_verified, email_verified,
                   phone_verified, last_login, created_at, updated_at
            FROM useraccount 
            WHERE user_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User retrieved successfully',
            user: result[0]
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            email, 
            first_name, 
            last_name, 
            phone,
            date_of_birth,
            gender,
            profile_picture_url,
            cover_photo_url,
            bio,
            location,
            timezone,
            language_preference,
            is_active,
            is_verified,
            email_verified,
            phone_verified
        } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid user ID'
            });
        }

        // Validate gender if provided
        if (gender) {
            const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
            if (!validGenders.includes(gender)) {
                return res.status(400).json({
                    error: 'Invalid gender. Must be one of: male, female, other, prefer_not_to_say'
                });
            }
        }

        const updates = [];

        if (email !== undefined) {
            updates.push(sql`email = ${email}`);
        }
        if (first_name !== undefined) {
            updates.push(sql`first_name = ${first_name}`);
        }
        if (last_name !== undefined) {
            updates.push(sql`last_name = ${last_name}`);
        }
        if (phone !== undefined) {
            updates.push(sql`phone = ${phone}`);
        }
        if (date_of_birth !== undefined) {
            updates.push(sql`date_of_birth = ${date_of_birth}`);
        }
        if (gender !== undefined) {
            updates.push(sql`gender = ${gender}`);
        }
        // NOTE: For file uploads (profile_picture_url, cover_photo_url), 
        // use the dedicated file upload endpoints:
        // POST /api/files/upload/profile-photo
        // POST /api/files/upload/cover-photo
        // These fields can still be updated directly with URLs if needed
        if (profile_picture_url !== undefined) {
            updates.push(sql`profile_picture_url = ${profile_picture_url}`);
        }
        if (cover_photo_url !== undefined) {
            updates.push(sql`cover_photo_url = ${cover_photo_url}`);
        }
        if (bio !== undefined) {
            updates.push(sql`bio = ${bio}`);
        }
        if (location !== undefined) {
            updates.push(sql`location = ${location}`);
        }
        if (timezone !== undefined) {
            updates.push(sql`timezone = ${timezone}`);
        }
        if (language_preference !== undefined) {
            updates.push(sql`language_preference = ${language_preference}`);
        }
        if (is_active !== undefined) {
            updates.push(sql`is_active = ${is_active}`);
        }
        if (is_verified !== undefined) {
            updates.push(sql`is_verified = ${is_verified}`);
        }
        if (email_verified !== undefined) {
            updates.push(sql`email_verified = ${email_verified}`);
        }
        if (phone_verified !== undefined) {
            updates.push(sql`phone_verified = ${phone_verified}`);
        }

        // Always update the updated_at timestamp
        updates.push(sql`updated_at = CURRENT_TIMESTAMP`);

        if (updates.length === 1) { // Only the updated_at was added
            return res.status(400).json({
                error: 'No valid fields provided for update'
            });
        }

        const result = await sql`
            UPDATE useraccount 
            SET ${sql(updates, ', ')}
            WHERE user_id = ${id}
            RETURNING user_id, email, first_name, last_name, phone, date_of_birth,
                     gender, profile_picture_url, cover_photo_url, bio, location, 
                     timezone, language_preference, is_active, is_verified, email_verified,
                     phone_verified, created_at, updated_at
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user: result[0]
        });

    } catch (error) {
        console.error('Error updating user:', error);
        
        // Handle unique constraint violation (duplicate email)
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'User with this email already exists'
            });
        }
        
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid user ID'
            });
        }

        const result = await sql`
            DELETE FROM useraccount 
            WHERE user_id = ${id}
            RETURNING user_id
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get user roles
const getUserRolesById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return res.status(400).json({
                error: 'Invalid user ID'
            });
        }

        // Check if user exists
        const users = await sql`
            SELECT user_id, email, first_name, last_name 
            FROM useraccount 
            WHERE user_id = ${userId}
        `;

        if (users.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const roles = await getUserRoles(userId);

        res.status(200).json({
            user_id: userId,
            roles
        });

    } catch (error) {
        console.error('Error fetching user roles:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Assign or remove user roles (superadmin only)
const manageUserRoles = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, role } = req.body; // action: 'add' or 'remove', role: 'learner', 'educator', etc.
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return res.status(400).json({
                error: 'Invalid user ID'
            });
        }

        if (!action || !role) {
            return res.status(400).json({
                error: 'Action and role are required'
            });
        }

        if (!['add', 'remove'].includes(action)) {
            return res.status(400).json({
                error: 'Action must be either "add" or "remove"'
            });
        }

        const validRoles = ['learner', 'educator', 'institutionadmin', 'superadmin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        // Check if user exists
        const users = await sql`
            SELECT user_id FROM useraccount WHERE user_id = ${userId}
        `;

        if (users.length === 0) {
            return res.status(400).json({
                error: 'User not found'
            });
        }

        // Handle role assignment/removal
        try {
            if (action === 'add') {
                // Add role by inserting into appropriate table
                switch (role) {
                    case 'learner':
                        await sql`
                            INSERT INTO learner (user_id, status, learning_streak, total_points, level)
                            VALUES (${userId}, 'active', 0, 0, 1)
                            ON CONFLICT (user_id) DO NOTHING
                        `;
                        break;
                    case 'educator':
                        await sql`
                            INSERT INTO educator (user_id, verification_status)
                            VALUES (${userId}, 'pending')
                            ON CONFLICT (user_id) DO NOTHING
                        `;
                        break;
                    case 'institutionadmin':
                        // Note: institutionadmin requires institution_id, so we'll need to handle this carefully
                        return res.status(400).json({
                            error: 'Institution admin role requires additional setup. Use specific institution admin endpoints.'
                        });
                    case 'superadmin':
                        await sql`
                            INSERT INTO superadmin (user_id, access_level)
                            VALUES (${userId}, 'full')
                            ON CONFLICT (user_id) DO NOTHING
                        `;
                        break;
                }
            } else if (action === 'remove') {
                // Remove role by deleting from appropriate table
                switch (role) {
                    case 'learner':
                        await sql`DELETE FROM learner WHERE user_id = ${userId}`;
                        break;
                    case 'educator':
                        await sql`DELETE FROM educator WHERE user_id = ${userId}`;
                        break;
                    case 'institutionadmin':
                        await sql`DELETE FROM institutionadmin WHERE user_id = ${userId}`;
                        break;
                    case 'superadmin':
                        await sql`DELETE FROM superadmin WHERE user_id = ${userId}`;
                        break;
                }
            }

            // Clear role cache for this user
            clearUserRoleCache(userId);

            // Get updated roles
            const updatedRoles = await getUserRoles(userId);

            res.status(200).json({
                message: `Role ${action}ed successfully`,
                user_id: userId,
                action,
                role,
                current_roles: updatedRoles
            });

        } catch (dbError) {
            if (dbError.code === '23503') {
                return res.status(400).json({
                    error: 'Foreign key constraint violation. User may not exist or role assignment failed.'
                });
            }
            throw dbError;
        }

    } catch (error) {
        console.error('Error managing user roles:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserRolesById,
    manageUserRoles
};