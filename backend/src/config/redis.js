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

  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
  }

  redisClient = redis.createClient(config)

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err)
  })

  redisClient.on('connect', () => {
    console.log('Redis Client Connected')
  })

  redisClient.on('ready', () => {
    console.log('Redis Client Ready')
  })

  redisClient.on('end', () => {
    console.log('Redis Client Connection Ended')
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

