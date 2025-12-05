/**
 * Message Queue Manager Component
 * 
 * Why: Start/stop retry service based on authentication state
 * How: Monitors auth state and manages retry service lifecycle
 * Impact: Automatic message retry only when user is authenticated
 */

import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { startRetryService, stopRetryService } from '../services/messageRetryService'

export default function MessageQueueManager() {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      // Start retry service when authenticated
      console.log('[MessageQueueManager] Starting retry service')
      startRetryService()
    } else {
      // Stop retry service when logged out
      console.log('[MessageQueueManager] Stopping retry service')
      stopRetryService()
    }

    // Cleanup on unmount
    return () => {
      if (!isAuthenticated) {
        stopRetryService()
      }
    }
  }, [isAuthenticated])

  return null // This component doesn't render anything
}
