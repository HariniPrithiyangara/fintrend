// ============================================
// AI CLIENT (OPENROUTER) - NO HARDCODING
// ============================================

const axios = require('axios');
const logger = require('../utils/logger');
const { OPENROUTER } = require('./constants');

if (!OPENROUTER.API_KEY) {
  throw new Error('❌ OPENROUTER_API_KEY missing in environment');
}

const aiClient = axios.create({
  baseURL: OPENROUTER.BASE_URL,
  timeout: OPENROUTER.TIMEOUT_MS,
  headers: {
    'Authorization': `Bearer ${OPENROUTER.API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
    'X-Title': 'FinTrend'
  }
});

aiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`✅ AI API: ${response.status}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    
    if (status === 429) {
      logger.error('⚠️ AI rate limit exceeded');
      error.message = 'AI rate limit exceeded';
    } else if (status === 401 || status === 402) {
      logger.error('❌ AI authentication/payment failed');
      error.message = 'AI API authentication failed';
    } else if (error.code === 'ECONNABORTED') {
      logger.error('⏱️ AI request timeout');
      error.message = 'AI request timeout';
    }
    
    return Promise.reject(error);
  }
);

aiClient.safeRequest = async (fn, retries = 2, delay = 3000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (error.response?.status === 401 || error.response?.status === 402) {
        throw error;
      }
      
      if (attempt < retries) {
        const waitTime = delay * Math.pow(2, attempt - 1);
        logger.warn(`AI retry ${attempt}/${retries} in ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};

module.exports = aiClient;