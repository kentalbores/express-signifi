const express = require('express');
const router = express.Router();
const {
    createMinigame,
    getAllMinigames,
    getMinigameById,
    updateMinigame,
    deleteMinigame
} = require('../../controllers/minigame/minigameController');

// Minigame routes
router.post('/', createMinigame);            // POST /api/minigames
router.get('/', getAllMinigames);            // GET /api/minigames
router.get('/:id', getMinigameById);         // GET /api/minigames/:id
router.put('/:id', updateMinigame);          // PUT /api/minigames/:id
router.delete('/:id', deleteMinigame);       // DELETE /api/minigames/:id

module.exports = router;


