# Environment Variables Setup

## Required Environment Variables

### Server Configuration
- `PORT` - Backend server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `BACKEND_URL` - Backend server URL for gateway

### Database Configuration
- `MONGODB_URI` - MongoDB connection string

### Redis Configuration
- `REDIS_HOST` - Redis server host
- `REDIS_PORT` - Redis server port
- `REDIS_PASSWORD` - Redis password (optional)

### Authentication
- `SESSION_SECRET` - Secret key for sessions
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration (default: 7d)

### CORS
- `FRONTEND_URL` - Frontend application URL

### AWS S3 Configuration (for file uploads)
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_S3_BUCKET_NAME` - S3 bucket name for file storage
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 10485760 = 10MB)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 900000 = 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window (default: 100)

### Express Gateway
- `GATEWAY_PORT` - Gateway server port (default: 8080)

## Example .env File

```env
# Server Configuration
PORT=5000
NODE_ENV=development
BACKEND_URL=http://localhost:5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chai-tapri

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-in-production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=chai-tapri-uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Express Gateway Configuration
GATEWAY_PORT=8080
```

## AWS S3 Setup Instructions

1. Create an AWS account if you don't have one
2. Go to AWS S3 Console
3. Create a new bucket:
   - Choose a unique bucket name (e.g., chai-tapri-uploads)
   - Select a region
   - Configure bucket settings (public access, versioning, etc.)
4. Create IAM user for S3 access:
   - Go to IAM Console
   - Create new user with programmatic access
   - Attach policy: AmazonS3FullAccess (or create custom policy)
   - Save Access Key ID and Secret Access Key
5. Update .env file with AWS credentials

## File Upload Limits

- Maximum file size: 10MB (configurable via MAX_FILE_SIZE)
- Maximum files per request: 10
- Allowed file types:
  - Images: JPEG, PNG, GIF, WebP
  - Documents: PDF, DOC, DOCX, XLS, XLSX, TXT
  - Videos: MP4, WebM
  - Audio: MP3, WAV

