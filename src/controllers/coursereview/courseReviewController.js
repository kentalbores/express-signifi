const sql = require('../../config/database');

// Create a new course review
const createReview = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating, title, comment } = req.body;
        const learnerId = req.user.user_id;

        // Validate required fields
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                error: 'Rating is required and must be between 1 and 5'
            });
        }

        // Check if user is enrolled in the course
        const enrollment = await sql`
            SELECT enrollment_id FROM enrollment
            WHERE learner_id = ${learnerId} AND course_id = ${courseId}
            LIMIT 1
        `;

        if (enrollment.length === 0) {
            return res.status(403).json({
                error: 'You must be enrolled in this course to leave a review'
            });
        }

        // Check if user already reviewed this course
        const existingReview = await sql`
            SELECT review_id FROM course_review
            WHERE course_id = ${courseId} AND learner_id = ${learnerId}
        `;

        if (existingReview.length > 0) {
            return res.status(409).json({
                error: 'You have already reviewed this course. Use PUT to update your review.'
            });
        }

        // Insert the review
        const result = await sql`
            INSERT INTO course_review (
                course_id, learner_id, enrollment_id, rating, title, comment
            )
            VALUES (
                ${courseId}, ${learnerId}, ${enrollment[0].enrollment_id},
                ${rating}, ${title || null}, ${comment || null}
            )
            RETURNING *
        `;

        // Update course average rating and total reviews
        await updateCourseRatingStats(courseId);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review: result[0]
        });

    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get all reviews for a course
const getCourseReviews = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { limit = 20, offset = 0, sort = 'recent' } = req.query;

        let orderBy = sql`cr.created_at DESC`;
        if (sort === 'highest') {
            orderBy = sql`cr.rating DESC, cr.created_at DESC`;
        } else if (sort === 'lowest') {
            orderBy = sql`cr.rating ASC, cr.created_at DESC`;
        } else if (sort === 'helpful') {
            orderBy = sql`cr.helpful_count DESC, cr.created_at DESC`;
        }

        const reviews = await sql`
            SELECT 
                cr.review_id, cr.course_id, cr.learner_id, cr.rating, 
                cr.title, cr.comment, cr.is_featured, cr.is_verified_purchase,
                cr.helpful_count, cr.created_at, cr.updated_at,
                (u.first_name || ' ' || u.last_name) as reviewer_name,
                u.profile_picture_url as reviewer_avatar
            FROM course_review cr
            JOIN useraccount u ON cr.learner_id = u.user_id
            WHERE cr.course_id = ${courseId}
            ORDER BY ${orderBy}
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        // Get review statistics
        const stats = await sql`
            SELECT 
                COUNT(*) as total_reviews,
                ROUND(AVG(rating)::numeric, 2) as average_rating,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
            FROM course_review
            WHERE course_id = ${courseId}
        `;

        res.status(200).json({
            success: true,
            reviews,
            stats: stats[0],
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: reviews.length === parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Get a single review by ID
const getReviewById = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const result = await sql`
            SELECT 
                cr.*, 
                (u.first_name || ' ' || u.last_name) as reviewer_name,
                u.profile_picture_url as reviewer_avatar
            FROM course_review cr
            JOIN useraccount u ON cr.learner_id = u.user_id
            WHERE cr.review_id = ${reviewId}
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'Review not found'
            });
        }

        res.status(200).json({
            success: true,
            review: result[0]
        });

    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Update a review (only by the author)
const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;
        const userId = req.user.user_id;

        // Check if review exists and belongs to user
        const existing = await sql`
            SELECT review_id, course_id FROM course_review 
            WHERE review_id = ${reviewId} AND learner_id = ${userId}
        `;

        if (existing.length === 0) {
            return res.status(404).json({
                error: 'Review not found or you do not have permission to edit it'
            });
        }

        // Validate rating if provided
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                error: 'Rating must be between 1 and 5'
            });
        }

        const result = await sql`
            UPDATE course_review
            SET 
                rating = COALESCE(${rating}, rating),
                title = COALESCE(${title}, title),
                comment = COALESCE(${comment}, comment),
                updated_at = NOW()
            WHERE review_id = ${reviewId}
            RETURNING *
        `;

        // Update course average rating
        await updateCourseRatingStats(existing[0].course_id);

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            review: result[0]
        });

    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Delete a review (only by the author or admin)
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.user_id;
        const userRoles = req.user.roles || [];

        // Check if review exists
        const existing = await sql`
            SELECT review_id, course_id, learner_id FROM course_review 
            WHERE review_id = ${reviewId}
        `;

        if (existing.length === 0) {
            return res.status(404).json({
                error: 'Review not found'
            });
        }

        // Check permission: author or admin
        const isAuthor = existing[0].learner_id === userId;
        const isAdmin = userRoles.includes('superadmin') || userRoles.includes('institutionadmin');

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                error: 'You do not have permission to delete this review'
            });
        }

        await sql`DELETE FROM course_review WHERE review_id = ${reviewId}`;

        // Update course average rating
        await updateCourseRatingStats(existing[0].course_id);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Mark a review as helpful
const markReviewHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const result = await sql`
            UPDATE course_review
            SET helpful_count = helpful_count + 1
            WHERE review_id = ${reviewId}
            RETURNING review_id, helpful_count
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'Review not found'
            });
        }

        res.status(200).json({
            success: true,
            helpful_count: result[0].helpful_count
        });

    } catch (error) {
        console.error('Error marking review helpful:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Helper function to update course rating stats
const updateCourseRatingStats = async (courseId) => {
    try {
        const stats = await sql`
            SELECT 
                COUNT(*) as total_reviews,
                COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as average_rating
            FROM course_review
            WHERE course_id = ${courseId}
        `;

        await sql`
            UPDATE course
            SET 
                average_rating = ${stats[0].average_rating},
                total_reviews = ${stats[0].total_reviews}
            WHERE course_id = ${courseId}
        `;
    } catch (error) {
        console.error('Error updating course rating stats:', error);
    }
};

// Get user's review for a specific course
const getUserReviewForCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.user_id;

        const result = await sql`
            SELECT * FROM course_review
            WHERE course_id = ${courseId} AND learner_id = ${userId}
        `;

        res.status(200).json({
            success: true,
            review: result[0] || null,
            hasReviewed: result.length > 0
        });

    } catch (error) {
        console.error('Error fetching user review:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

module.exports = {
    createReview,
    getCourseReviews,
    getReviewById,
    updateReview,
    deleteReview,
    markReviewHelpful,
    getUserReviewForCourse
};
