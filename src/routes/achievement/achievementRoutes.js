const express = require('express');
const router = express.Router();
const {
    createAchievement,
    getAllAchievements,
    getAchievementById,
    updateAchievement,
    deleteAchievement
} = require('../../controllers/achievement/achievementController');

// Achievement routes
router.post('/', createAchievement);            // POST /api/achievements
router.get('/', getAllAchievements);            // GET /api/achievements
router.get('/:id', getAchievementById);         // GET /api/achievements/:id
router.put('/:id', updateAchievement);          // PUT /api/achievements/:id
router.delete('/:id', deleteAchievement);       // DELETE /api/achievements/:id

module.exports = router;


