/**
 * Message Retry Service
 * 
 * Why: Automatically retry failed messages when connection is restored
 * How: Monitors queue for failed messages and attempts to resend them
 * Impact: Seamless message delivery even after connection issues
 */

import { getPendingMessages, markAsFailed, removeFromQueue, getNextRetryDelay, updateQueueStatus } from './indexedDBQueue'
import { getSocket } from './socket'

let retryInterval = null
let isRetrying = false
const RETRY_INTERVAL_MS = 30000 // Check every 30 seconds
const MAX_RETRY_AGE = 24 * 60 * 60 * 1000 // Don't retry messages older than 24 hours

/**
 * Start the retry service
 * Why: Automatically retry failed messages periodically
 * How: Sets up interval to check and retry pending messages
 * Impact: Failed messages automatically resend when connection is restored
 */
export const startRetryService = () => {
  if (retryInterval) {
    console.log('[RetryService] Service already running')
    return
  }

  console.log('[RetryService] Starting retry service')
  
  // Initial retry check
  checkAndRetryMessages()
  
  // Set up interval for periodic checks
  retryInterval = setInterval(() => {
    checkAndRetryMessages()
  }, RETRY_INTERVAL_MS)
}

/**
 * Stop the retry service
 * Why: Clean up when app unmounts or user logs out
 * How: Clears the interval
 * Impact: Prevents memory leaks and unnecessary retry attempts
 */
export const stopRetryService = () => {
  if (retryInterval) {
    clearInterval(retryInterval)
    retryInterval = null
    console.log('[RetryService] Retry service stopped')
  }
}

/**
 * Check and retry pending messages
 * Why: Process failed messages and attempt to resend them
 * How: Gets pending messages, filters by age, attempts retry
 * Impact: Automatic message recovery
 */
const checkAndRetryMessages = async () => {
  if (isRetrying) {
    return // Prevent concurrent retry attempts
  }

  try {
    isRetrying = true
    const socket = getSocket()
    
    // Only retry if socket is connected
    if (!socket || !socket.connected) {
      console.log('[RetryService] Socket not connected, skipping retry')
      return
    }

    const pendingMessages = await getPendingMessages()
    const now = Date.now()

    for (const message of pendingMessages) {
      // Skip messages older than MAX_RETRY_AGE
      if (now - message.timestamp > MAX_RETRY_AGE) {
        console.log('[RetryService] Message too old, marking as failed permanently:', message.id)
        await updateQueueStatus(message.id, 'failed_permanently', 'Message too old to retry')
        continue
      }

      // Skip if already at max retries
      if (message.status === 'failed_permanently') {
        continue
      }

      // Calculate retry delay
      const delay = getNextRetryDelay(message.retryCount)
      const timeSinceLastUpdate = now - (message.lastUpdate || message.timestamp)

      // Only retry if enough time has passed since last attempt
      if (timeSinceLastUpdate >= delay) {
        await retryMessage(message)
      }
    }
  } catch (error) {
    console.error('[RetryService] Error checking messages:', error)
  } finally {
    isRetrying = false
  }
}

/**
 * Retry a single message
 * @param {Object} message - Queue message to retry
 * @returns {Promise<boolean>} - True if retry was successful
 */
export const retryMessage = async (message) => {
  const socket = getSocket()
  
  if (!socket || !socket.connected) {
    console.log('[RetryService] Cannot retry, socket not connected')
    return false
  }

  try {
    console.log('[RetryService] Retrying message:', message.id)
    
    // Update status to pending
    await updateQueueStatus(message.id, 'pending', null)

    // Prepare message data (remove queue-specific fields)
    const { id, type, optimisticId, status, retryCount, timestamp, lastError, lastUpdate, createdAt, queueId, ...messageData } = message

    // Create a promise that resolves/rejects based on send result
    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        // If no confirmation after timeout, mark as failed
        await markAsFailed(message.id, 'Retry timeout - message not confirmed')
        resolve(false)
      }, 10000) // 10 second timeout for retry

      try {
        // Send message based on type
        if (message.type === 'channel') {
          socket.emit('send-message', {
            channelId: message.channelId,
            ...messageData,
          })
        } else if (message.type === 'direct') {
          socket.emit('send-direct-message', {
            recipientId: message.recipientId,
            ...messageData,
          })
        }

        // Listen for confirmation - if message is confirmed, it will be removed from queue
        // by the ChatWindow/DirectMessageWindow components
        // Clear timeout after a short delay to allow confirmation
        setTimeout(() => {
          clearTimeout(timeout)
          // Status will be updated by confirmation handlers
          resolve(true)
        }, 2000)
      } catch (error) {
        clearTimeout(timeout)
        console.error('[RetryService] Error sending retry:', error)
        markAsFailed(message.id, error.message).then(() => resolve(false))
      }
    })
  } catch (error) {
    console.error('[RetryService] Error retrying message:', error)
    await markAsFailed(message.id, error.message)
    return false
  }
}

/**
 * Manually retry a message (user-initiated)
 * @param {string} messageId - Queue message ID
 * @returns {Promise<boolean>} - True if retry was successful
 */
export const manualRetryMessage = async (messageId) => {
  try {
    const { getMessageById } = await import('./indexedDBQueue')
    const message = await getMessageById(messageId)
    
    if (!message) {
      console.error('[RetryService] Message not found:', messageId)
      return false
    }

    // Reset retry count for manual retry
    const { updateMessage } = await import('./indexedDBQueue')
    await updateMessage(messageId, {
      retryCount: 0,
      status: 'pending'
    })

    return await retryMessage({ ...message, retryCount: 0 })
  } catch (error) {
    console.error('[RetryService] Error in manual retry:', error)
    return false
  }
}

/**
 * Delete a failed message from queue
 * @param {string} messageId - Queue message ID
 */
export const deleteFailedMessage = async (messageId) => {
  try {
    await removeFromQueue(messageId)
    console.log('[RetryService] Deleted failed message:', messageId)
  } catch (error) {
    console.error('[RetryService] Error deleting message:', error)
  }
}
