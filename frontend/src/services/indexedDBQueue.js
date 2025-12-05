/**
 * IndexedDB Message Queue Service
 * 
 * Why: Handle message sending with retry logic and offline queue using IndexedDB
 * How: Stores messages in IndexedDB (async, non-blocking), retries failed sends, queues for offline
 * Impact: Messages never lost, works with slow/unreliable connections, doesn't block main thread
 */

import { openDB } from 'idb'

const DB_NAME = 'messageQueue'
const DB_VERSION = 1
const STORE_NAME = 'messages'
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 3000, 5000] // Exponential backoff in milliseconds

// Singleton DB instance
let dbPromise = null

/**
 * Initialize IndexedDB database
 * Why: Create database and object store with indexes
 * How: Uses idb library for Promise-based IndexedDB API
 * Impact: Async operations don't block main thread
 */
const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object store for messages
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: false
          })
          
          // Create indexes for efficient querying
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('channelId', 'channelId', { unique: false })
          store.createIndex('conversationId', 'conversationId', { unique: false })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('optimisticId', 'optimisticId', { unique: false })
        }
      }
    })
  }
  return dbPromise
}

/**
 * Add message to queue
 * @param {Object} messageData - Message data to send
 * @param {string} type - 'channel' or 'direct'
 * @param {string} optimisticId - ID of optimistic message in React Query cache
 * @returns {Promise<string>} - Queue message ID
 */
export const addToQueue = async (messageData, type = 'channel', optimisticId = null) => {
  try {
    const db = await initDB()
    const queuedMessage = {
      id: `queue-${Date.now()}-${Math.random()}`,
      ...messageData,
      type,
      optimisticId,
      status: 'pending',
      retryCount: 0,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    }
    
    await db.add(STORE_NAME, queuedMessage)
    return queuedMessage.id
  } catch (error) {
    console.error('[IndexedDBQueue] Error adding message to queue:', error)
    throw error
  }
}

/**
 * Update message status in queue
 * @param {string} messageId - Queue message ID
 * @param {string} status - New status (pending, sending, sent, failed, failed_permanently)
 * @param {string|null} error - Error message if failed
 */
export const updateQueueStatus = async (messageId, status, error = null) => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const message = await store.get(messageId)
    
    if (message) {
      message.status = status
      message.lastError = error
      message.lastUpdate = Date.now()
      await store.put(message)
    }
    
    await tx.done
  } catch (error) {
    console.error('[IndexedDBQueue] Error updating queue status:', error)
  }
}

/**
 * Remove message from queue
 * @param {string} messageId - Queue message ID
 */
export const removeFromQueue = async (messageId) => {
  try {
    const db = await initDB()
    await db.delete(STORE_NAME, messageId)
  } catch (error) {
    console.error('[IndexedDBQueue] Error removing from queue:', error)
  }
}

/**
 * Get pending messages from queue
 * @param {string|null} channelId - Filter by channel ID (optional)
 * @param {string|null} conversationId - Filter by conversation ID (optional)
 * @returns {Promise<Array>} - Array of pending/failed messages
 */
export const getPendingMessages = async (channelId = null, conversationId = null) => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const statusIndex = store.index('status')
    
    // Get all pending and failed messages
    const pending = await statusIndex.getAll('pending')
    const failed = await statusIndex.getAll('failed')
    let allMessages = [...pending, ...failed]
    
    // Filter by channel or conversation if provided
    if (channelId) {
      allMessages = allMessages.filter(msg => msg.channelId === channelId)
    }
    if (conversationId) {
      allMessages = allMessages.filter(msg => msg.conversationId === conversationId)
    }
    
    await tx.done
    return allMessages.sort((a, b) => a.timestamp - b.timestamp)
  } catch (error) {
    console.error('[IndexedDBQueue] Error getting pending messages:', error)
    return []
  }
}

/**
 * Get message by optimistic ID
 * @param {string} optimisticId - Optimistic message ID
 * @returns {Promise<Object|null>} - Queue message or null
 */
export const getMessageByOptimisticId = async (optimisticId) => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const optimisticIndex = store.index('optimisticId')
    
    const messages = await optimisticIndex.getAll(optimisticId)
    await tx.done
    
    return messages.length > 0 ? messages[0] : null
  } catch (error) {
    console.error('[IndexedDBQueue] Error getting message by optimistic ID:', error)
    return null
  }
}

/**
 * Mark message as failed and increment retry count
 * @param {string} messageId - Queue message ID
 * @param {string} error - Error message
 */
export const markAsFailed = async (messageId, error) => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const message = await store.get(messageId)
    
    if (message) {
      message.retryCount += 1
      message.status = message.retryCount >= MAX_RETRIES ? 'failed_permanently' : 'failed'
      message.lastError = error
      message.lastUpdate = Date.now()
      await store.put(message)
    }
    
    await tx.done
  } catch (error) {
    console.error('[IndexedDBQueue] Error marking as failed:', error)
  }
}

/**
 * Clear all successfully sent messages from queue
 */
export const clearSentMessages = async () => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const statusIndex = store.index('status')
    
    const sentMessages = await statusIndex.getAll('sent')
    await Promise.all(sentMessages.map(msg => store.delete(msg.id)))
    
    await tx.done
  } catch (error) {
    console.error('[IndexedDBQueue] Error clearing sent messages:', error)
  }
}

/**
 * Clear all messages from queue (for testing or reset)
 */
export const clearQueue = async () => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await store.clear()
    await tx.done
  } catch (error) {
    console.error('[IndexedDBQueue] Error clearing queue:', error)
  }
}

/**
 * Get next retry delay based on retry count
 * @param {number} retryCount - Current retry count
 * @returns {number} - Delay in milliseconds
 */
export const getNextRetryDelay = (retryCount) => {
  if (retryCount >= RETRY_DELAYS.length) {
    return RETRY_DELAYS[RETRY_DELAYS.length - 1]
  }
  return RETRY_DELAYS[retryCount]
}

/**
 * Get all messages for a specific channel or conversation
 * @param {string} id - Channel ID or conversation ID
 * @param {string} type - 'channel' or 'direct'
 * @returns {Promise<Array>} - Array of messages
 */
export const getMessagesByContext = async (id, type = 'channel') => {
  try {
    if (type === 'channel') {
      return await getPendingMessages(id, null)
    } else {
      return await getPendingMessages(null, id)
    }
  } catch (error) {
    console.error('[IndexedDBQueue] Error getting messages by context:', error)
    return []
  }
}

/**
 * Get message by ID
 * @param {string} messageId - Queue message ID
 * @returns {Promise<Object|null>} - Message or null
 */
export const getMessageById = async (messageId) => {
  try {
    const db = await initDB()
    return await db.get(STORE_NAME, messageId)
  } catch (error) {
    console.error('[IndexedDBQueue] Error getting message by ID:', error)
    return null
  }
}

/**
 * Update message with new data
 * @param {string} messageId - Queue message ID
 * @param {Object} updates - Fields to update
 */
export const updateMessage = async (messageId, updates) => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const message = await store.get(messageId)
    
    if (message) {
      Object.assign(message, updates, {
        lastUpdate: Date.now()
      })
      await store.put(message)
    }
    
    await tx.done
  } catch (error) {
    console.error('[IndexedDBQueue] Error updating message:', error)
  }
}
