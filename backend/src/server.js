/**
 * Main Server Entry Point
 * 
 * Why: Start HTTP server and initialize application
 * How: Connects to database, starts Express server, sets up WebSocket
 * Impact: Application is ready to handle requests
 * 
 * Startup Flow:
 * 1. Load environment variables
 * 2. Connect to MongoDB
 * 3. Connect to Redis
 * 4. Start HTTP server
 * 5. Set up WebSocket server
 * 6. Handle graceful shutdown
 */

require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const connectDatabase = require('./config/database')
const { createRedisClient } = require('./config/redis')
const app = require('./app')
const socketHandler = require('./socket/socketHandler')
const logger = require('./utils/logger')
const { startCleanupScheduler } = require('./utils/messageCleanup')

/**
 * Get port from environment or use default
 * Why: Allow port configuration via environment variable
 * How: Reads PORT from environment or defaults to 5000
 * Impact: Flexible port configuration for different environments
 */
const PORT = process.env.PORT || 5000

/**
 * Initialize application
 * Why: Set up database connections and start server
 * How: Connects to MongoDB and Redis, creates HTTP server, starts listening
 * Impact: Application is ready to handle requests
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase()

    // Connect to Redis (optional - server will start even if Redis fails)
    let redisClient = null
    try {
      redisClient = createRedisClient()
      
      // Try to connect with timeout
      const connectPromise = redisClient.connect()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
      
      await Promise.race([connectPromise, timeoutPromise])
      logger.info('[Redis] Successfully connected to Redis')
    } catch (error) {
      logger.warn('[Redis] Failed to connect to Redis:', error.message)
      logger.warn('[Redis] Server will continue without Redis. Some features may be limited.')
      logger.warn('[Redis] To enable Redis features:')
      logger.warn('[Redis]   1. Install Redis: https://redis.io/download')
      logger.warn('[Redis]   2. Start Redis server: redis-server')
      logger.warn('[Redis]   3. Or use Redis Cloud and set REDIS_HOST environment variable')
      redisClient = null // Set to null so socketHandler knows Redis is unavailable
    }

    // Create HTTP server
    const server = http.createServer(app)

    // Set up Socket.IO
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    // Initialize socket handler (pass null if Redis not available)
    socketHandler(io, redisClient)

    // Start message cleanup scheduler
    // Why: Automatically delete messages older than 48 hours
    // How: Runs cleanup job every hour
    // Impact: Maintains user privacy by removing old conversations
    startCleanupScheduler()

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
      if (!redisClient) {
        logger.warn('[Redis] Running without Redis - presence tracking and session storage disabled')
      }
      logger.info('[Privacy] Messages will be automatically deleted after 48 hours')
    })

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`)

      server.close(() => {
        logger.info('HTTP server closed')

        if (redisClient) {
          redisClient.quit().then(() => {
            logger.info('Redis connection closed')
            process.exit(0)
          }).catch((err) => {
            logger.warn('Error closing Redis connection:', err.message)
            process.exit(0)
          })
        } else {
          process.exit(0)
        }
      })

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()

