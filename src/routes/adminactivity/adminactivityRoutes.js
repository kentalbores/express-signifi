const express = require('express');
const router = express.Router();
const {
    createAdminActivity,
    getAllAdminActivities,
    getAdminActivityById,
    updateAdminActivity,
    deleteAdminActivity
} = require('../../controllers/adminactivity/adminactivityController');

// Admin activity routes
router.post('/', createAdminActivity);                // POST /api/admin-activities
router.get('/', getAllAdminActivities);               // GET /api/admin-activities
router.get('/:id', getAdminActivityById);             // GET /api/admin-activities/:id
router.put('/:id', updateAdminActivity);              // PUT /api/admin-activities/:id
router.delete('/:id', deleteAdminActivity);           // DELETE /api/admin-activities/:id

module.exports = router;


