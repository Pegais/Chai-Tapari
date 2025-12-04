/**
 * Channel Model
 * 
 * Why: Defines channel schema for chat channels
 * How: Uses Mongoose schema with references to users
 * Impact: Enables channel management and member tracking
 * 
 * Common Errors:
 * 1. ValidationError - Required fields missing or invalid format
 * 2. Duplicate key error - Channel name already exists
 * 3. CastError - Invalid ObjectId in members or createdBy fields
 */

const mongoose = require('mongoose')

/**
 * Channel Schema Definition
 * Why: Structure channel data with members and metadata
 * How: Defines fields with types, validation, and references
 * Impact: Enables channel creation, member management, and queries
 */
const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Channel name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [1, 'Channel name must be at least 1 character'],
    maxlength: [50, 'Channel name cannot exceed 50 characters'],
    match: [/^[a-z0-9-_]+$/, 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.memberCount = ret.members ? ret.members.length : 0
      return ret
    },
  },
})

/**
 * Index for efficient queries
 * Why: Improve query performance for common lookups
 * How: Creates indexes on frequently queried fields
 * Impact: Faster database queries for channel lookups
 */
channelSchema.index({ name: 1 })
channelSchema.index({ members: 1 })
channelSchema.index({ createdBy: 1 })
channelSchema.index({ isPrivate: 1 })

/**
 * Virtual field for member count
 * Why: Provide easy access to member count without querying
 * How: Calculates member count from members array length
 * Impact: Simplifies member count access in queries
 */
channelSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0
})

/**
 * Method to add member to channel
 * Why: Manage channel membership programmatically
 * How: Adds user ID to members array if not already present
 * Impact: Enables adding users to channels
 */
channelSchema.methods.addMember = function(userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId)
    return this.save()
  }
  return Promise.resolve(this)
}

/**
 * Method to remove member from channel
 * Why: Manage channel membership programmatically
 * How: Removes user ID from members array
 * Impact: Enables removing users from channels
 */
channelSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(memberId => !memberId.equals(userId))
  return this.save()
}

/**
 * Method to check if user is member
 * Why: Verify channel membership before allowing actions
 * How: Checks if userId exists in members array
 * Impact: Enables authorization checks for channel operations
 */
channelSchema.methods.isMember = function(userId) {
  return this.members.some(memberId => memberId.equals(userId))
}

const Channel = mongoose.model('Channel', channelSchema)

module.exports = Channel

