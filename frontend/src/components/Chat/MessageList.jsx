/**
 * Message List Component
 * 
 * Why: Displays scrollable list of messages in a channel
 * How: Renders messages with virtualization for performance, supports pagination
 * Impact: Efficient message display even with thousands of messages
 */

import React, { useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import MessageItem from "./MessageItem"
import { format } from "date-fns"
import { getSocket } from "../../services/socket"
import { useQueryClient } from "@tanstack/react-query"
import { messageKeys } from "../../hooks/useMessages"

function MessageList({ messages = [], channelId, conversationId }) {
  const scrollRef = useRef(null)
  const messagesEndRef = useRef(null)
  const socket = getSocket()
  const queryClient = useQueryClient()

  /**
   * Set up WebSocket listeners for real-time message updates
   * Why: Receive new messages, edits, and deletes in real-time
   * How: Listens to socket events and updates message list
   * Impact: Real-time message synchronization
   */
  useEffect(() => {
    if (!socket || (!channelId && !conversationId)) return

    const handleNewMessage = (data) => {
      // Message will be added via WebSocket
      const message = data.message || data
      
      if (channelId) {
        const messageChannelId = typeof message.channel === 'object' 
          ? message.channel._id || message.channel 
          : message.channel
        
        if (messageChannelId === channelId) {
          console.log('[MessageList] New message received:', message)
          
          // Update cache if not already updated
          queryClient.setQueryData(messageKeys.list(channelId), (oldData) => {
            if (!oldData) return oldData
            
            // Check if message already exists
            const messageExists = oldData.pages.some(page => 
              page.messages.some(msg => {
                const msgId = msg._id || msg
                const newMsgId = message._id || message
                return msgId === newMsgId
              })
            )
            
            if (messageExists) return oldData
            
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
          
          // Scroll to bottom when new message arrives
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
            }
          }, 100)
        }
      } else if (conversationId) {
        const messageConversationId = typeof message.conversation === 'object' 
          ? message.conversation._id || message.conversation 
          : message.conversation
        
        if (messageConversationId === conversationId) {
          console.log('[MessageList] New direct message received:', message)
          // Scroll to bottom
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
            }
          }, 100)
        }
      }
    }

    const handleMessageEdited = (data) => {
      const message = data.message || data
      console.log('[MessageList] Message edited:', message)
      
      if (channelId) {
        const messageChannelId = typeof message.channel === 'object' 
          ? message.channel._id || message.channel 
          : message.channel
        
        if (messageChannelId === channelId) {
          // Update cache immediately
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
      } else if (conversationId) {
        const messageConversationId = typeof message.conversation === 'object' 
          ? message.conversation._id || message.conversation 
          : message.conversation
        
        if (messageConversationId === conversationId) {
          // Update direct message cache
          const { directMessageKeys } = require('../../hooks/useDirectMessages')
          queryClient.setQueryData(directMessageKeys.conversationMessages(conversationId), (oldData) => {
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
    }

    const handleMessageDeleted = (data) => {
      const { messageId } = data
      console.log('[MessageList] Message deleted:', messageId)
      
      if (channelId) {
        // Update cache immediately
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
      } else if (conversationId) {
        // Update direct message cache
        const { directMessageKeys } = require('../../hooks/useDirectMessages')
        queryClient.setQueryData(directMessageKeys.conversationMessages(conversationId), (oldData) => {
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
    }

    socket.on('new-message', handleNewMessage)
    socket.on('new-direct-message', handleNewMessage)
    socket.on('message-edited', handleMessageEdited)
    socket.on('message-deleted', handleMessageDeleted)

    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('new-direct-message', handleNewMessage)
      socket.off('message-edited', handleMessageEdited)
      socket.off('message-deleted', handleMessageDeleted)
    }
  }, [socket, channelId, conversationId, queryClient])

  /**
   * Auto-scroll to bottom when new messages arrive
   * Why: Keep latest messages visible
   * How: Scrolls to bottom element when messages change
   * Impact: Better UX - users see new messages automatically
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  /**
   * Mark messages as read when in viewport
   * Why: Update message status to 'read' when user views them
   * How: Uses Intersection Observer to detect when messages are visible
   * Impact: Accurate read receipts for message senders
   */
  useEffect(() => {
    if (!socket || messages.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id')
            if (messageId) {
              // Mark as read via socket
              socket.emit('message-read', { messageId })
            }
          }
        })
      },
      { rootMargin: '0px', threshold: 0.5 }
    )

    // Observe all message elements
    const messageElements = document.querySelectorAll('[data-message-id]')
    messageElements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [messages, socket])

  /**
   * Group messages by date for date separators
   * Why: Visual organization of messages by time
   * How: Groups consecutive messages from same sender on same day
   * Impact: Clearer message timeline and reduced visual clutter
   */
  const groupedMessages = []
  let currentGroup = null

  messages.forEach((message, index) => {
    const messageDate = format(new Date(message.timestamp), "yyyy-MM-dd")
    const prevMessage = index > 0 ? messages[index - 1] : null
    const prevDate = prevMessage ? format(new Date(prevMessage.timestamp), "yyyy-MM-dd") : null

    // Show date separator if date changed
    if (messageDate !== prevDate) {
      groupedMessages.push({
        type: "date-separator",
        date: messageDate,
      })
    }

    // Get sender ID (handle both object and string)
    const senderId = typeof message.sender === 'object' 
      ? message.sender._id 
      : message.sender
    const prevSenderId = prevMessage 
      ? (typeof prevMessage.sender === 'object' ? prevMessage.sender._id : prevMessage.sender)
      : null

    // Group consecutive messages from same sender
    const shouldGroup = prevMessage && 
      senderId === prevSenderId &&
      new Date(message.timestamp) - new Date(prevMessage.timestamp) < 5 * 60 * 1000 // 5 minutes

    if (shouldGroup && currentGroup) {
      currentGroup.messages.push(message)
    } else {
      currentGroup = {
        type: "message-group",
        sender: senderId,
        messages: [message],
      }
      groupedMessages.push(currentGroup)
    }
  })

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden" ref={scrollRef}>
      <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 max-w-full">
        <AnimatePresence>
          {groupedMessages.map((group, index) => {
            if (group.type === "date-separator") {
              return (
                <motion.div
                  key={`date-${group.date}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center py-4"
                >
                  <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/20">
                    {format(new Date(group.date), "MMMM d, yyyy")}
                  </div>
                </motion.div>
              )
            }

            return (
              <motion.div
                key={`group-${index}`}
                className="space-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
              >
                {group.messages.map((message, msgIndex) => (
                  <div key={message._id} data-message-id={message._id}>
                    <MessageItem
                      message={message}
                      showAvatar={msgIndex === 0} // Show avatar only for first message in group
                      showTimestamp={msgIndex === group.messages.length - 1} // Show timestamp only for last message
                    />
                  </div>
                ))}
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList

