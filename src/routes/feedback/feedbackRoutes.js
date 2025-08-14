const express = require('express');
const router = express.Router();
const {
    createFeedback,
    getAllFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedback
} = require('../../controllers/feedback/feedbackController');

// Feedback routes
router.post('/', createFeedback);            // POST /api/feedback
router.get('/', getAllFeedback);             // GET /api/feedback
router.get('/:id', getFeedbackById);         // GET /api/feedback/:id
router.put('/:id', updateFeedback);          // PUT /api/feedback/:id
router.delete('/:id', deleteFeedback);       // DELETE /api/feedback/:id

module.exports = router;


