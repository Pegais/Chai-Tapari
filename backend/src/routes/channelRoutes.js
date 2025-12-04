/**
 * Channel Routes
 * 
 * Why: Define HTTP endpoints for channel operations
 * How: Maps HTTP methods and paths to controller functions
 * Impact: Provides channel management API endpoints
 * 
 * Route Structure:
 * GET /api/channels - Get all channels
 * POST /api/channels - Create channel (protected)
 * GET /api/channels/:id - Get channel by ID
 * POST /api/channels/:id/join - Join channel (protected)
 * POST /api/channels/:id/leave - Leave channel (protected)
 */

const express = require('express')
const router = express.Router()
const channelController = require('../controllers/channelController')
const { authenticate, optionalAuth } = require('../middleware/auth')
const { validateCreateChannel, validateChannelId } = require('../utils/validators')

/**
 * Get all channels
 * GET /api/channels
 * Why: List available channels
 * How: Optional authentication, calls getAllChannels controller
 * Impact: Frontend can display channel list
 */
router.get('/', optionalAuth, channelController.getAllChannels)

/**
 * Create new channel
 * POST /api/channels
 * Why: Allow users to create channels
 * How: Requires authentication, validates input, calls createChannel controller
 * Impact: New channels can be created through API
 */
router.post('/', authenticate, validateCreateChannel, channelController.createChannel)

/**
 * Get channel by ID
 * GET /api/channels/:id
 * Why: Retrieve specific channel details
 * How: Optional authentication, validates ID, calls getChannelById controller
 * Impact: Frontend can display channel information
 */
router.get('/:id', optionalAuth, validateChannelId, channelController.getChannelById)

/**
 * Join channel
 * POST /api/channels/:id/join
 * Why: Add user to channel members
 * How: Requires authentication, validates ID, calls joinChannel controller
 * Impact: Users can join channels through API
 */
router.post('/:id/join', authenticate, validateChannelId, channelController.joinChannel)

/**
 * Leave channel
 * POST /api/channels/:id/leave
 * Why: Remove user from channel members
 * How: Requires authentication, validates ID, calls leaveChannel controller
 * Impact: Users can leave channels through API
 */
router.post('/:id/leave', authenticate, validateChannelId, channelController.leaveChannel)

module.exports = router

