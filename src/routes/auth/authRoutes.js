const express = require('express');
const router = express.Router();
const { login, register, me } = require('../../controllers/auth/authController');
const { authenticateToken } = require('../../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', authenticateToken, me);

module.exports = router;
