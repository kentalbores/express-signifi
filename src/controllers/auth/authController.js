const sql = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Get JWT secret from env
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Learner login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const users = await sql`
      SELECT user_id, email, password, role, full_name, created_at
      FROM useraccount
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// Learner registration
const register = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user account
    const result = await sql`
      INSERT INTO useraccount (email, password, role, full_name)
      VALUES (${email}, ${hashedPassword}, 'learner', ${full_name || null})
      RETURNING user_id, email, role, full_name, created_at
    `;

    const user = result[0];

    // Create learner profile
    await sql`
      INSERT INTO learner (id, progress_perc, status)
      VALUES (${user.user_id}, 0, 'new')
    `;

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error during registration:', error);

    // Handle duplicate email
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

// Get current user profile
const me = async (req, res) => {
  try {
    const userId = req.user.user_id; // From auth middleware

    const users = await sql`
      SELECT user_id, email, role, full_name, created_at
      FROM useraccount
      WHERE user_id = ${userId}
    `;

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = users[0];
    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  register,
  me
};

// --- Educator Registration ---
/**
 * POST /api/auth/register-educator
 * body: { email: string, password: string, full_name?: string }
 * Creates a user with role 'educator' and returns token + user
 */
module.exports.registerEducator = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await sql`
      INSERT INTO useraccount (email, password, role, full_name)
      VALUES (${email}, ${hashedPassword}, 'educator', ${full_name || null})
      RETURNING user_id, email, role, full_name, created_at
    `;

    const user = result[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'Educator registered successfully',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error during educator registration:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
