const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const userRoutes = require('./routes/user/userRoutes');

// Middleware
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
    res.send('hello world');
});

// API routes
app.use('/api/users', userRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API endpoints available at:`);
    console.log(`- GET    /test`);
    console.log(`- POST   /api/users`);
    console.log(`- GET    /api/users`);
    console.log(`- GET    /api/users/:id`);
    console.log(`- PUT    /api/users/:id`);
    console.log(`- DELETE /api/users/:id`);
});

module.exports = app;
