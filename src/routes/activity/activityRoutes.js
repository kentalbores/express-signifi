const express = require('express');
const router = express.Router();
const {
    createActivity,
    getAllActivities,
    getActivityById,
    updateActivity,
    deleteActivity
} = require('../../controllers/activity/activityController');

// Activity routes
router.post('/', createActivity);            // POST /api/activities
router.get('/', getAllActivities);           // GET /api/activities
router.get('/:id', getActivityById);         // GET /api/activities/:id
router.put('/:id', updateActivity);          // PUT /api/activities/:id
router.delete('/:id', deleteActivity);       // DELETE /api/activities/:id

module.exports = router;


