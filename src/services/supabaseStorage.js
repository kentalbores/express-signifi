const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY not configured. File upload will not work.');
}

const supabase = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const BUCKETS = {
    PROFILE_PHOTOS: 'profile-photos',
    COVER_PHOTOS: 'cover-photos',
    COURSE_MATERIALS: 'course-materials'
};

const sanitizeFilename = (filename) => {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
};

const generateUniqueFilename = (originalFilename) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = originalFilename.split('.').pop();
    const sanitized = sanitizeFilename(originalFilename.replace(`.${ext}`, ''));
    return `${sanitized}_${timestamp}_${randomStr}.${ext}`;
};

const uploadFile = async (fileBuffer, originalFilename, bucket, folder = '') => {
    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized. Check environment variables.');
        }

        const uniqueFilename = generateUniqueFilename(originalFilename);
        const filePath = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

        console.log(`Uploading file to bucket: ${bucket}, path: ${filePath}`);

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
                contentType: 'auto',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }

        console.log('File uploaded successfully:', data);
        return {
            path: data.path,
            fullPath: data.fullPath || `${bucket}/${data.path}`
        };

    } catch (error) {
        console.error('Error in uploadFile:', error);
        throw error;
    }
};

const deleteFile = async (filePath, bucket) => {
    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized. Check environment variables.');
        }

        console.log(`Deleting file from bucket: ${bucket}, path: ${filePath}`);

        const { data, error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error('Supabase delete error:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }

        console.log('File deleted successfully:', data);
        return data;

    } catch (error) {
        console.error('Error in deleteFile:', error);
        throw error;
    }
};

const getPublicUrl = (filePath, bucket) => {
    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized. Check environment variables.');
        }

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        if (!data || !data.publicUrl) {
            throw new Error('Failed to generate public URL');
        }

        return data.publicUrl;

    } catch (error) {
        console.error('Error in getPublicUrl:', error);
        throw error;
    }
};

const createBucketsIfNotExist = async () => {
    if (!supabase) {
        console.warn('Supabase not initialized. Skipping bucket creation.');
        return;
    }

    try {
        const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('Error listing buckets:', listError);
            return;
        }

        const bucketNames = existingBuckets.map(b => b.name);

        for (const [key, bucketName] of Object.entries(BUCKETS)) {
            if (!bucketNames.includes(bucketName)) {
                console.log(`Creating bucket: ${bucketName}`);
                const { error } = await supabase.storage.createBucket(bucketName, {
                    public: true,
                    fileSizeLimit: bucketName === BUCKETS.COURSE_MATERIALS ? 104857600 : 5242880
                });

                if (error) {
                    console.error(`Failed to create bucket ${bucketName}:`, error);
                } else {
                    console.log(`Bucket ${bucketName} created successfully`);
                }
            }
        }
    } catch (error) {
        console.error('Error in createBucketsIfNotExist:', error);
    }
};

module.exports = {
    uploadFile,
    deleteFile,
    getPublicUrl,
    createBucketsIfNotExist,
    BUCKETS,
    supabase
};

