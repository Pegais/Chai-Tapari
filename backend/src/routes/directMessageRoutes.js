/**
 * Direct Message Routes
 * 
 * Why: Define HTTP endpoints for direct message operations
 * How: Maps HTTP methods and paths to controller functions
 * Impact: Provides direct messaging API endpoints
 * 
 * Route Structure:
 * GET /api/direct-messages/conversations - Get all conversations for current user
 * GET /api/direct-messages/conversations/:conversationId/messages - Get messages in conversation
 * GET /api/direct-messages/conversation - Get conversation by participant
 * POST /api/direct-messages/messages - Send direct message
 */

const express = require('express')
const router = express.Router()
const directMessageController = require('../controllers/directMessageController')
const { authenticate } = require('../middleware/auth')

/**
 * Get all conversations for current user
 * GET /api/direct-messages/conversations
 * Why: List user's conversations
 * How: Requires authentication, calls getConversations controller
 * Impact: Frontend can display conversation list
 */
router.get('/conversations', authenticate, directMessageController.getConversations)

/**
 * Get conversation by participant
 * GET /api/direct-messages/conversation?userId=xxx
 * Why: Find conversation between current user and another user
 * How: Requires authentication, calls getConversation controller
 * Impact: Enables direct access to specific conversation
 */
router.get('/conversation', authenticate, directMessageController.getConversation)

/**
 * Get messages in a conversation
 * GET /api/direct-messages/conversations/:conversationId/messages
 * Why: Retrieve conversation message history
 * How: Requires authentication, calls getMessages controller
 * Impact: Frontend can display messages
 */
router.get('/conversations/:conversationId/messages', authenticate, directMessageController.getMessages)

/**
 * Send direct message
 * POST /api/direct-messages/messages
 * Why: Send private message to another user
 * How: Requires authentication, calls sendMessage controller
 * Impact: Message appears in conversation
 */
router.post('/messages', authenticate, directMessageController.sendMessage)

module.exports = router

