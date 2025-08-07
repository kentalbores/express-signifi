const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const userRoutes = require('./routes/user/userRoutes');
const courseRoutes = require('./routes/course/courseRoutes');

// Middleware
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
    res.send('hello world');
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
