/**
 * Authentication Service
 * 
 * Why: Centralized authentication business logic
 * How: Handles user registration, login, password validation
 * Impact: Ensures consistent authentication across the application
 * 
 * Common Errors:
 * 1. User already exists - Email or username already registered
 * 2. Invalid credentials - Wrong email or password during login
 * 3. Password validation failed - Password does not meet requirements
 * 4. Database error - Connection issues or query failures
 */

const User = require('../models/User')
const jwt = require('jsonwebtoken')

/**
 * Register new user
 * Why: Create user account with validated data
 * How: Validates input, checks for duplicates, hashes password, saves user
 * Impact: New user can access the application
 * 
 * Flow:
 * 1. Check if email or username already exists
 * 2. Validate password strength
 * 3. Hash password using bcrypt
 * 4. Create user document in database
 * 5. Return user data without password
 */
const registerUser = async (userData) => {
  const { username, email, password, avatar } = userData

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  })

  if (existingUser) {
    const error = new Error('User already exists with this email or username')
    error.statusCode = 409
    throw error
  }

  // Create new user
  const user = new User({
    username,
    email,
    password,
    avatar: avatar || null,
  })

  await user.save()

  // Return user without password
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
  }
}

/**
 * Authenticate user login
 * Why: Verify user credentials and create session
 * How: Finds user by email, compares password, returns user data
 * Impact: User can access protected routes after successful login
 * 
 * Flow:
 * 1. Find user by email
 * 2. Check if user exists
 * 3. Compare provided password with hashed password
 * 4. Update last seen timestamp
 * 5. Return user data
 */
const loginUser = async (email, password) => {
  // Find user with password field included
  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  // Compare passwords
  const isPasswordValid = await user.comparePassword(password)

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  // Update last seen
  await user.updateLastSeen()

  // Return user without password
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    lastSeen: user.lastSeen,
  }
}

/**
 * Generate JWT token
 * Why: Create secure token for user authentication
 * How: Signs user ID with JWT secret and expiration
 * Impact: Enables stateless authentication
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'default-secret'
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

  return jwt.sign({ userId }, secret, { expiresIn })
}

/**
 * Verify JWT token
 * Why: Validate token and extract user information
 * How: Verifies token signature and expiration
 * Impact: Enables protected route access
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'default-secret'

  try {
    return jwt.verify(token, secret)
  } catch (error) {
    const authError = new Error('Invalid or expired token')
    authError.statusCode = 401
    throw authError
  }
}

/**
 * Get user by ID
 * Why: Retrieve user information for authenticated requests
 * How: Queries database by user ID
 * Impact: Provides user data for protected routes
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId)

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    lastSeen: user.lastSeen,
    isOnline: user.isOnline,
  }
}

module.exports = {
  registerUser,
  loginUser,
  generateToken,
  verifyToken,
  getUserById,
}

