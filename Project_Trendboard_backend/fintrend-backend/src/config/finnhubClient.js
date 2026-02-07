// ============================================
// FINNHUB CLIENT - NO HARDCODING
// ============================================

const axios = require('axios');
const logger = require('../utils/logger');
const { FINNHUB } = require('./constants');

if (!FINNHUB.API_KEY) {
  throw new Error('❌ FINNHUB_API_KEY missing in environment');
}

const finnhubClient = axios.create({
  baseURL: FINNHUB.BASE_URL,
  timeout: FINNHUB.TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'X-Finnhub-Token': FINNHUB.API_KEY
  }
});

finnhubClient.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`📡 Finnhub: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    logger.error('Finnhub request error:', error.message);
    return Promise.reject(error);
  }
);

finnhubClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`✅ Finnhub: ${response.status}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    
    if (status === 429) {
      logger.error('⚠️ Finnhub rate limit exceeded');
      error.message = 'Rate limit exceeded. Please wait before retrying.';
    } else if (status === 401) {
      logger.error('❌ Finnhub authentication failed');
      error.message = 'Invalid API key';
    } else if (error.code === 'ECONNABORTED') {
      logger.error('⏱️ Finnhub request timeout');
      error.message = 'Request timeout';
    }
    
    return Promise.reject(error);
  }
);

finnhubClient.safeCall = async (fn, retries = 2, delay = 3000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (error.response?.status === 401 || error.response?.status === 429) {
        throw error;
      }
      
      if (attempt < retries) {
        logger.warn(`Retry ${attempt}/${retries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

module.exports = finnhubClient;