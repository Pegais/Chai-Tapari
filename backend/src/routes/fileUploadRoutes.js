/**
 * File Upload Routes
 * 
 * Why: Define HTTP endpoints for file upload operations
 * How: Maps HTTP methods and paths to controller functions
 * Impact: Provides file upload API endpoints
 * 
 * Route Structure:
 * POST /api/upload - Upload single file (protected)
 * POST /api/upload/multiple - Upload multiple files (protected)
 * DELETE /api/upload - Delete file (protected)
 */

const express = require('express')
const router = express.Router()
const fileUploadController = require('../controllers/fileUploadController')
const { authenticate } = require('../middleware/auth')
const { uploadSingle, uploadMultiple, handleMulterError } = require('../middleware/fileUpload')

/**
 * Upload single file
 * POST /api/upload
 * Why: Allow users to upload single file
 * How: Requires authentication, handles file upload, calls uploadFile controller
 * Impact: Files can be uploaded through API
 */
router.post('/', authenticate, uploadSingle, handleMulterError, fileUploadController.uploadFile)

/**
 * Upload multiple files
 * POST /api/upload/multiple
 * Why: Allow users to upload multiple files
 * How: Requires authentication, handles multiple file uploads, calls uploadMultipleFiles controller
 * Impact: Multiple files can be uploaded in single request
 */
router.post('/multiple', authenticate, uploadMultiple, handleMulterError, fileUploadController.uploadMultipleFiles)

/**
 * Delete file
 * DELETE /api/upload
 * Why: Allow users to delete uploaded files
 * How: Requires authentication, calls deleteFile controller
 * Impact: Files can be removed from storage
 */
router.delete('/', authenticate, fileUploadController.deleteFile)

module.exports = router

