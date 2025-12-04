/**
 * Axios Configuration
 * 
 * Why: Centralized HTTP client configuration with interceptors
 * How: Creates axios instance with base URL, request/response interceptors
 * Impact: Consistent API calls with authentication, error handling, and logging
 * 
 * Features:
 * 1. Base URL configuration
 * 2. Request interceptor for adding auth token
 * 3. Response interceptor for error handling
 * 4. Request/response logging
 * 5. CORS handling
 */

import axios from 'axios'

/**
 * Get API base URL from environment
 * Why: Support different environments (dev, staging, production)
 * How: Reads from environment variable or defaults to localhost
 * Impact: Easy environment-specific configuration
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

/**
 * Create axios instance
 * Why: Configure default settings for all API requests
 * How: Creates axios instance with base URL and timeout
 * Impact: All API calls use consistent configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true is not needed since we're using JWT tokens in Authorization header
  // However, if backend sets cookies, this should be true
  withCredentials: false, // Using JWT tokens in headers, not cookies
})

/**
 * Request interceptor
 * Why: Add authentication token and log requests
 * How: Intercepts requests before they are sent
 * Impact: Automatic token injection and request logging
 * 
 * Flow:
 * 1. Get token from localStorage
 * 2. Add Authorization header if token exists
 * 3. Log request details
 * 4. Return modified config
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token')
    
    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Log request (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
        headers: config.headers,
      })
    }

    return config
  },
  (error) => {
    // Log request error
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

/**
 * Response interceptor
 * Why: Handle responses, errors, and logging
 * How: Intercepts responses before they reach components
 * Impact: Centralized error handling and response logging
 * 
 * Flow:
 * 1. Log successful responses
 * 2. Handle authentication errors (401)
 * 3. Handle other errors
 * 4. Return response or reject with error
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      })
    }

    return response
  },
  (error) => {
    // Handle response errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response

      // Log error response
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status,
        message: data?.message || error.message,
        data: data,
      })

      // Handle 401 Unauthorized - Clear token and redirect to login
      if (status === 401) {
        console.warn('[API] Unauthorized - Clearing session')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.warn('[API] Forbidden - Insufficient permissions')
      }

      // Handle 404 Not Found
      if (status === 404) {
        console.warn('[API] Resource not found')
      }

      // Handle 500 Server Error
      if (status >= 500) {
        console.error('[API] Server error occurred')
      }

      // Return error with formatted message
      return Promise.reject({
        message: data?.message || 'An error occurred',
        status,
        data: data?.data || data,
        errors: data?.errors || [],
      })
    } else if (error.request) {
      // Request made but no response received
      console.error('[API] No response received', error.request)
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
      })
    } else {
      // Error setting up request
      console.error('[API] Request setup error', error.message)
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0,
      })
    }
  }
)

export default apiClient

