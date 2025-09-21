const sql = require('../../config/database');
const bcrypt = require('bcrypt');

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
        
        let query = sql`
            SELECT user_id, email, first_name, last_name, phone, date_of_birth,
                   gender, profile_picture_url, bio, location, timezone, 
                   language_preference, is_active, is_verified, email_verified,
                   phone_verified, last_login, created_at, updated_at
            FROM useraccount
        `;
        
        if (is_active !== undefined || is_verified !== undefined) {
            const conditions = [];
            if (is_active !== undefined) {
                conditions.push(sql`is_active = ${is_active === 'true'}`);
            }
            if (is_verified !== undefined) {
                conditions.push(sql`is_verified = ${is_verified === 'true'}`);
            }
            query = sql`
                SELECT user_id, email, first_name, last_name, phone, date_of_birth,
                       gender, profile_picture_url, bio, location, timezone, 
                       language_preference, is_active, is_verified, email_verified,
                       phone_verified, last_login, created_at, updated_at
                FROM useraccount
                WHERE ${sql.join(conditions, sql` AND `)}
                ORDER BY created_at DESC
            `;
        } else {
            query = sql`
                SELECT user_id, email, first_name, last_name, phone, date_of_birth,
                       gender, profile_picture_url, bio, location, timezone, 
                       language_preference, is_active, is_verified, email_verified,
                       phone_verified, last_login, created_at, updated_at
                FROM useraccount
                ORDER BY created_at DESC
            `;
        }

        const users = await query;

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
        const values = [id];
        let paramIndex = 2;

        if (email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            values.push(email);
        }
        if (first_name !== undefined) {
            updates.push(`first_name = $${paramIndex++}`);
            values.push(first_name);
        }
        if (last_name !== undefined) {
            updates.push(`last_name = $${paramIndex++}`);
            values.push(last_name);
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            values.push(phone);
        }
        if (date_of_birth !== undefined) {
            updates.push(`date_of_birth = $${paramIndex++}`);
            values.push(date_of_birth);
        }
        if (gender !== undefined) {
            updates.push(`gender = $${paramIndex++}`);
            values.push(gender);
        }
        if (profile_picture_url !== undefined) {
            updates.push(`profile_picture_url = $${paramIndex++}`);
            values.push(profile_picture_url);
        }
        if (cover_photo_url !== undefined) {
            updates.push(`cover_photo_url = $${paramIndex++}`);
            values.push(cover_photo_url);
        }
        if (bio !== undefined) {
            updates.push(`bio = $${paramIndex++}`);
            values.push(bio);
        }
        if (location !== undefined) {
            updates.push(`location = $${paramIndex++}`);
            values.push(location);
        }
        if (timezone !== undefined) {
            updates.push(`timezone = $${paramIndex++}`);
            values.push(timezone);
        }
        if (language_preference !== undefined) {
            updates.push(`language_preference = $${paramIndex++}`);
            values.push(language_preference);
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(is_active);
        }
        if (is_verified !== undefined) {
            updates.push(`is_verified = $${paramIndex++}`);
            values.push(is_verified);
        }
        if (email_verified !== undefined) {
            updates.push(`email_verified = $${paramIndex++}`);
            values.push(email_verified);
        }
        if (phone_verified !== undefined) {
            updates.push(`phone_verified = $${paramIndex++}`);
            values.push(phone_verified);
        }

        // Always update the updated_at timestamp
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updates.length === 1) { // Only the updated_at was added
            return res.status(400).json({
                error: 'No valid fields provided for update'
            });
        }

        const result = await sql`
            UPDATE useraccount 
            SET ${sql.unsafe(updates.join(', '))}
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

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
};