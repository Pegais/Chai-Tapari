/**
 * Queue Cleanup Service
 * 
 * Why: Automatically remove messages from queue when they're confirmed as sent
 * How: Listens for message confirmations and removes matching queue entries
 * Impact: Keeps queue clean and prevents duplicate sends
 */

import { removeFromQueue, getMessageByOptimisticId, getPendingMessages } from './indexedDBQueue'

/**
 * Cleanup queue entry when message is confirmed
 * @param {Object} confirmedMessage - Confirmed message from server
 * @param {string} optimisticId - Optional optimistic message ID
 */
export const cleanupQueueOnConfirmation = async (confirmedMessage, optimisticId = null) => {
  try {
    // If we have an optimistic ID, find and remove by that
    if (optimisticId) {
      const queueMsg = await getMessageByOptimisticId(optimisticId)
      if (queueMsg) {
        await removeFromQueue(queueMsg.id)
        console.log('[QueueCleanup] Removed confirmed message from queue:', queueMsg.id)
        return true
      }
    }

    // Try to match by content and timestamp if no optimistic ID
    const pendingMessages = await getPendingMessages()
    for (const queueMsg of pendingMessages) {
      // Match by content and timestamp (within 5 seconds)
      if (queueMsg.content === confirmedMessage.content) {
        const queueTimestamp = new Date(queueMsg.timestamp).getTime()
        const confirmedTimestamp = new Date(confirmedMessage.timestamp || confirmedMessage.createdAt).getTime()
        const timeDiff = Math.abs(confirmedTimestamp - queueTimestamp)

        if (timeDiff < 5000) {
          await removeFromQueue(queueMsg.id)
          console.log('[QueueCleanup] Removed confirmed message from queue by content match:', queueMsg.id)
          return true
        }
      }
    }

    return false
  } catch (error) {
    console.error('[QueueCleanup] Error cleaning up queue:', error)
    return false
  }
}

/**
 * Setup queue cleanup listener for socket events
 * @param {Object} socket - Socket.IO instance
 */
export const setupQueueCleanupListeners = (socket) => {
  if (!socket) return

  // Listen for message confirmation events
  const handleMessageConfirmed = async (data) => {
    const message = data.message || data
    if (message && message._id) {
      await cleanupQueueOnConfirmation(message)
    }
  }

  socket.on('new-message', handleMessageConfirmed)
  socket.on('direct-message-sent', handleMessageConfirmed)

  // Return cleanup function
  return () => {
    socket.off('new-message', handleMessageConfirmed)
    socket.off('direct-message-sent', handleMessageConfirmed)
  }
}
