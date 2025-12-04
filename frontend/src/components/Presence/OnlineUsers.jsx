/**
 * Online Users Component
 * 
 * Why: Display list of currently online users
 * How: Shows user avatars and names with online status indicator
 * Impact: Users can see who is available for real-time communication
 */

import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import AnimatedList from "../ui/AnimatedList"
import { ScrollArea } from "../ui/scroll-area"
import { MessageCircle } from "lucide-react"
import { useUsers, useOnlineUsers, userKeys } from "../../hooks/useUsers"
import { useAuth } from "../../context/AuthContext"
import { useConversation } from "../../hooks/useDirectMessages"
import { useSendDirectMessage } from "../../hooks/useDirectMessages"
import { getSocket } from "../../services/socket"
import { useQueryClient } from "@tanstack/react-query"

function OnlineUsers() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { data: allUsers = [], isLoading: usersLoading } = useUsers()
  const { data: onlineUsersList = [], isLoading: onlineLoading } = useOnlineUsers()
  
  /**
   * Listen for real-time online/offline status updates
   * Why: Update user status immediately when users go online/offline
   * How: Listens to WebSocket events and updates React Query cache
   * Impact: Real-time presence updates without polling delay
   */
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleUserOnline = (data) => {
      const { userId, user: userData } = data
      
      // Update all users cache - set user to online
      queryClient.setQueryData(userKeys.lists(), (oldData) => {
        if (!oldData) return oldData
        
        return oldData.map(user => {
          const userIdStr = typeof user._id === 'string' ? user._id : user._id?.toString()
          const newUserIdStr = typeof userId === 'string' ? userId : userId?.toString()
          
          if (userIdStr === newUserIdStr) {
            return {
              ...user,
              isOnline: true,
            }
          }
          return user
        })
      })
      
      // Update online users cache - add user if not present
      queryClient.setQueryData(userKeys.online(), (oldData) => {
        if (!oldData) return oldData
        
        const userIdStr = typeof userId === 'string' ? userId : userId?.toString()
        const exists = oldData.some(u => {
          const uId = typeof u._id === 'string' ? u._id : u._id?.toString()
          return uId === userIdStr
        })
        
        if (!exists) {
          return [...oldData, userData || { _id: userId, isOnline: true }]
        }
        
        return oldData.map(u => {
          const uId = typeof u._id === 'string' ? u._id : u._id?.toString()
          if (uId === userIdStr) {
            return { ...u, isOnline: true }
          }
          return u
        })
      })
    }

    const handleUserOffline = (data) => {
      const { userId } = data
      
      // Update all users cache - set user to offline
      queryClient.setQueryData(userKeys.lists(), (oldData) => {
        if (!oldData) return oldData
        
        return oldData.map(user => {
          const userIdStr = typeof user._id === 'string' ? user._id : user._id?.toString()
          const newUserIdStr = typeof userId === 'string' ? userId : userId?.toString()
          
          if (userIdStr === newUserIdStr) {
            return {
              ...user,
              isOnline: false,
            }
          }
          return user
        })
      })
      
      // Update online users cache - remove user
      queryClient.setQueryData(userKeys.online(), (oldData) => {
        if (!oldData) return oldData
        
        const userIdStr = typeof userId === 'string' ? userId : userId?.toString()
        return oldData.filter(u => {
          const uId = typeof u._id === 'string' ? u._id : u._id?.toString()
          return uId !== userIdStr
        })
      })
    }

    socket.on('user:online', handleUserOnline)
    socket.on('user:offline', handleUserOffline)

    return () => {
      socket.off('user:online', handleUserOnline)
      socket.off('user:offline', handleUserOffline)
    }
  }, [queryClient])

  /**
   * Filter and sort users by online status
   * Why: Show online users first, then offline
   * How: Separates users by presence, sorts by username
   * Impact: Better UX with active users prominently displayed
   */
  // Filter out current user from the list
  const otherUsers = allUsers.filter(user => {
    const userId = typeof user._id === 'string' ? user._id : user._id?.toString()
    const currentUserId = typeof currentUser?._id === 'string' ? currentUser._id : currentUser?._id?.toString()
    return userId !== currentUserId
  })
  
  // Create set of online user IDs (handle both object and string formats)
  const onlineUserIds = new Set(
    onlineUsersList.map(user => {
      const id = typeof user === 'string' ? user : (user._id || user)
      return typeof id === 'string' ? id : id.toString()
    })
  )
  
  // Determine online/offline status
  // Priority: onlineUsersList > isOnline field from allUsers
  const onlineUsers = otherUsers.filter((user) => {
    const userId = typeof user._id === 'string' ? user._id : user._id?.toString()
    // User is online if:
    // 1. They are in the onlineUsersList, OR
    // 2. Their isOnline field is explicitly true
    return onlineUserIds.has(userId) || user.isOnline === true
  })
  
  const offlineUsers = otherUsers.filter((user) => {
    const userId = typeof user._id === 'string' ? user._id : user._id?.toString()
    // User is offline if:
    // 1. They are NOT in the onlineUsersList, AND
    // 2. Their isOnline field is NOT true (false or undefined)
    return !onlineUserIds.has(userId) && user.isOnline !== true
  })

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <motion.div
        className="p-3 md:p-4 border-b border-primary/20 flex-shrink-0"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-base md:text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Online Users
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          {onlineUsers.length} online, {offlineUsers.length} offline
        </p>
      </motion.div>

      {/* Users List - Scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {usersLoading || onlineLoading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground text-sm">Loading users...</p>
            </div>
          ) : (
            <>
              {/* Online Users */}
              {onlineUsers.length > 0 && (
            <>
              <motion.div
                className="px-2 py-2 text-xs font-semibold text-primary uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Online ({onlineUsers.length})
              </motion.div>
              <AnimatedList
                items={onlineUsers}
                renderItem={(user) => <UserItem user={user} isOnline={true} />}
                itemClassName="mb-1"
                staggerDelay={0.05}
              />
            </>
          )}

          {/* Offline Users */}
          {offlineUsers.length > 0 && (
            <>
              <motion.div
                className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Offline ({offlineUsers.length})
              </motion.div>
              <AnimatedList
                items={offlineUsers}
                renderItem={(user) => <UserItem user={user} isOnline={false} />}
                itemClassName="mb-1"
                staggerDelay={0.05}
              />
            </>
          )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

/**
 * Individual User Item Component
 * Why: Display user with avatar, status, and direct message button
 * How: Shows avatar, username, online indicator, and message button
 * Impact: Clear user identification with presence status and messaging capability
 */
function UserItem({ user, isOnline }) {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { data: conversation } = useConversation(user._id)
  const sendDirectMessage = useSendDirectMessage()

  /**
   * Handle direct message click
   * Why: Start or navigate to conversation with user
   * How: Gets or creates conversation, navigates to DM window
   * Impact: Enables direct messaging from user list
   */
  const handleDirectMessage = async (e) => {
    e.stopPropagation()
    const userId = typeof user._id === 'string' ? user._id : user._id?.toString()
    
    // Navigate to new conversation route - DirectMessageWindow will handle getting/creating conversation
    navigate(`/chat/dm/new/${userId}`)
  }

  return (
    <motion.div
      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/20 transition-colors group"
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
      <button
        onClick={handleDirectMessage}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary/10 rounded-md"
        title="Send direct message"
      >
        <MessageCircle className="h-4 w-4 text-primary" />
      </button>
    </motion.div>
  )
}

export default OnlineUsers

