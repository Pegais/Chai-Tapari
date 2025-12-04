/**
 * File Upload Service
 * 
 * Why: Centralized file upload handling using AWS S3
 * How: Uploads files to S3 bucket, returns file URLs and metadata
 * Impact: Enables file sharing in chat messages
 * 
 * Common Errors:
 * 1. File too large - Exceeds maximum file size limit
 * 2. Invalid file type - File type not allowed
 * 3. S3 upload failed - Network or permission issues
 * 4. Missing S3 configuration - AWS credentials not configured
 */

const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

/**
 * Initialize S3 client
 * Why: Create S3 client with AWS credentials
 * How: Configures AWS SDK with credentials from environment
 * Impact: Enables S3 operations for file uploads
 */
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default

/**
 * Allowed file types
 * Why: Restrict file uploads to safe file types
 * How: Defines whitelist of allowed MIME types
 * Impact: Prevents malicious file uploads
 */
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
}

/**
 * Validate file type
 * Why: Ensure only allowed file types are uploaded
 * How: Checks file MIME type against allowed types
 * Impact: Prevents unauthorized file types
 */
const validateFileType = (mimetype) => {
  return Object.keys(ALLOWED_FILE_TYPES).includes(mimetype)
}

/**
 * Get file extension from MIME type
 * Why: Determine file extension for S3 key
 * How: Maps MIME type to file extension
 * Impact: Proper file naming in S3
 */
const getFileExtension = (mimetype) => {
  const extensions = ALLOWED_FILE_TYPES[mimetype]
  return extensions ? extensions[0] : ''
}

/**
 * Upload file to S3
 * Why: Store files in S3 bucket for access
 * How: Uploads file buffer to S3 with unique key, returns file URL
 * Impact: Files are stored securely and accessible via URL
 * 
 * Flow:
 * 1. Validate file type
 * 2. Validate file size
 * 3. Generate unique file key
 * 4. Upload to S3
 * 5. Return file URL and metadata
 */
const uploadFile = async (file, userId) => {
  try {
    // Validate file type
    if (!validateFileType(file.mimetype)) {
      const error = new Error('File type not allowed')
      error.statusCode = 400
      throw error
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const error = new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      error.statusCode = 400
      throw error
    }

    // Generate unique file key
    const fileExtension = getFileExtension(file.mimetype) || path.extname(file.originalname)
    const fileName = `${uuidv4()}${fileExtension}`
    const fileKey = `uploads/${userId}/${Date.now()}-${fileName}`

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make files publicly accessible
    }

    const uploadResult = await s3.upload(uploadParams).promise()

    // Generate thumbnail URL for images (if needed)
    let thumbnailUrl = null
    if (file.mimetype.startsWith('image/')) {
      // For images, thumbnail is same as original (can be enhanced with image processing)
      thumbnailUrl = uploadResult.Location
    }

    return {
      fileUrl: uploadResult.Location,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      thumbnailUrl: thumbnailUrl,
      s3Key: fileKey,
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    // Handle AWS S3 errors
    const s3Error = new Error('File upload failed')
    s3Error.statusCode = 500
    s3Error.originalError = error.message
    throw s3Error
  }
}

/**
 * Upload multiple files
 * Why: Handle multiple file uploads in single request
 * How: Uploads each file sequentially and returns array of results
 * Impact: Enables multiple file attachments in messages
 */
const uploadMultipleFiles = async (files, userId) => {
  const uploadPromises = files.map(file => uploadFile(file, userId))
  return Promise.all(uploadPromises)
}

/**
 * Delete file from S3
 * Why: Remove files from S3 when messages are deleted
 * How: Deletes file from S3 using file key
 * Impact: Prevents orphaned files in S3 bucket
 */
const deleteFile = async (s3Key) => {
  try {
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
    }

    await s3.deleteObject(deleteParams).promise()
    return true
  } catch (error) {
    const deleteError = new Error('File deletion failed')
    deleteError.statusCode = 500
    deleteError.originalError = error.message
    throw deleteError
  }
}

/**
 * Get file URL from S3 key
 * Why: Generate file URL from S3 key
 * How: Constructs S3 URL from bucket name and key
 * Impact: Enables file URL generation
 */
const getFileUrl = (s3Key) => {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`
}

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getFileUrl,
  validateFileType,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
}

