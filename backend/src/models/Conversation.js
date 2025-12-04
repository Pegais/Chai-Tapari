/**
 * Conversation Model
 * 
 * Why: Defines schema for direct messages between users
 * How: Uses Mongoose schema with references to users
 * Impact: Enables private messaging functionality
 * 
 * Common Errors:
 * 1. ValidationError - Must have exactly 2 participants
 * 2. Duplicate participants - Same user cannot be both participants
 */

const mongoose = require('mongoose')

/**
 * Conversation Schema Definition
 * Why: Structure conversation data for direct messages
 * How: Defines fields with types, validation, and references
 * Impact: Enables private messaging between two users
 */
const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
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
})

/**
 * Pre-save validation
 * Why: Ensure conversation has exactly 2 unique participants
 * How: Validates participants array before saving
 * Impact: Prevents invalid conversations
 */
conversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'))
  }
  
  // Ensure unique participants
  const uniqueParticipants = [...new Set(this.participants.map(p => p.toString()))]
  if (uniqueParticipants.length !== 2) {
    return next(new Error('Conversation participants must be different users'))
  }
  
  // Sort participants for consistent lookup
  this.participants.sort()
  next()
})

/**
 * Indexes for efficient queries
 * Why: Improve query performance for conversation lookups
 * How: Creates indexes on frequently queried fields
 * Impact: Faster database queries for conversations
 */
conversationSchema.index({ participants: 1 })
conversationSchema.index({ lastMessageAt: -1 })

/**
 * Static method to find or create conversation
 * Why: Get existing conversation or create new one between two users
 * How: Searches for existing conversation, creates if not found
 * Impact: Ensures one conversation per user pair
 */
conversationSchema.statics.findOrCreateConversation = async function(userId1, userId2) {
  const participants = [userId1, userId2].sort()
  
  let conversation = await this.findOne({
    participants: { $all: participants, $size: 2 }
  })

  if (!conversation) {
    conversation = new this({
      participants: participants,
    })
    await conversation.save()
  }

  return conversation
}

const Conversation = mongoose.model('Conversation', conversationSchema)

module.exports = Conversation

