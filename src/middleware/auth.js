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

// Middleware to ensure user is a learner
const requireLearner = (req, res, next) => {
  if (req.user.role !== 'learner') {
    return res.status(403).json({ error: 'Access denied. Learner role required.' });
  }
  next();
};

// Middleware to ensure user is an educator
const requireEducator = (req, res, next) => {
  if (req.user.role !== 'educator') {
    return res.status(403).json({ error: 'Access denied. Educator role required.' });
  }
  next();
};

// Middleware to ensure user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireLearner,
  requireEducator,
  requireAdmin
};
