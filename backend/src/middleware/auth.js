/**
 * Authentication Middleware
 * 
 * Why: Protect routes by verifying JWT tokens
 * How: Extracts token from Authorization header, verifies it, attaches user to request
 * Impact: Ensures only authenticated users can access protected routes
 * 
 * Common Errors:
 * 1. Token missing - No Authorization header provided
 * 2. Invalid token - Token signature invalid or expired
 * 3. User not found - Token valid but user does not exist
 */

const authService = require('../services/authService')

/**
 * Verify JWT token and authenticate user
 * Why: Protect routes from unauthorized access
 * How: Extracts token from header, verifies it, attaches user to request object
 * Impact: Protected routes can access authenticated user information
 * 
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Verify token using JWT secret
 * 3. Extract user ID from token payload
 * 4. Attach user information to request object
 * 5. Call next middleware
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authentication token required')
      error.statusCode = 401
      return next(error)
    }

    const token = authHeader.substring(7)

    // Verify token
    const decoded = authService.verifyToken(token)

    // Attach user to request
    req.user = {
      userId: decoded.userId,
    }

    next()
  } catch (error) {
    error.statusCode = 401
    error.message = 'Invalid or expired token'
    next(error)
  }
}

/**
 * Optional authentication middleware
 * Why: Allow routes to work with or without authentication
 * How: Verifies token if present, but doesn't fail if missing
 * Impact: Some routes can show different data for authenticated vs unauthenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = authService.verifyToken(token)
      req.user = {
        userId: decoded.userId,
      }
    }

    next()
  } catch (error) {
    // If token invalid, continue without authentication
    next()
  }
}

module.exports = {
  authenticate,
  optionalAuth,
}

