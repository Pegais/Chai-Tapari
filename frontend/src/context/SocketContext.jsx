/**
 * Socket Context
 * 
 * Why: Centralized WebSocket connection management
 * How: Provides socket instance and connection status to all components
 * Impact: Consistent WebSocket usage across the application
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getSocket, disconnectSocket, reconnectSocket } from '../services/socket'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

/**
 * Socket Provider Component
 * Why: Manage WebSocket connection lifecycle
 * How: Connects on mount, reconnects on auth change, disconnects on unmount
 * Impact: WebSocket connection available to all components
 */
export function SocketProvider({ children }) {
  const { isAuthenticated, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  /**
   * Initialize socket connection
   * Why: Establish WebSocket connection when authenticated
   * How: Creates socket connection and sets up event listeners
   * Impact: Real-time features enabled
   */
  useEffect(() => {
    if (isAuthenticated && token) {
      const socketInstance = getSocket()
      
      if (socketInstance) {
        setSocket(socketInstance)

        socketInstance.on('connect', () => {
          console.log('[Socket] Connected')
          setIsConnected(true)
        })

        socketInstance.on('disconnect', () => {
          console.log('[Socket] Disconnected')
          setIsConnected(false)
        })

        socketInstance.on('connect_error', (error) => {
          console.error('[Socket] Connection error:', error)
          setIsConnected(false)
        })
      }
    } else {
      // Disconnect if not authenticated
      disconnectSocket()
      setSocket(null)
      setIsConnected(false)
    }

    return () => {
      // Cleanup on unmount
      if (!isAuthenticated) {
        disconnectSocket()
      }
    }
  }, [isAuthenticated, token])

  /**
   * Reconnect socket when token changes
   * Why: Update socket connection with new token
   * How: Disconnects and creates new connection
   * Impact: Socket uses updated authentication
   */
  useEffect(() => {
    if (isAuthenticated && token && socket) {
      reconnectSocket()
    }
  }, [token])

  const value = {
    socket,
    isConnected,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

/**
 * Use Socket Hook
 * Why: Access socket context in components
 * How: Returns socket context value
 * Impact: Components can use socket connection
 */
export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

