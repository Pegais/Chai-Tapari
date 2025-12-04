/**
 * Channel Service
 * 
 * Why: Centralized channel business logic
 * How: Handles channel creation, member management, queries
 * Impact: Ensures consistent channel operations across the application
 * 
 * Common Errors:
 * 1. Channel already exists - Channel name already taken
 * 2. User not found - Invalid user ID in members or createdBy
 * 3. Channel not found - Channel ID does not exist
 * 4. Unauthorized access - User not member of private channel
 * 5. Database error - Connection issues or query failures
 */

const Channel = require('../models/Channel')
const User = require('../models/User')

/**
 * Create new channel
 * Why: Allow users to create chat channels
 * How: Validates input, checks for duplicates, creates channel with creator as member
 * Impact: New channel available for users to join
 * 
 * Flow:
 * 1. Check if channel name already exists
 * 2. Verify creator user exists
 * 3. Create channel document
 * 4. Add creator as first member
 * 5. Return channel with populated members
 */
const createChannel = async (channelData, creatorId) => {
  const { name, description, isPrivate } = channelData

  // Check if channel name already exists
  const existingChannel = await Channel.findOne({ name: name.toLowerCase() })

  if (existingChannel) {
    const error = new Error('Channel name already exists')
    error.statusCode = 409
    throw error
  }

  // Verify creator exists
  const creator = await User.findById(creatorId)
  if (!creator) {
    const error = new Error('Creator user not found')
    error.statusCode = 404
    throw error
  }

  // Create channel
  const channel = new Channel({
    name: name.toLowerCase(),
    description: description || '',
    members: [creatorId],
    createdBy: creatorId,
    isPrivate: isPrivate || false,
  })

  await channel.save()

  // Populate and return
  await channel.populate('members', 'username email avatar')
  await channel.populate('createdBy', 'username email avatar')

  return channel
}

/**
 * Get all channels
 * Why: List available channels for user
 * How: Queries channels based on privacy and membership
 * Impact: Users can see and join available channels
 * 
 * Flow:
 * 1. If user authenticated, get public channels and user's private channels
 * 2. If not authenticated, get only public channels
 * 3. Populate member and creator information
 * 4. Return channel list
 */
const getAllChannels = async (userId = null) => {
  let query = { isPrivate: false }

  // If user authenticated, include their private channels
  if (userId) {
    query = {
      $or: [
        { isPrivate: false },
        { isPrivate: true, members: userId },
      ],
    }
  }

  const channels = await Channel.find(query)
    .populate('members', 'username email avatar')
    .populate('createdBy', 'username email avatar')
    .sort({ createdAt: -1 })

  return channels
}

/**
 * Get channel by ID
 * Why: Retrieve specific channel details
 * How: Queries database by channel ID with population
 * Impact: Provides channel information for chat interface
 */
const getChannelById = async (channelId, userId = null) => {
  const channel = await Channel.findById(channelId)
    .populate('members', 'username email avatar')
    .populate('createdBy', 'username email avatar')

  if (!channel) {
    const error = new Error('Channel not found')
    error.statusCode = 404
    throw error
  }

  // Check if private channel and user is member
  if (channel.isPrivate && userId && !channel.isMember(userId)) {
    const error = new Error('Unauthorized access to private channel')
    error.statusCode = 403
    throw error
  }

  return channel
}

/**
 * Join channel
 * Why: Add user to channel members
 * How: Adds user ID to channel members array
 * Impact: User can access and send messages in channel
 * 
 * Flow:
 * 1. Find channel by ID
 * 2. Check if user already member
 * 3. Add user to members array
 * 4. Save and return updated channel
 */
const joinChannel = async (channelId, userId) => {
  const channel = await Channel.findById(channelId)

  if (!channel) {
    const error = new Error('Channel not found')
    error.statusCode = 404
    throw error
  }

  // Check if already member
  if (channel.isMember(userId)) {
    return channel
  }

  // Add member
  await channel.addMember(userId)
  await channel.populate('members', 'username email avatar')

  return channel
}

/**
 * Leave channel
 * Why: Remove user from channel members
 * How: Removes user ID from channel members array
 * Impact: User can no longer access channel
 * 
 * Flow:
 * 1. Find channel by ID
 * 2. Check if user is member
 * 3. Remove user from members array
 * 4. Save and return updated channel
 */
const leaveChannel = async (channelId, userId) => {
  const channel = await Channel.findById(channelId)

  if (!channel) {
    const error = new Error('Channel not found')
    error.statusCode = 404
    throw error
  }

  // Check if member
  if (!channel.isMember(userId)) {
    const error = new Error('User is not a member of this channel')
    error.statusCode = 400
    throw error
  }

  // Remove member
  await channel.removeMember(userId)
  await channel.populate('members', 'username email avatar')

  return channel
}

module.exports = {
  createChannel,
  getAllChannels,
  getChannelById,
  joinChannel,
  leaveChannel,
}

