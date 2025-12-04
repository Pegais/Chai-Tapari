/**
 * User Routes
 * 
 * Why: Define HTTP endpoints for user operations
 * How: Maps HTTP methods and paths to controller functions
 * Impact: Provides user information API endpoints
 * 
 * Route Structure:
 * GET /api/users - Get all users
 * GET /api/users/online - Get online users
 * GET /api/users/:id - Get user by ID
 */

const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { optionalAuth } = require('../middleware/auth')

/**
 * Get all users
 * GET /api/users
 * Why: Retrieve list of all users
 * How: Optional authentication, calls getAllUsers controller
 * Impact: Frontend can display user list
 */
router.get('/', optionalAuth, userController.getAllUsers)

/**
 * Get online users
 * GET /api/users/online
 * Why: Retrieve list of currently online users
 * How: Optional authentication, calls getOnlineUsers controller
 * Impact: Frontend can display online user list
 */
router.get('/online', optionalAuth, userController.getOnlineUsers)

/**
 * Get user by ID
 * GET /api/users/:id
 * Why: Retrieve specific user information
 * How: Optional authentication, calls getUserById controller
 * Impact: Frontend can display user details
 */
router.get('/:id', optionalAuth, userController.getUserById)

module.exports = router

