const express = require('express');
const router = express.Router();
const {
    createEducatorVerification,
    getAllEducatorVerifications,
    getEducatorVerificationById,
    updateEducatorVerification,
    deleteEducatorVerification
} = require('../../controllers/educatorverification/educatorverificationController');

// Educator verification routes
router.post('/', createEducatorVerification);                     // POST /api/educator-verifications
router.get('/', getAllEducatorVerifications);                     // GET /api/educator-verifications
router.get('/:id', getEducatorVerificationById);                  // GET /api/educator-verifications/:id
router.put('/:id', updateEducatorVerification);                   // PUT /api/educator-verifications/:id
router.delete('/:id', deleteEducatorVerification);                // DELETE /api/educator-verifications/:id

module.exports = router;


