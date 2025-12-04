/**
 * File Upload Controller
 * 
 * Why: Handle HTTP requests for file upload endpoints
 * How: Processes file uploads, calls file upload service, returns file URLs
 * Impact: Provides file upload API endpoints for frontend
 * 
 * Common Errors:
 * 1. No file provided - Request missing file
 * 2. File too large - Exceeds size limit
 * 3. Invalid file type - File type not allowed
 * 4. Upload failed - S3 upload error
 */

const fileUploadService = require('../services/fileUploadService')

/**
 * Upload single file
 * Why: Allow users to upload single file
 * How: Validates file, uploads to S3, returns file metadata
 * Impact: Files can be uploaded through API
 * 
 * Request:
 * - Content-Type: multipart/form-data
 * - Field name: file
 * 
 * Response:
 * - 200: File uploaded successfully
 * - 400: Validation errors
 * - 500: Upload failed
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      })
    }

    const userId = req.user.userId

    const fileData = await fileUploadService.uploadFile(req.file, userId)

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: fileData,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Upload multiple files
 * Why: Allow users to upload multiple files
 * How: Validates files, uploads to S3, returns file metadata array
 * Impact: Multiple files can be uploaded in single request
 * 
 * Request:
 * - Content-Type: multipart/form-data
 * - Field name: files (array)
 * 
 * Response:
 * - 200: Files uploaded successfully
 * - 400: Validation errors
 * - 500: Upload failed
 */
const uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided',
      })
    }

    const userId = req.user.userId

    const filesData = await fileUploadService.uploadMultipleFiles(req.files, userId)

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: filesData,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete file
 * Why: Allow users to delete uploaded files
 * How: Deletes file from S3 using S3 key
 * Impact: Files can be removed from storage
 * 
 * Request Body:
 * - s3Key: string (S3 object key)
 * 
 * Response:
 * - 200: File deleted successfully
 * - 400: Missing S3 key
 * - 500: Deletion failed
 */
const deleteFile = async (req, res, next) => {
  try {
    const { s3Key } = req.body

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        message: 'S3 key is required',
      })
    }

    await fileUploadService.deleteFile(s3Key)

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
}

