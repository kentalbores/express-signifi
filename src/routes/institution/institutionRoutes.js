const express = require('express');
const router = express.Router();
const {
    createInstitution,
    getAllInstitutions,
    getInstitutionById,
    updateInstitution,
    deleteInstitution
} = require('../../controllers/institution/institutionController');

// Institution routes
router.post('/', createInstitution);            // POST /api/institutions
router.get('/', getAllInstitutions);           // GET /api/institutions
router.get('/:id', getInstitutionById);        // GET /api/institutions/:id
router.put('/:id', updateInstitution);         // PUT /api/institutions/:id
router.delete('/:id', deleteInstitution);      // DELETE /api/institutions/:id

module.exports = router;


