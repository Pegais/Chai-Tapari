/**
 * Direct Message Service
 * 
 * Why: Handle direct messaging between users
 * How: Manages conversations and direct messages
 * Impact: Enables private messaging functionality
 * 
 * Common Errors:
 * 1. User not found - Invalid user ID
 * 2. Conversation not found - Invalid conversation ID
 * 3. Unauthorized - User not participant in conversation
 */

const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const User = require('../models/User')

/**
 * Get or create conversation between two users
 * Why: Ensure one conversation per user pair
 * How: Searches for existing conversation or creates new one
 * Impact: Prevents duplicate conversations
 * 
 * Flow:
 * 1. Validate user IDs are different
 * 2. Verify both users exist
 * 3. Find or create conversation
 * 4. Return conversation
 */
const getOrCreateConversation = async (userId1, userId2) => {
  if (userId1.toString() === userId2.toString()) {
    const error = new Error('Cannot create conversation with yourself')
    error.statusCode = 400
    throw error
  }

  // Verify both users exist
  const users = await User.find({ _id: { $in: [userId1, userId2] } })
  if (users.length !== 2) {
    const error = new Error('One or both users not found')
    error.statusCode = 404
    throw error
  }

  return await Conversation.findOrCreateConversation(userId1, userId2)
}

/**
 * Send direct message
 * Why: Allow users to send private messages
 * How: Gets or creates conversation, creates message
 * Impact: Message appears in conversation for both users
 * 
 * Flow:
 * 1. Get or create conversation
 * 2. Create message document
 * 3. Update conversation lastMessage
 * 4. Populate sender and return
 */
const sendDirectMessage = async (messageData, senderId) => {
  const { recipientId, content, messageType, attachments, linkPreview, videoEmbed } = messageData

  // Get or create conversation
  const conversation = await getOrCreateConversation(senderId, recipientId)

  // Create message
  const message = new Message({
    sender: senderId,
    conversation: conversation._id,
    content,
    messageType: messageType || 'text',
    attachments: attachments || [],
    linkPreview: linkPreview || null,
    videoEmbed: videoEmbed || null,
  })

  await message.save()

  // Update conversation
  conversation.lastMessage = message._id
  conversation.lastMessageAt = message.timestamp
  await conversation.save()

  await message.populate('sender', 'username email avatar')

  return message
}

/**
 * Get messages in conversation
 * Why: Retrieve conversation message history
 * How: Queries messages by conversation with pagination
 * Impact: Enables message history loading
 * 
 * Flow:
 * 1. Verify conversation exists
 * 2. Verify user is participant
 * 3. Build query with pagination
 * 4. Fetch and return messages
 */
const getConversationMessages = async (conversationId, userId, options = {}) => {
  const { before, limit = 50 } = options

  // Verify user is participant
  const conversation = await Conversation.findById(conversationId)
  if (!conversation) {
    const error = new Error('Conversation not found')
    error.statusCode = 404
    throw error
  }

  if (!conversation.participants.some(p => p.toString() === userId.toString())) {
    const error = new Error('Unauthorized access to conversation')
    error.statusCode = 403
    throw error
  }

  // Build query
  let query = {
    conversation: conversationId,
    isDeleted: false,
  }

  if (before) {
    query.timestamp = { $lt: new Date(before) }
  }

  // Fetch messages
  const messages = await Message.find(query)
    .populate('sender', 'username email avatar')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))

  return messages.reverse()
}

/**
 * Get user's conversations
 * Why: List all conversations for a user
 * How: Queries conversations where user is participant
 * Impact: Enables conversation list display
 * 
 * Flow:
 * 1. Find all conversations with user as participant
 * 2. Populate participants and lastMessage
 * 3. Sort by lastMessageAt
 * 4. Filter out current user from participants
 * 5. Return conversations
 */
const getUserConversations = async (userId) => {
  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate('participants', 'username email avatar isOnline')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username email avatar',
      },
    })
    .sort({ lastMessageAt: -1 })

  // Filter out current user from participants for easier frontend use
  return conversations.map(conv => ({
    ...conv.toObject(),
    participants: conv.participants.filter(p => p._id.toString() !== userId.toString()),
  }))
}

/**
 * Get conversation by participant IDs
 * Why: Find conversation between two specific users
 * How: Searches for conversation with both participants
 * Impact: Enables direct access to specific conversation
 */
const getConversationByParticipants = async (userId1, userId2) => {
  const participants = [userId1, userId2].sort()
  
  const conversation = await Conversation.findOne({
    participants: { $all: participants, $size: 2 }
  })
    .populate('participants', 'username email avatar isOnline')

  return conversation
}

module.exports = {
  getOrCreateConversation,
  sendDirectMessage,
  getConversationMessages,
  getUserConversations,
  getConversationByParticipants,
}

