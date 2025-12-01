const sql = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUserRoles } = require('../../middleware/auth');
const fetch = require('node-fetch');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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
const registerEducator = async (req, res) => {
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
  console.log('═══ OAuth Login Request Received ═══');
  console.log('Request body:', req.body);

  const { provider_token } = req.body;

  if (!provider_token) {
    console.error('❌ Missing provider_token in request body');
    return res.status(400).json({ error: 'provider_token is required' });
  }

  console.log('✅ Provider token received, verifying with Supabase...');

  // 1. Verify the token with Supabase
  let supabaseUser;
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'NOT SET');
      console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'NOT SET');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('🔗 Calling Supabase API:', `${supabaseUrl}/auth/v1/user`);

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${provider_token}`,
        apikey: supabaseKey,
      },
    });

    console.log('📡 Supabase response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Supabase token verification failed:', errorData);
      return res.status(401).json({ error: 'Invalid provider token' });
    }

    supabaseUser = await response.json();
    console.log('✅ Supabase user retrieved:', {
      email: supabaseUser.email,
      id: supabaseUser.id,
      hasMetadata: !!supabaseUser.user_metadata
    });

    if (!supabaseUser || !supabaseUser.email) {
      console.error('❌ No email in Supabase user response');
      return res.status(401).json({ error: 'Failed to get user details from provider' });
    }

  } catch (error) {
    console.error('❌ Error verifying Supabase token:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: 'Internal server error during token verification' });
  }

  // 2. Find or create user in *your* local database
  try {
    const { email, user_metadata } = supabaseUser;
    console.log('🔍 Looking up user by email:', email);

    // Check if user already exists
    const existingUsers = await sql`
      SELECT user_id, email, first_name, last_name, created_at
      FROM useraccount
      WHERE email = ${email}
    `;

    let user = existingUsers[0];

    // 3. If user does NOT exist, create them
    if (!user) {
      console.log(`➕ User ${email} not found locally, creating new user...`);

      // Get names from metadata
      let firstName = user_metadata?.first_name || '';
      let lastName = user_metadata?.last_name || '';

      if (!firstName && user_metadata?.full_name) {
        const parts = String(user_metadata.full_name).trim().split(/\s+/);
        firstName = parts.shift() || '';
        lastName = parts.length ? parts.join(' ') : '';
      }

      console.log('User metadata:', { firstName, lastName, full_name: user_metadata?.full_name });

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
      console.log('✅ User created with ID:', user.user_id);

      // Also create their learner profile (mirroring your 'register' function)
      await sql`
        INSERT INTO learner (user_id, status, learning_streak, total_points, level)
        VALUES (${user.user_id}, 'active', 0, 0, 1)
      `;
      console.log('✅ Learner profile created');
    } else {
      console.log('✅ Existing user found with ID:', user.user_id);
    }

    // 4. User exists (or was just created), generate YOUR app's JWT
    console.log('🔑 Generating JWT token...');
    const token = await generateToken(user);
    const roles = await getUserRoles(user.user_id);
    console.log('✅ Token generated, roles:', roles);

    console.log('✅ OAuth login successful, sending response');
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
    console.error('❌ Error during OAuth login/registration:', error);
    console.error('Error stack:', error.stack);
    // Handle duplicate email race condition (though find-first should prevent it)
    if (error.code === '23505') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- Password reset flow ---
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Find user by email
    const users = await sql`
      SELECT user_id, email
      FROM useraccount
      WHERE email = ${email}
    `;

    // Always respond with a generic message to avoid user enumeration
    const genericResponse = { message: 'If an account with that email exists, a password reset link has been sent.' };
    if (!users || users.length === 0) {
      console.log(`Forgot password requested for non-existing email: ${email}`);
      return res.json(genericResponse);
    }

    const user = users[0];

    // Generate token and store its hash
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + (process.env.PASSWORD_RESET_EXPIRES_MINUTES ? parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES, 10) * 60000 : 60 * 60 * 1000)); // default 60 minutes

    await sql`
      INSERT INTO password_resets (user_id, token_hash, expires_at, created_at)
      VALUES (${user.user_id}, ${tokenHash}, ${expiresAt}, now())
    `;

    // Build reset link (frontend should implement the route to capture userId and token)
    const frontendBase = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetLink = `${frontendBase.replace(/\/$/, '')}/reset-password/${user.user_id}/${token}`;

    // Send email if SMTP configured, otherwise log reset link for development
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT, 10),
          secure: (process.env.SMTP_SECURE === 'true'),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const fromAddress = process.env.EMAIL_FROM || 'no-reply@example.com';
        const mailOptions = {
          from: fromAddress,
          to: user.email,
          subject: 'Password reset request',
          text: `You requested a password reset. Use the link below to reset your password (expires in ${process.env.PASSWORD_RESET_EXPIRES_MINUTES || 60} minutes):\n\n${resetLink}`,
          html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in ${process.env.PASSWORD_RESET_EXPIRES_MINUTES || 60} minutes.</p>`
        };

        await transporter.sendMail(mailOptions);
      } catch (err) {
        console.error('Error sending password reset email:', err);
        console.log('Reset link (dev):', resetLink);
      }
    } else {
      console.log('Password reset link (no SMTP configured):', resetLink);
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, token } = req.params;
    const { newPassword } = req.body;

    if (!userId || !token || !newPassword) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const rows = await sql`
      SELECT id, user_id, token_hash, expires_at, used_at
      FROM password_resets
      WHERE user_id = ${userId} AND token_hash = ${tokenHash}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const resetRow = rows[0];
    const now = new Date();
    if (resetRow.used_at) {
      return res.status(400).json({ error: 'Token already used' });
    }
    if (new Date(resetRow.expires_at) < now) {
      return res.status(400).json({ error: 'Token expired' });
    }

    // Update user password
    const saltRounds = 10;
    const hashed = await bcrypt.hash(newPassword, saltRounds);
    await sql`
      UPDATE useraccount
      SET password = ${hashed}
      WHERE user_id = ${userId}
    `;

    // Mark token as used
    await sql`
      UPDATE password_resets
      SET used_at = now()
      WHERE id = ${resetRow.id}
    `;

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  login,
  register,
  me,
  registerEducator,
  loginOrRegisterWithProvider,
  forgotPassword,
  resetPassword
};
