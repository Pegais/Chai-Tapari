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

        const handleConnect = () => {
          console.log('[SocketContext] Connected')
          setIsConnected(true)
        }

        const handleDisconnect = () => {
          console.log('[SocketContext] Disconnected')
          setIsConnected(false)
        }

        const handleConnectError = (error) => {
          console.error('[SocketContext] Connection error:', error)
          setIsConnected(false)
        }

        // Set up listeners
        socketInstance.on('connect', handleConnect)
        socketInstance.on('disconnect', handleDisconnect)
        socketInstance.on('connect_error', handleConnectError)

        // Check if already connected
        if (socketInstance.connected) {
          setIsConnected(true)
        }

        // Cleanup function to remove listeners
        return () => {
          if (socketInstance) {
            socketInstance.off('connect', handleConnect)
            socketInstance.off('disconnect', handleDisconnect)
            socketInstance.off('connect_error', handleConnectError)
          }
        }
      }
    } else {
      // Disconnect if not authenticated
      disconnectSocket()
      setSocket(null)
      setIsConnected(false)
    }
  }, [isAuthenticated, token])

  /**
   * Handle page unload - cleanup socket
   * Why: Ensure socket is properly closed when page is closed/reloaded
   * How: Disconnects socket on beforeunload and pagehide events
   * Impact: Prevents socket connection leaks on page reload
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('[SocketContext] Page unloading, disconnecting socket')
      disconnectSocket()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload) // For mobile browsers

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
    }
  }, [])

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

