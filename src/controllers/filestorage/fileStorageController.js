const sql = require('../../config/database');
const { uploadFile, deleteFile, getPublicUrl, BUCKETS } = require('../../services/supabaseStorage');

const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file provided',
                message: 'Please upload an image file'
            });
        }

        const userId = req.user.user_id;
        const file = req.file;

        console.log('Uploading profile photo for user:', userId);

        const uploadResult = await uploadFile(
            file.buffer,
            file.originalname,
            BUCKETS.PROFILE_PHOTOS,
            `user_${userId}`
        );

        const publicUrl = getPublicUrl(uploadResult.path, BUCKETS.PROFILE_PHOTOS);

        const fileStorageResult = await sql`
            INSERT INTO file_storage (
                original_filename,
                stored_filename,
                file_path,
                file_size,
                mime_type,
                file_type,
                uploaded_by,
                is_public
            )
            VALUES (
                ${file.originalname},
                ${uploadResult.path},
                ${publicUrl},
                ${file.size},
                ${file.mimetype},
                'profile_photo',
                ${userId},
                true
            )
            RETURNING file_id, file_path, created_at
        `;

        const userUpdateResult = await sql`
            UPDATE useraccount
            SET profile_picture_url = ${publicUrl},
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ${userId}
            RETURNING user_id, profile_picture_url
        `;

        res.status(200).json({
            message: 'Profile photo uploaded successfully',
            file: {
                file_id: fileStorageResult[0].file_id,
                url: publicUrl,
                uploaded_at: fileStorageResult[0].created_at
            },
            user: userUpdateResult[0]
        });

    } catch (error) {
        console.error('Error uploading profile photo:', error);
        res.status(500).json({
            error: 'Failed to upload profile photo',
            message: error.message
        });
    }
};

const uploadCoverPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file provided',
                message: 'Please upload an image file'
            });
        }

        const userId = req.user.user_id;
        const file = req.file;

        console.log('Uploading cover photo for user:', userId);

        const uploadResult = await uploadFile(
            file.buffer,
            file.originalname,
            BUCKETS.COVER_PHOTOS,
            `user_${userId}`
        );

        const publicUrl = getPublicUrl(uploadResult.path, BUCKETS.COVER_PHOTOS);

        const fileStorageResult = await sql`
            INSERT INTO file_storage (
                original_filename,
                stored_filename,
                file_path,
                file_size,
                mime_type,
                file_type,
                uploaded_by,
                is_public
            )
            VALUES (
                ${file.originalname},
                ${uploadResult.path},
                ${publicUrl},
                ${file.size},
                ${file.mimetype},
                'cover_photo',
                ${userId},
                true
            )
            RETURNING file_id, file_path, created_at
        `;

        const userUpdateResult = await sql`
            UPDATE useraccount
            SET cover_photo_url = ${publicUrl},
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ${userId}
            RETURNING user_id, cover_photo_url
        `;

        res.status(200).json({
            message: 'Cover photo uploaded successfully',
            file: {
                file_id: fileStorageResult[0].file_id,
                url: publicUrl,
                uploaded_at: fileStorageResult[0].created_at
            },
            user: userUpdateResult[0]
        });

    } catch (error) {
        console.error('Error uploading cover photo:', error);
        res.status(500).json({
            error: 'Failed to upload cover photo',
            message: error.message
        });
    }
};

const uploadCourseMaterial = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file provided',
                message: 'Please upload a file'
            });
        }

        const { lesson_id } = req.body;
        const userId = req.user.user_id;
        const file = req.file;

        if (!lesson_id || isNaN(lesson_id)) {
            return res.status(400).json({
                error: 'Invalid lesson_id',
                message: 'Please provide a valid lesson_id'
            });
        }

        const lessonCheck = await sql`
            SELECT lesson_id, title FROM lesson WHERE lesson_id = ${lesson_id}
        `;

        if (lessonCheck.length === 0) {
            return res.status(404).json({
                error: 'Lesson not found',
                message: `No lesson found with ID ${lesson_id}`
            });
        }

        console.log('Uploading course material for lesson:', lesson_id);

        const uploadResult = await uploadFile(
            file.buffer,
            file.originalname,
            BUCKETS.COURSE_MATERIALS,
            `lesson_${lesson_id}`
        );

        const publicUrl = getPublicUrl(uploadResult.path, BUCKETS.COURSE_MATERIALS);

        const fileStorageResult = await sql`
            INSERT INTO file_storage (
                original_filename,
                stored_filename,
                file_path,
                file_size,
                mime_type,
                file_type,
                uploaded_by,
                is_public
            )
            VALUES (
                ${file.originalname},
                ${uploadResult.path},
                ${publicUrl},
                ${file.size},
                ${file.mimetype},
                'course_material',
                ${userId},
                true
            )
            RETURNING file_id, file_path, created_at
        `;

        const materialType = file.mimetype.startsWith('video/') ? 'video' :
                            file.mimetype.startsWith('audio/') ? 'audio' :
                            file.mimetype.startsWith('image/') ? 'image' :
                            'document';

        const lessonUpdateResult = await sql`
            UPDATE lesson
            SET original_filename = ${file.originalname},
                stored_filename = ${uploadResult.path},
                file_path = ${publicUrl},
                file_size = ${file.size},
                mime_type = ${file.mimetype},
                material_type = ${materialType},
                streaming_url = ${materialType === 'video' ? publicUrl : null},
                updated_at = CURRENT_TIMESTAMP
            WHERE lesson_id = ${lesson_id}
            RETURNING lesson_id, title, file_path, material_type
        `;

        res.status(200).json({
            message: 'Course material uploaded successfully',
            file: {
                file_id: fileStorageResult[0].file_id,
                url: publicUrl,
                uploaded_at: fileStorageResult[0].created_at
            },
            lesson: lessonUpdateResult[0]
        });

    } catch (error) {
        console.error('Error uploading course material:', error);
        res.status(500).json({
            error: 'Failed to upload course material',
            message: error.message
        });
    }
};

const deleteFileById = async (req, res) => {
    try {
        const { file_id } = req.params;
        const userId = req.user.user_id;
        const userRoles = req.user.roles || [];

        if (!file_id || isNaN(file_id)) {
            return res.status(400).json({
                error: 'Invalid file_id',
                message: 'Please provide a valid file_id'
            });
        }

        const fileRecord = await sql`
            SELECT * FROM file_storage WHERE file_id = ${file_id}
        `;

        if (fileRecord.length === 0) {
            return res.status(404).json({
                error: 'File not found',
                message: `No file found with ID ${file_id}`
            });
        }

        const file = fileRecord[0];

        const isOwner = file.uploaded_by === userId;
        const isAdmin = userRoles.includes('superadmin') || userRoles.includes('institutionadmin');

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to delete this file'
            });
        }

        let bucket = BUCKETS.COURSE_MATERIALS;
        if (file.file_type === 'profile_photo') {
            bucket = BUCKETS.PROFILE_PHOTOS;
        } else if (file.file_type === 'cover_photo') {
            bucket = BUCKETS.COVER_PHOTOS;
        }

        await deleteFile(file.stored_filename, bucket);

        await sql`
            DELETE FROM file_storage WHERE file_id = ${file_id}
        `;

        if (file.file_type === 'profile_photo') {
            await sql`
                UPDATE useraccount
                SET profile_picture_url = NULL
                WHERE user_id = ${file.uploaded_by}
            `;
        } else if (file.file_type === 'cover_photo') {
            await sql`
                UPDATE useraccount
                SET cover_photo_url = NULL
                WHERE user_id = ${file.uploaded_by}
            `;
        }

        res.status(200).json({
            message: 'File deleted successfully',
            file_id: file_id
        });

    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            error: 'Failed to delete file',
            message: error.message
        });
    }
};

const getFileMetadata = async (req, res) => {
    try {
        const { file_id } = req.params;

        if (!file_id || isNaN(file_id)) {
            return res.status(400).json({
                error: 'Invalid file_id',
                message: 'Please provide a valid file_id'
            });
        }

        const fileRecord = await sql`
            SELECT 
                f.file_id,
                f.original_filename,
                f.stored_filename,
                f.file_path,
                f.file_size,
                f.mime_type,
                f.file_type,
                f.uploaded_by,
                f.is_public,
                f.created_at,
                u.first_name,
                u.last_name,
                u.email
            FROM file_storage f
            LEFT JOIN useraccount u ON f.uploaded_by = u.user_id
            WHERE f.file_id = ${file_id}
        `;

        if (fileRecord.length === 0) {
            return res.status(404).json({
                error: 'File not found',
                message: `No file found with ID ${file_id}`
            });
        }

        res.status(200).json({
            message: 'File metadata retrieved successfully',
            file: fileRecord[0]
        });

    } catch (error) {
        console.error('Error retrieving file metadata:', error);
        res.status(500).json({
            error: 'Failed to retrieve file metadata',
            message: error.message
        });
    }
};

module.exports = {
    uploadProfilePhoto,
    uploadCoverPhoto,
    uploadCourseMaterial,
    deleteFileById,
    getFileMetadata
};

