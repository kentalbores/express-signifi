const express = require('express');
const router = express.Router();
const {
    createContentPolicy,
    getAllContentPolicies,
    getActivePoliciesByType,
    getContentPolicyById,
    updateContentPolicy,
    deleteContentPolicy
} = require('../../controllers/contentpolicy/contentPolicyController');
const { authenticateToken, requireSuperAdmin } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Content Policies
 *   description: Content policy management endpoints
 */

/**
 * @swagger
 * /api/content-policies:
 *   post:
 *     summary: Create a new content policy (superadmin only)
 *     tags: [Content Policies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               policy_type:
 *                 type: string
 *                 enum: [privacy, terms, community, general]
 *                 default: general
 *               version:
 *                 type: string
 *                 default: "1.0"
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Content policy created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Superadmin role required
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get all content policies
 *     tags: [Content Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: policy_type
 *         schema:
 *           type: string
 *           enum: [privacy, terms, community, general]
 *         description: Filter by policy type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of policies to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of policies to skip
 *     responses:
 *       200:
 *         description: Content policies retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/content-policies/active:
 *   get:
 *     summary: Get active content policies
 *     tags: [Content Policies]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [privacy, terms, community, general]
 *         description: Filter by specific policy type
 *     responses:
 *       200:
 *         description: Active content policies retrieved successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/content-policies/{id}:
 *   get:
 *     summary: Get content policy by ID
 *     tags: [Content Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy ID
 *     responses:
 *       200:
 *         description: Content policy retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Content policy not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update content policy (superadmin only)
 *     tags: [Content Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               policy_type:
 *                 type: string
 *                 enum: [privacy, terms, community, general]
 *               version:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Content policy updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Superadmin role required
 *       404:
 *         description: Content policy not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete content policy (superadmin only)
 *     tags: [Content Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy ID
 *     responses:
 *       200:
 *         description: Content policy deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Superadmin role required
 *       404:
 *         description: Content policy not found
 *       500:
 *         description: Internal server error
 */

// Content policy routes
router.post('/', authenticateToken, requireSuperAdmin, createContentPolicy);        // POST /api/content-policies - Create policy (superadmin only)
router.get('/', authenticateToken, getAllContentPolicies);                         // GET /api/content-policies - Get all policies
router.get('/active', getActivePoliciesByType);                                   // GET /api/content-policies/active - Get active policies (public)
router.get('/:id', authenticateToken, getContentPolicyById);                      // GET /api/content-policies/:id - Get policy by ID
router.put('/:id', authenticateToken, requireSuperAdmin, updateContentPolicy);    // PUT /api/content-policies/:id - Update policy (superadmin only)
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteContentPolicy); // DELETE /api/content-policies/:id - Delete policy (superadmin only)

module.exports = router;
