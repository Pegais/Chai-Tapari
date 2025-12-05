/**
 * Message Queue Service
 * 
 * Why: Handle message sending with retry logic and offline queue
 * How: Stores messages in localStorage, retries failed sends, queues for offline
 * Impact: Messages never lost, works with slow/unreliable connections
 */

const QUEUE_STORAGE_KEY = 'message_queue'
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 3000, 5000] // Exponential backoff in milliseconds

/**
 * Get message queue from localStorage
 */
const getQueue = () => {
  try {
    const queue = localStorage.getItem(QUEUE_STORAGE_KEY)
    return queue ? JSON.parse(queue) : []
  } catch (error) {
    console.error('[MessageQueue] Error reading queue:', error)
    return []
  }
}

/**
 * Save message queue to localStorage
 */
const saveQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('[MessageQueue] Error saving queue:', error)
  }
}

/**
 * Add message to queue
 * @param {Object} messageData - Message data to send
 * @param {string} type - 'channel' or 'direct'
 */
export const addToQueue = (messageData, type = 'channel') => {
  const queue = getQueue()
  const queuedMessage = {
    id: `queue-${Date.now()}-${Math.random()}`,
    ...messageData,
    type,
    status: 'pending',
    retryCount: 0,
    timestamp: Date.now(),
  }
  
  queue.push(queuedMessage)
  saveQueue(queue)
  return queuedMessage.id
}

/**
 * Update message status in queue
 */
export const updateQueueStatus = (messageId, status, error = null) => {
  const queue = getQueue()
  const messageIndex = queue.findIndex(msg => msg.id === messageId)
  
  if (messageIndex !== -1) {
    queue[messageIndex].status = status
    queue[messageIndex].lastError = error
    queue[messageIndex].lastUpdate = Date.now()
    saveQueue(queue)
  }
}

/**
 * Remove message from queue
 */
export const removeFromQueue = (messageId) => {
  const queue = getQueue()
  const filteredQueue = queue.filter(msg => msg.id !== messageId)
  saveQueue(filteredQueue)
}

/**
 * Get pending messages from queue
 */
export const getPendingMessages = () => {
  const queue = getQueue()
  return queue.filter(msg => msg.status === 'pending' || msg.status === 'failed')
}

/**
 * Mark message as failed and increment retry count
 */
export const markAsFailed = (messageId, error) => {
  const queue = getQueue()
  const messageIndex = queue.findIndex(msg => msg.id === messageId)
  
  if (messageIndex !== -1) {
    queue[messageIndex].retryCount += 1
    queue[messageIndex].status = queue[messageIndex].retryCount >= MAX_RETRIES ? 'failed_permanently' : 'failed'
    queue[messageIndex].lastError = error
    queue[messageIndex].lastUpdate = Date.now()
    saveQueue(queue)
  }
}

/**
 * Clear all successfully sent messages from queue
 */
export const clearSentMessages = () => {
  const queue = getQueue()
  const filteredQueue = queue.filter(msg => msg.status !== 'sent')
  saveQueue(filteredQueue)
}

/**
 * Clear all messages from queue (for testing or reset)
 */
export const clearQueue = () => {
  localStorage.removeItem(QUEUE_STORAGE_KEY)
}

/**
 * Get next retry delay based on retry count
 */
export const getNextRetryDelay = (retryCount) => {
  if (retryCount >= RETRY_DELAYS.length) {
    return RETRY_DELAYS[RETRY_DELAYS.length - 1]
  }
  return RETRY_DELAYS[retryCount]
}
