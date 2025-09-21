const express = require('express');
const router = express.Router();
const {
    createEducator,
    getAllEducators,
    getEducatorById,
    updateEducator,
    deleteEducator,
    getEducatorStats
} = require('../../controllers/educator/educatorController');

/**
 * @swagger
 * tags:
 *   name: Educators
 *   description: Educator profile management endpoints
 */

/**
 * @swagger
 * /api/educators:
 *   post:
 *     summary: Create educator profile
 *     tags: [Educators]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *               institution_id:
 *                 type: integer
 *               employee_id:
 *                 type: string
 *               title:
 *                 type: string
 *               bio:
 *                 type: string
 *               specialization:
 *                 type: string
 *               qualifications:
 *                 type: string
 *               years_experience:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Educator profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   get:
 *     summary: Get all educators
 *     tags: [Educators]
 *     parameters:
 *       - in: query
 *         name: institution_id
 *         schema:
 *           type: integer
 *         description: Filter by institution ID
 *       - in: query
 *         name: verification_status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, suspended]
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: Educators retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Educator'
 */

/**
 * @swagger
 * /api/educators/{id}:
 *   get:
 *     summary: Get educator by ID
 *     tags: [Educators]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Educator ID
 *     responses:
 *       200:
 *         description: Educator retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Educator'
 *       404:
 *         description: Educator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update educator profile
 *     tags: [Educators]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Educator ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               bio:
 *                 type: string
 *               specialization:
 *                 type: string
 *               qualifications:
 *                 type: string
 *               years_experience:
 *                 type: integer
 *               verification_status:
 *                 type: string
 *                 enum: [pending, approved, rejected, suspended]
 *     responses:
 *       200:
 *         description: Educator updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Educator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete educator profile
 *     tags: [Educators]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Educator ID
 *     responses:
 *       200:
 *         description: Educator deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Educator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/educators/{id}/stats:
 *   get:
 *     summary: Get educator statistics
 *     tags: [Educators]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Educator ID
 *     responses:
 *       200:
 *         description: Educator statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_students:
 *                       type: integer
 *                     total_courses:
 *                       type: integer
 *                     published_courses:
 *                       type: integer
 *                     average_rating:
 *                       type: number
 *                     total_reviews:
 *                       type: integer
 *       404:
 *         description: Educator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Educator routes
router.post('/', createEducator);                          // POST /api/educators
router.get('/', getAllEducators);                          // GET /api/educators
router.get('/:id', getEducatorById);                       // GET /api/educators/:id
router.get('/:id/stats', getEducatorStats);                // GET /api/educators/:id/stats
router.put('/:id', updateEducator);                        // PUT /api/educators/:id
router.delete('/:id', deleteEducator);                     // DELETE /api/educators/:id

module.exports = router;
