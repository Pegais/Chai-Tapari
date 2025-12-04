/**
 * File Upload Hook
 * 
 * Why: Centralized file upload functionality
 * How: Uses React Query mutations for file uploads
 * Impact: Consistent file upload handling across components
 */

import { useMutation } from '@tanstack/react-query'
import { uploadFile, uploadMultipleFiles, deleteFile } from '../services/api'

/**
 * Upload single file mutation hook
 * Why: Upload file to S3
 * How: Uses React Query useMutation hook
 * Impact: File uploaded and URL returned
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: async (file) => {
      const response = await uploadFile(file)
      return response.data.file
    },
  })
}

/**
 * Upload multiple files mutation hook
 * Why: Upload multiple files to S3
 * How: Uses React Query useMutation hook
 * Impact: Multiple files uploaded and URLs returned
 */
export function useUploadMultipleFiles() {
  return useMutation({
    mutationFn: async (files) => {
      const response = await uploadMultipleFiles(files)
      return response.data.files
    },
  })
}

/**
 * Delete file mutation hook
 * Why: Remove file from S3
 * How: Uses React Query useMutation hook
 * Impact: File deleted from storage
 */
export function useDeleteFile() {
  return useMutation({
    mutationFn: async (s3Key) => {
      const response = await deleteFile(s3Key)
      return response
    },
  })
}

