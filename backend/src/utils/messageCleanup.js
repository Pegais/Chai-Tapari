/**
 * Message Cleanup Utility
 * 
 * Why: Automatically delete messages older than 48 hours for privacy
 * How: Scheduled job that runs periodically to delete old messages
 * Impact: Ensures user privacy by automatically removing old conversations
 * 
 * Common Errors:
 * 1. Database connection error - Cannot connect to MongoDB
 * 2. Delete operation failed - Error during message deletion
 */

const Message = require('../models/Message')
const logger = require('./logger')

/**
 * Delete messages older than 48 hours
 * Why: Maintain user privacy by removing old conversations
 * How: Finds and deletes messages where timestamp is older than 48 hours
 * Impact: Old messages are permanently removed from database
 * 
 * Flow:
 * 1. Calculate cutoff time (48 hours ago)
 * 2. Find all messages older than cutoff
 * 3. Delete messages from database
 * 4. Log deletion count
 */
const deleteOldMessages = async () => {
  try {
    // Calculate cutoff time (48 hours ago)
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - 48)

    // Find and delete messages older than 48 hours
    const result = await Message.deleteMany({
      timestamp: { $lt: cutoffTime },
    })

    if (result.deletedCount > 0) {
      logger.info(`[Message Cleanup] Deleted ${result.deletedCount} messages older than 48 hours`)
    }

    return {
      success: true,
      deletedCount: result.deletedCount,
      cutoffTime: cutoffTime.toISOString(),
    }
  } catch (error) {
    logger.error('[Message Cleanup] Error deleting old messages:', error)
    throw error
  }
}

/**
 * Start message cleanup scheduler
 * Why: Automatically run cleanup job at regular intervals
 * How: Sets up interval to run cleanup every hour
 * Impact: Messages are automatically deleted after 48 hours
 * 
 * Schedule: Runs every hour to check for messages to delete
 */
const startCleanupScheduler = () => {
  // Run cleanup immediately on startup
  deleteOldMessages().catch((error) => {
    logger.error('[Message Cleanup] Initial cleanup failed:', error)
  })

  // Schedule cleanup to run every hour
  const cleanupInterval = setInterval(() => {
    deleteOldMessages().catch((error) => {
      logger.error('[Message Cleanup] Scheduled cleanup failed:', error)
    })
  }, 60 * 60 * 1000) // 1 hour in milliseconds

  logger.info('[Message Cleanup] Scheduler started - will delete messages older than 48 hours every hour')

  // Return cleanup function to stop scheduler if needed
  return () => {
    clearInterval(cleanupInterval)
    logger.info('[Message Cleanup] Scheduler stopped')
  }
}

module.exports = {
  deleteOldMessages,
  startCleanupScheduler,
}

