const express = require('express');
const router = express.Router();
const { healthCheck, databaseHealthCheck } = require('../../controllers/health/healthController');

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check endpoints for monitoring system status
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *       500:
 *         description: Service is unhealthy
 */
router.get('/', healthCheck);

/**
 * @swagger
 * /api/health/database:
 *   get:
 *     summary: Database health check with schema verification
 *     tags: [Health]
 *     description: Checks database connection, verifies critical tables and columns exist
 *     responses:
 *       200:
 *         description: Database is healthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                 issues:
 *                   type: array
 *       503:
 *         description: Database is unhealthy (cannot connect)
 */
router.get('/database', databaseHealthCheck);

module.exports = router;


