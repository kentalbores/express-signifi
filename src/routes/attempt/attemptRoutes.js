const express = require('express');
const router = express.Router();
const {
    createAttempt,
    getAllAttempts,
    getAttemptById,
    updateAttempt,
    deleteAttempt
} = require('../../controllers/attempt/attemptController');

// Attempt routes
router.post('/', createAttempt);            // POST /api/attempts
router.get('/', getAllAttempts);            // GET /api/attempts
router.get('/:id', getAttemptById);         // GET /api/attempts/:id
router.put('/:id', updateAttempt);          // PUT /api/attempts/:id
router.delete('/:id', deleteAttempt);       // DELETE /api/attempts/:id

module.exports = router;


