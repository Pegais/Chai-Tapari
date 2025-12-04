/**
 * Socket.IO Client Service
 * 
 * Why: Centralized WebSocket connection management
 * How: Creates and manages Socket.IO client instance
 * Impact: Real-time communication for messaging and presence
 * 
 * Common Errors:
 * 1. Connection failed - Backend server not running
 * 2. Authentication failed - Invalid or expired token
 * 3. Network error - Connection lost
 */

import { io } from 'socket.io-client'

/**
 * Get Socket.IO server URL
 * Why: Support different environments
 * How: Reads from environment variable or defaults to localhost
 * Impact: Easy environment-specific configuration
 */
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'

/**
 * Socket instance
 * Why: Single socket instance for the application
 * How: Created on first use, reused across components
 * Impact: Prevents multiple connections
 */
let socket = null

/**
 * Get or create socket instance
 * Why: Provide socket connection to components
 * How: Creates socket if not exists, reuses if exists
 * Impact: Single connection shared across application
 */
export const getSocket = () => {
  if (socket && socket.connected) {
    return socket
  }

  const token = localStorage.getItem('token')

  if (!token) {
    console.warn('[Socket] No token available, cannot connect')
    return null
  }

  // Create socket connection
  socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  // Connection event handlers
  socket.on('connect', () => {
    console.log('[Socket] Connected to server')
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error)
  })

  socket.on('error', (error) => {
    console.error('[Socket] Error:', error)
  })

  return socket
}

/**
 * Disconnect socket
 * Why: Clean up socket connection
 * How: Disconnects and clears socket instance
 * Impact: Proper cleanup on logout
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('[Socket] Disconnected and cleared')
  }
}

/**
 * Reconnect socket
 * Why: Re-establish connection after token update
 * How: Disconnects and creates new connection
 * Impact: Socket uses updated authentication
 */
export const reconnectSocket = () => {
  disconnectSocket()
  return getSocket()
}

