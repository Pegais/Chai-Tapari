/**
 * Message Controller
 * 
 * Why: Handle HTTP requests for message endpoints
 * How: Processes requests, calls services, returns responses
 * Impact: Provides message management API endpoints for frontend
 * 
 * Common Errors:
 * 1. Validation errors - Invalid input data
 * 2. Channel not found - Invalid channel ID
 * 3. Message not found - Invalid message ID
 * 4. Unauthorized - User not message sender or not channel member
 * 5. Server errors - Database or service failures
 */

const messageService = require('../services/messageService')
const { validationResult } = require('express-validator')

/**
 * Create new message
 * Why: Allow users to send messages in channels
 * How: Validates input, calls createMessage service
 * Impact: Messages can be sent through API
 * 
 * Request Body:
 * - channelId: string (required, valid channel ID)
 * - content: string (required, max 5000 chars)
 * - messageType: string (optional, enum: text, file, link, video, image)
 * - attachments: array (optional, file attachment objects)
 * - linkPreview: object (optional, link preview data)
 * - videoEmbed: object (optional, video embed data)
 * 
 * Response:
 * - 201: Message created successfully
 * - 404: Channel not found
 * - 403: User not member of channel
 * - 400: Validation errors
 */
const createMessage = async (req, res, next) => {
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

    const messageData = {
      channelId: req.params.channelId,
      content: req.body.content,
      messageType: req.body.messageType || 'text',
      attachments: req.body.attachments || [],
      linkPreview: req.body.linkPreview || null,
      videoEmbed: req.body.videoEmbed || null,
    }

    const senderId = req.user.userId

    const message = await messageService.createMessage(messageData, senderId)

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
 * Get messages by channel
 * Why: Retrieve channel messages with pagination
 * How: Calls getMessagesByChannel service with pagination options
 * Impact: Frontend can load message history
 * 
 * URL Parameters:
 * - channelId: string (channel ID)
 * 
 * Query Parameters:
 * - before: string (ISO timestamp for cursor-based pagination)
 * - limit: number (max messages to return, default 50)
 * 
 * Response:
 * - 200: Messages retrieved successfully
 * - 404: Channel not found
 */
const getMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params
    const { before, limit } = req.query

    const options = {
      before: before ? new Date(before) : null,
      limit: limit || 50,
    }

    const messages = await messageService.getMessagesByChannel(channelId, options)

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
 * Edit message
 * Why: Allow users to update their messages
 * How: Validates input, calls editMessage service
 * Impact: Messages can be edited through API
 * 
 * URL Parameters:
 * - messageId: string (message ID)
 * 
 * Request Body:
 * - content: string (required, max 5000 chars)
 * 
 * Response:
 * - 200: Message edited successfully
 * - 404: Message not found
 * - 403: Unauthorized to edit message
 * - 400: Validation errors
 */
const editMessage = async (req, res, next) => {
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

    const { messageId } = req.params
    const { content } = req.body
    const userId = req.user.userId

    const message = await messageService.editMessage(messageId, content, userId)

    res.status(200).json({
      success: true,
      message: 'Message edited successfully',
      data: {
        message,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete message
 * Why: Allow users to remove their messages
 * How: Calls deleteMessage service
 * Impact: Messages can be deleted through API
 * 
 * URL Parameters:
 * - messageId: string (message ID)
 * 
 * Response:
 * - 200: Message deleted successfully
 * - 404: Message not found
 * - 403: Unauthorized to delete message
 */
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params
    const userId = req.user.userId

    const message = await messageService.deleteMessage(messageId, userId)

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: {
        message,
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createMessage,
  getMessages,
  editMessage,
  deleteMessage,
}

