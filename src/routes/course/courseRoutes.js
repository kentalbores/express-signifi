const express = require('express');
const router = express.Router();
const {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
} = require('../../controllers/course/courseController');

// Course routes
router.post('/', createCourse);         // POST /api/courses - Create new course
router.get('/', getAllCourses);        // GET /api/courses - Get all courses (with optional filters)
router.get('/:id', getCourseById);     // GET /api/courses/:id - Get course by ID
router.put('/:id', updateCourse);      // PUT /api/courses/:id - Update course
router.delete('/:id', deleteCourse);   // DELETE /api/courses/:id - Delete course

module.exports = router;