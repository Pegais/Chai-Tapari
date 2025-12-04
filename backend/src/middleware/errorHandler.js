/**
 * Error Handler Middleware
 * 
 * Why: Centralized error handling and logging
 * How: Catches errors, logs them, returns appropriate HTTP responses
 * Impact: Consistent error responses and centralized error logging
 * 
 * Common Error Types:
 * 1. Validation errors - 400 Bad Request
 * 2. Authentication errors - 401 Unauthorized
 * 3. Authorization errors - 403 Forbidden
 * 4. Not found errors - 404 Not Found
 * 5. Conflict errors - 409 Conflict
 * 6. Server errors - 500 Internal Server Error
 */

const logger = require('../utils/logger')

/**
 * Global error handler middleware
 * Why: Catch and handle all errors consistently
 * How: Checks error status code, logs error, returns formatted response
 * Impact: All errors are handled uniformly with proper logging
 * 
 * Flow:
 * 1. Check if error has statusCode property
 * 2. Log error with appropriate level
 * 3. Return formatted error response
 * 4. Default to 500 for unknown errors
 */
const errorHandler = (err, req, res, next) => {
  // Determine status code
  const statusCode = err.statusCode || 500

  // Determine error message
  const message = err.message || 'Internal server error'

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    })
  } else {
    logger.warn('Client Error:', {
      error: err.message,
      statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip,
    })
  }

  // Return error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

/**
 * 404 Not Found handler
 * Why: Handle requests to non-existent routes
 * How: Returns 404 error for unmatched routes
 * Impact: Consistent 404 responses for invalid routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.url}`)
  error.statusCode = 404
  next(error)
}

module.exports = {
  errorHandler,
  notFound,
}

