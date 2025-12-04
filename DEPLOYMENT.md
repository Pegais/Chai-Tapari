# Deployment Guide for Chai Tapri

This guide explains how to deploy the Chai Tapri application to Railway (backend) and Vercel (frontend).

## Architecture

- **Backend**: Railway (Node.js/Express)
- **Frontend**: Vercel (React)
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud (optional)
- **File Storage**: AWS S3

## Prerequisites

1. Railway account: https://railway.app
2. Vercel account: https://vercel.com
3. MongoDB Atlas account: https://www.mongodb.com/cloud/atlas
4. AWS account (for S3): https://aws.amazon.com
5. Redis Cloud account (optional): https://redis.com/cloud

## Backend Deployment (Railway)

### Step 1: Prepare Backend Repository

1. Ensure your backend code is in a Git repository
2. Make sure `package.json` has a `start` script:
   ```json
   {
     "scripts": {
       "start": "node src/server.js"
     }
   }
   ```

### Step 2: Deploy to Railway

1. Go to https://railway.app and create a new project
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js and start deployment

### Step 3: Configure Environment Variables

In Railway dashboard, go to your service → Variables tab and add:

```env
# Server
PORT=5000
NODE_ENV=production
BACKEND_URL=https://your-app.railway.app

# Frontend URL (your Vercel deployment URL)
FRONTEND_URL=https://your-app.vercel.app

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chai-tapri?retryWrites=true&w=majority

# Redis (optional)
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
REDIS_USERNAME=your-redis-username
REDIS_PASSWORD=your-redis-password

# Authentication
JWT_SECRET=your-production-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-production-session-secret-minimum-32-characters

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
MAX_FILE_SIZE=10485760

# Twilio (for OTP - optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

### Step 4: Get Railway Backend URL

1. In Railway dashboard, go to Settings → Networking
2. Generate a public domain or use the provided Railway domain
3. Copy the URL (e.g., `https://chai-tapri-backend.railway.app`)

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend Repository

1. Ensure your frontend code is in a Git repository
2. Make sure `package.json` has a `build` script:
   ```json
   {
     "scripts": {
       "build": "react-scripts build"
     }
   }
   ```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com and import your repository
2. Configure project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend` (if frontend is in a subdirectory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 3: Configure Environment Variables

In Vercel dashboard, go to your project → Settings → Environment Variables:

```env
# Backend API URL (your Railway backend URL)
REACT_APP_API_URL=https://your-app.railway.app/api

# Socket.IO URL (your Railway backend URL)
REACT_APP_SOCKET_URL=https://your-app.railway.app
```

### Step 4: Get Vercel Frontend URL

1. After deployment, Vercel provides a URL (e.g., `https://chai-tapri.vercel.app`)
2. Copy this URL

## Update CORS Configuration

### Backend (Railway)

1. Go back to Railway dashboard → Variables
2. Update `FRONTEND_URL` with your Vercel URL:
   ```env
   FRONTEND_URL=https://chai-tapri.vercel.app
   ```
   
   Or for multiple origins (dev + prod):
   ```env
   FRONTEND_URL=https://chai-tapri.vercel.app,http://localhost:3000
   ```

3. Redeploy the backend service

## CORS Configuration Details

### Backend CORS Settings

- **Origin**: Supports single or multiple origins (comma-separated)
- **Credentials**: `true` (for JWT token authentication)
- **Methods**: `GET, POST, PATCH, DELETE, PUT, OPTIONS`
- **Headers**: `Content-Type, Authorization, X-Requested-With`
- **Max Age**: 86400 seconds (24 hours) for preflight caching

### Frontend Configuration

- **Axios**: Uses `Authorization: Bearer <token>` header (not cookies)
- **withCredentials**: `false` (since we use JWT tokens, not cookies)
- **Socket.IO**: Configured with same origin as backend

## Testing Deployment

1. **Backend Health Check**:
   - Visit: `https://your-backend.railway.app/health`
   - Should return: `{"success": true, "message": "Server is running"}`

2. **Frontend**:
   - Visit your Vercel URL
   - Try logging in
   - Check browser console for CORS errors

3. **WebSocket**:
   - Open browser DevTools → Network → WS
   - Should see WebSocket connection established

## Common Issues and Solutions

### CORS Errors

**Issue**: `Access-Control-Allow-Origin` errors

**Solution**:
1. Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
2. Check for trailing slashes (should not have)
3. Ensure protocol matches (both https or both http)
4. Clear browser cache and try again

### WebSocket Connection Failed

**Issue**: Socket.IO connection fails

**Solution**:
1. Verify `REACT_APP_SOCKET_URL` in Vercel matches Railway backend URL
2. Check Railway networking settings (ensure WebSocket is enabled)
3. Verify CORS settings in `server.js` allow your frontend origin

### Authentication Not Working

**Issue**: 401 Unauthorized errors

**Solution**:
1. Verify JWT_SECRET is set in Railway
2. Check token is being sent in Authorization header
3. Verify token format: `Bearer <token>`

### File Upload Fails

**Issue**: S3 upload errors

**Solution**:
1. Verify AWS credentials in Railway
2. Check S3 bucket policy allows uploads
3. Verify bucket name matches `AWS_S3_BUCKET_NAME`

## Production Checklist

- [ ] All environment variables set in Railway
- [ ] All environment variables set in Vercel
- [ ] CORS configured with production URLs
- [ ] MongoDB Atlas connection string configured
- [ ] Redis Cloud configured (if using)
- [ ] AWS S3 bucket configured with proper permissions
- [ ] JWT_SECRET and SESSION_SECRET are strong (32+ characters)
- [ ] NODE_ENV set to `production`
- [ ] Health check endpoint working
- [ ] Frontend can connect to backend API
- [ ] WebSocket connections working
- [ ] File uploads working
- [ ] Authentication working
- [ ] Private channels only visible to members

## Monitoring

### Railway

- View logs in Railway dashboard
- Monitor resource usage
- Set up alerts for errors

### Vercel

- View deployment logs
- Monitor build times
- Check analytics

## Security Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Enable HTTPS** - Both Railway and Vercel provide HTTPS by default
4. **Rate Limiting** - Already configured in backend
5. **CORS** - Only allow your frontend domain(s)

## Support

For issues:
1. Check Railway logs
2. Check Vercel deployment logs
3. Check browser console for errors
4. Verify all environment variables are set correctly

