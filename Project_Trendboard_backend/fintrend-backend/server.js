// ============================================
// SERVER.JS - MAIN APPLICATION ENTRY
// NO HARDCODING - PRODUCTION READY
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { SERVER } = require('./src/config/constants');
const logger = require('./src/utils/logger');
const { initializeFirebase, testConnection, shutdown: firebaseShutdown } = require('./src/config/firebase');
const { errorHandler, notFoundHandler } = require('./src/middleware/error.middleware');
const { rateLimiter } = require('./src/middleware/rateLimit');
const { validateEnv } = require('./src/config/validateEnv');

// Validate environment
validateEnv();

// Import routes
const newsRoutes = require('./src/routes/news.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const authRoutes = require('./src/routes/auth.routes');


// Import cron
const { scheduleNewsFetch, initialFetchIfRequired, getCronStatus, stopCron } = require('./src/jobs/newsCron');

// Create Express app
const app = express();

// ========== MIDDLEWARE ==========

// Security
app.use(helmet({
  contentSecurityPolicy: SERVER.IS_PROD,
  crossOriginEmbedderPolicy: SERVER.IS_PROD
}));

// CORS
app.use(cors({
  origin: SERVER.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Rate limiting
app.use('/api/', rateLimiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (SERVER.IS_DEV || duration > 1000) {
      logger.http(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FinTrend API',
    status: 'running',
    docs: '/api/docs',
    health: '/api/health'
  });
});

// ========== ROUTES ==========

// Health check
app.get('/api/health', async (req, res) => {
  const healthy = await testConnection();
  const cronStatus = getCronStatus();

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: SERVER.NODE_ENV,
    checks: {
      firestore: healthy,
      cron: cronStatus
    }
  });
});

// API routes
app.use('/api/news', newsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);


// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// ========== STARTUP ==========

async function startServer() {
  try {
    // Initialize Firebase
    logger.info('🔥 Initializing Firebase...');
    initializeFirebase();

    // 4. Test Firestore Connection (Non-blocking)
    const isDbConnected = await testConnection();
    if (isDbConnected) {
      logger.info('✅ Firestore connected successfully');
    } else {
      logger.warn('⚠️ Firestore connection failed during startup. API endpoints may fail until resolved.');
      // We continue startup instead of crashing
    }
    // Run initial fetch if configured (non-blocking)
    initialFetchIfRequired().catch(err => logger.error('Initial fetch failed:', err));

    // Schedule cron if enabled
    scheduleNewsFetch();

    // Start server
    const server = app.listen(SERVER.PORT, () => {
      logger.info('');
      logger.info('═'.repeat(60));
      const PORT = process.env.PORT || 5000;
      const NODE_ENV = process.env.NODE_ENV || 'production'; // Default to production on cloud

      logger.info(`Rate limiter: ${process.env.RATE_LIMIT_MAX || 100} requests per 900s`);

      // Validation
      console.log('✅ Environment validation complete');
      console.log(`🔧 Environment: ${NODE_ENV}`);
      console.log(`📡 Server Port: ${PORT}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'Not Set'}`);
      logger.info('═'.repeat(60));
      logger.info('');
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      logger.info(`📴 ${signal} received - Starting graceful shutdown...`);

      // Close HTTP server
      server.close(() => {
        logger.info('✅ HTTP server closed');
      });

      // Stop cron jobs
      try {
        await stopCron();
        logger.info('✅ Cron jobs stopped');
      } catch (error) {
        logger.error('⚠️ Error stopping cron:', error);
      }

      // Shutdown Firebase
      try {
        await firebaseShutdown();
        logger.info('✅ Firebase shutdown complete');
      } catch (error) {
        logger.error('⚠️ Error shutting down Firebase:', error);
      }

      // Force exit after timeout
      setTimeout(() => {
        logger.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
      }, SERVER.SHUTDOWN_TIMEOUT_MS);

      logger.info('✅ Graceful shutdown complete');
      process.exit(0);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;