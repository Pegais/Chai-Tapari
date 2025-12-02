/**
 * Profile Section Component
 * 
 * Why: Display user profile information and important chats
 * How: Shows avatar, username, email, and starred channels
 * Impact: User identity and quick access to important conversations
 */

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Star, StarOff } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { mockCurrentUser, mockChannels } from "../../data/mockData"
import { cn } from "../../lib/utils"

function ProfileSection() {
  const [starredChannels, setStarredChannels] = useState(["channel1", "channel3"])

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

  // Get starred channels
  const starredChannelsList = mockChannels.filter((channel) =>
    starredChannels.includes(channel._id)
  )

  // Get current user data
  const user = JSON.parse(localStorage.getItem("user")) || mockCurrentUser

  return (
    <div className="h-full flex flex-col bg-card/95 backdrop-blur-sm border-r border-primary/20">
      {/* Profile Header */}
      <motion.div
        className="p-6 border-b border-primary/20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Avatar */}
        <div className="flex flex-col items-center mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Avatar className="h-32 w-32 ring-4 ring-primary/30 shadow-lg shadow-primary/20">
              <AvatarImage 
                src={user.avatar || "/avatars/avatar_1.jpg"} 
                alt={user.username} 
              />
              <AvatarFallback className="bg-primary/20 text-primary text-4xl">
                {user.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <motion.div
              className="absolute bottom-2 right-2 h-6 w-6 bg-primary border-4 border-background rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>

        {/* Username */}
        <motion.h2
          className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {user.username || "User"}
        </motion.h2>

        {/* Email */}
        <motion.p
          className="text-sm text-muted-foreground text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {user.email || "user@example.com"}
        </motion.p>
      </motion.div>

      {/* Starred Channels Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <motion.div
          className="p-4 border-b border-primary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Important Chats
          </h3>
        </motion.div>

        <div className="flex-1 overflow-y-auto p-2">
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
    </div>
  )
}

export default ProfileSection

