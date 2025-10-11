const express = require('express');
const router = express.Router();
const {
    uploadProfilePhoto,
    uploadCoverPhoto,
    uploadCourseMaterial,
    deleteFileById,
    getFileMetadata
} = require('../../controllers/filestorage/fileStorageController');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { 
    uploadImageSingle, 
    uploadCourseMaterialSingle, 
    handleMulterError 
} = require('../../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: File Storage
 *   description: File upload and management endpoints
 */

/**
 * @swagger
 * /api/files/upload/profile-photo:
 *   post:
 *     summary: Upload user profile photo
 *     tags: [File Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, GIF)
 *     responses:
 *       200:
 *         description: Profile photo uploaded successfully
 *       400:
 *         description: Bad request or invalid file type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
    '/upload/profile-photo',
    authenticateToken,
    (req, res, next) => {
        uploadImageSingle(req, res, (err) => {
            if (err) return handleMulterError(err, req, res, next);
            next();
        });
    },
    uploadProfilePhoto
);

/**
 * @swagger
 * /api/files/upload/cover-photo:
 *   post:
 *     summary: Upload user cover photo
 *     tags: [File Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, GIF)
 *     responses:
 *       200:
 *         description: Cover photo uploaded successfully
 *       400:
 *         description: Bad request or invalid file type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
    '/upload/cover-photo',
    authenticateToken,
    (req, res, next) => {
        uploadImageSingle(req, res, (err) => {
            if (err) return handleMulterError(err, req, res, next);
            next();
        });
    },
    uploadCoverPhoto
);

/**
 * @swagger
 * /api/files/upload/course-material:
 *   post:
 *     summary: Upload course material (video, document, audio, image)
 *     tags: [File Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - lesson_id
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Course material file
 *               lesson_id:
 *                 type: integer
 *                 description: ID of the lesson this material belongs to
 *     responses:
 *       200:
 *         description: Course material uploaded successfully
 *       400:
 *         description: Bad request or invalid file type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires educator or admin role
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Internal server error
 */
router.post(
    '/upload/course-material',
    authenticateToken,
    requireRole(['educator', 'institutionadmin', 'superadmin']),
    (req, res, next) => {
        uploadCourseMaterialSingle(req, res, (err) => {
            if (err) return handleMulterError(err, req, res, next);
            next();
        });
    },
    uploadCourseMaterial
);

/**
 * @swagger
 * /api/files/{file_id}:
 *   get:
 *     summary: Get file metadata by ID
 *     tags: [File Storage]
 *     parameters:
 *       - in: path
 *         name: file_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File metadata retrieved successfully
 *       400:
 *         description: Invalid file_id
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete file by ID
 *     tags: [File Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: file_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       400:
 *         description: Invalid file_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not file owner or admin
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
router.get('/:file_id', getFileMetadata);
router.delete('/:file_id', authenticateToken, deleteFileById);

module.exports = router;

