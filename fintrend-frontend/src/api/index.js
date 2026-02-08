// ============================================
// API CLIENT - AXIOS CONFIGURATION
// NO HARDCODING - All from environment
// ============================================

import axios from 'axios';

// Define API URLs
const API_LOCAL = 'http://localhost:5000/api';
const API_PROD = 'https://fintrend-12.onrender.com/api';

// Logic: Use Env Var -> Then Dev/Prod Logic -> Fallback
// Logic: Use Env Var -> Split -> Select based on mode
let envUrls = (import.meta.env.VITE_API_URL || '').split(',').map(u => u.trim()).filter(Boolean);

let API_URL;

if (envUrls.length > 0) {
  if (import.meta.env.MODE === 'development') {
    // Prefer localhost in dev if available, otherwise first one
    API_URL = envUrls.find(u => u.includes('localhost')) || envUrls[0];
  } else {
    // Prefer non-localhost in prod, otherwise first one
    API_URL = envUrls.find(u => !u.includes('localhost')) || envUrls[0];
  }
} else {
  // Fallback if .env is empty/missing
  API_URL = import.meta.env.MODE === 'development' ? API_LOCAL : API_PROD;
}

console.log('🌐 API Target:', API_URL);

if (!API_URL) {
  console.error('❌ VITE_API_URL is missing or invalid!');
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