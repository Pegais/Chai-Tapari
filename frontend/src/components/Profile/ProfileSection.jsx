/**
 * Profile Section Component
 * 
 * Why: Display user profile information and important chats
 * How: Shows avatar, username, email, and starred channels
 * Impact: User identity and quick access to important conversations
 */

import React, { useState, useRef, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Star, StarOff, Hash, ChevronDown, Plus, LogOut } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import CardNav from "../ui/CardNav"
import CreateChannel from "../Channels/CreateChannel"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { useAuth } from "../../context/AuthContext"
import { useChannels } from "../../hooks/useChannels"

function ProfileSection() {
  const navigate = useNavigate()
  const { channelId } = useParams()
  const { user, logout } = useAuth()
  const { data: channels = [] } = useChannels()
  const [starredChannels, setStarredChannels] = useState([])
  const [showChannels, setShowChannels] = useState(false)
  const [selectedChannelId, setSelectedChannelId] = useState(channelId || null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const channelsRef = useRef(null)

  // Update selected channel when route changes
  useEffect(() => {
    if (channelId) {
      setSelectedChannelId(channelId)
    }
  }, [channelId])

  // Load starred channels from user data
  useEffect(() => {
    if (user?.starredChannels) {
      setStarredChannels(user.starredChannels.map(ch => ch._id || ch))
    }
  }, [user])

  /**
   * Toggle channel star status
   * Why: Allow users to mark channels as important
   * How: Adds/removes channel ID from starredChannels array
   * Impact: Users can quickly access important channels
   */
  const toggleStar = (channelId) => {
    setStarredChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    )
  }

  /**
   * Handle channel selection
   * Why: Navigate to selected channel
   * How: Sets selected channel and navigates
   * Impact: User can switch channels from profile section
   */
  const handleChannelSelect = (channelId) => {
    setSelectedChannelId(channelId)
    navigate(`/chat/channel/${channelId}`)
  }

  /**
   * Close channels dropdown when clicking outside
   * Why: Better UX - dropdown closes when user clicks elsewhere
   * How: Detects clicks outside dropdown element
   * Impact: Intuitive dropdown behavior
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (channelsRef.current && !channelsRef.current.contains(event.target)) {
        setShowChannels(false)
      }
    }

    if (showChannels) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showChannels])

  /**
   * Custom render function for channel items
   * Why: Customize channel display in card-nav
   * How: Returns JSX for each channel
   * Impact: Consistent channel presentation
   */
  const renderChannelItem = (channel, isSelected) => {
    return (
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-md transition-colors",
          isSelected ? "bg-primary/20" : "bg-muted/50"
        )}>
          <Hash className={cn(
            "h-4 w-4",
            isSelected ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-semibold text-sm truncate",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {channel.name}
          </div>
          {channel.description && (
            <div className="text-xs text-muted-foreground truncate mt-1">
              {channel.description}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {channel.memberCount} members
          </div>
        </div>
      </div>
    )
  }

  // Get starred channels
  const starredChannelsList = channels.filter((channel) =>
    starredChannels.includes(channel._id)
  )

  return (
    <div className="h-full flex flex-col bg-card/95 backdrop-blur-sm border-r border-primary/20 overflow-hidden" style={{width:"100%"}}>
      {/* Profile Header - Fixed */}
      <motion.div
        className="p-4 md:p-6 border-b border-primary/20 flex-shrink-0"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Avatar */}
        <div className="flex flex-col items-center mb-3 md:mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Avatar className="h-20 w-20 md:h-32 md:w-32 ring-2 md:ring-4 ring-primary/30 shadow-lg shadow-primary/20">
              <AvatarImage 
                src={user.avatar || "/avatars/avatar_1.jpg"} 
                alt={user.username} 
              />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl md:text-4xl">
                {user.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <motion.div
              className="absolute bottom-1 right-1 md:bottom-2 md:right-2 h-4 w-4 md:h-6 md:w-6 bg-primary border-2 md:border-4 border-background rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>

        {/* Username */}
        <motion.h2
          className="text-lg md:text-2xl font-bold text-center mb-1 md:mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {user.username || "User"}
        </motion.h2>

        {/* Email */}
        <motion.p
          className="text-xs md:text-sm text-muted-foreground text-center truncate w-full px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {user.email || "user@example.com"}
        </motion.p>
      </motion.div>

      {/* Starred Channels Section - Scrollable */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <motion.div
          className="p-4 border-b border-primary/20 flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Important Chats
          </h3>
        </motion.div>

        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {starredChannelsList.length > 0 ? (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {starredChannelsList.map((channel, index) => (
                <motion.div
                  key={channel._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-lg",
                    "bg-card/50 border border-primary/10 hover:border-primary/30",
                    "hover:bg-card/80 cursor-pointer transition-all"
                  )}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-2 rounded-md bg-primary/20">
                    <Star className="h-4 w-4 text-primary fill-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">#{channel.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {channel.memberCount} members
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStar(channel._id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                  >
                    <StarOff className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-8 text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No starred channels yet</p>
              <p className="text-xs mt-1">Star channels to see them here</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Logout Button - Fixed at bottom */}
      <div className="border-t border-primary/20 flex-shrink-0 p-4">
        <Button
          onClick={logout}
          variant="outline"
          className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/40"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Logout</span>
        </Button>
      </div>

      {/* Channels Section - Fixed at bottom left */}
      <div className="border-t border-primary/20 flex-shrink-0" ref={channelsRef}>
        <button
          onClick={() => setShowChannels(!showChannels)}
          className="w-full p-4 flex items-center justify-between hover:bg-accent/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Channels</span>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform text-muted-foreground",
            showChannels && "rotate-180"
          )} />
        </button>

        {/* Channels Dropdown */}
        <AnimatePresence>
          {showChannels && (
            <>
              {/* Backdrop - Makes background inaccessible */}
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowChannels(false)}
              />
              
              {/* Channels Panel - Fixed at bottom left */}
              <motion.div
                className="absolute bottom-0 left-0 w-64 h-[400px] bg-card/95 backdrop-blur-sm border-t border-r border-primary/20 shadow-2xl z-50 overflow-hidden"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="h-full flex flex-col">
                  {/* Header with Create Button */}
                  <div className="p-4 border-b border-primary/20 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      All Channels
                    </h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setShowChannels(false)
                        setShowCreateModal(true)
                      }}
                      className="h-7 w-7 hover:bg-primary/10"
                      title="Create Channel"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* CardNav Content */}
                  <div className="flex-1 overflow-hidden">
                    <CardNav
                      items={channels}
                      onItemSelect={handleChannelSelect}
                      selectedItemId={selectedChannelId}
                      renderItem={renderChannelItem}
                      searchPlaceholder="Search channels..."
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannel
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newChannel) => {
            // TODO: Add new channel to list
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

export default ProfileSection

