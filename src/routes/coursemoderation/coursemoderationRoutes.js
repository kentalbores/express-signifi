const express = require('express');
const router = express.Router();
const {
    createCourseModeration,
    getAllCourseModerations,
    getCourseModerationById,
    updateCourseModeration,
    deleteCourseModeration
} = require('../../controllers/coursemoderation/coursemoderationController');

// Course moderation routes
router.post('/', createCourseModeration);               // POST /api/course-moderations
router.get('/', getAllCourseModerations);               // GET /api/course-moderations
router.get('/:id', getCourseModerationById);            // GET /api/course-moderations/:id
router.put('/:id', updateCourseModeration);             // PUT /api/course-moderations/:id
router.delete('/:id', deleteCourseModeration);          // DELETE /api/course-moderations/:id

module.exports = router;


