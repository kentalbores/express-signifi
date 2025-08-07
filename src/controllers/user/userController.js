const sql = require('../../config/database');
const bcrypt = require('bcrypt');

// Create a new user account
const createUser = async (req, res) => {
    try {
        const { email, password, role, full_name } = req.body;

        // Validate required fields
        if (!email || !password || !role) {
            return res.status(400).json({
                error: 'Missing required fields: email, password, and role are required'
            });
        }

        // Validate role
        const validRoles = ['learner', 'educator', 'admin', 'institution'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: 'Invalid role. Must be one of: learner, educator, admin, institution'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user into database
        const result = await sql`
            INSERT INTO useraccount (email, password, role, full_name)
            VALUES (${email}, ${hashedPassword}, ${role}, ${full_name})
            RETURNING user_id, email, role, full_name, created_at
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
        const users = await sql`
            SELECT user_id, email, role, full_name, created_at 
            FROM useraccount
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
            SELECT user_id, email, role, full_name, created_at 
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
        const { email, role, full_name } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid user ID'
            });
        }

        // Validate role if provided
        if (role) {
            const validRoles = ['learner', 'educator', 'admin', 'institution'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    error: 'Invalid role. Must be one of: learner, educator, admin, institution'
                });
            }
        }

        // Check if at least one field is provided
        if (email === undefined && role === undefined && full_name === undefined) {
            return res.status(400).json({
                error: 'No valid fields provided for update'
            });
        }

        // First, get current user data
        const currentUser = await sql`
            SELECT email, role, full_name FROM useraccount WHERE user_id = ${id}
        `;

        if (currentUser.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Use current values for undefined fields
        const updatedEmail = email !== undefined ? email : currentUser[0].email;
        const updatedRole = role !== undefined ? role : currentUser[0].role;
        const updatedFullName = full_name !== undefined ? full_name : currentUser[0].full_name;

        const result = await sql`
            UPDATE useraccount 
            SET email = ${updatedEmail}, role = ${updatedRole}, full_name = ${updatedFullName}
            WHERE user_id = ${id}
            RETURNING user_id, email, role, full_name, created_at
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