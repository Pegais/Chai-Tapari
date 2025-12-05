/**
 * Message Cleanup Utility
 * 
 * Why: Automatically delete messages older than 8 hours for privacy
 * How: Scheduled job that runs periodically to delete old messages, conversations, Redis data, and S3 files
 * Impact: Ensures user privacy by automatically removing old conversations and related data
 * 
 * What Gets Cleaned:
 * 1. Messages (both channel and direct messages) older than 8 hours
 * 2. Empty conversations (conversations with no messages)
 * 3. Redis presence data (stale online users, channel presence, typing indicators)
 * 4. Orphaned S3 file attachments (files no longer referenced in messages)
 * 
 * What Does NOT Get Cleaned:
 * - Users (user accounts are preserved)
 * - Channels (channel metadata is preserved)
 * 
 * Common Errors:
 * 1. Database connection error - Cannot connect to MongoDB
 * 2. Delete operation failed - Error during message deletion
 * 3. Redis connection error - Cannot connect to Redis
 * 4. S3 deletion error - Error deleting files from S3
 */

const Message = require('../models/Message')
const Conversation = require('../models/Conversation')
const { getRedisClient } = require('../config/redis')
const { deleteFile } = require('../services/fileUploadService')
const logger = require('./logger')

/**
 * Delete messages older than 8 hours
 * Why: Maintain user privacy by removing old conversations
 * How: Finds and deletes messages (both channel and direct messages) where timestamp is older than 8 hours
 * Impact: Old messages are permanently removed from database
 * 
 * Flow:
 * 1. Calculate cutoff time (8 hours ago)
 * 2. Find all messages older than cutoff (both channel and conversation messages)
 * 3. Extract S3 keys from attachments before deletion
 * 4. Delete messages from database
 * 5. Log deletion count
 */
const deleteOldMessages = async () => {
  try {
    // Calculate cutoff time (8 hours ago)
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - 8)

    // Find messages older than 8 hours and extract S3 keys before deletion
    const oldMessages = await Message.find({
      timestamp: { $lt: cutoffTime },
    }).select('attachments')

    // Extract S3 keys from attachments for later cleanup
    // Why: Delete associated files from S3 when messages are deleted
    // How: Extracts S3 keys from fileUrl in message attachments
    // Impact: Prevents orphaned files in S3 bucket
    const s3KeysToDelete = []
    oldMessages.forEach(message => {
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach(attachment => {
          // Extract S3 key from fileUrl
          // S3 URL format: https://bucket.s3.region.amazonaws.com/uploads/userId/timestamp-filename
          // S3 key format: uploads/userId/timestamp-filename
          if (attachment.fileUrl) {
            try {
              const url = new URL(attachment.fileUrl)
              // Extract pathname and remove leading slash
              const pathname = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
              
              // S3 key is the pathname (e.g., "uploads/userId/timestamp-filename")
              if (pathname) {
                s3KeysToDelete.push(pathname)
              }
            } catch (error) {
              // If URL parsing fails, try simple string extraction
              // Look for 'uploads' in the URL
              const urlParts = attachment.fileUrl.split('/')
              const keyIndex = urlParts.findIndex(part => part === 'uploads')
              if (keyIndex !== -1) {
                // Reconstruct S3 key from 'uploads' onwards
                const s3Key = urlParts.slice(keyIndex).join('/')
                s3KeysToDelete.push(s3Key)
              } else {
                logger.warn(`[Message Cleanup] Could not extract S3 key from URL: ${attachment.fileUrl}`)
              }
            }
          }
        })
      }
    })

    // Delete messages older than 8 hours (both channel and conversation messages)
    const result = await Message.deleteMany({
      timestamp: { $lt: cutoffTime },
    })

    if (result.deletedCount > 0) {
      logger.info(`[Message Cleanup] Deleted ${result.deletedCount} messages older than 8 hours`)
      
      // Delete associated S3 files
      if (s3KeysToDelete.length > 0) {
        await deleteOrphanedS3Files(s3KeysToDelete)
      }
    }

    return {
      success: true,
      deletedCount: result.deletedCount,
      cutoffTime: cutoffTime.toISOString(),
      s3FilesDeleted: s3KeysToDelete.length,
    }
  } catch (error) {
    logger.error('[Message Cleanup] Error deleting old messages:', error)
    throw error
  }
}

/**
 * Delete empty conversations
 * Why: Remove conversations that have no messages after cleanup
 * How: Finds conversations with no associated messages and deletes them
 * Impact: Prevents orphaned conversation records
 */
const deleteEmptyConversations = async () => {
  try {
    // Find all conversations
    const conversations = await Conversation.find({})
    
    let deletedCount = 0
    
    for (const conversation of conversations) {
      // Check if conversation has any messages
      const messageCount = await Message.countDocuments({
        conversation: conversation._id,
      })
      
      // If no messages, delete the conversation
      if (messageCount === 0) {
        await Conversation.findByIdAndDelete(conversation._id)
        deletedCount++
      }
    }
    
    if (deletedCount > 0) {
      logger.info(`[Message Cleanup] Deleted ${deletedCount} empty conversations`)
    }
    
    return {
      success: true,
      deletedCount,
    }
  } catch (error) {
    logger.error('[Message Cleanup] Error deleting empty conversations:', error)
    throw error
  }
}

/**
 * Clean up Redis presence data
 * Why: Remove stale presence data from Redis
 * How: Cleans up online users, channel presence, and typing indicators
 * Impact: Prevents Redis memory bloat from stale data
 */
const cleanupRedisData = async () => {
  try {
    const redisClient = getRedisClient()
    
    // Check if Redis is available
    if (!redisClient || !redisClient.isReady) {
      logger.warn('[Message Cleanup] Redis not available, skipping Redis cleanup')
      return {
        success: true,
        skipped: true,
        reason: 'Redis not available',
      }
    }
    
    let cleanedCount = 0
    
    // Clean up stale online users (users who are actually offline in database)
    try {
      const User = require('../models/User')
      const onlineUserIds = await redisClient.sMembers('online_users')
      
      for (const userId of onlineUserIds) {
        const user = await User.findById(userId)
        if (!user || !user.isOnline) {
          // User is not actually online, remove from Redis
          await redisClient.sRem('online_users', userId)
          cleanedCount++
        }
      }
    } catch (error) {
      logger.warn('[Message Cleanup] Error cleaning online users from Redis:', error.message)
    }
    
    // Clean up channel presence data (scan for channel:*:members keys)
    try {
      const keys = await redisClient.keys('channel:*:members')
      for (const key of keys) {
        const channelId = key.replace('channel:', '').replace(':members', '')
        const memberIds = await redisClient.sMembers(key)
        
        // Verify members are actually in the channel
        const Channel = require('../models/Channel')
        const channel = await Channel.findById(channelId)
        
        if (!channel) {
          // Channel doesn't exist, delete Redis key
          await redisClient.del(key)
          await redisClient.del(`channel:${channelId}:typing`) // Also delete typing indicator
          cleanedCount++
        } else {
          // Remove members who are no longer in the channel
          for (const memberId of memberIds) {
            if (!channel.members.some(m => m.toString() === memberId)) {
              await redisClient.sRem(key, memberId)
              cleanedCount++
            }
          }
        }
      }
    } catch (error) {
      logger.warn('[Message Cleanup] Error cleaning channel presence from Redis:', error.message)
    }
    
    // Clean up typing indicators (scan for channel:*:typing keys)
    try {
      const typingKeys = await redisClient.keys('channel:*:typing')
      for (const key of typingKeys) {
        // Typing indicators should expire quickly, but clean up any stale ones
        const ttl = await redisClient.ttl(key)
        if (ttl === -1) {
          // Key exists but has no expiration, delete it
          await redisClient.del(key)
          cleanedCount++
        }
      }
    } catch (error) {
      logger.warn('[Message Cleanup] Error cleaning typing indicators from Redis:', error.message)
    }
    
    if (cleanedCount > 0) {
      logger.info(`[Message Cleanup] Cleaned ${cleanedCount} stale Redis entries`)
    }
    
    return {
      success: true,
      cleanedCount,
    }
  } catch (error) {
    logger.error('[Message Cleanup] Error cleaning Redis data:', error)
    // Don't throw - Redis cleanup is optional
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete orphaned S3 files
 * Why: Remove files from S3 that are no longer referenced in messages
 * How: Deletes files from S3 using file keys
 * Impact: Prevents orphaned files in S3 bucket
 */
const deleteOrphanedS3Files = async (s3Keys) => {
  try {
    let deletedCount = 0
    let errorCount = 0
    
    for (const s3Key of s3Keys) {
      try {
        await deleteFile(s3Key)
        deletedCount++
      } catch (error) {
        // Log error but continue with other files
        logger.warn(`[Message Cleanup] Failed to delete S3 file ${s3Key}:`, error.message)
        errorCount++
      }
    }
    
    if (deletedCount > 0) {
      logger.info(`[Message Cleanup] Deleted ${deletedCount} files from S3`)
    }
    
    if (errorCount > 0) {
      logger.warn(`[Message Cleanup] Failed to delete ${errorCount} files from S3`)
    }
    
    return {
      success: true,
      deletedCount,
      errorCount,
    }
  } catch (error) {
    logger.error('[Message Cleanup] Error deleting S3 files:', error)
    throw error
  }
}

/**
 * Run complete cleanup process
 * Why: Execute all cleanup tasks in sequence
 * How: Runs message deletion, conversation cleanup, Redis cleanup, and S3 cleanup
 * Impact: Comprehensive cleanup of all old data
 */
const runCompleteCleanup = async () => {
  const results = {
    messages: null,
    conversations: null,
    redis: null,
    s3: null,
  }
  
  try {
    // 1. Delete old messages (includes S3 file deletion)
    results.messages = await deleteOldMessages()
    
    // 2. Delete empty conversations
    results.conversations = await deleteEmptyConversations()
    
    // 3. Clean up Redis data
    results.redis = await cleanupRedisData()
    
    logger.info('[Message Cleanup] Complete cleanup finished', {
      messagesDeleted: results.messages?.deletedCount || 0,
      conversationsDeleted: results.conversations?.deletedCount || 0,
      redisCleaned: results.redis?.cleanedCount || 0,
      s3FilesDeleted: results.messages?.s3FilesDeleted || 0,
    })
    
    return results
  } catch (error) {
    logger.error('[Message Cleanup] Complete cleanup failed:', error)
    throw error
  }
}

/**
 * Start message cleanup scheduler
 * Why: Automatically run cleanup job at regular intervals
 * How: Sets up interval to run complete cleanup every hour
 * Impact: Messages, conversations, Redis data, and S3 files are automatically cleaned after 8 hours
 * 
 * Schedule: Runs every hour to check for data to delete
 * 
 * What Gets Cleaned:
 * 1. Messages older than 8 hours (both channel and direct messages)
 * 2. Empty conversations (conversations with no messages)
 * 3. Redis presence data (stale online users, channel presence, typing indicators)
 * 4. Orphaned S3 file attachments
 * 
 * What Does NOT Get Cleaned:
 * - Users (user accounts are preserved)
 * - Channels (channel metadata is preserved)
 */
const startCleanupScheduler = () => {
  // Run cleanup immediately on startup
  runCompleteCleanup().catch((error) => {
    logger.error('[Message Cleanup] Initial cleanup failed:', error)
  })

  // Schedule cleanup to run every hour
  const cleanupInterval = setInterval(() => {
    runCompleteCleanup().catch((error) => {
      logger.error('[Message Cleanup] Scheduled cleanup failed:', error)
    })
  }, 60 * 60 * 1000) // 1 hour in milliseconds

  logger.info('[Message Cleanup] Scheduler started - will clean up messages, conversations, Redis data, and S3 files older than 8 hours every hour')
  logger.info('[Message Cleanup] Note: Users and channels are NOT deleted (preserved)')

  // Return cleanup function to stop scheduler if needed
  return () => {
    clearInterval(cleanupInterval)
    logger.info('[Message Cleanup] Scheduler stopped')
  }
}

module.exports = {
  deleteOldMessages,
  deleteEmptyConversations,
  cleanupRedisData,
  deleteOrphanedS3Files,
  runCompleteCleanup,
  startCleanupScheduler,
}

