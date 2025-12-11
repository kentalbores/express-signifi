const express = require('express');
const router = express.Router();
const {
    createCourse,
    getAllCourses,
    getCourseById,
    getCourseByIdFull,
    updateCourse,
    deleteCourse
} = require('../../controllers/course/courseController');
const { authenticateToken, requireEducator, requireAdminRole } = require('../../middleware/auth');
const { validate, schemas } = require('../../middleware/validation');
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

// Import download manifest and institution courses controllers
const { getDownloadManifest, getMyInstitutionCourses } = require('../../controllers/course/courseController');

// IMPORTANT: All specific named routes MUST come before parameterized routes (/:id)
// to prevent Express from matching "my-institution" as an ID

// My institution courses route - MUST be first to avoid /:id catching it
router.get('/my-institution', authenticateToken, getMyInstitutionCourses);  // GET /api/courses/my-institution

// Public course routes (no authentication required)
router.get('/published', async (req, res) => { // GET /api/courses/published
  try {
    const rows = await sql`
      SELECT course_id, title, description, price, is_published, created_at 
      FROM course 
      WHERE is_published = true AND is_active = true 
      ORDER BY created_at DESC
    `;
    res.json(rows);
  } catch (e) {
    console.error('Error fetching published courses:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search', async (req, res) => { // GET /api/courses/search?q=
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);
    const like = `%${q}%`;
    const rows = await sql`
      SELECT course_id, title, description, price, is_published, created_at 
      FROM course 
      WHERE is_published = true AND is_active = true 
        AND (title ILIKE ${like} OR description ILIKE ${like}) 
      ORDER BY created_at DESC
    `;
    res.json(rows);
  } catch (e) {
    console.error('Error searching courses:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Parameterized routes (must come after ALL specific named paths)
router.get('/:id/full', getCourseByIdFull);  // GET /api/courses/:id/full - Get course with full nested structure (public)
router.get('/:id', getCourseById);     // GET /api/courses/:id - Get course by ID (public)
router.get('/:id/download-manifest', authenticateToken, getDownloadManifest);  // GET /api/courses/:id/download-manifest

// Protected course routes with validation
router.post('/', authenticateToken, requireEducator, validate(schemas.course.create), createCourse);         // POST /api/courses - Create new course (educators only)
router.get('/', authenticateToken, validate(schemas.query.courseFilters, 'query'), getAllCourses);        // GET /api/courses - Get all courses (authenticated users)
router.put('/:id', authenticateToken, requireEducator, validate(schemas.params.id, 'params'), validate(schemas.course.update), updateCourse);      // PUT /api/courses/:id - Update course (educators only)
router.delete('/:id', authenticateToken, requireAdminRole, validate(schemas.params.id, 'params'), deleteCourse);   // DELETE /api/courses/:id - Delete course (admins only)

module.exports = router;