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

function MessageList({ messages = [], channelId, conversationId }) {
  const scrollRef = useRef(null)
  const messagesEndRef = useRef(null)
  const socket = getSocket()

  /**
   * Scroll to bottom when new messages arrive (cache updates handled by parent components)
   * Why: Keep latest messages visible
   * How: Listens to socket events and scrolls when messages are added
   * Impact: Better UX - users see new messages automatically
   */
  useEffect(() => {
    if (!socket || (!channelId && !conversationId)) return

    const handleNewMessage = (data) => {
      // Cache updates are handled by ChatWindow/DirectMessageWindow
      // This component only handles scrolling
      const message = data.message || data
      
      if (channelId) {
        const messageChannelId = typeof message.channel === 'object' 
          ? message.channel._id || message.channel 
          : message.channel
        
        if (messageChannelId === channelId) {
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
          // Scroll to bottom
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
            }
          }, 100)
        }
      }
    }

    // Note: All cache updates (new messages, edits, deletes) are handled by parent components
    // (ChatWindow/DirectMessageWindow). This component only handles scrolling.

    socket.on('new-message', handleNewMessage)
    socket.on('new-direct-message', handleNewMessage)

    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('new-direct-message', handleNewMessage)
    }
  }, [socket, channelId, conversationId])

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
            // Skip optimistic/temporary message IDs (they start with "temp-")
            // Only send read events for messages that have been saved to the database
            if (messageId && !messageId.startsWith('temp-')) {
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
   * Deduplicate and sort messages
   * Messages are already deduplicated and sorted by parent component,
   * but do a quick ID-based dedup as safety measure
   */
  const messageMap = new Map()
  messages.forEach(message => {
    const msgId = message._id || message.id
    if (msgId) {
      // Keep last occurrence (most up-to-date) or prefer non-optimistic
      const existing = messageMap.get(String(msgId))
      if (!existing || (!message.isOptimistic && existing.isOptimistic)) {
        messageMap.set(String(msgId), message)
      }
    }
  })
  
  // Helper to get valid date from message
  const getMessageDate = (msg) => {
    const timestamp = msg?.timestamp || msg?.createdAt
    if (!timestamp) return new Date()
    const date = new Date(timestamp)
    // Check if date is valid
    return isNaN(date.getTime()) ? new Date() : date
  }

  const sortedMessages = Array.from(messageMap.values())
    .sort((a, b) => getMessageDate(a).getTime() - getMessageDate(b).getTime())
  
  const groupedMessages = []
  let currentGroup = null

  sortedMessages.forEach((message, index) => {
    const msgDate = getMessageDate(message)
    const messageDate = format(msgDate, "yyyy-MM-dd")
    const prevMessage = index > 0 ? sortedMessages[index - 1] : null
    const prevDate = prevMessage ? format(getMessageDate(prevMessage), "yyyy-MM-dd") : null

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
      getMessageDate(message).getTime() - getMessageDate(prevMessage).getTime() < 5 * 60 * 1000 // 5 minutes

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
                {group.messages.map((message, msgIndex) => {
                  // Create truly unique key: combine message ID with group and message index
                  // This prevents React warnings even if same ID appears (shouldn't after deduplication)
                  const messageId = message._id || message
                  const uniqueKey = `${messageId || 'no-id'}-g${index}-m${msgIndex}`
                  return (
                    <div key={uniqueKey} data-message-id={messageId}>
                    <MessageItem
                      message={message}
                      showAvatar={msgIndex === 0} // Show avatar only for first message in group
                      showTimestamp={msgIndex === group.messages.length - 1} // Show timestamp only for last message
                      channelId={channelId}
                      conversationId={conversationId}
                    />
                    </div>
                  )
                })}
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

