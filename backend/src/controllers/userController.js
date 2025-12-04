/**
 * User Controller
 * 
 * Why: Handle HTTP requests for user endpoints
 * How: Processes requests, calls services, returns responses
 * Impact: Provides user information API endpoints for frontend
 * 
 * Common Errors:
 * 1. User not found - Invalid user ID
 * 2. Server errors - Database or service failures
 */

const userService = require('../services/userService')

/**
 * Get all users
 * Why: Retrieve list of all users
 * How: Calls getAllUsers service
 * Impact: Frontend can display user list
 * 
 * Response:
 * - 200: Users retrieved successfully
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers()

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get online users
 * Why: Retrieve list of currently online users
 * How: Calls getOnlineUsers service
 * Impact: Frontend can display online user list
 * 
 * Response:
 * - 200: Online users retrieved successfully
 */
const getOnlineUsers = async (req, res, next) => {
  try {
    const users = await userService.getOnlineUsers()

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user by ID
 * Why: Retrieve specific user information
 * How: Calls getUserById service
 * Impact: Frontend can display user details
 * 
 * URL Parameters:
 * - id: string (user ID)
 * 
 * Response:
 * - 200: User retrieved successfully
 * - 404: User not found
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await userService.getUserById(id)

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

module.exports = {
  getAllUsers,
  getOnlineUsers,
  getUserById,
}

