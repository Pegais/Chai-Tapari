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
import ChannelList from "../Channels/ChannelList"
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
    <div className="h-screen flex bg-background relative z-10">
      {/* Left Sidebar - Profile Section */}
      <motion.aside
        className="w-72 border-r border-primary/20 flex-shrink-0"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        <ProfileSection />
      </motion.aside>

      {/* Channels Sidebar */}
      <motion.aside
        className="w-64 border-r border-primary/20 bg-card/95 backdrop-blur-sm flex-shrink-0"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        <ChannelList />
      </motion.aside>

      {/* Main Content Area - Chat Window */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>

      {/* Right Sidebar - Online Users */}
      <motion.aside
        className="w-64 border-l border-primary/20 bg-card/95 backdrop-blur-sm flex-shrink-0"
        variants={rightSidebarVariants}
        initial="hidden"
        animate="visible"
      >
        <OnlineUsers />
      </motion.aside>
    </div>
  )
}

export default MainLayout

