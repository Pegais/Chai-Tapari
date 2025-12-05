/**
 * Main App Component
 * 
 * Why: Root component that sets up routing and application structure
 * How: Defines routes for authentication and chat pages
 * Impact: Controls application navigation and page rendering
 */

import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AnimatePresence } from "framer-motion"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"
import Home from "./components/Home/Home"
import Login from "./components/Auth/Login"
import Signup from "./components/Auth/Signup"
import MainLayout from "./components/Layout/MainLayout"
import ChatWindow from "./components/Chat/ChatWindow"
import DirectMessageWindow from "./components/DirectMessages/DirectMessageWindow"
import MessageQueueManager from "./components/MessageQueueManager"
import { useChannels } from "./hooks/useChannels"

// Get Google Client ID from environment
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || ''

// Warn if Google Client ID is not set
if (!GOOGLE_CLIENT_ID && process.env.NODE_ENV === 'development') {
  console.warn('[Google OAuth] REACT_APP_GOOGLE_CLIENT_ID is not set. Google sign-in will not work.')
  console.warn('[Google OAuth] To enable Google sign-in:')
  console.warn('[Google OAuth]   1. Go to https://console.cloud.google.com/')
  console.warn('[Google OAuth]   2. Create OAuth 2.0 credentials')
  console.warn('[Google OAuth]   3. Add REACT_APP_GOOGLE_CLIENT_ID to your .env file')
}

// Create React Query client for data fetching and caching
// Why: Centralized data management with caching and refetching
// How: Provides QueryClient context to all components
// Impact: Better performance with cached API responses
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

/**
 * Protected Route Component
 * Why: Restrict access to authenticated users only
 * How: Checks for user session, redirects to login if not authenticated
 * Impact: Secures application routes from unauthorized access
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

/**
 * Navigate to first available channel
 * Why: Redirect to a valid channel on initial load
 * How: Gets channels list and navigates to first one
 * Impact: Better UX - user lands on a valid channel
 */
function NavigateToFirstChannel() {
  const { data: channels = [] } = useChannels()
  
  if (channels.length > 0) {
    const firstChannel = channels[0]
    return <Navigate to={`/chat/channel/${firstChannel._id}`} replace />
  }
  
  return <Navigate to="/chat/channel/general" replace />
}

/**
 * Navigate to channel (handles old route format)
 * Why: Support old route format for backward compatibility
 * How: Redirects old format to new format
 * Impact: Prevents broken links
 */
function NavigateToChannel() {
  const { useParams } = require("react-router-dom")
  const { id } = useParams()
  return <Navigate to={`/chat/channel/${id}`} replace />
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              <MessageQueueManager />
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Home Page - Public Route */}
                  <Route path="/" element={<Home />} />
                  
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  
                  {/* Protected Routes */}
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<NavigateToFirstChannel />} />
                    <Route path="channel/:channelId" element={<ChatWindow />} />
                    <Route path="dm/:conversationId" element={<DirectMessageWindow />} />
                    <Route path="dm/new/:userId" element={<DirectMessageWindow />} />
                    {/* Fallback route for old format - redirect to new format */}
                    <Route path=":id" element={<NavigateToChannel />} />
                  </Route>
                </Routes>
              </AnimatePresence>
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App

