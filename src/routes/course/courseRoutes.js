const express = require('express');
const router = express.Router();
const {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
} = require('../../controllers/course/courseController');
const sql = require('../../config/database');

// Course routes
router.post('/', createCourse);         // POST /api/courses - Create new course
router.get('/', getAllCourses);        // GET /api/courses - Get all courses (with optional filters)
router.get('/published', async (req, res) => { // GET /api/courses/published
  try {
    const rows = await sql`SELECT course_id, title, description, price, is_published, created_at FROM course WHERE is_published = true ORDER BY created_at DESC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/search', async (req, res) => { // GET /api/courses/search?q=
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);
    const like = `%${q}%`;
    const rows = await sql`SELECT course_id, title, description, price, is_published, created_at FROM course WHERE is_published = true AND (title ILIKE ${like} OR description ILIKE ${like}) ORDER BY created_at DESC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/:id', getCourseById);     // GET /api/courses/:id - Get course by ID
router.put('/:id', updateCourse);      // PUT /api/courses/:id - Update course
router.delete('/:id', deleteCourse);   // DELETE /api/courses/:id - Delete course

module.exports = router;