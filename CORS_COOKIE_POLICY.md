# CORS and Cookie Policy Configuration

This document explains the CORS and cookie policy configuration for cross-origin deployment on Railway (backend) and Vercel (frontend).

## Overview

The application uses **JWT tokens in Authorization headers** (not cookies) for authentication, which simplifies CORS configuration. However, proper CORS settings are still essential for cross-origin requests.

## Backend CORS Configuration

### Main Express App (`backend/src/app.js`)

**Configuration:**
- **Origin**: Supports single or multiple origins (comma-separated)
  - Single: `FRONTEND_URL=https://your-app.vercel.app`
  - Multiple: `FRONTEND_URL=https://your-app.vercel.app,http://localhost:3000`
- **Credentials**: `true` (required for Authorization headers)
- **Methods**: `GET, POST, PATCH, DELETE, PUT, OPTIONS`
- **Headers**: `Content-Type, Authorization, X-Requested-With`
- **Max Age**: 86400 seconds (24 hours) for preflight caching

**Dynamic Origin Matching:**
- Checks request origin against allowed origins
- Allows requests with no origin (mobile apps, Postman)
- In development, allows all origins for easier testing

### Socket.IO (`backend/src/server.js`)

**Configuration:**
- **Origin**: Same as Express app (supports multiple origins)
- **Credentials**: `true` (for authentication tokens)
- **Methods**: `GET, POST`
- **Headers**: `Authorization, Content-Type`
- **Transports**: `websocket, polling` (for better compatibility)

### Avatar Routes (`backend/src/routes/avatarRoutes.js`)

**Configuration:**
- **Origin**: Supports multiple origins
- **Credentials**: `false` (images don't need credentials)
- **Methods**: `GET, OPTIONS`
- **Headers**: `Content-Type`
- **Dynamic Origin**: Sets CORS header based on request origin

### Express Gateway (`backend/gateway/config/gateway.config.js`)

**Configuration:**
- **Origin**: Uses `FRONTEND_URL` environment variable
- **Credentials**: `true`
- **Methods**: `GET, POST, PATCH, DELETE, PUT, OPTIONS`
- **Headers**: `Content-Type, Authorization, X-Requested-With`

## Frontend Configuration

### Axios Client (`frontend/src/config/axios.js`)

**Configuration:**
- **Base URL**: `REACT_APP_API_URL` (defaults to `http://localhost:5000/api`)
- **withCredentials**: `false` (using JWT tokens in headers, not cookies)
- **Timeout**: 30 seconds
- **Headers**: `Content-Type: application/json`
- **Authorization**: Added via interceptor from `localStorage.getItem('token')`

### Socket.IO Client (`frontend/src/services/socket.js`)

**Configuration:**
- **URL**: `REACT_APP_SOCKET_URL` or derived from `REACT_APP_API_URL`
- **Auth**: Token sent in `auth.token` field
- **Transports**: `websocket, polling`
- **Reconnection**: Enabled with exponential backoff

## Environment Variables

### Backend (Railway)

```env
# Frontend URL for CORS
# Single origin:
FRONTEND_URL=https://your-app.vercel.app

# Multiple origins (dev + prod):
FRONTEND_URL=https://your-app.vercel.app,http://localhost:3000

# Backend URL
BACKEND_URL=https://your-backend.railway.app
```

### Frontend (Vercel)

```env
# Backend API URL
REACT_APP_API_URL=https://your-backend.railway.app/api

# Socket.IO URL (optional, defaults to API URL without /api)
REACT_APP_SOCKET_URL=https://your-backend.railway.app
```

## Cookie Policy

### Current Implementation

**No cookies are used** - The application uses JWT tokens stored in `localStorage` and sent via `Authorization: Bearer <token>` header.

### If Cookies Were Used (Future Reference)

For cookie-based authentication, you would need:

**Backend:**
```javascript
app.use(session({
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'none', // Required for cross-origin cookies
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: process.env.COOKIE_DOMAIN, // Set if using subdomains
  }
}))
```

**Frontend:**
```javascript
// Axios config
withCredentials: true // Required for cookies
```

## CORS Flow

### Preflight Requests (OPTIONS)

1. Browser sends OPTIONS request with:
   - `Origin: https://your-app.vercel.app`
   - `Access-Control-Request-Method: POST`
   - `Access-Control-Request-Headers: Authorization, Content-Type`

2. Backend responds with:
   - `Access-Control-Allow-Origin: https://your-app.vercel.app`
   - `Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, PUT, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Max-Age: 86400`

3. Browser caches preflight response for 24 hours

### Actual Requests

1. Browser sends request with:
   - `Origin: https://your-app.vercel.app`
   - `Authorization: Bearer <token>`
   - `Content-Type: application/json`

2. Backend validates origin and processes request

3. Backend responds with:
   - `Access-Control-Allow-Origin: https://your-app.vercel.app`
   - `Access-Control-Allow-Credentials: true`
   - Response data

## Testing CORS Configuration

### 1. Check Preflight Response

```bash
curl -X OPTIONS https://your-backend.railway.app/api/channels \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -v
```

**Expected Headers:**
- `Access-Control-Allow-Origin: https://your-app.vercel.app`
- `Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, PUT, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`
- `Access-Control-Allow-Credentials: true`

### 2. Check Actual Request

```bash
curl -X GET https://your-backend.railway.app/api/channels \
  -H "Origin: https://your-app.vercel.app" \
  -H "Authorization: Bearer <token>" \
  -v
```

**Expected:**
- Status: 200
- `Access-Control-Allow-Origin: https://your-app.vercel.app`
- Response data

### 3. Browser Console

Open browser DevTools → Network tab:
- Check for CORS errors in console
- Verify `Access-Control-Allow-Origin` header in response
- Check preflight requests (OPTIONS) are successful

## Common CORS Issues and Solutions

### Issue 1: "Access-Control-Allow-Origin" header missing

**Cause**: CORS middleware not applied or origin not matching

**Solution**:
1. Verify `FRONTEND_URL` in Railway matches Vercel URL exactly
2. Check for trailing slashes (should not have)
3. Ensure protocol matches (both https)
4. Check CORS middleware is before routes in `app.js`

### Issue 2: "Credentials flag is true, but Access-Control-Allow-Credentials is not 'true'"

**Cause**: CORS credentials not enabled

**Solution**:
- Verify `credentials: true` in CORS configuration
- Check all CORS configurations (Express, Socket.IO, Gateway)

### Issue 3: Preflight request fails

**Cause**: OPTIONS method not allowed or headers not allowed

**Solution**:
- Ensure `OPTIONS` is in allowed methods
- Verify all required headers are in `allowedHeaders`
- Check `Access-Control-Max-Age` is set for caching

### Issue 4: WebSocket connection fails

**Cause**: Socket.IO CORS not configured correctly

**Solution**:
1. Verify `REACT_APP_SOCKET_URL` in Vercel
2. Check Socket.IO CORS in `server.js`
3. Ensure origin matches frontend URL
4. Check Railway networking (WebSocket support)

### Issue 5: Multiple origins not working

**Cause**: Origin matching logic not handling comma-separated values

**Solution**:
- Verify `getAllowedOrigins()` function splits comma-separated values
- Check origin matching logic in CORS configuration
- Test with both origins

## Security Considerations

1. **Never use wildcard (`*`) origin** with credentials
   - Always specify exact origins
   - Use environment variables for production URLs

2. **HTTPS in production**
   - Both Railway and Vercel provide HTTPS by default
   - Ensure `FRONTEND_URL` uses `https://`

3. **Token Security**
   - Tokens stored in `localStorage` (accessible to JavaScript)
   - Consider `httpOnly` cookies for enhanced security (requires cookie configuration)

4. **Origin Validation**
   - Always validate request origin
   - Reject requests from unknown origins

## Production Checklist

- [ ] `FRONTEND_URL` set in Railway with production Vercel URL
- [ ] `REACT_APP_API_URL` set in Vercel with production Railway URL
- [ ] `REACT_APP_SOCKET_URL` set in Vercel (or uses API URL)
- [ ] CORS allows production frontend origin
- [ ] Credentials enabled in all CORS configurations
- [ ] All HTTP methods allowed (GET, POST, PATCH, DELETE, PUT, OPTIONS)
- [ ] Authorization header allowed
- [ ] Preflight caching enabled (maxAge: 86400)
- [ ] WebSocket CORS configured
- [ ] Avatar routes CORS configured
- [ ] No CORS errors in browser console
- [ ] WebSocket connections working
- [ ] File uploads working
- [ ] Authentication working

## References

- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS Documentation](https://expressjs.com/en/resources/middleware/cors.html)
- [Socket.IO CORS Documentation](https://socket.io/docs/v4/handling-cors/)
- [Railway Deployment](https://docs.railway.app/)
- [Vercel Deployment](https://vercel.com/docs)

