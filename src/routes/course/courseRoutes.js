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

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management endpoints
 */

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - educator_id
 *               - title
 *               - slug
 *             properties:
 *               educator_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               short_description:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 minimum: 0
 *               difficulty_level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, expert]
 *               is_published:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: is_published
 *         schema:
 *           type: boolean
 *         description: Filter by published status
 *       - in: query
 *         name: educator_id
 *         schema:
 *           type: integer
 *         description: Filter by educator ID
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 courses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 */

/**
 * @swagger
 * /api/courses/published:
 *   get:
 *     summary: Get all published courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: Published courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 */

/**
 * @swagger
 * /api/courses/search:
 *   get:
 *     summary: Search published courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 */

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               is_published:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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