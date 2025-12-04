/**
 * User Service
 * 
 * Why: Centralized user business logic
 * How: Handles user queries, presence tracking, online status
 * Impact: Ensures consistent user operations across the application
 * 
 * Common Errors:
 * 1. User not found - User ID does not exist
 * 2. Database error - Connection issues or query failures
 */

const User = require('../models/User')

/**
 * Get all users
 * Why: Retrieve list of all users for presence display
 * How: Queries all users from database
 * Impact: Enables user list and presence features
 */
const getAllUsers = async () => {
  const users = await User.find()
    .select('username email avatar lastSeen isOnline')
    .sort({ username: 1 })

  return users
}

/**
 * Get online users
 * Why: Retrieve list of currently online users
 * How: Queries users with isOnline flag set to true
 * Impact: Enables online user display and presence features
 */
const getOnlineUsers = async () => {
  const users = await User.find({ isOnline: true })
    .select('username email avatar lastSeen isOnline')
    .sort({ username: 1 })

  return users
}

/**
 * Get user by ID
 * Why: Retrieve specific user information
 * How: Queries database by user ID
 * Impact: Provides user data for various operations
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select('username email avatar lastSeen isOnline')

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return user
}

/**
 * Update user presence
 * Why: Track user online/offline status
 * How: Updates isOnline flag and lastSeen timestamp
 * Impact: Enables real-time presence tracking
 */
const updateUserPresence = async (userId, isOnline) => {
  const user = await User.findById(userId)

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  user.isOnline = isOnline
  user.lastSeen = new Date()
  await user.save()

  return user
}

module.exports = {
  getAllUsers,
  getOnlineUsers,
  getUserById,
  updateUserPresence,
}

