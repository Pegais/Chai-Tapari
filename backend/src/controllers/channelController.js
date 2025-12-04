/**
 * Channel Controller
 * 
 * Why: Handle HTTP requests for channel endpoints
 * How: Processes requests, calls services, returns responses
 * Impact: Provides channel management API endpoints for frontend
 * 
 * Common Errors:
 * 1. Validation errors - Invalid input data
 * 2. Channel not found - Invalid channel ID
 * 3. Unauthorized - User not member of private channel
 * 4. Duplicate channel - Channel name already exists
 * 5. Server errors - Database or service failures
 */

const channelService = require('../services/channelService')
const { validationResult } = require('express-validator')

/**
 * Create new channel
 * Why: Allow users to create channels
 * How: Validates input, calls createChannel service
 * Impact: New channels can be created through API
 * 
 * Request Body:
 * - name: string (required, 1-50 chars, lowercase alphanumeric + hyphens/underscores)
 * - description: string (optional, max 200 chars)
 * - isPrivate: boolean (optional, default false)
 * 
 * Response:
 * - 201: Channel created successfully
 * - 409: Channel name already exists
 * - 400: Validation errors
 */
const createChannel = async (req, res, next) => {
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

    const channelData = req.body
    const creatorId = req.user.userId

    const channel = await channelService.createChannel(channelData, creatorId)

    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: {
        channel,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all channels
 * Why: List available channels
 * How: Calls getAllChannels service with user ID
 * Impact: Frontend can display channel list
 * 
 * Response:
 * - 200: Channels retrieved successfully
 */
const getAllChannels = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.userId : null

    const channels = await channelService.getAllChannels(userId)

    res.status(200).json({
      success: true,
      data: {
        channels,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get channel by ID
 * Why: Retrieve specific channel details
 * How: Calls getChannelById service
 * Impact: Frontend can display channel information
 * 
 * URL Parameters:
 * - id: string (channel ID)
 * 
 * Response:
 * - 200: Channel retrieved successfully
 * - 404: Channel not found
 * - 403: Unauthorized access to private channel
 */
const getChannelById = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user ? req.user.userId : null

    const channel = await channelService.getChannelById(id, userId)

    res.status(200).json({
      success: true,
      data: {
        channel,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Join channel
 * Why: Add user to channel members
 * How: Calls joinChannel service
 * Impact: User can access and send messages in channel
 * 
 * URL Parameters:
 * - id: string (channel ID)
 * 
 * Response:
 * - 200: User joined channel successfully
 * - 404: Channel not found
 */
const joinChannel = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const channel = await channelService.joinChannel(id, userId)

    res.status(200).json({
      success: true,
      message: 'Joined channel successfully',
      data: {
        channel,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Leave channel
 * Why: Remove user from channel members
 * How: Calls leaveChannel service
 * Impact: User can no longer access channel
 * 
 * URL Parameters:
 * - id: string (channel ID)
 * 
 * Response:
 * - 200: User left channel successfully
 * - 404: Channel not found
 * - 400: User not a member
 */
const leaveChannel = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const channel = await channelService.leaveChannel(id, userId)

    res.status(200).json({
      success: true,
      message: 'Left channel successfully',
      data: {
        channel,
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createChannel,
  getAllChannels,
  getChannelById,
  joinChannel,
  leaveChannel,
}

