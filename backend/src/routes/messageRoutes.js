/**
 * Message Routes
 * 
 * Why: Define HTTP endpoints for message operations
 * How: Maps HTTP methods and paths to controller functions
 * Impact: Provides message management API endpoints
 * 
 * Route Structure:
 * GET /api/channels/:channelId/messages - Get messages (with pagination)
 * POST /api/channels/:channelId/messages - Create message (protected)
 * PATCH /api/messages/:messageId - Edit message (protected)
 * DELETE /api/messages/:messageId - Delete message (protected)
 */

const express = require('express')
const router = express.Router()
const messageController = require('../controllers/messageController')
const { authenticate } = require('../middleware/auth')
const { messageLimiter } = require('../middleware/rateLimiter')
const { validateCreateMessage, validateEditMessage, validateMessagePagination } = require('../utils/validators')

/**
 * Get messages by channel
 * GET /api/channels/:channelId/messages
 * Why: Retrieve channel messages with pagination
 * How: Validates channel ID and pagination params, calls getMessages controller
 * Impact: Frontend can load message history
 */
router.get('/channels/:channelId/messages', validateMessagePagination, messageController.getMessages)

/**
 * Create new message
 * POST /api/channels/:channelId/messages
 * Why: Allow users to send messages in channels
 * How: Requires authentication, validates input, rate limits, calls createMessage controller
 * Impact: Messages can be sent through API
 */
router.post('/channels/:channelId/messages', authenticate, messageLimiter, validateCreateMessage, messageController.createMessage)

/**
 * Edit message
 * PATCH /api/messages/:messageId
 * Why: Allow users to update their messages
 * How: Requires authentication, validates input, calls editMessage controller
 * Impact: Messages can be edited through API
 */
router.patch('/messages/:messageId', authenticate, validateEditMessage, messageController.editMessage)

/**
 * Delete message
 * DELETE /api/messages/:messageId
 * Why: Allow users to remove their messages
 * How: Requires authentication, validates ID, calls deleteMessage controller
 * Impact: Messages can be deleted through API
 */
router.delete('/messages/:messageId', authenticate, messageController.deleteMessage)

module.exports = router

