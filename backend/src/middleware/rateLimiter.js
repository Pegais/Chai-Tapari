/**
 * Rate Limiting Middleware
 * 
 * Why: Prevent abuse and protect server resources
 * How: Limits number of requests per IP address within time window
 * Impact: Protects API from excessive requests and potential DoS attacks
 * 
 * Common Errors:
 * 1. Too many requests - Rate limit exceeded
 */

const rateLimit = require('express-rate-limit')

/**
 * General API rate limiter
 * Why: Limit requests to all API endpoints
 * How: Allows 100 requests per 15 minutes per IP
 * Impact: Prevents abuse while allowing normal usage
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Authentication rate limiter
 * Why: Prevent brute force attacks on login/register
 * How: Allows 5 requests per 15 minutes per IP
 * Impact: Protects authentication endpoints from abuse
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Message creation rate limiter
 * Why: Prevent spam in channels
 * How: Allows 30 messages per minute per user
 * Impact: Prevents message spam while allowing normal chat
 */
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Too many messages, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? req.user.userId : req.ip
  },
})

module.exports = {
  apiLimiter,
  authLimiter,
  messageLimiter,
}

