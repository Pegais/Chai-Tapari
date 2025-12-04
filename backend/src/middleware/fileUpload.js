/**
 * File Upload Middleware
 * 
 * Why: Handle multipart form data for file uploads
 * How: Uses Multer to parse file uploads with size and type limits
 * Impact: Enables file upload functionality
 * 
 * Common Errors:
 * 1. File too large - Exceeds size limit
 * 2. Too many files - Exceeds file count limit
 * 3. Invalid file type - File type not allowed
 * 4. Multer error - File parsing failed
 */

const multer = require('multer')
const { MAX_FILE_SIZE, validateFileType } = require('../services/fileUploadService')

/**
 * Configure Multer storage
 * Why: Store files in memory for S3 upload
 * How: Uses memory storage to keep files in buffer
 * Impact: Files are processed in memory before S3 upload
 */
const storage = multer.memoryStorage()

/**
 * File filter function
 * Why: Validate file types before processing
 * How: Checks MIME type against allowed types
 * Impact: Prevents invalid file uploads
 */
const fileFilter = (req, file, cb) => {
  if (validateFileType(file.mimetype)) {
    cb(null, true)
  } else {
    const error = new Error('File type not allowed')
    error.statusCode = 400
    cb(error, false)
  }
}

/**
 * Multer configuration
 * Why: Configure file upload limits and validation
 * How: Sets file size limit, file count limit, and file filter
 * Impact: Enforces upload constraints
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Maximum 10 files per request
  },
  fileFilter: fileFilter,
})

/**
 * Single file upload middleware
 * Why: Handle single file upload
 * How: Uses Multer single file upload
 * Impact: Enables single file uploads
 */
const uploadSingle = upload.single('file')

/**
 * Multiple files upload middleware
 * Why: Handle multiple file uploads
 * How: Uses Multer multiple files upload
 * Impact: Enables multiple file uploads
 */
const uploadMultiple = upload.array('files', 10)

/**
 * Error handler for Multer errors
 * Why: Handle Multer-specific errors gracefully
 * How: Catches Multer errors and formats them
 * Impact: Better error messages for file upload failures
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed per request',
      })
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field',
      })
    }
  }

  if (err.statusCode === 400) {
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }

  next(err)
}

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleMulterError,
}

