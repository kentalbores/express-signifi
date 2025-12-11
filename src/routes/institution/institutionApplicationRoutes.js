const express = require('express');
const router = express.Router();
const {
    submitEducatorApplication,
    getEducatorApplications,
    updateEducatorApplicationStatus,
    sendEducatorInvitation,
    getEducatorInvitations,
    acceptEducatorInvitation,
    submitLearnerApplication,
    getLearnerApplications,
    updateLearnerApplicationStatus,
    sendLearnerInvitation,
    getLearnerInvitations,
    acceptLearnerInvitation
} = require('../../controllers/institution/institutionApplicationController');
const { authenticateToken, requireInstitutionAdmin, requireEducator } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Institution Applications
 *   description: Educator and learner applications/invitations to institutions
 */

// ============== EDUCATOR APPLICATIONS ==============

// Educator submits application
router.post('/:institutionId/educator-applications', 
    authenticateToken, requireEducator, submitEducatorApplication);

// Admin views applications
router.get('/:institutionId/educator-applications', 
    authenticateToken, requireInstitutionAdmin, getEducatorApplications);

// Admin approves/rejects
router.put('/educator-applications/:applicationId', 
    authenticateToken, requireInstitutionAdmin, updateEducatorApplicationStatus);

// ============== EDUCATOR INVITATIONS ==============

// Admin sends invitation
router.post('/:institutionId/educator-invitations', 
    authenticateToken, requireInstitutionAdmin, sendEducatorInvitation);

// Admin views invitations
router.get('/:institutionId/educator-invitations', 
    authenticateToken, requireInstitutionAdmin, getEducatorInvitations);

// Educator accepts invitation
router.post('/educator-invitations/:token/accept', 
    authenticateToken, acceptEducatorInvitation);

// ============== LEARNER APPLICATIONS ==============

// Learner submits application
router.post('/:institutionId/learner-applications', 
    authenticateToken, submitLearnerApplication);

// Admin views applications
router.get('/:institutionId/learner-applications', 
    authenticateToken, requireInstitutionAdmin, getLearnerApplications);

// Admin approves/rejects
router.put('/learner-applications/:applicationId', 
    authenticateToken, requireInstitutionAdmin, updateLearnerApplicationStatus);

// ============== LEARNER INVITATIONS ==============

// Admin sends invitation
router.post('/:institutionId/learner-invitations', 
    authenticateToken, requireInstitutionAdmin, sendLearnerInvitation);

// Admin views invitations
router.get('/:institutionId/learner-invitations', 
    authenticateToken, requireInstitutionAdmin, getLearnerInvitations);

// Learner accepts invitation
router.post('/learner-invitations/:token/accept', 
    authenticateToken, acceptLearnerInvitation);

module.exports = router;
