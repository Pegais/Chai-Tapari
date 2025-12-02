/**
 * Main Layout Component
 * 
 * Why: Provides consistent page structure with sidebar and main content area
 * How: Three-column layout: channels sidebar, chat area, online users sidebar
 * Impact: Consistent navigation and layout across the application
 */

import React from "react"
import { Outlet } from "react-router-dom"
import { motion } from "framer-motion"
import Header from "./Header"
import OnlineUsers from "../Presence/OnlineUsers"
import ProfileSection from "../Profile/ProfileSection"

// Sidebar animation variants
// Why: Smooth sidebar entrance animations
// How: Slides in from sides with fade
// Impact: Professional, polished UI transitions
const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

const rightSidebarVariants = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

function MainLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background relative z-10 overflow-hidden">
      {/* Header with Channel Navigation */}
      {/* <Header /> */}

      {/* Body: Three Column Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Profile Section */}
        <motion.aside
          className="w-64 border-r border-primary/20 flex-shrink-0 overflow-hidden"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
        >
          <ProfileSection />
        </motion.aside>

        {/* Center: Chat Window - Reduced width */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 max-w-full">
          <Outlet />
        </main>

        {/* Right: Online Users */}
        <motion.aside
          className="w-56 border-l border-primary/20 bg-card/95 backdrop-blur-sm flex-shrink-0 overflow-hidden"
          variants={rightSidebarVariants}
          initial="hidden"
          animate="visible"
        >
          <OnlineUsers />
        </motion.aside>
      </div>
    </div>
  )
}

export default MainLayout

