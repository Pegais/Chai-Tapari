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
import { getChannelById, getMessagesByChannel } from "../../data/mockData"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import TypingIndicator from "./TypingIndicator"
import { getTypingUsers } from "../../data/mockData"

function ChatWindow() {
  const { channelId } = useParams()
  const [channel, setChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([])

  /**
   * Load channel and messages when channel changes
   * Why: Update chat content when user switches channels
   * How: Fetches channel data and messages for selected channel
   * Impact: Displays correct messages for current channel
   */
  useEffect(() => {
    if (channelId) {
      const channelData = getChannelById(channelId)
      const channelMessages = getMessagesByChannel(channelId)
      setChannel(channelData)
      setMessages(channelMessages)
      setTypingUsers(getTypingUsers(channelId))
    }
  }, [channelId])

  /**
   * Handle new message
   * Why: Add new message to chat
   * How: Appends message to messages array
   * Impact: Real-time message updates in chat
   */
  const handleNewMessage = (message) => {
    setMessages((prev) => [...prev, message])
  }

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Select a channel to start chatting</p>
      </div>
    )
  }

  return (
    <motion.div
      className="flex-1 flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      {/* Channel Header */}
      <motion.div
        className="border-b border-primary/20 p-4 bg-card/95 backdrop-blur-sm"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          #{channel.name}
        </h1>
        <p className="text-sm text-muted-foreground">{channel.description}</p>
      </motion.div>

      {/* Messages List */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} channelId={channelId} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <TypingIndicator typingUsers={typingUsers} />
      )}

      {/* Message Input */}
      <motion.div
        className="border-t border-primary/20 p-4 bg-card/95 backdrop-blur-sm"
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

