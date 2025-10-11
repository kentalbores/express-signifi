const jwt = require('jsonwebtoken');

// JWT secret - should match the one in authController
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Cache for user roles to reduce database queries
const roleCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get user roles from database with caching
const getUserRoles = async (userId) => {
  const cacheKey = `user_roles_${userId}`;
  const cached = roleCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.roles;
  }

  try {
    const sql = require('../config/database');
    const roles = [];

    // Check each role table
    const [learnerRows, educatorRows, superadminRows, institutionadminRows] = await Promise.all([
      sql`SELECT 1 FROM learner WHERE user_id = ${userId} LIMIT 1`,
      sql`SELECT 1 FROM educator WHERE user_id = ${userId} LIMIT 1`,
      sql`SELECT 1 FROM superadmin WHERE user_id = ${userId} LIMIT 1`,
      sql`SELECT 1 FROM institutionadmin WHERE user_id = ${userId} LIMIT 1`
    ]);

    if (learnerRows.length > 0) roles.push('learner');
    if (educatorRows.length > 0) roles.push('educator');
    if (superadminRows.length > 0) roles.push('superadmin');
    if (institutionadminRows.length > 0) roles.push('institutionadmin');

    // Cache the result
    roleCache.set(cacheKey, {
      roles,
      timestamp: Date.now()
    });

    return roles;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
};

// Clear role cache for a specific user (useful after role changes)
const clearUserRoleCache = (userId) => {
  const cacheKey = `user_roles_${userId}`;
  roleCache.delete(cacheKey);
};

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Add user roles to the request object
    try {
      const roles = await getUserRoles(user.user_id);
      req.user = { ...user, roles };
      next();
    } catch (error) {
      console.error('Error adding roles to user:', error);
      req.user = { ...user, roles: [] };
      next();
    }
  });
};

// Helper function to check if user has required role
const hasRole = (userRoles, requiredRole) => {
  return userRoles && userRoles.includes(requiredRole);
};

// Helper function to check if user has any of the required roles
const hasAnyRole = (userRoles, requiredRoles) => {
  return userRoles && requiredRoles.some(role => userRoles.includes(role));
};

// Middleware to ensure user is a learner
const requireLearner = (req, res, next) => {
  try {
    const userRoles = req.user && req.user.roles;
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasRole(userRoles, 'learner')) {
      return res.status(403).json({ 
        error: 'Access denied. Learner role required.',
        required_role: 'learner',
        user_roles: userRoles || []
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in requireLearner middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to ensure user is an educator
const requireEducator = (req, res, next) => {
  try {
    const userRoles = req.user && req.user.roles;
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasRole(userRoles, 'educator')) {
      return res.status(403).json({ 
        error: 'Access denied. Educator role required.',
        required_role: 'educator',
        user_roles: userRoles || []
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in requireEducator middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to ensure user is a superadmin
const requireSuperAdmin = (req, res, next) => {
  try {
    const userRoles = req.user && req.user.roles;
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasRole(userRoles, 'superadmin')) {
      return res.status(403).json({ 
        error: 'Access denied. Super admin role required.',
        required_role: 'superadmin',
        user_roles: userRoles || []
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in requireSuperAdmin middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to ensure user is an institution admin
const requireInstitutionAdmin = (req, res, next) => {
  try {
    const userRoles = req.user && req.user.roles;
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasRole(userRoles, 'institutionadmin')) {
      return res.status(403).json({ 
        error: 'Access denied. Institution admin role required.',
        required_role: 'institutionadmin',
        user_roles: userRoles || []
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in requireInstitutionAdmin middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to ensure user is either superadmin or institution admin
const requireAdminRole = (req, res, next) => {
  try {
    const userRoles = req.user && req.user.roles;
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasAnyRole(userRoles, ['superadmin', 'institutionadmin'])) {
      return res.status(403).json({ 
        error: 'Access denied. Admin role required.',
        required_roles: ['superadmin', 'institutionadmin'],
        user_roles: userRoles || []
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in requireAdminRole middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Generic middleware to require any of the specified roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRoles = req.user && req.user.roles;
      if (!req.user || !req.user.user_id) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (!hasAnyRole(userRoles, allowedRoles)) {
        return res.status(403).json({ 
          error: 'Access denied. Required role not found.',
          required_roles: allowedRoles,
          user_roles: userRoles || []
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in requireRole middleware:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Legacy alias for backward compatibility
const requireAdmin = requireSuperAdmin;

module.exports = {
  authenticateToken,
  getUserRoles,
  clearUserRoleCache,
  hasRole,
  hasAnyRole,
  requireLearner,
  requireEducator,
  requireSuperAdmin,
  requireInstitutionAdmin,
  requireAdminRole,
  requireRole, // Generic role middleware
  requireAdmin // Legacy alias
};
