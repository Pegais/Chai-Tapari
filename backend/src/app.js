/**
 * Express Application Setup
 * 
 * Why: Configure Express application with middleware and routes
 * How: Sets up middleware stack, routes, error handling
 * Impact: Provides HTTP API server for frontend
 * 
 * Middleware Order:
 * 1. Security headers (helmet)
 * 2. CORS
 * 3. Body parsing
 * 4. Compression
 * 5. Logging
 * 6. Rate limiting
 * 7. Routes
 * 8. Error handling
 */

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const { apiLimiter } = require('./middleware/rateLimiter')
const { errorHandler, notFound } = require('./middleware/errorHandler')
const logger = require('./utils/logger')

// Import routes
const authRoutes = require('./routes/authRoutes')
const channelRoutes = require('./routes/channelRoutes')
const messageRoutes = require('./routes/messageRoutes')
const userRoutes = require('./routes/userRoutes')
const fileUploadRoutes = require('./routes/fileUploadRoutes')
const avatarRoutes = require('./routes/avatarRoutes')
const directMessageRoutes = require('./routes/directMessageRoutes')

/**
 * Create Express application
 * Why: Initialize Express app instance
 * How: Creates new Express application
 * Impact: Provides HTTP server foundation
 */
const app = express()

/**
 * Security middleware
 * Why: Protect application from common vulnerabilities
 * How: Sets security headers using Helmet
 * Impact: Reduces risk of XSS, clickjacking, and other attacks
 */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded cross-origin
  crossOriginEmbedderPolicy: false, // Allow embedding resources
}))

/**
 * CORS configuration
 * Why: Allow frontend to make requests from different origin
 * How: Configures CORS with frontend URL
 * Impact: Frontend can communicate with backend API
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Content-Length'],
}))

/**
 * Body parsing middleware
 * Why: Parse JSON and URL-encoded request bodies
 * How: Uses Express built-in parsers
 * Impact: Request body data is accessible in controllers
 */
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * Compression middleware
 * Why: Reduce response size for better performance
 * How: Compresses responses using gzip
 * Impact: Faster response times and reduced bandwidth
 */
app.use(compression())

/**
 * Logging middleware
 * Why: Log HTTP requests for debugging and monitoring
 * How: Uses Morgan to log request details
 * Impact: Request logs available for troubleshooting
 */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }))
}

/**
 * Health check endpoint
 * Why: Monitor server status
 * How: Returns server status information
 * Impact: Enables health monitoring and load balancer checks
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  })
})

/**
 * API routes with rate limiting
 * Why: Apply rate limiting to all API routes
 * How: Uses rate limiter middleware before routes
 * Impact: Protects API from excessive requests
 */
app.use('/api/auth', authRoutes)
app.use('/api/avatars', avatarRoutes) // Avatar routes (no rate limit for static assets)
app.use('/api/channels', apiLimiter, channelRoutes)
app.use('/api', apiLimiter, messageRoutes)
app.use('/api/users', apiLimiter, userRoutes)
app.use('/api/upload', apiLimiter, fileUploadRoutes)
app.use('/api/direct-messages', apiLimiter, directMessageRoutes)

/**
 * 404 handler
 * Why: Handle requests to non-existent routes
 * How: Returns 404 error for unmatched routes
 * Impact: Consistent 404 responses
 */
app.use(notFound)

/**
 * Error handler
 * Why: Catch and handle all errors
 * How: Uses error handler middleware
 * Impact: All errors are handled consistently
 */
app.use(errorHandler)

module.exports = app

