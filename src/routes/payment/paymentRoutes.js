const express = require('express');
const router = express.Router();
const { authenticateToken, requireLearner } = require('../../middleware/auth');
const { createPaymentIntent, stripeWebhook } = require('../../controllers/payment/paymentController');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing endpoints
 */

/**
 * @swagger
 * /api/payments/intent:
 *   post:
 *     summary: Create payment intent for course purchase
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_id
 *               - amount
 *             properties:
 *               course_id:
 *                 type: integer
 *                 description: ID of the course to purchase
 *               amount:
 *                 type: number
 *                 description: Payment amount in cents
 *               currency:
 *                 type: string
 *                 default: usd
 *                 description: Payment currency
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 client_secret:
 *                   type: string
 *                   description: Stripe client secret for frontend
 *                 payment_intent_id:
 *                   type: string
 *                   description: Stripe payment intent ID
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Payments]
 *     description: Handles Stripe webhook events for payment processing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature or payload
 */

// Stripe requires raw body for webhook signature verification
// We'll mount webhook separately in server.js with express.raw

router.post('/intent', authenticateToken, requireLearner, createPaymentIntent);

module.exports = {
  paymentsRouter: router,
  stripeWebhookHandler: stripeWebhook
};


