// ============================================
// API CLIENT - AXIOS CONFIGURATION
// NO HARDCODING - All from environment
// ============================================

import axios from 'axios';

// Get API URL from environment
// Get API URL from environment or default to Render production
const API_URL = import.meta.env.VITE_API_URL || 'https://fintrend-12.onrender.com/api';

if (!API_URL) {
  console.error('❌ VITE_API_URL is missing in .env file!');
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status}`, response.data);
    }

    // Backend returns: { success: true, data: [...], count: X }
    // Extract the 'data' field if it exists, otherwise return full response
    if (response.data && typeof response.data === 'object') {
      // If response has a 'data' field, return it
      if ('data' in response.data) {
        return response.data.data;
      }
      // Otherwise return the whole response.data
      return response.data;
    }

    return response.data;
  },
  (error) => {
    // Handle errors
    const message = error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Network error';

    const status = error.response?.status;

    // Log errors
    console.error('❌ API Error:', {
      url: error.config?.url,
      status,
      message
    });

    // Return formatted error
    return Promise.reject({
      message,
      status,
      data: error.response?.data
    });
  }
);

/**
 * Safe API call wrapper with fallback
 */
export async function safeApiCall(apiFunc, fallback = null) {
  try {
    return await apiFunc();
  } catch (error) {
    console.error('Safe API call failed:', error.message);
    return fallback;
  }
}

/**
 * Get API base URL (for display purposes)
 */
export function getApiUrl() {
  return API_URL;
}

export default apiClient;