const sql = require('../../config/database');

// Create educator verification
const createEducatorVerification = async (req, res) => {
    try {
        const { educator_id, institution_id, status, submitted_at } = req.body;
        if (!educator_id || isNaN(educator_id) || !institution_id || isNaN(institution_id)) {
            return res.status(400).json({ error: 'Missing required fields: educator_id and institution_id must be numbers' });
        }
        if (status && !['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: pending, approved, rejected' });
        }
        const result = await sql`
            INSERT INTO educatorverification (educator_id, institution_id, status, submitted_at)
            VALUES (${educator_id}, ${institution_id}, ${status || 'pending'}, ${submitted_at || null})
            RETURNING verification_id, educator_id, institution_id, status, submitted_at
        `;
        res.status(201).json({ message: 'Educator verification created successfully', verification: result[0] });
    } catch (error) {
        console.error('Error creating educator verification:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: educator_id or institution_id does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List verifications (optionally by educator_id, institution_id, status)
const getAllEducatorVerifications = async (req, res) => {
    try {
        const { educator_id, institution_id, status } = req.query;
        
        // Build WHERE conditions dynamically
        let whereClause = sql``;
        const conditions = [];
        
        if (educator_id) {
            conditions.push(sql`educator_id = ${educator_id}`);
        }
        if (institution_id) {
            conditions.push(sql`institution_id = ${institution_id}`);
        }
        if (status) {
            conditions.push(sql`status = ${status}`);
        }
        
        // Combine conditions with AND
        if (conditions.length > 0) {
            whereClause = conditions.reduce((acc, condition, index) => {
                if (index === 0) {
                    return sql`WHERE ${condition}`;
                }
                return sql`${acc} AND ${condition}`;
            }, sql``);
        }
        
        const verifications = await sql`
            SELECT verification_id, educator_id, institution_id, status, submitted_at 
            FROM educatorverification
            ${whereClause}
            ORDER BY submitted_at DESC
        `;
        
        res.status(200).json({ message: 'Educator verifications retrieved successfully', verifications });
    } catch (error) {
        console.error('Error fetching educator verifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get by ID
const getEducatorVerificationById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid verification ID' });
        const result = await sql`SELECT verification_id, educator_id, institution_id, status, submitted_at FROM educatorverification WHERE verification_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Educator verification not found' });
        res.status(200).json({ message: 'Educator verification retrieved successfully', verification: result[0] });
    } catch (error) {
        console.error('Error fetching educator verification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update
const updateEducatorVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { educator_id, institution_id, status, submitted_at } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid verification ID' });
        const current = await sql`SELECT educator_id, institution_id, status, submitted_at FROM educatorverification WHERE verification_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Educator verification not found' });
        const updatedEducatorId = educator_id !== undefined ? educator_id : current[0].educator_id;
        const updatedInstitutionId = institution_id !== undefined ? institution_id : current[0].institution_id;
        const updatedStatus = status !== undefined ? status : current[0].status;
        const updatedSubmittedAt = submitted_at !== undefined ? submitted_at : current[0].submitted_at;
        if (updatedStatus && !['pending', 'approved', 'rejected'].includes(updatedStatus)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: pending, approved, rejected' });
        }
        const result = await sql`
            UPDATE educatorverification SET educator_id = ${updatedEducatorId}, institution_id = ${updatedInstitutionId}, status = ${updatedStatus}, submitted_at = ${updatedSubmittedAt}
            WHERE verification_id = ${id}
            RETURNING verification_id, educator_id, institution_id, status, submitted_at
        `;
        res.status(200).json({ message: 'Educator verification updated successfully', verification: result[0] });
    } catch (error) {
        console.error('Error updating educator verification:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid foreign key: educator_id or institution_id does not exist' });
        }
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete
const deleteEducatorVerification = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid verification ID' });
        const result = await sql`DELETE FROM educatorverification WHERE verification_id = ${id} RETURNING verification_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Educator verification not found' });
        res.status(200).json({ message: 'Educator verification deleted successfully' });
    } catch (error) {
        console.error('Error deleting educator verification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createEducatorVerification,
    getAllEducatorVerifications,
    getEducatorVerificationById,
    updateEducatorVerification,
    deleteEducatorVerification
};


