/**
 * Direct Message Controller
 * 
 * Why: Handle HTTP requests for direct message endpoints
 * How: Processes requests, calls services, returns responses
 * Impact: Provides direct messaging API endpoints for frontend
 * 
 * Common Errors:
 * 1. Validation errors - Invalid input data
 * 2. User not found - Invalid user ID
 * 3. Conversation not found - Invalid conversation ID
 * 4. Unauthorized - User not participant in conversation
 */

const directMessageService = require('../services/directMessageService')
const { validationResult } = require('express-validator')

/**
 * Get all conversations for current user
 * Why: List user's conversations
 * How: Calls getUserConversations service
 * Impact: Frontend can display conversation list
 * 
 * Response:
 * - 200: Conversations retrieved successfully
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const conversations = await directMessageService.getUserConversations(userId)

    res.status(200).json({
      success: true,
      data: {
        conversations,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get messages in a conversation
 * Why: Retrieve conversation message history
 * How: Calls getConversationMessages service
 * Impact: Frontend can display messages
 * 
 * URL Parameters:
 * - conversationId: string (conversation ID)
 * 
 * Query Parameters:
 * - before: Date (ISO string, for cursor-based pagination)
 * - limit: Number (default: 50)
 * 
 * Response:
 * - 200: Messages retrieved successfully
 * - 404: Conversation not found
 * - 403: Unauthorized access
 */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.userId
    const { before, limit } = req.query

    const messages = await directMessageService.getConversationMessages(
      conversationId,
      userId,
      { before, limit }
    )

    res.status(200).json({
      success: true,
      data: {
        messages,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Send direct message
 * Why: Send private message to another user
 * How: Calls sendDirectMessage service
 * Impact: Message appears in conversation
 * 
 * Request Body:
 * - recipientId: string (required)
 * - content: string (required)
 * - messageType: string (optional, default: 'text')
 * - attachments: array (optional)
 * - linkPreview: object (optional)
 * - videoEmbed: object (optional)
 * 
 * Response:
 * - 201: Message sent successfully
 * - 400: Validation errors
 * - 404: User not found
 */
const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    const senderId = req.user.userId
    const messageData = req.body

    const message = await directMessageService.sendDirectMessage(messageData, senderId)

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get conversation by participant
 * Why: Find conversation between current user and another user
 * How: Calls getConversationByParticipants service
 * Impact: Enables direct access to specific conversation
 * 
 * Query Parameters:
 * - userId: string (other user's ID)
 * 
 * Response:
 * - 200: Conversation found or null
 */
const getConversation = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { userId: otherUserId } = req.query

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'userId query parameter is required',
      })
    }

    const conversation = await directMessageService.getConversationByParticipants(
      userId,
      otherUserId
    )

    res.status(200).json({
      success: true,
      data: {
        conversation,
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  getConversation,
}

