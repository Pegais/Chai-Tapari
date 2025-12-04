/**
 * Authentication Controller
 * 
 * Why: Handle HTTP requests for authentication endpoints
 * How: Processes requests, calls services, returns responses
 * Impact: Provides authentication API endpoints for frontend
 * 
 * Common Errors:
 * 1. Validation errors - Invalid input data
 * 2. User already exists - Registration with existing email/username
 * 3. Invalid credentials - Wrong email/password during login
 * 4. Server errors - Database or service failures
 */

const authService = require('../services/authService')
const { validationResult } = require('express-validator')

/**
 * Register new user
 * Why: Create user account endpoint
 * How: Validates input, calls registerUser service, returns user data
 * Impact: Users can create accounts through API
 * 
 * Request Body:
 * - username: string (required, 3-30 chars, alphanumeric + underscore)
 * - email: string (required, valid email format)
 * - password: string (required, min 6 chars)
 * - avatar: string (optional, image URL)
 * 
 * Response:
 * - 201: User created successfully
 * - 409: User already exists
 * - 400: Validation errors
 */
const register = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    const { username, email, password, avatar } = req.body

    // Register user
    const user = await authService.registerUser({
      username,
      email,
      password,
      avatar,
    })

    // Generate token
    const token = authService.generateToken(user._id)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Login user
 * Why: Authenticate user and create session
 * How: Validates credentials, calls loginUser service, returns token
 * Impact: Users can access protected routes after login
 * 
 * Request Body:
 * - email: string (required, valid email)
 * - password: string (required)
 * 
 * Response:
 * - 200: Login successful
 * - 401: Invalid credentials
 * - 400: Validation errors
 */
const login = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    const { email, password } = req.body

    // Login user
    const user = await authService.loginUser(email, password)

    // Generate token
    const token = authService.generateToken(user._id)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get current user
 * Why: Retrieve authenticated user information
 * How: Extracts user ID from token, calls getUserById service
 * Impact: Frontend can get current user data
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * Response:
 * - 200: User data retrieved
 * - 401: Invalid or missing token
 * - 404: User not found
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId

    const user = await authService.getUserById(userId)

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Logout user
 * Why: End user session and set user offline
 * How: Calls logoutUser service to set offline and clear socket IDs
 * Impact: User session terminated and marked offline in database
 * 
 * Response:
 * - 200: Logout successful
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.user.userId

    // Set user offline and clear socket connections
    await authService.logoutUser(userId)

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Google OAuth authentication
 * Why: Allow users to sign in with Google
 * How: Verifies Google ID token, creates or logs in user
 * Impact: Users can authenticate with Google account
 * 
 * Request Body:
 * - idToken: string (required, Google ID token)
 * 
 * Response:
 * - 200: Authentication successful
 * - 401: Invalid token
 */
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required',
      })
    }

    // Authenticate with Google
    const user = await authService.authenticateGoogle(idToken)

    // Generate token
    const token = authService.generateToken(user._id)

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  getMe,
  logout,
  googleAuth,
}

