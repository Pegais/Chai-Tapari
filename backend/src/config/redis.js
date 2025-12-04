/**
 * Redis Configuration Module
 * 
 * Why: Centralized Redis connection for session storage and caching
 * How: Creates Redis client with connection pooling
 * Impact: Enables session management and presence tracking
 * 
 * Common Errors:
 * 1. Connection refused - Redis server not running
 * 2. Authentication failed - Wrong password in REDIS_PASSWORD
 * 3. ECONNREFUSED - Redis server not accessible on specified host/port
 */

const redis = require('redis')

let redisClient = null

/**
 * Create Redis client connection
 * Why: Establish connection for session storage and presence tracking
 * How: Creates Redis client with configuration from environment variables
 * Impact: Enables Redis-based features like sessions and online status
 */
const createRedisClient = () => {
  if (redisClient) {
    return redisClient
  }

  // Build Redis configuration from environment variables
  // Supports both local Redis and Redis Cloud (Redis Labs)
  const config = {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.warn('[Redis] Max reconnection attempts reached. Redis features will be disabled.')
          return false // Stop reconnecting after 10 attempts
        }
        const delay = Math.min(retries * 50, 2000)
        return delay
      },
      connectTimeout: 5000, // 5 second timeout
    },
  }

  // Add username if provided (for Redis Cloud/Redis Labs)
  if (process.env.REDIS_USERNAME) {
    config.username = process.env.REDIS_USERNAME
  }

  // Add password if provided
  if (process.env.REDIS_PASSWORD) {
    config.password = process.env.REDIS_PASSWORD
  }

  // Create Redis client using createClient (same as user's example)
  redisClient = redis.createClient(config)

  redisClient.on('error', (err) => {
    // Log error but don't crash the application
    // Only log if it's not a connection refused error (those are expected if Redis isn't running)
    if (err.code !== 'ECONNREFUSED') {
      console.warn('[Redis] Connection error:', err.message)
      console.warn('[Redis] Some features (presence tracking, session storage) may be unavailable.')
    }
  })

  redisClient.on('connect', () => {
    console.log('[Redis] Client connecting...')
  })

  redisClient.on('ready', () => {
    console.log('[Redis] Client ready and connected')
  })

  redisClient.on('end', () => {
    console.log('[Redis] Client connection ended')
  })

  redisClient.on('reconnecting', () => {
    console.log('[Redis] Client reconnecting...')
  })

  return redisClient
}

/**
 * Get Redis client instance
 * Why: Provide single Redis client instance across application
 * How: Returns existing client or creates new one
 * Impact: Prevents multiple connections and ensures connection reuse
 */
const getRedisClient = () => {
  if (!redisClient) {
    return createRedisClient()
  }
  return redisClient
}

module.exports = {
  createRedisClient,
  getRedisClient,
}

