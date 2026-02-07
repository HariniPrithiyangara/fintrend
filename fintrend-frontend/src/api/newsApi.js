// ============================================
// NEWS API - ALL NEWS ENDPOINTS
// NO HARDCODING
// ============================================

import apiClient, { safeApiCall } from './index';

/**
 * Fetch news articles with filters
 * @param {string} search - Search query
 * @param {string} category - Category filter (All News, Stocks, Markets, IPOs, Crypto)
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Articles array
 */
export async function fetchNews(search = '', category = 'All News', limit = 100) {
  return safeApiCall(async () => {
    const params = { limit };

    if (search && search.trim()) {
      params.q = search.trim();
    }

    if (category && category !== 'All News') {
      params.category = category;
    }

    const response = await apiClient.get('/news/articles', { params });
    return Array.isArray(response) ? response : [];
  }, []);
}

/**
 * Fetch single article by ID
 * @param {string} id - Article ID
 * @returns {Promise<Object|null>} Article object or null
 */
export async function fetchArticleById(id) {
  return safeApiCall(async () => {
    const response = await apiClient.get(`/news/article/${id}`);
    return response || null;
  }, null);
}

/**
 * Search articles by keyword
 * @param {string} query - Search query
 * @param {string} category - Category filter
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Articles array
 */
export async function searchNews(query, category = null, limit = 50) {
  return safeApiCall(async () => {
    const params = { q: query, limit };

    if (category && category !== 'All News') {
      params.category = category;
    }

    const response = await apiClient.get('/news/search', { params });
    return Array.isArray(response) ? response : [];
  }, []);
}

/**
 * Fetch high impact notifications
 */
export async function fetchNotifications(limit = 5) {
  return safeApiCall(async () => {
    const response = await apiClient.get('/news/articles', {
      params: { impact: 'high', limit }
    });
    return Array.isArray(response) ? response : [];
  }, []);
}

export async function fetchCategoryStats() {
  return safeApiCall(async () => {
    const response = await apiClient.get('/news/categories');
    return response || {};
  }, {});
}

// Export all functions
export default {
  fetchNews,
  fetchArticleById,
  searchNews,
  fetchNotifications,
  fetchCategoryStats
};