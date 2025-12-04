# Rate Limiting Guide

This document explains what happens when your requests are blocked due to rate limiting in the Chai Tapri application.

## What Happens When You're Rate Limited?

### 1. **HTTP Response**

When a request exceeds the rate limit, the server responds with:

- **Status Code**: `429 Too Many Requests`
- **Response Body**:
  ```json
  {
    "success": false,
    "message": "Too many requests from this IP, please try again later",
    "error": "RATE_LIMIT_EXCEEDED"
  }
  ```
- **Response Headers**:
  - `RateLimit-Limit`: Maximum number of requests allowed
  - `RateLimit-Remaining`: Number of requests remaining in current window
  - `RateLimit-Reset`: Timestamp when the rate limit resets
  - `Retry-After`: Seconds until you can make another request (if applicable)

### 2. **Request Behavior**

- The request is **immediately rejected** by the server
- No processing occurs (the request never reaches your controller)
- The client receives the 429 error response
- The request is **not retried automatically** (to prevent further rate limit violations)

### 3. **Frontend Handling**

When the frontend receives a 429 error:

1. **Error Detection**: Axios interceptor catches the 429 status code
2. **Error Message**: User sees a friendly error message
3. **No Auto-Retry**: The request is not automatically retried
4. **User Action Required**: User must wait before trying again

## Rate Limit Thresholds

### Authentication Endpoints (`/api/auth/login`, `/api/auth/signup`, `/api/auth/google`)
- **Limit**: 10 requests per 15 minutes per IP address (increased from 5)
- **Window**: 15 minutes
- **Purpose**: Prevent brute force attacks while allowing legitimate retries

### General API Endpoints
- **Limit**: 1000 requests per 15 minutes per IP address (increased from 500)
- **Window**: 15 minutes
- **Purpose**: Prevent API abuse while allowing normal chat application usage
- **Note**: Only failed requests are counted, successful requests are skipped for better user experience

### Message Creation (`POST /api/messages`)
- **Limit**: 100 messages per minute per user (increased from 50)
- **Window**: 1 minute
- **Purpose**: Prevent message spam while allowing active conversations
- **Note**: Only failed messages are counted, successful messages are skipped

## What You'll See

### In the Browser Console

```
[API Error] POST /api/auth/login {
  status: 429,
  message: "Too many authentication attempts, please try again later"
}
[API] Rate limit exceeded
```

### In the UI

- **Login/Signup Pages**: Error message displayed in red below the form
- **Message Input**: Error message shown, message not sent
- **API Calls**: Error message in console, request fails

## How to Handle Rate Limiting

### For Users

1. **Wait**: The rate limit resets after the time window (15 minutes for auth, 1 minute for messages)
2. **Check Retry Time**: Look at the error message or check browser console for reset time
3. **Reduce Requests**: If you're making many requests, slow down
4. **Contact Support**: If you believe you're being rate limited incorrectly

### For Developers

1. **Check Rate Limit Headers**: Inspect response headers for limit information
2. **Implement Exponential Backoff**: Retry requests with increasing delays
3. **Cache Responses**: Reduce API calls by caching data
4. **Batch Requests**: Combine multiple requests when possible
5. **Monitor Usage**: Track your request rate to avoid hitting limits

## Rate Limit Headers Explained

When you make a request, the server includes these headers:

```
RateLimit-Limit: 100          # Maximum requests allowed
RateLimit-Remaining: 45       # Requests remaining in current window
RateLimit-Reset: 1704067200   # Unix timestamp when limit resets
Retry-After: 900              # Seconds until you can retry (if rate limited)
```

## Example Scenarios

### Scenario 1: Too Many Login Attempts

**What Happens:**
1. User tries to login 11 times in 15 minutes
2. 11th attempt is blocked with 429 error
3. User sees: "Too many authentication attempts, please try again later"
4. User must wait 15 minutes before trying again

**Response:**
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 15
}
```

### Scenario 2: Too Many API Requests

**What Happens:**
1. Frontend makes 501 API calls in 15 minutes
2. 501st request is blocked with 429 error
3. Error logged in console
4. User may see error message depending on context

**Response:**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later",
  "error": "RATE_LIMIT_EXCEEDED"
}
```

### Scenario 3: Message Spam

**What Happens:**
1. User sends 51 messages in 1 minute
2. 51st message is blocked with 429 error
3. Error message shown: "Too many messages, please slow down"
4. User must wait 1 minute before sending more messages

**Response:**
```json
{
  "success": false,
  "message": "Too many messages, please slow down",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 1
}
```

## Best Practices

### For Users
- ✅ Don't spam login attempts
- ✅ Don't send messages too quickly
- ✅ Wait if you see a rate limit error
- ✅ Use the application normally

### For Developers
- ✅ Implement request caching
- ✅ Use WebSocket for real-time updates (not REST API polling)
- ✅ Batch multiple operations when possible
- ✅ Handle 429 errors gracefully with user-friendly messages
- ✅ Implement exponential backoff for retries

## Testing Rate Limits

To test rate limiting (in development only):

1. **Authentication Rate Limit**:
   ```bash
   # Make 6 login attempts quickly
   for i in {1..6}; do
     curl -X POST http://localhost:5000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com","password":"test"}'
   done
   ```

2. **API Rate Limit**:
   ```bash
   # Make 101 API requests quickly
   for i in {1..101}; do
     curl http://localhost:5000/api/channels
   done
   ```

## Configuration

Rate limits can be configured via environment variables:

```env
# Backend .env
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=1000         # Maximum requests per window (default: 1000)
AUTH_RATE_LIMIT_MAX=10               # Auth requests per window (default: 10)
MESSAGE_RATE_LIMIT_MAX=100           # Messages per minute per user (default: 100)
GET_RATE_LIMIT_MAX=300               # GET requests per window (default: 300)
WRITE_RATE_LIMIT_MAX=150             # POST/PUT/DELETE requests per window (default: 150)
```

### Recent Optimizations

To improve communication and prevent blocking legitimate users, rate limits have been optimized:

- **General API limit**: Increased from 500 to 1000 requests per 15 minutes (only failed requests count)
- **Auth limit**: Increased from 5 to 10 requests per 15 minutes  
- **Message limit**: Increased from 50 to 100 messages per minute (only failed messages count)
- **GET requests**: More lenient limit of 300 requests per 15 minutes
- **Write requests**: Moderate limit of 150 requests per 15 minutes
- **Optimization**: Only failed requests are counted, successful requests don't count against limits

## Summary

When rate limited:
- ✅ Request is rejected immediately (429 status)
- ✅ Error message is returned
- ✅ Rate limit headers are included
- ✅ User must wait before retrying
- ✅ No automatic retries (to prevent further violations)
- ✅ Error is logged for monitoring

The rate limiting protects the server from abuse while allowing normal usage patterns.
