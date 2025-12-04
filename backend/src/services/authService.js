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
const { OAuth2Client } = require('google-auth-library')
const { detectGenderFromName, getRandomAvatarByGender } = require('../utils/genderDetector')

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
  const { username, email, password, avatar: avatarInput } = userData
  
  // Convert avatar filename to full URL if it's just a filename
  let avatar = avatarInput
  if (avatarInput && !avatarInput.startsWith('http://') && !avatarInput.startsWith('https://')) {
    // It's a filename, construct the backend URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    avatar = `${backendUrl}/api/avatars/${avatarInput}`
  }

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

/**
 * Logout user
 * Why: Set user offline and clear socket connections
 * How: Updates user to offline, clears socket IDs using atomic update
 * Impact: User marked as offline in database on logout
 */
const logoutUser = async (userId) => {
  // Use findByIdAndUpdate with atomic operations to avoid version conflicts
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        isOnline: false,
        socketIds: [],
        lastSeen: new Date(),
      },
    },
    {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    }
  )

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

/**
 * Authenticate user with Google OAuth
 * Why: Allow users to sign in with Google account
 * How: Verifies Google ID token, creates or updates user
 * Impact: Users can sign in with Google without password
 */
const authenticateGoogle = async (idToken) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  
  try {
    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    
    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload
    
    if (!email) {
      const error = new Error('Email not provided by Google')
      error.statusCode = 400
      throw error
    }
    
    // Use name as username (sanitize it properly)
    let baseUsername = name
      ? name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
      : email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
    
    // Ensure minimum length of 3 characters
    if (baseUsername.length < 3) {
      baseUsername = baseUsername + '_user'
    }
    
    // Truncate to max 30 characters
    baseUsername = baseUsername.substring(0, 30)
    
    // Check if user exists by email or googleId
    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    })
    
    if (user) {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId
        await user.save()
      }
      
      // Update last seen
      await user.updateLastSeen()
    } else {
      // Create new user
      // Detect gender from name
      const gender = detectGenderFromName(name || baseUsername)
      
      // Assign random avatar based on gender
      const avatar = getRandomAvatarByGender(gender)
      
      // Generate unique username if conflict
      let finalUsername = baseUsername
      let counter = 1
      while (await User.findOne({ username: finalUsername })) {
        const suffix = `_${counter}`
        const maxLength = 30 - suffix.length
        finalUsername = baseUsername.substring(0, maxLength) + suffix
        counter++
        
        // Prevent infinite loop
        if (counter > 1000) {
          finalUsername = baseUsername.substring(0, 20) + '_' + Date.now().toString().slice(-6)
          break
        }
      }
      
      user = new User({
        username: finalUsername,
        email,
        googleId,
        avatar,
        password: undefined, // No password for OAuth users
      })
      
      await user.save()
    }
    
    // Return user without password
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      lastSeen: user.lastSeen,
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    const authError = new Error('Invalid Google token')
    authError.statusCode = 401
    throw authError
  }
}

module.exports = {
  registerUser,
  loginUser,
  generateToken,
  verifyToken,
  getUserById,
  logoutUser,
  authenticateGoogle,
}

