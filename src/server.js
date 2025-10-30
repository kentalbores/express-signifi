const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDoc = YAML.load('./src/swagger.yaml');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 5000;
const bodyParser = require('body-parser');
const { swaggerUi, specs } = require('./config/swagger');

// Import routes
const userRoutes = require('./routes/user/userRoutes');
const courseRoutes = require('./routes/course/courseRoutes');
const learnerRoutes = require('./routes/learner/learnerRoutes');
const authRoutes = require('./routes/auth/authRoutes');
const institutionRoutes = require('./routes/institution/institutionRoutes');
const coursemoduleRoutes = require('./routes/coursemodule/coursemoduleRoutes');
const lessonRoutes = require('./routes/lesson/lessonRoutes');
const enrollmentRoutes = require('./routes/enrollment/enrollmentRoutes');
const feedbackRoutes = require('./routes/feedback/feedbackRoutes');
const achievementRoutes = require('./routes/achievement/achievementRoutes');
const activityRoutes = require('./routes/activity/activityRoutes');
const notificationRoutes = require('./routes/notification/notificationRoutes');
const minigameRoutes = require('./routes/minigame/minigameRoutes');
const gameattemptRoutes = require('./routes/gameattempt/gameattemptRoutes');
const transactionRoutes = require('./routes/transaction/transactionRoutes');
const adminactivityRoutes = require('./routes/adminactivity/adminactivityRoutes');
const coursemoderationRoutes = require('./routes/coursemoderation/coursemoderationRoutes');
const educatorverificationRoutes = require('./routes/educatorverification/educatorverificationRoutes');
const courseCategoryRoutes = require('./routes/coursecategory/courseCategoryRoutes');
const educatorRoutes = require('./routes/educator/educatorRoutes');
const superAdminRoutes = require('./routes/superadmin/superAdminRoutes');
const institutionAdminRoutes = require('./routes/institutionadmin/institutionAdminRoutes');
const selfStudyPerformanceRoutes = require('./routes/selfstudy/selfStudyPerformanceRoutes');
const contentPolicyRoutes = require('./routes/contentpolicy/contentPolicyRoutes');
const analyticsRoutes = require('./routes/analytics/analyticsRoutes');
const { paymentsRouter, stripeWebhookHandler } = require('./routes/payment/paymentRoutes');
const fileStorageRoutes = require('./routes/filestorage/fileStorageRoutes');
const healthRoutes = require('./routes/health/healthRoutes');
const subscriptionRoutes = require('./routes/subscription/subscriptionRoutes');
// Stripe webhook must use raw body BEFORE express.json()
app.post('/api/payments/webhook', bodyParser.raw({ type: 'application/json' }), stripeWebhookHandler);

// Middleware
app.use(express.json());

// CORS configuration (permissive for development)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));


// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SigniFi API Documentation'
}));

// Test route
app.get('/test', (req, res) => {
    res.send('hello world');
});

app.get('/test2', (req, res) => {
    res.send('hello world');
});

// Health check routes (no auth required)
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/learner', learnerRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/modules', coursemoduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/minigames', minigameRoutes);
app.use('/api/game-attempts', gameattemptRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin-activities', adminactivityRoutes);
app.use('/api/course-moderations', coursemoderationRoutes);
app.use('/api/educator-verifications', educatorverificationRoutes);
app.use('/api/course-categories', courseCategoryRoutes);
app.use('/api/educators', educatorRoutes);
app.use('/api/super-admins', superAdminRoutes);
app.use('/api/institution-admins', institutionAdminRoutes);
app.use('/api/selfstudy-performances', selfStudyPerformanceRoutes);
app.use('/api/content-policies', contentPolicyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentsRouter);
app.use('/api/files', fileStorageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
