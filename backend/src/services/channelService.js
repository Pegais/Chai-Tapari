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
 * 3. For private channels: validate at least one additional member
 * 4. Create channel document
 * 5. Add creator and members
 * 6. Return channel with populated members
 */
const createChannel = async (channelData, creatorId) => {
  const { name, description, isPrivate, members } = channelData

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

  // For private channels: validate that at least one additional member is provided
  if (isPrivate) {
    if (!members || !Array.isArray(members) || members.length === 0) {
      const error = new Error('Private channels require at least one member (besides creator)')
      error.statusCode = 400
      throw error
    }

    // Remove duplicates from members array
    // Why: Prevent same user from being added multiple times
    // How: Creates Set of unique member IDs, filters out creator
    // Impact: Ensures each user appears only once in members list
    const uniqueMemberIds = [...new Set(members.map(m => m.toString()))]
    
    // Filter out creator from members list and validate
    const additionalMembers = uniqueMemberIds.filter(memberId => 
      memberId !== creatorId.toString()
    )

    if (additionalMembers.length === 0) {
      const error = new Error('Private channels require at least one member besides the creator')
      error.statusCode = 400
      throw error
    }

    // Verify all member IDs exist
    const validMembers = await User.find({ _id: { $in: additionalMembers } })
    if (validMembers.length !== additionalMembers.length) {
      const error = new Error('One or more member IDs are invalid')
      error.statusCode = 400
      throw error
    }
  }

  // Create channel with members
  // Remove duplicates and ensure creator is included only once
  // Why: Prevent duplicate members in channel
  // How: Creates Set of unique member IDs, keeps original ObjectId format
  // Impact: Ensures each user appears only once in members array
  let channelMembers = [creatorId]
  
  if (isPrivate && members && members.length > 0) {
    // Remove duplicates from members array using Set
    // Convert to strings for comparison, then get unique values
    const uniqueMemberStrings = [...new Set(members.map(m => m.toString()))]
    
    // Filter out creator and keep original member objects
    // Why: Preserve ObjectId format from original members array
    // How: Maps unique strings back to original member objects
    // Impact: Maintains proper ObjectId format for database
    const additionalUniqueMembers = uniqueMemberStrings
      .filter(memberIdStr => memberIdStr !== creatorId.toString())
      .map(memberIdStr => {
        // Find original member object to preserve ObjectId format
        return members.find(m => m.toString() === memberIdStr)
      })
      .filter(Boolean) // Remove any undefined values
    
    channelMembers = [creatorId, ...additionalUniqueMembers]
  }

  const channel = new Channel({
    name: name.toLowerCase(),
    description: description || '',
    members: channelMembers,
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
  // Why: Show private channels only to members
  // How: Uses $or to get public channels OR private channels where user is a member
  // Impact: Private channels are only visible to their members
  if (userId) {
    const mongoose = require('mongoose')
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId
    
    query = {
      $or: [
        { isPrivate: false }, // All public channels
        { 
          isPrivate: true, 
          members: { $in: [userObjectId] } // Only private channels where user is a member
        },
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
 * Get channel by ID or name
 * Why: Retrieve specific channel details
 * How: Queries database by channel ID or name with population
 * Impact: Provides channel information for chat interface
 */
const getChannelById = async (channelId, userId = null) => {
  // Check if channelId is a valid MongoDB ObjectId (24 hex characters)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(channelId)
  
  let channel
  if (isObjectId) {
    // Try to find by ID first
    channel = await Channel.findById(channelId)
      .populate('members', 'username email avatar')
      .populate('createdBy', 'username email avatar')
  }
  
  // If not found by ID or not a valid ObjectId, try by name
  if (!channel) {
    channel = await Channel.findOne({ name: channelId.toLowerCase() })
      .populate('members', 'username email avatar')
      .populate('createdBy', 'username email avatar')
  }

  if (!channel) {
    const error = new Error('Channel not found')
    error.statusCode = 404
    throw error
  }

  // Check if private channel and user is member
  // Why: Prevent unauthorized access to private channels
  // How: Verifies user membership for private channels
  // Impact: Private channels are only accessible to their members
  if (channel.isPrivate) {
    if (!userId) {
      const error = new Error('Access denied. Authentication required for private channels.')
      error.statusCode = 403
      throw error
    }
    
    if (!channel.isMember(userId)) {
      const error = new Error('Access denied. You are not a member of this private channel.')
      error.statusCode = 403
      throw error
    }
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
 * 3. For public channels: auto-join allowed
 * 4. For private channels: require explicit invitation
 * 5. Add user to members array
 * 6. Save and return updated channel
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
    await channel.populate('members', 'username email avatar')
    return channel
  }

  // For public channels, allow auto-join
  // For private channels, require explicit invitation
  if (channel.isPrivate) {
    const error = new Error('Cannot join private channel. Invitation required.')
    error.statusCode = 403
    throw error
  }

  // Auto-join public channel
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

