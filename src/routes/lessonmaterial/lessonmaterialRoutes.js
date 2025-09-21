const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Lesson Materials
 *   description: Lesson Materials management endpoints
 */

/**
 * @swagger
 * /api/lesson-materials:
 *   get:
 *     summary: Get all lesson materials
 *     tags: [Lesson Materials]
 *     responses:
 *       200:
 *         description: Lesson Materials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   post:
 *     summary: Create lesson material
 *     tags: [Lesson Materials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Lesson Material created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */

/**
 * @swagger
 * /api/lesson-materials/{id}:
 *   get:
 *     summary: Get lesson material by ID
 *     tags: [Lesson Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lesson Material retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Lesson Material not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update lesson material
 *     tags: [Lesson Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Lesson Material updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   delete:
 *     summary: Delete lesson material
 *     tags: [Lesson Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lesson Material deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */


const router = express.Router();
const {
    createLessonMaterial,
    getAllLessonMaterials,
    getLessonMaterialById,
    updateLessonMaterial,
    deleteLessonMaterial
} = require('../../controllers/lessonmaterial/lessonmaterialController');

// Lesson material routes
router.post('/', createLessonMaterial);               // POST /api/lesson-materials
router.get('/', getAllLessonMaterials);               // GET /api/lesson-materials
router.get('/:id', getLessonMaterialById);            // GET /api/lesson-materials/:id
router.put('/:id', updateLessonMaterial);             // PUT /api/lesson-materials/:id
router.delete('/:id', deleteLessonMaterial);          // DELETE /api/lesson-materials/:id

module.exports = router;


