const express = require('express');
const router = express.Router();
const {
    createCourseModule,
    getAllCourseModules,
    getCourseModuleById,
    updateCourseModule,
    deleteCourseModule
} = require('../../controllers/coursemodule/coursemoduleController');

// Course module routes
router.post('/', createCourseModule);           // POST /api/modules
router.get('/', getAllCourseModules);           // GET /api/modules
router.get('/:id', getCourseModuleById);        // GET /api/modules/:id
router.put('/:id', updateCourseModule);         // PUT /api/modules/:id
router.delete('/:id', deleteCourseModule);      // DELETE /api/modules/:id

module.exports = router;


