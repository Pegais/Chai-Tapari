/**
 * Authentication Context
 * 
 * Why: Centralized authentication state management
 * How: Provides auth state and functions to all components
 * Impact: Consistent authentication across the application
 * 
 * Features:
 * 1. User state management
 * 2. Login/logout functions
 * 3. Token management
 * 4. Session persistence
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginAPI, getCurrentUser, logout as logoutAPI, googleAuth as googleAuthAPI } from '../services/api'
import { disconnectSocket } from '../services/socket'

/**
 * Create Auth Context
 * Why: Provide auth state to all components
 * How: Creates React context for authentication
 * Impact: Components can access auth state without prop drilling
 */
const AuthContext = createContext(null)

/**
 * Auth Provider Component
 * Why: Wrap application with auth context
 * How: Manages auth state and provides it to children
 * Impact: All components can access auth state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const navigate = useNavigate()

  /**
   * Initialize auth state on mount
   * Why: Restore user session from localStorage
   * How: Checks for token and fetches user data
   * Impact: User stays logged in on page refresh
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        try {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          
          // Verify token by fetching current user
          const response = await getCurrentUser()
          if (response.success) {
            setUser(response.data.user)
            localStorage.setItem('user', JSON.stringify(response.data.user))
          } else {
            // Token invalid, clear storage
            clearAuth()
          }
        } catch (error) {
          console.error('[Auth] Failed to verify token:', error)
          clearAuth()
        }
      }

      setLoading(false)
    }

    initializeAuth()
  }, [])

  /**
   * Clear authentication data
   * Why: Remove user session
   * How: Clears token, user, and localStorage
   * Impact: User logged out
   */
  const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  /**
   * Login function
   * Why: Authenticate user and set session
   * How: Calls login API, stores token and user data
   * Impact: User can access protected routes
   */
  const login = async (email, password) => {
    try {
      const response = await loginAPI(email, password)

      if (response.success) {
        const { user, token } = response.data

        // Store token and user
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setToken(token)
        setUser(user)

        return { success: true }
      } else {
        return { success: false, message: response.message || 'Login failed' }
      }
    } catch (error) {
      console.error('[Auth] Login error:', error)
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
      }
    }
  }

  /**
   * Google login function
   * Why: Authenticate user with Google OAuth
   * How: Calls Google auth API with ID token
   * Impact: User can sign in with Google account
   */
  const loginWithGoogle = async (idToken) => {
    try {
      const response = await googleAuthAPI(idToken)

      if (response.success) {
        const { user, token } = response.data

        // Store token and user
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setToken(token)
        setUser(user)

        return { success: true }
      } else {
        return { success: false, message: response.message || 'Google authentication failed' }
      }
    } catch (error) {
      console.error('[Auth] Google login error:', error)
      return {
        success: false,
        message: error.message || 'Google authentication failed. Please try again.',
      }
    }
  }

  /**
   * Logout function
   * Why: End user session
   * How: Calls logout API, clears auth data, disconnects socket
   * Impact: User logged out and redirected
   */
  const logout = async () => {
    try {
      // Disconnect socket before logout
      disconnectSocket()
      
      // Call logout API
      await logoutAPI()
    } catch (error) {
      console.error('[Auth] Logout error:', error)
    } finally {
      // Clear auth data
      clearAuth()
      // Redirect to login
      navigate('/login')
    }
  }

  /**
   * Update user data
   * Why: Refresh user information
   * How: Updates user state and localStorage
   * Impact: User data stays current
   */
  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const value = {
    user,
    token,
    loading,
    login,
    loginWithGoogle,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Use Auth Hook
 * Why: Access auth context in components
 * How: Returns auth context value
 * Impact: Components can use auth state and functions
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

