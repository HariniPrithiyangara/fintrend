// ============================================
// RATE LIMITING - FREE TIER PROTECTION
// NO HARDCODING
// ============================================

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT, SERVER } = require('../config/constants');
const logger = require('../utils/logger');

const createRateLimiter = () => {
  const maxRequests = SERVER.IS_DEV ? RATE_LIMIT.DEV_MAX : RATE_LIMIT.MAX;

  const limiter = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: maxRequests,
    message: {
      success: false,
      error: {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(RATE_LIMIT.WINDOW_MS / 1000)
        }
      });
    },
    skip: (req) => req.path === '/api/health'
  });

  logger.info(`Rate limiter: ${maxRequests} requests per ${RATE_LIMIT.WINDOW_MS / 1000}s`);
  return limiter;
};

const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: SERVER.IS_DEV ? 100 : 10,
  message: {
    success: false,
    error: {
      message: 'Rate limit exceeded for this operation.',
      code: 'STRICT_RATE_LIMIT'
    }
  }
});

module.exports = {
  rateLimiter: createRateLimiter(),
  strictRateLimiter
};