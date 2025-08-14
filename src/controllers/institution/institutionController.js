const sql = require('../../config/database');

// Create a new institution
const createInstitution = async (req, res) => {
    try {
        const { name, email, contact_number } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                error: 'Missing required fields: name and email are required'
            });
        }

        const result = await sql`
            INSERT INTO institution (name, email, contact_number)
            VALUES (${name}, ${email}, ${contact_number || null})
            RETURNING institution_id, name, email, contact_number, created_at
        `;

        res.status(201).json({
            message: 'Institution created successfully',
            institution: result[0]
        });
    } catch (error) {
        console.error('Error creating institution:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Institution with this email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all institutions
const getAllInstitutions = async (_req, res) => {
    try {
        const institutions = await sql`
            SELECT institution_id, name, email, contact_number, created_at
            FROM institution
            ORDER BY created_at DESC
        `;
        res.status(200).json({
            message: 'Institutions retrieved successfully',
            institutions: institutions
        });
    } catch (error) {
        console.error('Error fetching institutions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get institution by ID
const getInstitutionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        const result = await sql`
            SELECT institution_id, name, email, contact_number, created_at
            FROM institution
            WHERE institution_id = ${id}
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        res.status(200).json({
            message: 'Institution retrieved successfully',
            institution: result[0]
        });
    } catch (error) {
        console.error('Error fetching institution:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update institution
const updateInstitution = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, contact_number } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        if (name === undefined && email === undefined && contact_number === undefined) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        const current = await sql`
            SELECT name, email, contact_number FROM institution WHERE institution_id = ${id}
        `;
        if (current.length === 0) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        const updatedName = name !== undefined ? name : current[0].name;
        const updatedEmail = email !== undefined ? email : current[0].email;
        const updatedContact = contact_number !== undefined ? contact_number : current[0].contact_number;

        const result = await sql`
            UPDATE institution
            SET name = ${updatedName}, email = ${updatedEmail}, contact_number = ${updatedContact}
            WHERE institution_id = ${id}
            RETURNING institution_id, name, email, contact_number, created_at
        `;

        res.status(200).json({
            message: 'Institution updated successfully',
            institution: result[0]
        });
    } catch (error) {
        console.error('Error updating institution:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Institution with this email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete institution
const deleteInstitution = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        const result = await sql`
            DELETE FROM institution WHERE institution_id = ${id} RETURNING institution_id
        `;

        if (result.length === 0) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        res.status(200).json({ message: 'Institution deleted successfully' });
    } catch (error) {
        console.error('Error deleting institution:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Cannot delete institution: it is referenced by other records' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createInstitution,
    getAllInstitutions,
    getInstitutionById,
    updateInstitution,
    deleteInstitution
};


