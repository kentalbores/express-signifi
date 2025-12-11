const sql = require('../../config/database');
const crypto = require('crypto');

// ============== EDUCATOR APPLICATIONS ==============

// Submit educator application to institution
const submitEducatorApplication = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { application_message, documents } = req.body;
        const educatorId = req.user.user_id;

        // Check if educator exists
        const educatorCheck = await sql`
            SELECT user_id FROM educator WHERE user_id = ${educatorId}
        `;
        if (educatorCheck.length === 0) {
            return res.status(403).json({ error: 'Only educators can submit applications' });
        }

        // Check for existing pending application
        const existing = await sql`
            SELECT application_id FROM educator_institution_application
            WHERE educator_id = ${educatorId} AND institution_id = ${institutionId}
            AND status = 'pending'
        `;
        if (existing.length > 0) {
            return res.status(409).json({ error: 'You already have a pending application for this institution' });
        }

        const result = await sql`
            INSERT INTO educator_institution_application (
                educator_id, institution_id, application_message, documents
            )
            VALUES (${educatorId}, ${institutionId}, ${application_message || null}, ${documents || null})
            RETURNING *
        `;

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: result[0]
        });

    } catch (error) {
        console.error('Error submitting educator application:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid institution_id' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get educator applications for an institution (admin)
const getEducatorApplications = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { status, limit = 20, offset = 0 } = req.query;

        let whereClause = sql`WHERE a.institution_id = ${institutionId}`;
        if (status) {
            whereClause = sql`${whereClause} AND a.status = ${status}`;
        }

        const applications = await sql`
            SELECT a.*, u.first_name, u.last_name, u.email,
                   e.title as educator_title, e.specialization
            FROM educator_institution_application a
            JOIN useraccount u ON a.educator_id = u.user_id
            LEFT JOIN educator e ON a.educator_id = e.user_id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        res.status(200).json({ success: true, applications });

    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Approve/Reject educator application (admin)
const updateEducatorApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, response_message } = req.body;
        const reviewedBy = req.user.user_id;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be approved or rejected' });
        }

        const result = await sql`
            UPDATE educator_institution_application
            SET status = ${status}, 
                response_message = ${response_message || null},
                reviewed_by = ${reviewedBy},
                reviewed_at = NOW()
            WHERE application_id = ${applicationId}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // If approved, update educator's institution_id
        if (status === 'approved') {
            await sql`
                UPDATE educator
                SET institution_id = ${result[0].institution_id}
                WHERE user_id = ${result[0].educator_id}
            `;
        }

        res.status(200).json({
            success: true,
            message: `Application ${status}`,
            application: result[0]
        });

    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============== EDUCATOR INVITATIONS ==============

// Send educator invitation (admin)
const sendEducatorInvitation = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { email, message } = req.body;
        const invitedBy = req.user.user_id;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const result = await sql`
            INSERT INTO educator_invitation (
                institution_id, invited_by, email, invitation_token, message, expires_at
            )
            VALUES (${institutionId}, ${invitedBy}, ${email}, ${token}, ${message || null}, ${expiresAt})
            RETURNING invitation_id, institution_id, email, status, expires_at, created_at
        `;

        // TODO: Send email with invitation link

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            invitation: result[0],
            token // Include for testing, remove in production
        });

    } catch (error) {
        console.error('Error sending invitation:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Invitation already sent to this email' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get educator invitations for institution (admin)
const getEducatorInvitations = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { status } = req.query;

        let whereClause = sql`WHERE institution_id = ${institutionId}`;
        if (status) {
            whereClause = sql`${whereClause} AND status = ${status}`;
        }

        const invitations = await sql`
            SELECT invitation_id, institution_id, email, status, 
                   expires_at, created_at, accepted_at
            FROM educator_invitation
            ${whereClause}
            ORDER BY created_at DESC
        `;

        res.status(200).json({ success: true, invitations });

    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Accept educator invitation
const acceptEducatorInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user.user_id;

        // Find and validate invitation
        const invitation = await sql`
            SELECT * FROM educator_invitation
            WHERE invitation_token = ${token} AND status = 'pending'
        `;

        if (invitation.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired invitation' });
        }

        if (new Date(invitation[0].expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invitation has expired' });
        }

        // Update invitation status
        await sql`
            UPDATE educator_invitation
            SET status = 'accepted', accepted_at = NOW()
            WHERE invitation_token = ${token}
        `;

        // Update educator's institution
        await sql`
            UPDATE educator
            SET institution_id = ${invitation[0].institution_id}
            WHERE user_id = ${userId}
        `;

        res.status(200).json({
            success: true,
            message: 'Invitation accepted successfully'
        });

    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============== LEARNER APPLICATIONS ==============

// Submit learner application to institution
const submitLearnerApplication = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { application_message } = req.body;
        const learnerId = req.user.user_id;

        // Check for existing pending application
        const existing = await sql`
            SELECT application_id FROM learner_institution_application
            WHERE learner_id = ${learnerId} AND institution_id = ${institutionId}
            AND status = 'pending'
        `;
        if (existing.length > 0) {
            return res.status(409).json({ error: 'You already have a pending application' });
        }

        const result = await sql`
            INSERT INTO learner_institution_application (
                learner_id, institution_id, application_message
            )
            VALUES (${learnerId}, ${institutionId}, ${application_message || null})
            RETURNING *
        `;

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: result[0]
        });

    } catch (error) {
        console.error('Error submitting learner application:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid institution_id' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get learner applications for institution (admin)
const getLearnerApplications = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { status, limit = 20, offset = 0 } = req.query;

        let whereClause = sql`WHERE a.institution_id = ${institutionId}`;
        if (status) {
            whereClause = sql`${whereClause} AND a.status = ${status}`;
        }

        const applications = await sql`
            SELECT a.*, u.first_name, u.last_name, u.email
            FROM learner_institution_application a
            JOIN useraccount u ON a.learner_id = u.user_id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        res.status(200).json({ success: true, applications });

    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Approve/Reject learner application (admin)
const updateLearnerApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, response_message } = req.body;
        const reviewedBy = req.user.user_id;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be approved or rejected' });
        }

        const result = await sql`
            UPDATE learner_institution_application
            SET status = ${status}, 
                response_message = ${response_message || null},
                reviewed_by = ${reviewedBy},
                reviewed_at = NOW()
            WHERE application_id = ${applicationId}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // If approved, update learner's institution_id
        if (status === 'approved') {
            await sql`
                UPDATE learner
                SET institution_id = ${result[0].institution_id}
                WHERE user_id = ${result[0].learner_id}
            `;
        }

        res.status(200).json({
            success: true,
            message: `Application ${status}`,
            application: result[0]
        });

    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============== LEARNER INVITATIONS ==============

// Send learner invitation (admin)
const sendLearnerInvitation = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { email, message } = req.body;
        const invitedBy = req.user.user_id;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const result = await sql`
            INSERT INTO learner_invitation (
                institution_id, invited_by, email, invitation_token, message, expires_at
            )
            VALUES (${institutionId}, ${invitedBy}, ${email}, ${token}, ${message || null}, ${expiresAt})
            RETURNING invitation_id, institution_id, email, status, expires_at, created_at
        `;

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            invitation: result[0],
            token
        });

    } catch (error) {
        console.error('Error sending invitation:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Invitation already sent to this email' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get learner invitations for institution (admin)
const getLearnerInvitations = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { status } = req.query;

        let whereClause = sql`WHERE institution_id = ${institutionId}`;
        if (status) {
            whereClause = sql`${whereClause} AND status = ${status}`;
        }

        const invitations = await sql`
            SELECT invitation_id, institution_id, email, status, 
                   expires_at, created_at, accepted_at
            FROM learner_invitation
            ${whereClause}
            ORDER BY created_at DESC
        `;

        res.status(200).json({ success: true, invitations });

    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Accept learner invitation
const acceptLearnerInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user.user_id;

        const invitation = await sql`
            SELECT * FROM learner_invitation
            WHERE invitation_token = ${token} AND status = 'pending'
        `;

        if (invitation.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired invitation' });
        }

        if (new Date(invitation[0].expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invitation has expired' });
        }

        await sql`
            UPDATE learner_invitation
            SET status = 'accepted', accepted_at = NOW()
            WHERE invitation_token = ${token}
        `;

        await sql`
            UPDATE learner
            SET institution_id = ${invitation[0].institution_id}
            WHERE user_id = ${userId}
        `;

        res.status(200).json({
            success: true,
            message: 'Invitation accepted successfully'
        });

    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    // Educator
    submitEducatorApplication,
    getEducatorApplications,
    updateEducatorApplicationStatus,
    sendEducatorInvitation,
    getEducatorInvitations,
    acceptEducatorInvitation,
    // Learner
    submitLearnerApplication,
    getLearnerApplications,
    updateLearnerApplicationStatus,
    sendLearnerInvitation,
    getLearnerInvitations,
    acceptLearnerInvitation
};
