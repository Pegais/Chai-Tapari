/**
 * Online Users Component
 * 
 * Why: Display list of currently online users
 * How: Shows user avatars and names with online status indicator
 * Impact: Users can see who is available for real-time communication
 */

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { mockUsers, mockPresence, isUserOnline } from "../../data/mockData"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"

function OnlineUsers() {
  /**
   * Filter and sort users by online status
   * Why: Show online users first, then offline
   * How: Separates users by presence, sorts by username
   * Impact: Better UX with active users prominently displayed
   */
  const onlineUsers = mockUsers.filter((user) => isUserOnline(user._id))
  const offlineUsers = mockUsers.filter((user) => !isUserOnline(user._id))

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        className="p-4 border-b border-primary/20"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Online Users
        </h2>
        <p className="text-sm text-muted-foreground">
          {onlineUsers.length} online, {offlineUsers.length} offline
        </p>
      </motion.div>

      {/* Users List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Online Users */}
          <AnimatePresence>
            {onlineUsers.length > 0 && (
              <>
                <motion.div
                  className="px-2 py-1 text-xs font-semibold text-primary uppercase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Online
                </motion.div>
                {onlineUsers.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <UserItem user={user} isOnline={true} />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Offline Users */}
          <AnimatePresence>
            {offlineUsers.length > 0 && (
              <>
                <motion.div
                  className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Offline
                </motion.div>
                {offlineUsers.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <UserItem user={user} isOnline={false} />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}

/**
 * Individual User Item Component
 * Why: Display user with avatar and status
 * How: Shows avatar, username, and online indicator
 * Impact: Clear user identification with presence status
 */
function UserItem({ user, isOnline }) {
  return (
    <motion.div
      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/20 transition-colors"
      whileHover={{ x: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="relative">
        <Avatar className="h-8 w-8 ring-2 ring-primary/20">
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback className="bg-primary/20 text-primary">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <motion.div
            className="absolute bottom-0 right-0 h-3 w-3 bg-primary border-2 border-background rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{user.username}</div>
        {!isOnline && (
          <div className="text-xs text-muted-foreground">Offline</div>
        )}
      </div>
    </motion.div>
  )
}

export default OnlineUsers

