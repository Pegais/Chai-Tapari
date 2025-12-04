/**
 * Message Service
 * 
 * Why: Centralized message business logic
 * How: Handles message creation, retrieval, editing, deletion
 * Impact: Ensures consistent message operations across the application
 * 
 * Common Errors:
 * 1. Channel not found - Invalid channel ID
 * 2. User not member - User not member of channel
 * 3. Message not found - Message ID does not exist
 * 4. Unauthorized - User not message sender
 * 5. Database error - Connection issues or query failures
 */

const Message = require('../models/Message')
const Channel = require('../models/Channel')

/**
 * Create new message
 * Why: Allow users to send messages in channels
 * How: Validates channel membership, creates message document
 * Impact: Message appears in channel for all members
 * 
 * Flow:
 * 1. Verify channel exists
 * 2. Check if user is channel member
 * 3. Create message document
 * 4. Save and populate sender information
 * 5. Return message
 */
const createMessage = async (messageData, senderId) => {
  const { channelId, content, messageType, attachments, linkPreview, videoEmbed } = messageData

  // Verify channel exists
  const channel = await Channel.findById(channelId)
  if (!channel) {
    const error = new Error('Channel not found')
    error.statusCode = 404
    throw error
  }

  // Check channel access
  // For private channels: user must be a member
  // For public channels: allow anyone to send messages, auto-add to members if not already a member
  if (channel.isPrivate) {
    if (!channel.isMember(senderId)) {
      const error = new Error('User is not a member of this private channel')
      error.statusCode = 403
      throw error
    }
  } else {
    // Public channel: auto-add user to members if not already a member
    // Why: Track active participants without requiring explicit join
    // How: Uses atomic MongoDB operation to prevent race conditions and duplicates
    // Impact: Members array only tracks users who have participated, not all viewers
    
    // Use atomic $addToSet to prevent duplicate member IDs (thread-safe)
    // Why: Prevents race conditions when multiple messages are sent concurrently
    // How: MongoDB's $addToSet only adds if value doesn't exist
    // Impact: Each user appears only once in members array, even with concurrent requests
    await Channel.findByIdAndUpdate(
      channelId,
      { $addToSet: { members: senderId } }, // $addToSet prevents duplicates atomically
      { new: true }
    )
  }

  // Create message
  const message = new Message({
    sender: senderId,
    channel: channelId,
    content,
    messageType: messageType || 'text',
    attachments: attachments || [],
    linkPreview: linkPreview || null,
    videoEmbed: videoEmbed || null,
  })

  await message.save()
  await message.populate('sender', 'username email avatar')

  return message
}

/**
 * Get messages by channel with pagination
 * Why: Retrieve channel messages efficiently with pagination
 * How: Queries messages by channel with cursor-based pagination
 * Impact: Enables message history loading and infinite scroll
 * 
 * Flow:
 * 1. Verify channel exists
 * 2. Build query with channel and deletion filter
 * 3. Apply cursor-based pagination if before timestamp provided
 * 4. Limit results and sort by timestamp
 * 5. Populate sender information
 * 6. Return messages array
 */
const getMessagesByChannel = async (channelId, options = {}) => {
  const { before, limit = 50 } = options

  // Verify channel exists
  const channel = await Channel.findById(channelId)
  if (!channel) {
    const error = new Error('Channel not found')
    error.statusCode = 404
    throw error
  }

  // Build query
  let query = {
    channel: channelId,
    isDeleted: false,
  }

  // Cursor-based pagination
  if (before) {
    query.timestamp = { $lt: new Date(before) }
  }

  // Fetch messages
  const messages = await Message.find(query)
    .populate('sender', 'username email avatar')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))

  // Reverse to get chronological order
  return messages.reverse()
}

/**
 * Edit message
 * Why: Allow users to update their messages
 * How: Verifies ownership, updates content, sets editedAt timestamp
 * Impact: Users can correct mistakes in their messages
 * 
 * Flow:
 * 1. Find message by ID
 * 2. Verify message exists
 * 3. Check if user is message sender
 * 4. Update message content
 * 5. Set editedAt timestamp
 * 6. Save and return updated message
 */
const editMessage = async (messageId, newContent, userId) => {
  const message = await Message.findById(messageId)

  if (!message) {
    const error = new Error('Message not found')
    error.statusCode = 404
    throw error
  }

  // Check ownership
  if (message.sender.toString() !== userId.toString()) {
    const error = new Error('Unauthorized to edit this message')
    error.statusCode = 403
    throw error
  }

  // Update message
  await message.edit(newContent)
  await message.populate('sender', 'username email avatar')

  return message
}

/**
 * Delete message
 * Why: Allow users to remove their messages
 * How: Verifies ownership, performs soft delete
 * Impact: Message is hidden but preserved in database
 * 
 * Flow:
 * 1. Find message by ID
 * 2. Verify message exists
 * 3. Check if user is message sender
 * 4. Perform soft delete
 * 5. Return updated message
 */
const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId)

  if (!message) {
    const error = new Error('Message not found')
    error.statusCode = 404
    throw error
  }

  // Check ownership
  if (message.sender.toString() !== userId.toString()) {
    const error = new Error('Unauthorized to delete this message')
    error.statusCode = 403
    throw error
  }

  // Soft delete
  await message.softDelete()
  await message.populate('sender', 'username email avatar')

  return message
}

module.exports = {
  createMessage,
  getMessagesByChannel,
  editMessage,
  deleteMessage,
}

