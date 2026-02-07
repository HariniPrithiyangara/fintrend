const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const limiter = require('./src/middleware/rateLimit');
const errorHandler = require('./src/middleware/error.middleware');
const newsRoutes = require('./src/routes/news.routes');
const testRoutes = require('./src/routes/test.routes');
const analyticsRoutes = require('./src/routes/analytics.routes'); // ← ADD THIS

const app = express();

// CORS - Allow frontend
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(helmet());
app.use(express.json());
app.use(limiter);

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/test', testRoutes);
app.use('/api/analytics', analyticsRoutes); // ← ADD THIS

app.use(errorHandler);

module.exports = app;