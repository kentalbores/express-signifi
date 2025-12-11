const sql = require('../../config/database');

// Create a new institution
const createInstitution = async (req, res) => {
    try {
        const {
            name,
            slug,
            email,
            contact_number,
            address,
            city,
            state,
            country,
            postal_code,
            website,
            logo_url,
            banner_image_url,
            description,
            accreditation_info,
            is_active = true,
            is_verified = false
        } = req.body;

        if (!name || !slug || !email) {
            return res.status(400).json({
                error: 'Missing required fields: name, slug and email are required'
            });
        }

        const result = await sql`
            INSERT INTO institution (
                name, slug, email, contact_number, address, city, state, country, postal_code,
                website, logo_url, banner_image_url, description, accreditation_info, is_active, is_verified
            )
            VALUES (
                ${name}, ${slug}, ${email}, ${contact_number || null}, ${address || null}, ${city || null},
                ${state || null}, ${country || null}, ${postal_code || null}, ${website || null},
                ${logo_url || null}, ${banner_image_url || null}, ${description || null},
                ${accreditation_info || null}, ${is_active}, ${is_verified}
            )
            RETURNING institution_id, name, slug, email, contact_number, address, city, state, country, postal_code,
                      website, logo_url, banner_image_url, description, accreditation_info, is_active, is_verified, created_at
        `;

        res.status(201).json({
            message: 'Institution created successfully',
            institution: result[0]
        });
    } catch (error) {
        console.error('Error creating institution:', error);
        if (error.code === '23505') {
            // Unique violation could be on email or slug
            return res.status(409).json({ error: 'Institution with this email or slug already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all institutions with optional search
const getAllInstitutions = async (req, res) => {
    try {
        const { search } = req.query;
        
        let institutions;
        if (search && search.trim()) {
            const searchTerm = `%${search.trim()}%`;
            institutions = await sql`
                SELECT institution_id, name, slug, email, contact_number, address, city, state, country, postal_code,
                       website, logo_url, banner_image_url, description, accreditation_info, is_active, is_verified, created_at
                FROM institution
                WHERE (name ILIKE ${searchTerm} OR city ILIKE ${searchTerm} OR description ILIKE ${searchTerm})
                  AND is_active = true
                ORDER BY name ASC
            `;
        } else {
            institutions = await sql`
                SELECT institution_id, name, slug, email, contact_number, address, city, state, country, postal_code,
                       website, logo_url, banner_image_url, description, accreditation_info, is_active, is_verified, created_at
                FROM institution
                WHERE is_active = true
                ORDER BY created_at DESC
            `;
        }
        
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
            SELECT institution_id, name, slug, email, contact_number, address, city, state, country, postal_code,
                   website, logo_url, banner_image_url, description, accreditation_info, is_active, is_verified, created_at
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
        const {
            name,
            slug,
            email,
            contact_number,
            address,
            city,
            state,
            country,
            postal_code,
            website,
            logo_url,
            banner_image_url,
            description,
            accreditation_info,
            is_active,
            is_verified
        } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        if (
            name === undefined && slug === undefined && email === undefined && contact_number === undefined &&
            address === undefined && city === undefined && state === undefined && country === undefined &&
            postal_code === undefined && website === undefined && logo_url === undefined && banner_image_url === undefined &&
            description === undefined && accreditation_info === undefined && is_active === undefined && is_verified === undefined
        ) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        const current = await sql`
            SELECT name, slug, email, contact_number, address, city, state, country, postal_code,
                   website, logo_url, banner_image_url, description, accreditation_info, is_active, is_verified
            FROM institution WHERE institution_id = ${id}
        `;
        if (current.length === 0) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        const updatedName = name !== undefined ? name : current[0].name;
        const updatedSlug = slug !== undefined ? slug : current[0].slug;
        const updatedEmail = email !== undefined ? email : current[0].email;
        const updatedContact = contact_number !== undefined ? contact_number : current[0].contact_number;
        const updatedAddress = address !== undefined ? address : current[0].address;
        const updatedCity = city !== undefined ? city : current[0].city;
        const updatedState = state !== undefined ? state : current[0].state;
        const updatedCountry = country !== undefined ? country : current[0].country;
        const updatedPostalCode = postal_code !== undefined ? postal_code : current[0].postal_code;
        const updatedWebsite = website !== undefined ? website : current[0].website;
        const updatedLogoUrl = logo_url !== undefined ? logo_url : current[0].logo_url;
        const updatedBannerUrl = banner_image_url !== undefined ? banner_image_url : current[0].banner_image_url;
        const updatedDescription = description !== undefined ? description : current[0].description;
        const updatedAccreditation = accreditation_info !== undefined ? accreditation_info : current[0].accreditation_info;
        const updatedIsActive = is_active !== undefined ? is_active : current[0].is_active;
        const updatedIsVerified = is_verified !== undefined ? is_verified : current[0].is_verified;

        const result = await sql`
            UPDATE institution
            SET name = ${updatedName}, slug = ${updatedSlug}, email = ${updatedEmail}, contact_number = ${updatedContact},
                address = ${updatedAddress}, city = ${updatedCity}, state = ${updatedState}, country = ${updatedCountry},
                postal_code = ${updatedPostalCode}, website = ${updatedWebsite}, logo_url = ${updatedLogoUrl},
                banner_image_url = ${updatedBannerUrl}, description = ${updatedDescription},
                accreditation_info = ${updatedAccreditation}, is_active = ${updatedIsActive}, is_verified = ${updatedIsVerified}
            WHERE institution_id = ${id}
            RETURNING institution_id, name, slug, email, contact_number, address, city, state, country, postal_code,
                      website, logo_url, banner_image_url, description, accreditation_info, is_active, is_verified, created_at
        `;

        res.status(200).json({
            message: 'Institution updated successfully',
            institution: result[0]
        });
    } catch (error) {
        console.error('Error updating institution:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Institution with this email or slug already exists' });
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


