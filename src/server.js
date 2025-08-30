const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 5000;

// Import routes
const userRoutes = require('./routes/user/userRoutes');
const courseRoutes = require('./routes/course/courseRoutes');
const learnerRoutes = require('./routes/learner/learnerRoutes');
const authRoutes = require('./routes/auth/authRoutes');
const institutionRoutes = require('./routes/institution/institutionRoutes');
const coursemoduleRoutes = require('./routes/coursemodule/coursemoduleRoutes');
const lessonRoutes = require('./routes/lesson/lessonRoutes');
const enrollmentRoutes = require('./routes/enrollment/enrollmentRoutes');
const attemptRoutes = require('./routes/attempt/attemptRoutes');
const feedbackRoutes = require('./routes/feedback/feedbackRoutes');
const achievementRoutes = require('./routes/achievement/achievementRoutes');
const activityRoutes = require('./routes/activity/activityRoutes');
const notificationRoutes = require('./routes/notification/notificationRoutes');
const minigameRoutes = require('./routes/minigame/minigameRoutes');
const gameattemptRoutes = require('./routes/gameattempt/gameattemptRoutes');
const transactionRoutes = require('./routes/transaction/transactionRoutes');
const adminactivityRoutes = require('./routes/adminactivity/adminactivityRoutes');

// Middleware
app.use(express.json());

// CORS configuration (permissive for development)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));


// Test route
app.get('/test', (req, res) => {
    res.send('hello world');
});

app.get('/test2', (req, res) => {
    res.send('hello world');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/learner', learnerRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/modules', coursemoduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/minigames', minigameRoutes);
app.use('/api/game-attempts', gameattemptRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin-activities', adminactivityRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
