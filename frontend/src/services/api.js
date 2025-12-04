/**
 * API Service
 * 
 * Why: Centralized API endpoint functions
 * How: Provides functions for all backend API endpoints
 * Impact: Consistent API calls across the application
 * 
 * Common Errors:
 * 1. Network error - Backend server not running
 * 2. Authentication error - Invalid or expired token
 * 3. Validation error - Invalid request data
 * 4. Server error - Backend processing error
 */

import apiClient from '../config/axios'

/**
 * Authentication API
 * Why: Handle user authentication operations
 * How: Provides signup, login, logout, and get current user functions
 * Impact: Enables user authentication flow
 */

/**
 * Register new user
 * Why: Create user account
 * How: Sends user data to signup endpoint
 * Impact: New user can access the application
 */
export const signup = async (userData) => {
  const response = await apiClient.post('/auth/signup', userData)
  return response.data
}

/**
 * Login user
 * Why: Authenticate user and get access token
 * How: Sends credentials to login endpoint
 * Impact: User can access protected routes
 */
export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password })
  return response.data
}

/**
 * Get current user
 * Why: Retrieve authenticated user information
 * How: Sends request with auth token
 * Impact: Frontend can get current user data
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me')
  return response.data
}

/**
 * Logout user
 * Why: End user session
 * How: Sends logout request
 * Impact: User session terminated
 */
export const logout = async () => {
  const response = await apiClient.post('/auth/logout')
  return response.data
}

/**
 * Google OAuth authentication
 * Why: Authenticate user with Google account
 * How: Sends Google ID token to backend
 * Impact: Users can sign in with Google
 */
export const googleAuth = async (idToken) => {
  const response = await apiClient.post('/auth/google', { idToken })
  return response.data
}

/**
 * Channel API
 * Why: Handle channel operations
 * How: Provides CRUD operations for channels
 * Impact: Enables channel management
 */

/**
 * Get all channels
 * Why: List available channels
 * How: Fetches channels from backend
 * Impact: Frontend can display channel list
 */
export const getChannels = async () => {
  const response = await apiClient.get('/channels')
  return response.data
}

/**
 * Get channel by ID
 * Why: Retrieve specific channel details
 * How: Fetches channel by ID from backend
 * Impact: Frontend can display channel information
 */
export const getChannelById = async (channelId) => {
  const response = await apiClient.get(`/channels/${channelId}`)
  return response.data
}

/**
 * Create channel
 * Why: Allow users to create channels
 * How: Sends channel data to create endpoint
 * Impact: New channel available for users
 */
export const createChannel = async (channelData) => {
  const response = await apiClient.post('/channels', channelData)
  return response.data
}

/**
 * Join channel
 * Why: Add user to channel members
 * How: Sends join request to channel endpoint
 * Impact: User can access and send messages in channel
 */
export const joinChannel = async (channelId) => {
  const response = await apiClient.post(`/channels/${channelId}/join`)
  return response.data
}

/**
 * Leave channel
 * Why: Remove user from channel members
 * How: Sends leave request to channel endpoint
 * Impact: User can no longer access channel
 */
export const leaveChannel = async (channelId) => {
  const response = await apiClient.post(`/channels/${channelId}/leave`)
  return response.data
}

/**
 * Message API
 * Why: Handle message operations
 * How: Provides CRUD operations for messages
 * Impact: Enables messaging functionality
 */

/**
 * Get messages by channel
 * Why: Retrieve channel messages with pagination
 * How: Fetches messages from backend with pagination params
 * Impact: Frontend can load message history
 */
export const getMessages = async (channelId, options = {}) => {
  const params = {}
  if (options.before) params.before = options.before
  if (options.limit) params.limit = options.limit

  const response = await apiClient.get(`/channels/${channelId}/messages`, { params })
  return response.data
}

/**
 * Create message
 * Why: Send message in channel
 * How: Sends message data to create endpoint
 * Impact: Message appears in channel
 */
export const createMessage = async (channelId, messageData) => {
  const response = await apiClient.post(`/channels/${channelId}/messages`, messageData)
  return response.data
}

/**
 * Edit message
 * Why: Update message content
 * How: Sends updated content to edit endpoint
 * Impact: Message content updated
 */
export const editMessage = async (messageId, content) => {
  const response = await apiClient.patch(`/messages/${messageId}`, { content })
  return response.data
}

/**
 * Delete message
 * Why: Remove message
 * How: Sends delete request to message endpoint
 * Impact: Message deleted
 */
export const deleteMessage = async (messageId) => {
  const response = await apiClient.delete(`/messages/${messageId}`)
  return response.data
}

/**
 * User API
 * Why: Handle user operations
 * How: Provides user information endpoints
 * Impact: Enables user display and presence
 */

/**
 * Get all users
 * Why: Retrieve list of all users
 * How: Fetches users from backend
 * Impact: Frontend can display user list
 */
export const getUsers = async () => {
  const response = await apiClient.get('/users')
  return response.data
}

/**
 * Get online users
 * Why: Retrieve list of currently online users
 * How: Fetches online users from backend
 * Impact: Frontend can display online user list
 */
export const getOnlineUsers = async () => {
  const response = await apiClient.get('/users/online')
  return response.data
}

/**
 * Get user by ID
 * Why: Retrieve specific user information
 * How: Fetches user by ID from backend
 * Impact: Frontend can display user details
 */
export const getUserById = async (userId) => {
  const response = await apiClient.get(`/users/${userId}`)
  return response.data
}

/**
 * File Upload API
 * Why: Handle file upload operations
 * How: Provides file upload endpoints
 * Impact: Enables file sharing in messages
 */

/**
 * Upload single file
 * Why: Upload file to S3
 * How: Sends file as FormData to upload endpoint
 * Impact: File available for sharing
 */
export const uploadFile = async (file, options = {}) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    signal: options.signal, // Support AbortController
  })
  return response.data
}

/**
 * Upload multiple files
 * Why: Upload multiple files to S3
 * How: Sends files as FormData to upload endpoint
 * Impact: Multiple files available for sharing
 */
export const uploadMultipleFiles = async (files, options = {}) => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  const response = await apiClient.post('/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    signal: options.signal, // Support AbortController
  })
  return response.data
}

/**
 * Delete file
 * Why: Remove file from S3
 * How: Sends delete request with S3 key
 * Impact: File removed from storage
 */
export const deleteFile = async (s3Key) => {
  const response = await apiClient.delete('/upload', { data: { s3Key } })
  return response.data
}

/**
 * Direct Message API
 * Why: Handle direct messaging operations
 * How: Provides endpoints for private messaging
 * Impact: Enables direct messaging between users
 */

/**
 * Get all conversations
 * Why: List user's conversations
 * How: Fetches conversations from backend
 * Impact: Frontend can display conversation list
 */
export const getConversations = async () => {
  const response = await apiClient.get('/direct-messages/conversations')
  return response.data
}

/**
 * Get conversation by participant
 * Why: Find conversation between current user and another user
 * How: Fetches conversation by participant ID
 * Impact: Enables direct access to specific conversation
 */
export const getConversation = async (userId) => {
  const response = await apiClient.get('/direct-messages/conversation', {
    params: { userId },
  })
  return response.data
}

/**
 * Get messages in conversation
 * Why: Retrieve conversation message history
 * How: Fetches messages from backend with pagination
 * Impact: Frontend can load message history
 */
export const getConversationMessages = async (conversationId, options = {}) => {
  const params = {}
  if (options.before) params.before = options.before
  if (options.limit) params.limit = options.limit

  const response = await apiClient.get(`/direct-messages/conversations/${conversationId}/messages`, { params })
  return response.data
}

/**
 * Send direct message
 * Why: Send private message to another user
 * How: Sends message data to create endpoint
 * Impact: Message appears in conversation
 */
export const sendDirectMessage = async (messageData) => {
  const response = await apiClient.post('/direct-messages/messages', messageData)
  return response.data
}

