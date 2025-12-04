# Chai Tapri Backend API

Backend API server for Chai Tapri team chat application built with Node.js, Express, MongoDB, and Socket.IO.

## Architecture

### MVC Pattern
- Models: Database schemas (User, Channel, Message)
- Views: JSON API responses
- Controllers: Request handlers
- Services: Business logic layer

### Express Gateway
- Centralized authentication middleware
- Shared rate limiting
- Request routing and proxying

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and Redis configuration
│   ├── models/          # Mongoose models
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── socket/          # WebSocket handlers
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js         # Server entry point
├── gateway/             # Express Gateway configuration
├── logs/                # Application logs
└── package.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`

4. Start MongoDB and Redis:
```bash
# MongoDB
mongod

# Redis
redis-server
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start

# Gateway (optional)
npm run gateway
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user

### Channels
- `GET /api/channels` - Get all channels
- `POST /api/channels` - Create channel (protected)
- `GET /api/channels/:id` - Get channel by ID
- `POST /api/channels/:id/join` - Join channel (protected)
- `POST /api/channels/:id/leave` - Leave channel (protected)

### Messages
- `GET /api/channels/:channelId/messages` - Get messages (with pagination)
- `POST /api/channels/:channelId/messages` - Create message (protected)
- `PATCH /api/messages/:messageId` - Edit message (protected)
- `DELETE /api/messages/:messageId` - Delete message (protected)

### Users
- `GET /api/users` - Get all users
- `GET /api/users/online` - Get online users
- `GET /api/users/:id` - Get user by ID

### File Upload
- `POST /api/upload` - Upload single file (protected)
- `POST /api/upload/multiple` - Upload multiple files (protected)
- `DELETE /api/upload` - Delete file (protected)

## WebSocket Events

### Client to Server
- `join-channel` - Join a channel
- `leave-channel` - Leave a channel
- `send-message` - Send a message
- `typing-start` - User started typing
- `typing-stop` - User stopped typing
- `edit-message` - Edit a message
- `delete-message` - Delete a message

### Server to Client
- `new-message` - New message received
- `message-edited` - Message was edited
- `message-deleted` - Message was deleted
- `user-typing` - User is typing
- `user-stopped-typing` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline
- `channel:joined` - Successfully joined channel
- `channel:left` - Successfully left channel
- `error` - Error occurred

## Environment Variables

See `.env.example` or `ENV_SETUP.md` for all required environment variables.

### AWS S3 Configuration (Required for File Uploads)
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_S3_BUCKET_NAME` - S3 bucket name
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 10MB)

## Error Handling

All errors are handled centrally through the error handler middleware. Errors include:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Conflict errors (409)
- Server errors (500)

## Logging

Application uses Winston for logging. Logs are written to:
- Console (all levels)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Messages: 30 messages per minute per user

## File Upload

### Supported File Types
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, XLS, XLSX, TXT
- Videos: MP4, WebM
- Audio: MP3, WAV

### File Upload Limits
- Maximum file size: 10MB (configurable via MAX_FILE_SIZE)
- Maximum files per request: 10
- Files are stored in AWS S3 bucket
- Files are publicly accessible via returned URLs

### File Upload Request Format
```javascript
// Single file upload
FormData with field name: 'file'

// Multiple files upload
FormData with field name: 'files' (array)
```

### File Upload Response
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "fileUrl": "https://bucket.s3.region.amazonaws.com/uploads/userId/timestamp-uuid.jpg",
      "fileName": "original-filename.jpg",
      "fileType": "image/jpeg",
      "fileSize": 123456,
      "thumbnailUrl": "https://...",
      "s3Key": "uploads/userId/timestamp-uuid.jpg"
    }
  }
}
```

