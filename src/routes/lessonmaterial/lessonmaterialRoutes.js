const express = require('express');
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


