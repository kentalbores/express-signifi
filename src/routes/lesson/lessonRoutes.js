const express = require('express');
const router = express.Router();
const {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson
} = require('../../controllers/lesson/lessonController');

// Lesson routes
router.post('/', createLesson);           // POST /api/lessons
router.get('/', getAllLessons);           // GET /api/lessons
router.get('/:id', getLessonById);        // GET /api/lessons/:id
router.put('/:id', updateLesson);         // PUT /api/lessons/:id
router.delete('/:id', deleteLesson);      // DELETE /api/lessons/:id

module.exports = router;


