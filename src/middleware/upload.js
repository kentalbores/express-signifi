const multer = require('multer');

const FIVE_MB = 5 * 1024 * 1024;
const ONE_HUNDRED_MB = 100 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
];

const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
];

const ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
];

const ALLOWED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg'
];

const ALL_COURSE_MATERIAL_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
    ...ALLOWED_VIDEO_TYPES,
    ...ALLOWED_AUDIO_TYPES
];

const storage = multer.memoryStorage();

const createFileFilter = (allowedTypes, maxSize) => {
    return (req, file, cb) => {
        console.log('File upload attempt:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });

        if (!allowedTypes.includes(file.mimetype)) {
            const error = new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
            error.code = 'INVALID_FILE_TYPE';
            return cb(error, false);
        }

        cb(null, true);
    };
};

const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: `File size exceeds the limit`,
                code: 'FILE_TOO_LARGE'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected field',
                message: 'Unexpected file field in request',
                code: 'UNEXPECTED_FIELD'
            });
        }
        return res.status(400).json({
            error: 'File upload error',
            message: err.message,
            code: err.code
        });
    }

    if (err && err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
            error: 'Invalid file type',
            message: err.message,
            code: 'INVALID_FILE_TYPE'
        });
    }

    next(err);
};

const uploadImageSingle = multer({
    storage: storage,
    limits: {
        fileSize: FIVE_MB
    },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES, FIVE_MB)
}).single('file');

const uploadCourseMaterialSingle = multer({
    storage: storage,
    limits: {
        fileSize: ONE_HUNDRED_MB
    },
    fileFilter: createFileFilter(ALL_COURSE_MATERIAL_TYPES, ONE_HUNDRED_MB)
}).single('file');

const uploadCourseMaterialMultiple = (maxCount = 10) => {
    return multer({
        storage: storage,
        limits: {
            fileSize: ONE_HUNDRED_MB,
            files: maxCount
        },
        fileFilter: createFileFilter(ALL_COURSE_MATERIAL_TYPES, ONE_HUNDRED_MB)
    }).array('files', maxCount);
};

module.exports = {
    uploadImageSingle,
    uploadCourseMaterialSingle,
    uploadCourseMaterialMultiple,
    handleMulterError,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_DOCUMENT_TYPES,
    ALLOWED_VIDEO_TYPES,
    ALLOWED_AUDIO_TYPES,
    ALL_COURSE_MATERIAL_TYPES
};

