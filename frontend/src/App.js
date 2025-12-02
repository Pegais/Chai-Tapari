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
import Login from "./components/Auth/Login"
import Signup from "./components/Auth/Signup"
import MainLayout from "./components/Layout/MainLayout"
import ChatWindow from "./components/Chat/ChatWindow"
import FloatingLines from "./components/ui/FloatingLines"

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
  const user = localStorage.getItem("user")
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Floating Lines Background - Applied to entire application */}
        <FloatingLines />
        
        <AnimatePresence mode="wait">
          <Routes>
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
              <Route index element={<Navigate to="/chat/channel1" replace />} />
              <Route path=":channelId" element={<ChatWindow />} />
            </Route>
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

