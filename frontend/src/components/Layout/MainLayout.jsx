/**
 * Main Layout Component
 * 
 * Why: Provides consistent page structure with sidebar and main content area
 * How: Three-column layout on desktop, mobile drawer navigation
 * Impact: Consistent navigation and layout across all devices
 */

import React, { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Users, User, Hash } from "lucide-react"
import OnlineUsers from "../Presence/OnlineUsers"
import ProfileSection from "../Profile/ProfileSection"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

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

// Mobile drawer variants
const drawerVariants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
}

const rightDrawerVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
}

function MainLayout() {
  const [showLeftDrawer, setShowLeftDrawer] = useState(false)
  const [showRightDrawer, setShowRightDrawer] = useState(false)
  const location = useLocation()

  // Close drawers when route changes on mobile
  React.useEffect(() => {
    setShowLeftDrawer(false)
    setShowRightDrawer(false)
  }, [location.pathname])

  return (
    <div className="h-screen w-screen flex flex-col bg-background relative z-10 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-primary/20 bg-card/95 backdrop-blur-sm flex-shrink-0 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowLeftDrawer(true)}
          className="h-10 w-10"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          NUBEE
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowRightDrawer(true)}
          className="h-10 w-10"
        >
          <Users className="h-5 w-5" />
        </Button>
      </div>

      {/* Body: Responsive Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Profile Section - Desktop visible, mobile drawer */}
        <motion.aside
          className="hidden md:flex w-64 border-r border-primary/20 flex-shrink-0 overflow-hidden"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
        >
          <ProfileSection />
        </motion.aside>

        {/* Mobile Left Drawer */}
        <AnimatePresence>
          {showLeftDrawer && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLeftDrawer(false)}
              />
              <motion.aside
                className="fixed left-0 top-0 h-full w-64 bg-card/95 backdrop-blur-sm border-r border-primary/20 z-50 md:hidden shadow-2xl"
                variants={drawerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-primary/20 flex items-center justify-between">
                    <h2 className="font-semibold text-lg">Menu</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowLeftDrawer(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ProfileSection />
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Center: Chat Window */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 max-w-full">
          <Outlet />
        </main>

        {/* Right: Online Users - Desktop visible, mobile drawer */}
        <motion.aside
          className="hidden md:flex w-56 border-l border-primary/20 bg-card/95 backdrop-blur-sm flex-shrink-0 overflow-hidden"
          variants={rightSidebarVariants}
          initial="hidden"
          animate="visible"
        >
          <OnlineUsers />
        </motion.aside>

        {/* Mobile Right Drawer */}
        <AnimatePresence>
          {showRightDrawer && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRightDrawer(false)}
              />
              <motion.aside
                className="fixed right-0 top-0 h-full w-64 bg-card/95 backdrop-blur-sm border-l border-primary/20 z-50 md:hidden shadow-2xl"
                variants={rightDrawerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-primary/20 flex items-center justify-between">
                    <h2 className="font-semibold text-lg">Users</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowRightDrawer(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <OnlineUsers />
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex items-center justify-around border-t border-primary/20 bg-card/95 backdrop-blur-sm p-2 flex-shrink-0 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowLeftDrawer(true)}
          className={cn(
            "h-12 w-12 rounded-lg",
            showLeftDrawer && "bg-primary/20"
          )}
        >
          <User className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowLeftDrawer(true)}
          className={cn(
            "h-12 w-12 rounded-lg",
            showLeftDrawer && "bg-primary/20"
          )}
        >
          <Hash className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowRightDrawer(true)}
          className={cn(
            "h-12 w-12 rounded-lg",
            showRightDrawer && "bg-primary/20"
          )}
        >
          <Users className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

export default MainLayout

