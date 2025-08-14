const express = require('express');
const router = express.Router();
const {
    createEnrollment,
    getAllEnrollments,
    getEnrollmentById,
    updateEnrollment,
    deleteEnrollment
} = require('../../controllers/enrollment/enrollmentController');

// Enrollment routes
router.post('/', createEnrollment);             // POST /api/enrollments
router.get('/', getAllEnrollments);             // GET /api/enrollments
router.get('/:id', getEnrollmentById);          // GET /api/enrollments/:id
router.put('/:id', updateEnrollment);           // PUT /api/enrollments/:id
router.delete('/:id', deleteEnrollment);        // DELETE /api/enrollments/:id

module.exports = router;


