const express = require('express');
const router = express.Router();
const {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../../controllers/user/userController');

// User routes
router.post('/', createUser);           // POST /api/users - Create new user
router.get('/', getAllUsers);          // GET /api/users - Get all users
router.get('/:id', getUserById);       // GET /api/users/:id - Get user by ID
router.put('/:id', updateUser);        // PUT /api/users/:id - Update user
router.delete('/:id', deleteUser);     // DELETE /api/users/:id - Delete user

module.exports = router;