const express = require('express');
const router = express.Router();
const {
    createGameAttempt,
    getAllGameAttempts,
    getGameAttemptById,
    updateGameAttempt,
    deleteGameAttempt
} = require('../../controllers/gameattempt/gameattemptController');

// Game attempt routes
router.post('/', createGameAttempt);              // POST /api/game-attempts
router.get('/', getAllGameAttempts);              // GET /api/game-attempts
router.get('/:id', getGameAttemptById);           // GET /api/game-attempts/:id
router.put('/:id', updateGameAttempt);            // PUT /api/game-attempts/:id
router.delete('/:id', deleteGameAttempt);         // DELETE /api/game-attempts/:id

module.exports = router;


