/**
 * Message Model
 * 
 * Why: Defines message schema for chat messages
 * How: Uses Mongoose schema with references to users and channels
 * Impact: Enables message storage, retrieval, and management
 * 
 * Common Errors:
 * 1. ValidationError - Required fields missing or invalid format
 * 2. CastError - Invalid ObjectId in sender or channel fields
 * 3. ReferenceError - Referenced user or channel does not exist
 */

const mongoose = require('mongoose')

/**
 * Message Schema Definition
 * Why: Structure message data with content, metadata, and attachments
 * How: Defines fields with types, validation, and references
 * Impact: Enables message creation, editing, deletion, and retrieval
 */
const messageSchema = new mongoose.Schema({
  /**
   * Client Message ID (Idempotency Key)
   * Why: Prevent duplicate messages on network retries
   * How: Client generates unique ID, server uses upsert with $setOnInsert
   * Impact: Guarantees exactly-once message delivery even with retries
   */
  clientMessageId: {
    type: String,
    sparse: true, // Allow null values but ensure uniqueness when present
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
    index: true,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: false,
    index: true,
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: false,
    default: null,
    index: true,
  },
  content: {
    type: String,
    required: function() {
      // Content required if no attachments
      return !this.attachments || this.attachments.length === 0
    },
    trim: true,
    maxlength: [5000, 'Message content cannot exceed 5000 characters'],
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'link', 'video', 'image'],
    default: 'text',
  },
  attachments: [{
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
  }],
  linkPreview: {
    url: String,
    title: String,
    description: String,
    image: String,
    siteName: String,
  },
  videoEmbed: {
    provider: String,
    videoId: String,
    embedUrl: String,
  },
  editedAt: {
    type: Date,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read'],
    default: 'sent',
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v
      return ret
    },
  },
})

/**
 * Compound indexes for efficient queries
 * Why: Improve query performance for message retrieval
 * How: Creates compound indexes on channel/conversation and timestamp
 * Impact: Faster pagination and message retrieval
 */
messageSchema.index({ channel: 1, timestamp: -1 })
messageSchema.index({ conversation: 1, timestamp: -1 })
messageSchema.index({ sender: 1, timestamp: -1 })
messageSchema.index({ isDeleted: 1 })

/**
 * Unique compound index for idempotency
 * Why: Ensure same clientMessageId from same sender is only inserted once
 * How: Compound unique index on sender + clientMessageId (sparse to allow nulls)
 * Impact: Prevents duplicate messages on network retries
 */
messageSchema.index(
  { sender: 1, clientMessageId: 1 }, 
  { unique: true, sparse: true, partialFilterExpression: { clientMessageId: { $exists: true, $ne: null } } }
)

/**
 * Pre-save validation
 * Why: Ensure message has either channel or conversation
 * How: Validates that at least one is provided
 * Impact: Prevents invalid messages
 */
messageSchema.pre('save', function(next) {
  if (!this.channel && !this.conversation) {
    return next(new Error('Message must have either a channel or conversation'))
  }
  if (this.channel && this.conversation) {
    return next(new Error('Message cannot have both channel and conversation'))
  }
  next()
})

/**
 * Method to soft delete message
 * Why: Preserve message history while marking as deleted
 * How: Sets isDeleted flag and deletedAt timestamp
 * Impact: Messages remain in database but are hidden from users
 */
messageSchema.methods.softDelete = function() {
  this.isDeleted = true
  this.deletedAt = new Date()
  return this.save()
}

/**
 * Method to edit message
 * Why: Allow users to update their messages
 * How: Updates content and sets editedAt timestamp
 * Impact: Enables message editing functionality
 */
messageSchema.methods.edit = function(newContent) {
  this.content = newContent
  this.editedAt = new Date()
  return this.save()
}

const Message = mongoose.model('Message', messageSchema)

module.exports = Message

