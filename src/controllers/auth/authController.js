const sql = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUserRoles } = require('../../middleware/auth');
const fetch = require('node-fetch');
const crypto = require('crypto');
// Get JWT secret from env
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token with user roles
async function generateToken(user) {
  const roles = await getUserRoles(user.user_id);
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      roles
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
      SELECT user_id, email, password, first_name, last_name, created_at
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

    // Generate token with roles
    const token = await generateToken(user);
    
    // Get user roles for response
    const roles = await getUserRoles(user.user_id);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: {
        ...userWithoutPassword,
        roles
      }
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
    const { email, password, full_name, first_name, last_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Derive names
    let firstName = first_name || null;
    let lastName = last_name || null;
    if ((!firstName || !lastName) && full_name) {
      const parts = String(full_name).trim().split(/\s+/);
      firstName = firstName || parts.shift() || null;
      lastName = lastName || (parts.length ? parts.join(' ') : null);
    }

    // Create user account
    const result = await sql`
      INSERT INTO useraccount (email, password, first_name, last_name)
      VALUES (${email}, ${hashedPassword}, ${firstName}, ${lastName})
      RETURNING user_id, email, first_name, last_name, created_at
    `;

    const user = result[0];

    // Create learner profile (role is represented by presence in learner table)
    await sql`
      INSERT INTO learner (user_id, status, learning_streak, total_points, level)
      VALUES (${user.user_id}, 'active', 0, 0, 1)
    `;

    // Generate token with roles
    const token = await generateToken(user);
    
    // Get user roles for response
    const roles = await getUserRoles(user.user_id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles
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
      SELECT user_id, email, first_name, last_name, created_at
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
    
    // Include roles from auth middleware
    const roles = req.user.roles || [];

    res.json({
      ...userWithoutPassword,
      roles
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// --- Educator Registration ---
/**
 * POST /api/auth/register-educator
 * body: { email: string, password: string, full_name?: string }
 * Creates a user and educator profile, and returns token + user
 */
module.exports.registerEducator = async (req, res) => {
  try {
    const { email, password, full_name, first_name, last_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let firstName = first_name || null;
    let lastName = last_name || null;
    if ((!firstName || !lastName) && full_name) {
      const parts = String(full_name).trim().split(/\s+/);
      firstName = firstName || parts.shift() || null;
      lastName = lastName || (parts.length ? parts.join(' ') : null);
    }
    const result = await sql`
      INSERT INTO useraccount (email, password, first_name, last_name)
      VALUES (${email}, ${hashedPassword}, ${firstName}, ${lastName})
      RETURNING user_id, email, first_name, last_name, created_at
    `;

    const user = result[0];
    // Create educator profile row
    await sql`
      INSERT INTO educator (user_id)
      VALUES (${user.user_id})
    `;
    const token = await generateToken(user);
    
    // Get user roles for response
    const roles = await getUserRoles(user.user_id);

    res.status(201).json({
      message: 'Educator registered successfully',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles
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

/**
 * POST /api/auth/oauth-login
 * body: { provider_token: string }
 * Verifies Supabase token, then logs in or registers a user locally.
 */
const loginOrRegisterWithProvider = async (req, res) => {
  const { provider_token } = req.body;

  if (!provider_token) {
    return res.status(400).json({ error: 'provider_token is required' });
  }

  // 1. Verify the token with Supabase
  let supabaseUser;
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${provider_token}`,
        apikey: `${process.env.SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Supabase token verification failed:', errorData);
      return res.status(401).json({ error: 'Invalid provider token' });
    }

    supabaseUser = await response.json();
    if (!supabaseUser || !supabaseUser.email) {
      return res.status(401).json({ error: 'Failed to get user details from provider' });
    }

  } catch (error) {
    console.error('Error verifying Supabase token:', error);
    return res.status(500).json({ error: 'Internal server error during token verification' });
  }

  // 2. Find or create user in *your* local database
  try {
    const { email, user_metadata } = supabaseUser;

    // Check if user already exists
    const existingUsers = await sql`
      SELECT user_id, email, first_name, last_name, created_at
      FROM useraccount
      WHERE email = ${email}
    `;

    let user = existingUsers[0];

    // 3. If user does NOT exist, create them
    if (!user) {
      console.log(`User ${email} not found locally, creating new user...`);

      // Get names from metadata
      let firstName = user_metadata?.first_name || '';
      let lastName = user_metadata?.last_name || '';

      if (!firstName && user_metadata?.full_name) {
        const parts = String(user_metadata.full_name).trim().split(/\s+/);
        firstName = parts.shift() || '';
        lastName = parts.length ? parts.join(' ') : '';
      }

      // Create a secure, random password for the user since they don't have one
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Create the user
      const result = await sql`
        INSERT INTO useraccount (email, password, first_name, last_name)
        VALUES (${email}, ${hashedPassword}, ${firstName || null}, ${lastName || null})
        RETURNING user_id, email, first_name, last_name, created_at
      `;
      user = result[0];

      // Also create their learner profile (mirroring your 'register' function)
      await sql`
        INSERT INTO learner (user_id, status, learning_streak, total_points, level)
        VALUES (${user.user_id}, 'active', 0, 0, 1)
      `;
    }

    // 4. User exists (or was just created), generate YOUR app's JWT
    const token = await generateToken(user);
    const roles = await getUserRoles(user.user_id);

    res.status(200).json({
      message: user ? 'Login successful' : 'User registered and logged in successfully',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles
      }
    });

  } catch (error) {
    console.error('Error during OAuth login/registration:', error);
    // Handle duplicate email race condition (though find-first should prevent it)
    if (error.code === '23505') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports.login = login;
module.exports.register = register;
module.exports.me = me;
module.exports.registerEducator = module.exports.registerEducator;
module.exports.loginOrRegisterWithProvider = loginOrRegisterWithProvider;