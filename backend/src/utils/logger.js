/**
 * Logger Utility
 * 
 * Why: Centralized logging with different log levels
 * How: Uses Winston logger with console and file transports
 * Impact: Consistent logging across the application
 * 
 * Log Levels:
 * 1. error - Critical errors requiring attention
 * 2. warn - Warning messages for potential issues
 * 3. info - Informational messages
 * 4. debug - Debug messages for development
 */

const winston = require('winston')
const path = require('path')

/**
 * Create Winston logger instance
 * Why: Provide structured logging with different levels
 * How: Configures Winston with console and file transports
 * Impact: All application logs are centralized and structured
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'chai-tapri-backend' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
        })
      ),
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
  ],
})

// If we're not in production, log to console with simpler format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}

module.exports = logger

