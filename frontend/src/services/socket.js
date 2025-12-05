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
 * Why: Support different environments (dev, staging, production)
 * How: Reads from environment variable or defaults to localhost
 * Impact: Easy environment-specific configuration
 * 
 * Production: Should be set to Railway backend URL (e.g., https://your-app.railway.app)
 */
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'

/**
 * Socket instance
 * Why: Single socket instance for the application
 * How: Created on first use, reused across components
 * Impact: Prevents multiple connections
 */
let socket = null
let isConnecting = false // Track connection state to prevent multiple simultaneous connections

/**
 * Get or create socket instance
 * Why: Provide socket connection to components
 * How: Creates socket if not exists, reuses if exists, properly cleans up old connections
 * Impact: Single connection shared across application
 */
export const getSocket = () => {
  // If socket exists and is connected, return it
  if (socket && socket.connected) {
    return socket
  }

  // If socket exists but is connecting, wait a bit and return it
  if (socket && isConnecting) {
    return socket
  }

  const token = localStorage.getItem('token')

  if (!token) {
    console.warn('[Socket] No token available, cannot connect')
    return null
  }

  // CRITICAL: Disconnect any existing socket before creating a new one
  // This prevents multiple connections on page reload
  if (socket) {
    console.log('[Socket] Disconnecting existing socket before creating new one')
    socket.removeAllListeners() // Remove all event listeners
    socket.disconnect() // Disconnect the socket
    socket = null
  }

  isConnecting = true

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
    forceNew: true, // Force new connection (don't reuse)
    multiplex: false, // Disable multiplexing to ensure single connection
  })

  // Connection event handlers
  socket.on('connect', () => {
    console.log('[Socket] Connected to server, socket ID:', socket.id)
    isConnecting = false
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
    isConnecting = false
    
    // If disconnect was intentional (e.g., logout), don't reconnect
    if (reason === 'io client disconnect') {
      socket = null
    }
  })

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error)
    isConnecting = false
  })

  socket.on('error', (error) => {
    console.error('[Socket] Error:', error)
  })

  return socket
}

/**
 * Disconnect socket
 * Why: Clean up socket connection properly
 * How: Removes all listeners, disconnects, and clears socket instance
 * Impact: Proper cleanup on logout prevents connection leaks
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('[Socket] Disconnecting and cleaning up...')
    socket.removeAllListeners() // Remove all event listeners to prevent leaks
    socket.disconnect() // Disconnect the socket
    socket = null
    isConnecting = false
    console.log('[Socket] Disconnected and cleared')
  }
}

/**
 * Reconnect socket
 * Why: Re-establish connection after token update
 * How: Properly disconnects old socket and creates new connection
 * Impact: Socket uses updated authentication without connection leaks
 */
export const reconnectSocket = () => {
  disconnectSocket()
  // Small delay to ensure old socket is fully cleaned up
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getSocket())
    }, 100)
  })
}

/**
 * Check if socket is connected
 * Why: Verify connection status before operations
 * How: Returns true if socket exists and is connected
 * Impact: Prevents operations on disconnected sockets
 */
export const isSocketConnected = () => {
  return socket !== null && socket.connected
}

