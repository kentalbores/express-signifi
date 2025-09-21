const jwt = require('jsonwebtoken');

// JWT secret - should match the one in authController
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

// Middleware to ensure user is a learner (exists in learner table)
const requireLearner = async (req, res, next) => {
  try {
    const sql = require('../config/database');
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const rows = await sql`SELECT 1 FROM learner WHERE user_id = ${userId} LIMIT 1`;
    if (!rows.length) return res.status(403).json({ error: 'Access denied. Learner role required.' });
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to ensure user is an educator (exists in educator table)
const requireEducator = async (req, res, next) => {
  try {
    const sql = require('../config/database');
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const rows = await sql`SELECT 1 FROM educator WHERE user_id = ${userId} LIMIT 1`;
    if (!rows.length) return res.status(403).json({ error: 'Access denied. Educator role required.' });
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to ensure user is superadmin (exists in superadmin table)
const requireAdmin = async (req, res, next) => {
  try {
    const sql = require('../config/database');
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const rows = await sql`SELECT 1 FROM superadmin WHERE user_id = ${userId} LIMIT 1`;
    if (!rows.length) return res.status(403).json({ error: 'Access denied. Admin role required.' });
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  requireLearner,
  requireEducator,
  requireAdmin
};
