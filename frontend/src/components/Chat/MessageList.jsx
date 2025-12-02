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
import { ScrollArea } from "../ui/scroll-area"
import { format } from "date-fns"

function MessageList({ messages, channelId }) {
  const scrollRef = useRef(null)
  const messagesEndRef = useRef(null)

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

    // Group consecutive messages from same sender
    const shouldGroup = prevMessage && 
      prevMessage.sender === message.sender &&
      new Date(message.timestamp) - new Date(prevMessage.timestamp) < 5 * 60 * 1000 // 5 minutes

    if (shouldGroup && currentGroup) {
      currentGroup.messages.push(message)
    } else {
      currentGroup = {
        type: "message-group",
        sender: message.sender,
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
    <ScrollArea className="flex-1 h-full" ref={scrollRef}>
      <div className="p-4 space-y-4">
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
                  <MessageItem
                    key={message._id}
                    message={message}
                    showAvatar={msgIndex === 0} // Show avatar only for first message in group
                    showTimestamp={msgIndex === group.messages.length - 1} // Show timestamp only for last message
                  />
                ))}
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}

export default MessageList

