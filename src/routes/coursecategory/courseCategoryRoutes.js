const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Course Categories
 *   description: Course category management endpoints
 */

/**
 * @swagger
 * /api/course-categories/:
 *   post:
 *     summary: Create course category
 *     tags: [Course Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/course-categories/:
 *   get:
 *     summary: Get all course categories
 *     tags: [Course Categories]
 *     responses:
 *       200:
 *         description: Operation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/course-categories/slug/{slug}:
 *   get:
 *     summary: Get course category by slug
 *     tags: [Course Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource slug
 *     responses:
 *       200:
 *         description: Operation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/course-categories/{id}:
 *   get:
 *     summary: Get course category by ID
 *     tags: [Course Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Operation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/course-categories/{id}:
 *   put:
 *     summary: Update course category
 *     tags: [Course Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Operation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/course-categories/{id}:
 *   delete:
 *     summary: Delete course category
 *     tags: [Course Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Operation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */


const router = express.Router();
const {
    createCourseCategory,
    getAllCourseCategories,
    getCourseCategoryById,
    getCourseCategoryBySlug,
    updateCourseCategory,
    deleteCourseCategory
} = require('../../controllers/coursecategory/courseCategoryController');

// Course category routes
router.post('/', createCourseCategory);                     // POST /api/course-categories
router.get('/', getAllCourseCategories);                    // GET /api/course-categories
router.get('/slug/:slug', getCourseCategoryBySlug);         // GET /api/course-categories/slug/:slug
router.get('/:id', getCourseCategoryById);                  // GET /api/course-categories/:id
router.put('/:id', updateCourseCategory);                   // PUT /api/course-categories/:id
router.delete('/:id', deleteCourseCategory);                // DELETE /api/course-categories/:id

module.exports = router;
