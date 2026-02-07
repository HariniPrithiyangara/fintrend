// ============================================
// CONSTANTS - CENTRALIZED CONFIGURATION
// NO HARDCODING - All values from environment
// ============================================

require('dotenv').config();

const getEnv = (key, defaultValue = null) => {
  const value = process.env[key];
  if (value === undefined && defaultValue === null) {
    // Check if we are in production - we want to be strict in production but relaxed in dev
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`❌ Missing required environment variable: ${key}`);
    }
    console.warn(`⚠️ Warning: Missing environment variable ${key}. Using null.`);
    return null;
  }
  return value || defaultValue;
};

const getEnvNumber = (key, defaultValue) => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key, defaultValue = false) => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
};

module.exports = {
  SERVER: {
    PORT: getEnvNumber('PORT', 5000),
    NODE_ENV: process.env.NODE_ENV || 'production',
    FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:5173'),
    SHUTDOWN_TIMEOUT_MS: getEnvNumber('SHUTDOWN_TIMEOUT_MS', 10000),
    IS_DEV: (process.env.NODE_ENV || 'production') === 'development',
    IS_PROD: (process.env.NODE_ENV || 'production') === 'production'
  },

  FIRESTORE: {
    COLLECTION: getEnv('FIRESTORE_COLLECTION', 'articles'),
    // Free tier limits: 50K reads/day, 20K writes/day, 1GB storage
    // Optimized for free tier usage
    RETENTION_DAYS: getEnvNumber('FIRESTORE_RETENTION_DAYS', 30), // Keep only 30 days
    MAX_RESULTS: getEnvNumber('FIRESTORE_MAX_RESULTS', 100), // Limit query results
    MAX_TOTAL_ARTICLES: getEnvNumber('FIRESTORE_MAX_TOTAL_ARTICLES', 500), // Total doc limit
    ENRICHMENT_QUEUE: getEnv('ENRICHMENT_QUEUE_COLLECTION', 'enrichmentQueue'),
    // Free tier daily limits
    DAILY_READ_LIMIT: 45000, // Leave buffer from 50K
    DAILY_WRITE_LIMIT: 18000, // Leave buffer from 20K
    STORAGE_LIMIT_MB: 900 // Leave buffer from 1GB
  },

  FINNHUB: {
    API_KEY: getEnv('FINNHUB_API_KEY'),
    BASE_URL: getEnv('FINNHUB_BASE_URL', 'https://finnhub.io/api/v1'),
    TIMEOUT_MS: getEnvNumber('FINNHUB_TIMEOUT_MS', 15000),
    IPO_WINDOW_DAYS: getEnvNumber('FINNHUB_IPO_WINDOW_DAYS', 30),
    CATEGORIES: {
      GENERAL: 'general',
      FOREX: 'forex',
      CRYPTO: 'crypto',
      MERGER: 'merger'
    }
  },

  OPENROUTER: {
    API_KEY: getEnv('OPENROUTER_API_KEY'),
    BASE_URL: getEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1/chat/completions'),
    MODEL: getEnv('OPENROUTER_MODEL', 'meta-llama/llama-4-maverick:free'),
    TEMPERATURE: parseFloat(getEnv('OPENROUTER_TEMPERATURE', '0.2')),
    MAX_TOKENS: getEnvNumber('OPENROUTER_MAX_TOKENS', 350),
    TIMEOUT_MS: getEnvNumber('OPENROUTER_TIMEOUT_MS', 30000)
  },

  RATE_LIMIT: {
    WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
    MAX: getEnvNumber('RATE_LIMIT_MAX', 100),
    DEV_MAX: getEnvNumber('RATE_LIMIT_DEV_MAX', 1000)
  },

  CRON: {
    ENABLE: getEnvBoolean('ENABLE_CRON', false),
    RUN_INITIAL: getEnvBoolean('RUN_INITIAL_FETCH', false),
    SCHEDULE: getEnv('NEWS_FETCH_CRON', '0 */6 * * *'),
    LOCK_TTL_MS: getEnvNumber('CRON_LOCK_TTL_MS', 600000),
    BATCH_SIZE: getEnvNumber('CRON_BATCH_SIZE', 5),
    BATCH_DELAY_MS: getEnvNumber('CRON_BATCH_DELAY_MS', 2000)
  },

  ANALYTICS: {
    CACHE_TTL_MS: getEnvNumber('ANALYTICS_CACHE_TTL_MS', 60000)
  },

  WORKER: {
    POLL_INTERVAL_MS: getEnvNumber('ENRICH_POLL_INTERVAL_MS', 3000),
    BATCH_SIZE: getEnvNumber('ENRICH_BATCH_SIZE', 3)
  },

  SCRIPTS: {
    ALLOW: getEnvBoolean('ALLOW_SCRIPTS', false)
  },

  // UI Categories mapping
  CATEGORIES: {
    ALL: 'All News',
    STOCKS: 'Stocks',
    IPOS: 'IPOs',
    CRYPTO: 'Crypto'
  },

  SENTIMENT: {
    POSITIVE: 'positive',
    NEUTRAL: 'neutral',
    NEGATIVE: 'negative'
  },

  IMPACT: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  }
};