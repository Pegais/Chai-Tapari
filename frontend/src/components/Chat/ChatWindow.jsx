/**
 * Chat Window Component
 * 
 * Why: Main chat interface displaying messages and input
 * How: Combines MessageList and MessageInput in a scrollable container
 * Impact: Primary user interface for messaging functionality
 */

import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { motion } from "framer-motion"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import TypingIndicator from "./TypingIndicator"
import { useChannel, useJoinChannel } from "../../hooks/useChannels"
import { useMessages, messageKeys } from "../../hooks/useMessages"
import { useAuth } from "../../context/AuthContext"
import { getSocket } from "../../services/socket"
import { useQueryClient } from "@tanstack/react-query"

function ChatWindow() {
  const { channelId } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: channel, isLoading: channelLoading, error: channelError } = useChannel(channelId)
  const { data: messagesData, isLoading: messagesLoading } = useMessages(channelId)
  const [typingUsers, setTypingUsers] = useState([])
  const joinChannel = useJoinChannel()

  // Extract messages from infinite query data
  // Why: Flatten paginated messages into single array
  // How: Combines all pages of messages
  // Impact: All messages available for display
  const messages = messagesData?.pages?.flatMap(page => page.messages || []) || []

  /**
   * Auto-join public channels
   * Why: Allow users to automatically join public channels
   * How: Checks if user is member, joins if not
   * Impact: Seamless access to public channels
   */
  useEffect(() => {
    if (channel && !channel.isPrivate && user) {
      const isMember = channel.members?.some(member => 
        (typeof member === 'object' ? member._id : member) === user._id
      )
      
      if (!isMember) {
        joinChannel.mutate(channel._id, {
          onSuccess: () => {
            console.log('[ChatWindow] Auto-joined public channel')
          },
          onError: (error) => {
            console.error('[ChatWindow] Failed to join channel:', error)
          }
        })
      }
    }
  }, [channel, user, joinChannel])

  /**
   * Set up WebSocket listeners
   * Why: Receive real-time updates for messages and typing
   * How: Connects to socket and listens for events
   * Impact: Real-time messaging and presence updates
   */
  useEffect(() => {
    if (!channelId) return

    const socket = getSocket()
    if (!socket) return

    // Join channel room
    socket.emit('join-channel', channelId)

    // Listen for new messages
    const handleNewMessage = (data) => {
      // Update React Query cache immediately for instant UI update
      const message = data.message || data
      
      if (message) {
        const messageChannelId = typeof message.channel === 'object' 
          ? message.channel._id || message.channel 
          : message.channel
        
        if (messageChannelId === channelId) {
          console.log('[ChatWindow] New message received:', message)
          
          // Optimistically update the cache
          queryClient.setQueryData(messageKeys.list(channelId), (oldData) => {
            if (!oldData) return oldData
            
            // Check if message already exists (prevent duplicates)
            const messageExists = oldData.pages.some(page => 
              page.messages.some(msg => {
                const msgId = msg._id || msg
                const newMsgId = message._id || message
                const senderId = msg.sender?._id || msg.sender
                const newSenderId = message.sender?._id || message.sender
                return msgId === newMsgId || (msg.isOptimistic && msg.content === message.content && senderId === newSenderId)
              })
            )
            
            if (messageExists) {
              // Replace optimistic message with real message
              return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  messages: page.messages.map(msg => {
                    const senderId = msg.sender?._id || msg.sender
                    const newSenderId = message.sender?._id || message.sender
                    // Replace optimistic message with real one
                    if (msg.isOptimistic && msg.content === message.content && senderId === newSenderId) {
                      return message
                    }
                    // Update if same ID
                    if (msg._id === message._id) {
                      return message
                    }
                    return msg
                  }).filter((msg, index, arr) => {
                    // Remove duplicates by ID
                    const msgId = msg._id
                    return arr.findIndex(m => (m._id || m) === msgId) === index
                  }),
                })),
              }
            }
            
            // Add message to the last page (newest messages are at the end)
            const lastPageIndex = oldData.pages.length - 1
            return {
              ...oldData,
              pages: oldData.pages.map((page, index) => {
                if (index === lastPageIndex) {
                  // Add to end of last page (newest messages)
                  return {
                    ...page,
                    messages: [...page.messages, message],
                  }
                }
                return page
              }),
            }
          })
        }
      }
    }

    // Listen for typing indicators
    const handleTyping = (data) => {
      if (data.channelId === channelId) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username]
          }
          return prev
        })
      }
    }

    const handleTypingStop = (data) => {
      if (data.channelId === channelId) {
        setTypingUsers((prev) => prev.filter(user => user !== data.username))
      }
    }

    // Listen for message edits and deletes
    const handleMessageEdited = (data) => {
      const message = data.message || data
      const messageChannelId = typeof message.channel === 'object' 
        ? message.channel._id || message.channel 
        : message.channel
      
      if (messageChannelId === channelId) {
        console.log('[ChatWindow] Message edited:', message)
        queryClient.setQueryData(messageKeys.list(channelId), (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              messages: page.messages.map(msg => 
                msg._id === message._id ? message : msg
              ),
            })),
          }
        })
      }
    }

    const handleMessageDeleted = (data) => {
      const { messageId } = data
      console.log('[ChatWindow] Message deleted:', messageId)
      queryClient.setQueryData(messageKeys.list(channelId), (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            messages: page.messages.map(msg => 
              msg._id === messageId ? { ...msg, isDeleted: true } : msg
            ),
          })),
        }
      })
    }

    // Listen for message status updates
    const handleMessageStatusUpdate = (data) => {
      const { messageId, status } = data
      queryClient.setQueryData(messageKeys.list(channelId), (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            messages: page.messages.map(msg => 
              msg._id === messageId ? { ...msg, status } : msg
            ),
          })),
        }
      })
    }

    socket.on('new-message', handleNewMessage)
    socket.on('user-typing', handleTyping)
    socket.on('user-stopped-typing', handleTypingStop)
    socket.on('message-edited', handleMessageEdited)
    socket.on('message-deleted', handleMessageDeleted)
    socket.on('message-status-update', handleMessageStatusUpdate)

    // Cleanup on unmount
    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('user-typing', handleTyping)
      socket.off('user-stopped-typing', handleTypingStop)
      socket.off('message-edited', handleMessageEdited)
      socket.off('message-deleted', handleMessageDeleted)
      socket.off('message-status-update', handleMessageStatusUpdate)
      socket.emit('leave-channel', channelId)
    }
  }, [channelId, queryClient])

  /**
   * Handle new message
   * Why: Add new message to chat
   * How: Messages are handled via WebSocket and React Query
   * Impact: Real-time message updates in chat
   */
  const handleNewMessage = (message) => {
    // Message will be added via WebSocket
    // React Query will automatically refetch
    console.log('[ChatWindow] Message sent:', message)
  }

  if (channelLoading || messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (channelError || !channel) {
    // Check if error is due to unauthorized access to private channel
    const isUnauthorized = channelError?.response?.status === 403 || 
                          channelError?.status === 403 ||
                          (channelError?.message && channelError.message.includes('Access denied'))
    
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <p className="text-destructive font-semibold">
            {isUnauthorized 
              ? "Access Denied" 
              : "Error loading channel"}
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
      {/* Channel Header - Fixed */}
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
        
        {/* Privacy Notice */}
        <motion.div
          className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-md"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="text-primary">🔒</span>
            <span>For privacy, we will be deleting conversation after 48 hours.</span>
          </p>
        </motion.div>
      </motion.div>

      {/* Messages List - Scrollable (takes remaining space) */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : (
          <MessageList messages={messages} channelId={channelId} conversationId={null} />
        )}
      </div>

      {/* Typing Indicator - Fixed above input */}
      {typingUsers.length > 0 && (
        <div className="flex-shrink-0">
          <TypingIndicator typingUsers={typingUsers} />
        </div>
      )}

      {/* Message Input - Fixed at bottom (always in viewport) */}
      <motion.div
        className="border-t border-primary/20 p-2 sm:p-3 md:p-4 bg-card/95 backdrop-blur-sm flex-shrink-0"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <MessageInput channelId={channelId} onMessageSent={handleNewMessage} />
      </motion.div>
    </motion.div>
  )
}

export default ChatWindow

