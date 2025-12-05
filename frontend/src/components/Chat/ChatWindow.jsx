/**
 * Chat Window Component
 * 
 * Why: Main chat interface displaying messages and input
 * How: Uses React Query for initial fetch, Zustand for real-time updates
 * Impact: Fast real-time messaging with persistent data fetching
 */

import React, { useEffect, useMemo, useRef } from "react"
import { useParams } from "react-router-dom"
import { motion } from "framer-motion"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import TypingIndicator from "./TypingIndicator"
import { useChannel } from "../../hooks/useChannels"
import { useMessages } from "../../hooks/useMessages"
import { getSocket } from "../../services/socket"
import { useRestorePendingMessages } from "../../hooks/useMessageQueue"
import { removeFromQueue, getMessageByOptimisticId } from "../../services/indexedDBQueue"
import { useMessageStore } from "../../stores/useMessageStore"
import { useTypingStore } from "../../stores/useTypingStore"

function ChatWindow() {
  const { channelId } = useParams()
  const { data: channel, isLoading: channelLoading, error: channelError } = useChannel(channelId)
  const { data: messagesData, isLoading: messagesLoading } = useMessages(channelId)
  
  // Get Zustand store channel messages (object, not array)
  const channelMessages = useMessageStore((state) => state.messages[channelId])
  
  // Get typing users from Zustand
  const typingUsersSet = useTypingStore((state) => state.typingUsers.get(channelId))
  
  const typingUsers = useMemo(() => {
    if (!typingUsersSet) return []
    return Array.from(typingUsersSet)
  }, [typingUsersSet])

  // Extract initial messages from React Query
  const initialMessages = useMemo(() => {
    return messagesData?.pages?.flatMap(page => page.messages || []) || []
  }, [messagesData])

  // Restore pending messages from IndexedDB queue on mount
  useRestorePendingMessages(channelId, null)

  // Merge React Query + Zustand messages and sort (in component, NOT in selector)
  const messages = useMemo(() => {
    if (!channelId) return []
    
    const messageMap = new Map()
    const deletedIds = new Set()
    
    // First pass: collect all deleted IDs from Zustand
    if (channelMessages) {
      Object.values(channelMessages).forEach(msg => {
        const msgId = msg._id || msg.id
        if (msgId && msg.isDeleted) {
          deletedIds.add(String(msgId))
        }
      })
    }
    
    // Add React Query messages (skip deleted ones)
    initialMessages.forEach(msg => {
      const msgId = msg._id || msg.id
      if (msgId && !deletedIds.has(String(msgId))) {
        messageMap.set(String(msgId), msg)
      }
    })
    
    // Add/merge Zustand real-time messages (skip deleted ones)
    if (channelMessages) {
      Object.values(channelMessages).forEach(msg => {
        const msgId = msg._id || msg.id
        if (!msgId || msg.isDeleted) return
        
        const msgIdStr = String(msgId)
        const existing = messageMap.get(msgIdStr)
        
        if (msg.isOptimistic) {
          messageMap.set(msgIdStr, msg)
        } else if (existing) {
          messageMap.set(msgIdStr, { ...existing, ...msg })
        } else {
          messageMap.set(msgIdStr, msg)
        }
      })
    }
    
    // Sort by timestamp
    return Array.from(messageMap.values())
      .sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || 0).getTime()
        const timeB = new Date(b.timestamp || b.createdAt || 0).getTime()
        return timeA - timeB
      })
  }, [channelId, initialMessages, channelMessages])

  // Use refs for socket handlers to avoid recreating them
  const channelIdRef = useRef(channelId)
  channelIdRef.current = channelId

  // Socket setup - runs only when channelId changes
  useEffect(() => {
    if (!channelId) return

    const socket = getSocket()
    if (!socket) return

    // Get store actions directly (not from hooks)
    const { mergeMessage, updateMessage, deleteMessage } = useMessageStore.getState()
    const { addTypingUser, removeTypingUser } = useTypingStore.getState()

    // Join channel room
    socket.emit('join-channel', channelId)

    // Handler for new messages
    const handleNewMessage = (data) => {
      const message = data.message || data
      if (!message) return
      
      const messageChannelId = typeof message.channel === 'object' 
        ? message.channel._id || message.channel 
        : message.channel
      
      if (messageChannelId === channelIdRef.current) {
        // First, find and replace any matching optimistic message
        const state = useMessageStore.getState()
        const msgs = state.messages[channelIdRef.current] || {}
        const senderId = message.sender?._id || message.sender
        
        // Find optimistic message by matching content and sender
        const optimistic = Object.values(msgs).find(m => {
          if (!m.isOptimistic) return false
          if (!String(m._id || m.id || '').startsWith('temp-')) return false
          if (m.content !== message.content) return false
          
          const optSenderId = m.sender?._id || m.sender
          if (String(optSenderId) !== String(senderId)) return false
          
          // Check timestamp is within 30 seconds
          const optTime = new Date(m.timestamp || m.createdAt).getTime()
          const msgTime = new Date(message.timestamp || message.createdAt).getTime()
          return Math.abs(optTime - msgTime) < 30000
        })
        
        if (optimistic) {
          // Replace optimistic with real message - this removes temp and adds real
          const { replaceOptimistic } = useMessageStore.getState()
          const tempId = optimistic._id || optimistic.id
          replaceOptimistic(channelIdRef.current, tempId, { ...message, status: 'sent' })
          
          // Cleanup from IndexedDB queue
          setTimeout(async () => {
            try {
              if (optimistic.queueId) {
                await removeFromQueue(optimistic.queueId)
              } else {
                const queueMsg = await getMessageByOptimisticId(tempId)
                if (queueMsg) await removeFromQueue(queueMsg.id)
              }
            } catch (e) { /* ignore */ }
          }, 0)
        } else {
          // No optimistic found - just merge the new message (from other users)
          mergeMessage(channelIdRef.current, { ...message, status: message.status || 'sent' })
        }
      }
    }

    // Handler for typing
    const handleTyping = (data) => {
      if (data.channelId === channelIdRef.current && data.username) {
        addTypingUser(channelIdRef.current, data.username)
        setTimeout(() => {
          removeTypingUser(channelIdRef.current, data.username)
        }, 3000)
      }
    }

    const handleTypingStop = (data) => {
      if (data.channelId === channelIdRef.current && data.username) {
        removeTypingUser(channelIdRef.current, data.username)
      }
    }

    // Handler for message edits
    const handleMessageEdited = (data) => {
      const message = data.message || data
      if (!message) return
      
      const messageChannelId = typeof message.channel === 'object' 
        ? message.channel._id || message.channel 
        : message.channel
      
      const msgId = message._id || message.id
      if (messageChannelId === channelIdRef.current && msgId) {
        updateMessage(channelIdRef.current, msgId, message)
      }
    }

    // Handler for message deletes
    const handleMessageDeleted = (data) => {
      const { messageId, channelId: eventChannelId } = data
      if (!messageId) return
      
      const shouldUpdate = !eventChannelId || String(eventChannelId) === String(channelIdRef.current)
      if (shouldUpdate) {
        deleteMessage(channelIdRef.current, messageId)
      }
    }

    // Handler for status updates
    const handleMessageStatusUpdate = (data) => {
      const { messageId, status } = data
      if (messageId) {
        updateMessage(channelIdRef.current, messageId, { status })
      }
    }

    // Attach listeners
    socket.on('new-message', handleNewMessage)
    socket.on('user-typing', handleTyping)
    socket.on('user-stopped-typing', handleTypingStop)
    socket.on('message-edited', handleMessageEdited)
    socket.on('message-deleted', handleMessageDeleted)
    socket.on('message-status-update', handleMessageStatusUpdate)

    // Cleanup
    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('user-typing', handleTyping)
      socket.off('user-stopped-typing', handleTypingStop)
      socket.off('message-edited', handleMessageEdited)
      socket.off('message-deleted', handleMessageDeleted)
      socket.off('message-status-update', handleMessageStatusUpdate)
      socket.emit('leave-channel', channelId)
    }
  }, [channelId]) // Only channelId - no function dependencies

  // Loading state
  if (channelLoading || messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Error state
  if (channelError || !channel) {
    const isUnauthorized = channelError?.response?.status === 403 || 
                          channelError?.status === 403 ||
                          (channelError?.message && channelError.message.includes('Access denied'))
    
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <p className="text-destructive font-semibold">
            {isUnauthorized ? "Access Denied" : "Error loading channel"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isUnauthorized 
              ? "You are not a member of this private channel." 
              : channelError?.message || "Please try again later."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="h-full flex flex-col overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      {/* Channel Header */}
      <motion.div
        className="border-b border-primary/20 p-3 sm:p-4 bg-card/95 backdrop-blur-sm flex-shrink-0"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          #{channel.name}
        </h1>
        {channel.description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{channel.description}</p>
        )}
        
        <motion.div
          className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-md"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="text-primary">🔒</span>
            <span>For privacy, your messages will be automatically deleted after 8 hours.</span>
          </p>
        </motion.div>
      </motion.div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <MessageList messages={messages} channelId={channelId} conversationId={null} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex-shrink-0">
          <TypingIndicator typingUsers={typingUsers} />
        </div>
      )}

      {/* Message Input */}
      <motion.div
        className="border-t border-primary/20 p-2 sm:p-3 md:p-4 bg-card/95 backdrop-blur-sm flex-shrink-0"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <MessageInput channelId={channelId} onMessageSent={() => {}} />
      </motion.div>
    </motion.div>
  )
}

export default ChatWindow
