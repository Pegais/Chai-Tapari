/**
 * Rate Limiting Middleware
 * 
 * Why: Prevent abuse and protect server resources
 * How: Limits number of requests per IP address or user within time window
 * Impact: Protects API from excessive requests and potential DoS attacks
 * 
 * Common Errors:
 * 1. Too many requests - Rate limit exceeded
 */

const rateLimit = require('express-rate-limit')

/**
 * GET requests rate limiter (lenient for reading data)
 * Why: Allow frequent reads without blocking users
 * How: Allows 300 requests per 15 minutes per IP
 * Impact: Enables normal browsing while preventing abuse
 */
const getRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.GET_RATE_LIMIT_MAX) || 300, // Increased from 100 to 300
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  // Only apply to GET requests
  skip: (req) => req.method !== 'GET',
})

/**
 * POST/PUT/DELETE requests rate limiter (moderate for writes)
 * Why: Limit write operations more strictly than reads
 * How: Allows 150 requests per 15 minutes per IP
 * Impact: Prevents abuse while allowing normal write operations
 */
const writeRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.WRITE_RATE_LIMIT_MAX) || 150, // Increased from 100 to 150
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  // Only apply to POST, PUT, DELETE requests
  skip: (req) => !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method),
})

/**
 * General API rate limiter (combined)
 * Why: Apply appropriate limits based on request method
 * How: Uses separate limiters for GET and write operations
 * Impact: Balanced protection without blocking normal usage
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Further increased to 1000 for chat app
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests to be more lenient
  skipFailedRequests: false,
})

/**
 * Authentication rate limiter
 * Why: Prevent brute force attacks on login/register
 * How: Allows 10 requests per 15 minutes per IP (increased from 5)
 * Impact: Protects authentication endpoints from abuse while allowing legitimate retries
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10, // Increased from 5 to 10
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15, // minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
})

/**
 * Message creation rate limiter
 * Why: Prevent spam in channels
 * How: Allows 50 messages per minute per user (increased from 30)
 * Impact: Prevents message spam while allowing active conversations
 */
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.MESSAGE_RATE_LIMIT_MAX) || 100, // Further increased to 100 messages per minute
  message: {
    success: false,
    message: 'Too many messages, please slow down',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 1, // minute
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed messages to be more lenient
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    // Why: Per-user limits are more fair than per-IP for authenticated users
    return req.user ? req.user.userId : req.ip
  },
})

module.exports = {
  apiLimiter,
  authLimiter,
  messageLimiter,
  getRequestLimiter,
  writeRequestLimiter,
}

