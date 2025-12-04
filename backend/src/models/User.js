/**
 * User Model
 * 
 * Why: Defines user schema and database structure for user accounts
 * How: Uses Mongoose schema to define user fields and validation
 * Impact: Ensures consistent user data structure across the application
 * 
 * Common Errors:
 * 1. ValidationError - Required fields missing or invalid format
 * 2. Duplicate key error - Email or username already exists
 * 3. CastError - Invalid ObjectId format in queries
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

/**
 * User Schema Definition
 * Why: Structure user data with validation and constraints
 * How: Defines fields with types, validation rules, and indexes
 * Impact: Ensures data integrity and enables efficient queries
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: function() {
      // Password required only if not using OAuth
      return !this.googleId
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
  },
  avatar: {
    type: String,
    default: null,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  socketIds: [{
    type: String,
  }],
  starredChannels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  }],
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
      delete ret.password
      delete ret.__v
      return ret
    },
  },
})

/**
 * Index for efficient queries
 * Why: Improve query performance for common lookups
 * How: Creates indexes on frequently queried fields
 * Impact: Faster database queries for email and username lookups
 */
userSchema.index({ email: 1 })
userSchema.index({ username: 1 })
userSchema.index({ isOnline: 1 })
userSchema.index({ googleId: 1 })

/**
 * Pre-save hook to hash password
 * Why: Store passwords securely using bcrypt hashing
 * How: Hashes password before saving to database
 * Impact: Passwords are never stored in plain text
 */
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and exists (not for OAuth users)
  if (!this.isModified('password') || !this.password) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

/**
 * Method to compare password
 * Why: Verify user password during login
 * How: Compares provided password with hashed password in database
 * Impact: Enables secure password authentication
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw error
  }
}

/**
 * Method to update last seen timestamp
 * Why: Track user activity and presence
 * How: Updates lastSeen field to current timestamp
 * Impact: Enables presence tracking and offline detection
 */
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date()
  return this.save()
}

/**
 * Method to add socket ID
 * Why: Track multiple browser tabs for same user
 * How: Adds socket ID to socketIds array
 * Impact: Enables proper presence tracking across multiple sessions
 */
userSchema.methods.addSocketId = function(socketId) {
  if (!this.socketIds.includes(socketId)) {
    this.socketIds.push(socketId)
    this.isOnline = true
    return this.save()
  }
  return Promise.resolve(this)
}

/**
 * Method to remove socket ID
 * Why: Handle user disconnection properly
 * How: Removes socket ID from socketIds array
 * Impact: Only marks user offline when all sessions are closed
 */
userSchema.methods.removeSocketId = function(socketId) {
  this.socketIds = this.socketIds.filter(id => id !== socketId)
  if (this.socketIds.length === 0) {
    this.isOnline = false
  }
  return this.save()
}

const User = mongoose.model('User', userSchema)

module.exports = User

