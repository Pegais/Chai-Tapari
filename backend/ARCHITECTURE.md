# Backend Architecture Documentation

## Overview

The Chai Tapri backend follows RESTful API principles with MVC architecture, providing a scalable and maintainable codebase for the team chat application.

## Architecture Pattern

### MVC (Model-View-Controller)

1. Models: Database schemas and data structures
   - User Model: User accounts and authentication
   - Channel Model: Chat channels and membership
   - Message Model: Chat messages and metadata

2. Views: JSON API responses
   - All responses follow consistent format
   - Success responses include data object
   - Error responses include error details

3. Controllers: Request handlers
   - Process HTTP requests
   - Call service layer
   - Return formatted responses

4. Services: Business logic layer
   - Contains application logic
   - Interacts with models
   - Handles data validation and transformation

## Request Flow

```
Client Request
    ↓
Express Gateway (Optional)
    ↓
Rate Limiter Middleware
    ↓
Authentication Middleware (if protected)
    ↓
Validation Middleware
    ↓
Controller
    ↓
Service Layer
    ↓
Model/Database
    ↓
Service Layer
    ↓
Controller
    ↓
Response
```

## Error Handling Flow

```
Error Occurs
    ↓
Service throws error with statusCode
    ↓
Controller catches and passes to next()
    ↓
Error Handler Middleware
    ↓
Logger logs error
    ↓
Formatted error response sent to client
```

## Database Schema Relationships

```
User
  ├── Has many Channels (as member)
  ├── Has many Messages (as sender)
  └── Has many Starred Channels

Channel
  ├── Belongs to User (createdBy)
  ├── Has many Users (members)
  └── Has many Messages

Message
  ├── Belongs to User (sender)
  └── Belongs to Channel
```

## WebSocket Flow

```
Client Connects
    ↓
Socket.IO Authentication
    ↓
User marked online in Redis
    ↓
User joins personal room
    ↓
Client can join channels
    ↓
Real-time events:
  - send-message
  - typing-start/stop
  - edit-message
  - delete-message
    ↓
Broadcast to channel members
    ↓
Client Disconnects
    ↓
Remove socket ID
    ↓
If no more sockets, mark offline
```

## Express Gateway Integration

The Express Gateway provides shared services:

1. Authentication Middleware
   - JWT token verification
   - User context injection

2. Rate Limiting
   - Per-IP rate limiting
   - Per-user rate limiting for authenticated routes

3. CORS
   - Cross-origin request handling
   - Credential support

4. Request Proxying
   - Routes requests to backend services
   - Load balancing support

## Common Error Scenarios

### Authentication Errors
- Missing token: 401 Unauthorized
- Invalid token: 401 Unauthorized
- Expired token: 401 Unauthorized

### Validation Errors
- Missing required fields: 400 Bad Request
- Invalid format: 400 Bad Request
- Length constraints: 400 Bad Request

### Authorization Errors
- Not channel member: 403 Forbidden
- Not message owner: 403 Forbidden
- Private channel access: 403 Forbidden

### Resource Errors
- User not found: 404 Not Found
- Channel not found: 404 Not Found
- Message not found: 404 Not Found

### Conflict Errors
- User already exists: 409 Conflict
- Channel name exists: 409 Conflict

### Server Errors
- Database connection: 500 Internal Server Error
- Redis connection: 500 Internal Server Error
- Unexpected errors: 500 Internal Server Error

## Security Considerations

1. Password Hashing
   - Bcrypt with salt rounds
   - Passwords never stored in plain text

2. JWT Tokens
   - Signed with secret key
   - Expiration time configured
   - Token verification on protected routes

3. Rate Limiting
   - Prevents brute force attacks
   - Protects against DoS attacks
   - Different limits for different endpoints

4. Input Validation
   - All inputs validated
   - SQL injection prevention (MongoDB)
   - XSS prevention through validation

5. CORS
   - Restricted to frontend URL
   - Credentials enabled for cookies

## Performance Optimizations

1. Database Indexing
   - Indexes on frequently queried fields
   - Compound indexes for complex queries

2. Redis Caching
   - Session storage
   - Presence tracking
   - Online user lists

3. Connection Pooling
   - MongoDB connection pooling
   - Redis connection reuse

4. Response Compression
   - Gzip compression enabled
   - Reduces response size

## Logging Strategy

1. Log Levels
   - Error: Critical issues
   - Warn: Warning messages
   - Info: Informational messages
   - Debug: Debug information

2. Log Destinations
   - Console (development)
   - File: logs/combined.log
   - File: logs/error.log

3. Log Format
   - Timestamp
   - Log level
   - Message
   - Metadata (URL, method, IP, etc.)

## Deployment Considerations

1. Environment Variables
   - All sensitive data in .env
   - Different configs for dev/prod

2. Health Checks
   - /health endpoint for monitoring
   - Database connection checks

3. Graceful Shutdown
   - Handles SIGTERM and SIGINT
   - Closes connections properly
   - Timeout for forced shutdown

4. Process Management
   - Use PM2 or similar for production
   - Auto-restart on crashes
   - Log rotation

