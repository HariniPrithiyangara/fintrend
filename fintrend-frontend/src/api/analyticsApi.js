// ============================================
// ANALYTICS API - DASHBOARD DATA
// NO HARDCODING
// ============================================

import apiClient, { safeApiCall } from './index';

/**
 * Fetch trending topics
 * @param {string} category - Optional category filter
 * @returns {Promise<Object>} Trends data { topics: [], volumes: [] }
 */
export async function fetchTrends(category = null) {
  return safeApiCall(async () => {
    const params = category ? { category } : {};
    const response = await apiClient.get('/analytics/trends', { params });
    return response || { topics: [], volumes: [] };
  }, { topics: [], volumes: [] });
}

/**
 * Fetch sentiment distribution
 * @param {string} category - Optional category filter
 * @returns {Promise<Object>} Sentiment data { positive: 0, neutral: 0, negative: 0 }
 */
export async function fetchSentiment(category = null) {
  return safeApiCall(async () => {
    const params = category ? { category } : {};
    const response = await apiClient.get('/analytics/sentiment', { params });
    return response || { positive: 0, neutral: 0, negative: 0 };
  }, { positive: 0, neutral: 0, negative: 0 });
}

/**
 * Fetch sector performance
 * @param {string} category - Optional category filter
 * @returns {Promise<Array>} Sector list
 */
export async function fetchSectors(category = null) {
  return safeApiCall(async () => {
    const params = category ? { category } : {};
    const response = await apiClient.get('/analytics/sectors', { params });
    return Array.isArray(response) ? response : [];
  }, []);
}

/**
 * Fetch mentions trend (last 7 days)
 * @param {string} category - Optional category filter
 * @returns {Promise<Object>} Mentions data { labels: [], data: [] }
 */
export async function fetchMentions(category = null) {
  return safeApiCall(async () => {
    const params = category ? { category } : {};
    const response = await apiClient.get('/analytics/mentions', { params });
    return response || { labels: [], data: [] };
  }, { labels: [], data: [] });
}

/**
 * Fetch all dashboard stats in one go
 * @returns {Promise<Object>} Dashboard stats object
 */
export async function fetchDashboardStats() {
  return safeApiCall(async () => {
    const response = await apiClient.get('/analytics/dashboard');
    return response || {};
  }, {});
}

export default {
  fetchTrends,
  fetchSentiment,
  fetchSectors,
  fetchMentions,
  fetchDashboardStats
};