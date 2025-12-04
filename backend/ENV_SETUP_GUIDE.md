# Environment Variables Setup Guide

This guide explains how to set up all environment variables for the Chai Tapri backend.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your actual values

3. Never commit `.env` file to version control (it's in .gitignore)

## Required Variables

### 1. Server Configuration

**PORT** (Required)
- Default: `5000`
- Description: Port on which the backend server runs
- Example: `PORT=5000`

**NODE_ENV** (Required)
- Options: `development`, `production`, `test`
- Default: `development`
- Description: Application environment
- Example: `NODE_ENV=development`

**BACKEND_URL** (Required)
- Default: `http://localhost:5000`
- Description: Backend server URL (used by Express Gateway)
- Example: `BACKEND_URL=http://localhost:5000`
- Production: `BACKEND_URL=https://api.yourdomain.com`

### 2. MongoDB Configuration

**MONGODB_URI** (Required)
- Description: MongoDB connection string
- Local: `mongodb://localhost:27017/chai-tapri`
- MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/chai-tapri`
- Example: `MONGODB_URI=mongodb://localhost:27017/chai-tapri`

### 3. Redis Configuration

**REDIS_HOST** (Required)
- Default: `localhost`
- Description: Redis server hostname
- Local: `localhost`
- Redis Cloud: Your Redis Cloud hostname (e.g., `redis-17114.c267.us-east-1-4.ec2.cloud.redislabs.com`)
- Example: `REDIS_HOST=localhost`
- Redis Cloud Example: `REDIS_HOST=redis-17114.c267.us-east-1-4.ec2.cloud.redislabs.com`

**REDIS_PORT** (Required)
- Default: `6379`
- Description: Redis server port
- Local: `6379`
- Redis Cloud: Your Redis Cloud port (e.g., `17114`)
- Example: `REDIS_PORT=6379`
- Redis Cloud Example: `REDIS_PORT=17114`

**REDIS_USERNAME** (Optional - Required for Redis Cloud)
- Default: `undefined`
- Description: Redis username for authentication
- Redis Cloud: Usually `default`
- Example: `REDIS_USERNAME=default`

**REDIS_PASSWORD** (Optional - Required for Redis Cloud)
- Default: `undefined`
- Description: Redis password for authentication
- Redis Cloud: Your Redis Cloud password
- Example: `REDIS_PASSWORD=your-redis-password`

**REDIS_PORT** (Required)
- Default: `6379`
- Description: Redis server port
- Example: `REDIS_PORT=6379`

**REDIS_PASSWORD** (Optional)
- Default: (empty)
- Description: Redis password if authentication is enabled
- Example: `REDIS_PASSWORD=your-redis-password`

### 4. Authentication Configuration

**SESSION_SECRET** (Required)
- Description: Secret key for session encryption
- Generate: `openssl rand -base64 32`
- Minimum: 32 characters
- Example: `SESSION_SECRET=your-super-secret-session-key-change-in-production`

**JWT_SECRET** (Required)
- Description: Secret key for JWT token signing
- Generate: `openssl rand -base64 32`
- Minimum: 32 characters
- Example: `JWT_SECRET=your-super-secret-jwt-key-change-in-production`

**JWT_EXPIRES_IN** (Required)
- Default: `7d`
- Description: JWT token expiration time
- Format: `7d` (7 days), `24h` (24 hours), `60m` (60 minutes)
- Example: `JWT_EXPIRES_IN=7d`

### 5. CORS Configuration

**FRONTEND_URL** (Required)
- Default: `http://localhost:3000`
- Description: Frontend application URL for CORS
- Development: `FRONTEND_URL=http://localhost:3000`
- Production: `FRONTEND_URL=https://yourdomain.com`

### 6. AWS S3 Configuration (Required for File Uploads)

**AWS_ACCESS_KEY_ID** (Required for file uploads)
- Description: AWS Access Key ID from IAM
- How to get:
  1. Go to AWS Console → IAM
  2. Create new user with programmatic access
  3. Attach policy: `AmazonS3FullAccess`
  4. Copy Access Key ID
- Example: `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE`

**AWS_SECRET_ACCESS_KEY** (Required for file uploads)
- Description: AWS Secret Access Key from IAM
- How to get: Same as above, copy Secret Access Key
- Example: `AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

**AWS_REGION** (Required for file uploads)
- Default: `us-east-1`
- Description: AWS region where S3 bucket is located
- Examples: `us-east-1`, `us-west-2`, `eu-west-1`, `ap-south-1`
- Example: `AWS_REGION=us-east-1`

**AWS_S3_BUCKET_NAME** (Required for file uploads)
- Description: Name of S3 bucket for file storage
- How to create:
  1. Go to AWS Console → S3
  2. Create bucket
  3. Choose unique name (e.g., `chai-tapri-uploads`)
  4. Configure settings (public access, versioning, etc.)
- Example: `AWS_S3_BUCKET_NAME=chai-tapri-uploads`

**MAX_FILE_SIZE** (Optional)
- Default: `10485760` (10MB)
- Description: Maximum file size in bytes
- Examples:
  - 5MB: `5242880`
  - 10MB: `10485760`
  - 50MB: `52428800`
- Example: `MAX_FILE_SIZE=10485760`

### 7. Rate Limiting Configuration

**RATE_LIMIT_WINDOW_MS** (Optional)
- Default: `900000` (15 minutes)
- Description: Rate limit window in milliseconds
- Example: `RATE_LIMIT_WINDOW_MS=900000`

**RATE_LIMIT_MAX_REQUESTS** (Optional)
- Default: `100`
- Description: Maximum requests per window
- Example: `RATE_LIMIT_MAX_REQUESTS=100`

### 8. Express Gateway Configuration (Optional)

**GATEWAY_PORT** (Optional)
- Default: `8080`
- Description: Port for Express Gateway
- Only needed if using Express Gateway
- Example: `GATEWAY_PORT=8080`

### 9. Logging Configuration (Optional)

**LOG_LEVEL** (Optional)
- Default: `info`
- Options: `error`, `warn`, `info`, `debug`
- Description: Logging level
- Example: `LOG_LEVEL=info`

## Setup Instructions

### Local Development Setup

1. **Install MongoDB:**
   ```bash
   # Windows: Download from mongodb.com
   # Mac: brew install mongodb-community
   # Linux: sudo apt-get install mongodb
   ```

2. **Install Redis:**
   ```bash
   # Windows: Download from redis.io or use WSL
   # Mac: brew install redis
   # Linux: sudo apt-get install redis-server
   ```

3. **Start MongoDB:**
   ```bash
   mongod
   ```

4. **Start Redis:**
   ```bash
   redis-server
   ```

5. **Set up AWS S3 (for file uploads):**
   - Create AWS account
   - Create S3 bucket
   - Create IAM user with S3 access
   - Add credentials to `.env`

6. **Generate secrets:**
   ```bash
   # Generate SESSION_SECRET
   openssl rand -base64 32
   
   # Generate JWT_SECRET
   openssl rand -base64 32
   ```

### Production Setup

1. **Use MongoDB Atlas** (cloud MongoDB):
   - Sign up at mongodb.com/cloud/atlas
   - Create cluster
   - Get connection string
   - Update `MONGODB_URI`

2. **Use Redis Cloud** (cloud Redis):
   - Sign up at redis.com/cloud
   - Create database
   - Get connection details
   - Update `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

3. **Set strong secrets:**
   - Generate new secrets for production
   - Never use development secrets in production

4. **Configure CORS:**
   - Set `FRONTEND_URL` to your production frontend URL
   - Set `BACKEND_URL` to your production backend URL

5. **Configure S3:**
   - Create production S3 bucket
   - Set up proper IAM permissions
   - Configure bucket policies for public access if needed

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`

2. **Use strong secrets:**
   - Minimum 32 characters
   - Random and unpredictable
   - Different for each environment

3. **Rotate secrets regularly:**
   - Change secrets periodically
   - Especially after security incidents

4. **Limit AWS permissions:**
   - Use IAM policies with least privilege
   - Don't use root AWS credentials

5. **Use environment-specific values:**
   - Different values for dev/staging/production
   - Never share production secrets

## Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running
- Verify `MONGODB_URI` is correct
- Check firewall settings

### Redis Connection Failed
- Check if Redis is running
- Verify `REDIS_HOST` and `REDIS_PORT`
- Check if password is correct (if set)

### S3 Upload Failed
- Verify AWS credentials are correct
- Check bucket name and region
- Verify IAM user has S3 permissions
- Check bucket policy allows uploads

### CORS Errors
- Verify `FRONTEND_URL` matches your frontend URL
- Check if frontend is making requests from correct origin

## Example .env File

See `.env.example` for a complete example with all variables and comments.

