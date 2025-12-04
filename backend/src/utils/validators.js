/**
 * Validation Rules
 * 
 * Why: Centralized validation rules for request data
 * How: Uses express-validator to define validation chains
 * Impact: Ensures data integrity before processing requests
 * 
 * Common Validation Errors:
 * 1. Required field missing
 * 2. Invalid format (email, username, etc.)
 * 3. Length constraints violated
 * 4. Invalid value type
 */

const { body, param, query } = require('express-validator')

/**
 * User registration validation
 * Why: Ensure registration data meets requirements
 * How: Validates username, email, password fields
 * Impact: Only valid user data is accepted
 */
const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('avatar')
    .optional()
    .custom((value) => {
      // Accept either a valid URL or a valid avatar filename
      if (!value) return true // Optional field
      
      // Check if it's a valid avatar filename (e.g., "avatar_1.jpg")
      const validAvatarPattern = /^avatar_\d{1,2}\.jpg$/
      if (validAvatarPattern.test(value)) {
        return true
      }
      
      // Check if it's a valid URL
      try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        return false
      }
    }).withMessage('Avatar must be a valid avatar filename (e.g., avatar_1.jpg) or a valid URL'),
]

/**
 * User login validation
 * Why: Ensure login data is valid
 * How: Validates email and password fields
 * Impact: Only valid credentials are processed
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
]

/**
 * Channel creation validation
 * Why: Ensure channel data meets requirements
 * How: Validates name, description, isPrivate fields
 * Impact: Only valid channel data is accepted
 */
const validateCreateChannel = [
  body('name')
    .trim()
    .notEmpty().withMessage('Channel name is required')
    .isLength({ min: 1, max: 50 }).withMessage('Channel name must be between 1 and 50 characters')
    .matches(/^[a-z0-9-_]+$/).withMessage('Channel name can only contain lowercase letters, numbers, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  body('isPrivate')
    .optional()
    .isBoolean().withMessage('isPrivate must be a boolean'),
]

/**
 * Message creation validation
 * Why: Ensure message data meets requirements
 * How: Validates content, messageType, channelId fields
 * Impact: Only valid messages are created
 */
const validateCreateMessage = [
  param('channelId')
    .notEmpty().withMessage('Channel ID is required')
    .isMongoId().withMessage('Invalid channel ID format'),
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ max: 5000 }).withMessage('Message content cannot exceed 5000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'file', 'link', 'video', 'image']).withMessage('Invalid message type'),
]

/**
 * Message edit validation
 * Why: Ensure edited message data is valid
 * How: Validates content field
 * Impact: Only valid message edits are accepted
 */
const validateEditMessage = [
  param('messageId')
    .notEmpty().withMessage('Message ID is required')
    .isMongoId().withMessage('Invalid message ID format'),
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ max: 5000 }).withMessage('Message content cannot exceed 5000 characters'),
]

/**
 * Channel ID parameter validation
 * Why: Ensure channel ID is valid MongoDB ObjectId
 * How: Validates parameter format
 * Impact: Prevents invalid ID queries
 */
const validateChannelId = [
  param('id')
    .notEmpty().withMessage('Channel ID is required')
    .isMongoId().withMessage('Invalid channel ID format'),
]

/**
 * Message pagination query validation
 * Why: Ensure pagination parameters are valid
 * How: Validates before and limit query parameters
 * Impact: Prevents invalid pagination requests
 */
const validateMessagePagination = [
  query('before')
    .optional()
    .isISO8601().withMessage('Before must be a valid ISO 8601 date'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
]

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateChannel,
  validateCreateMessage,
  validateEditMessage,
  validateChannelId,
  validateMessagePagination,
}

