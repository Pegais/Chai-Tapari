/**
 * Authentication Routes
 * 
 * Why: Define HTTP endpoints for authentication operations
 * How: Maps HTTP methods and paths to controller functions
 * Impact: Provides authentication API endpoints
 * 
 * Route Structure:
 * POST /api/auth/signup - Register new user
 * POST /api/auth/login - Login user
 * GET /api/auth/me - Get current user (protected)
 * POST /api/auth/logout - Logout user
 */

const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { authLimiter } = require('../middleware/rateLimiter')
const { validateRegister, validateLogin } = require('../utils/validators')

/**
 * Register new user
 * POST /api/auth/signup
 * Why: Allow users to create accounts
 * How: Validates input, calls register controller
 * Impact: New users can register through API
 */
router.post('/signup', authLimiter, validateRegister, authController.register)

/**
 * Login user
 * POST /api/auth/login
 * Why: Authenticate users and provide access token
 * How: Validates credentials, calls login controller
 * Impact: Users can access protected routes after login
 */
router.post('/login', authLimiter, validateLogin, authController.login)

/**
 * Get current user
 * GET /api/auth/me
 * Why: Retrieve authenticated user information
 * How: Requires authentication, calls getMe controller
 * Impact: Frontend can get current user data
 */
router.get('/me', authenticate, authController.getMe)

/**
 * Logout user
 * POST /api/auth/logout
 * Why: End user session
 * How: Calls logout controller
 * Impact: User session terminated
 */
router.post('/logout', authenticate, authController.logout)

/**
 * Google OAuth authentication
 * POST /api/auth/google
 * Why: Allow users to sign in with Google
 * How: Verifies Google token and creates/logs in user
 * Impact: Users can authenticate with Google
 */
router.post('/google', authLimiter, authController.googleAuth)

module.exports = router

