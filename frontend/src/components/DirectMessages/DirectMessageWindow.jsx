/**
 * Direct Message Window Component
 * 
 * Why: Main interface for direct messaging between users
 * How: Combines MessageList and MessageInput for direct messages
 * Impact: Enables private messaging functionality
 */

import React, { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, User, Paperclip, Send, X } from "lucide-react"
import MessageList from "../Chat/MessageList"
import TypingIndicator from "../Chat/TypingIndicator"
import { useConversationMessages, useSendDirectMessage, useConversations, useConversation, directMessageKeys } from "../../hooks/useDirectMessages"
import { useAuth } from "../../context/AuthContext"
import { getSocket } from "../../services/socket"
import { useUploadMultipleFiles } from "../../hooks/useFileUpload"
import { useUser } from "../../hooks/useUsers"
import { useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"

function DirectMessageWindow() {
  const { conversationId, userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { data: conversations = [] } = useConversations()
  
  // If userId is provided (new conversation), get or create conversation
  const { data: conversationByUser } = useConversation(userId)
  const conversation = conversationId 
    ? conversations.find(c => c._id === conversationId)
    : conversationByUser
  
  const activeConversationId = conversation?._id || conversationId
  
  // Get recipient user if userId provided (always call hook, but conditionally enabled)
  const { data: recipientUser } = useUser(userId)
  
  // Get recipient from conversation or from userId
  // Filter out current user from participants
  const recipient = conversation?.participants?.find(p => {
    const participantId = typeof p === 'object' ? p._id : p
    return participantId.toString() !== currentUser?._id?.toString()
  }) || recipientUser
  
  const { data: messagesData, isLoading: messagesLoading } = useConversationMessages(activeConversationId)
  const [typingUsers, setTypingUsers] = useState([])
  const sendDirectMessageMutation = useSendDirectMessage()
  const uploadFilesMutation = useUploadMultipleFiles()
  
  const [messageContent, setMessageContent] = useState("")
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const socket = getSocket()

  // Extract messages from infinite query data
  const messages = messagesData?.pages?.flatMap(page => page.messages || []) || []

  /**
   * Set up WebSocket listeners for direct messages
   * Why: Receive real-time direct message updates
   * How: Connects to socket and listens for direct message events
   * Impact: Real-time direct messaging
   */
  useEffect(() => {
    if (!activeConversationId) return

    const socket = getSocket()
    if (!socket) return

    // Listen for new direct messages
    const handleNewDirectMessage = (data) => {
      const message = data.message || data
      const messageConversationId = typeof message.conversation === 'object' 
        ? message.conversation._id || message.conversation 
        : message.conversation
      
      if (messageConversationId && activeConversationId && 
          messageConversationId.toString() === activeConversationId.toString()) {
        console.log('[DirectMessageWindow] New direct message received:', message)
        
        // Update cache for instant UI update
        queryClient.setQueryData(directMessageKeys.conversationMessages(activeConversationId), (oldData) => {
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
          
          // Add message to last page (newest messages are at the end)
          const lastPageIndex = oldData.pages.length - 1
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) => {
              if (index === lastPageIndex) {
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

    // Listen for typing indicators
    const handleTyping = (data) => {
      if (data.conversationId === activeConversationId) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username]
          }
          return prev
        })
      }
    }

    const handleTypingStop = (data) => {
      if (data.conversationId === activeConversationId) {
        setTypingUsers((prev) => prev.filter(u => u !== data.username))
      }
    }

    socket.on('new-direct-message', handleNewDirectMessage)
    socket.on('direct-message-typing', handleTyping)
    socket.on('direct-message-typing-stop', handleTypingStop)

    return () => {
      socket.off('new-direct-message', handleNewDirectMessage)
      socket.off('direct-message-typing', handleTyping)
      socket.off('direct-message-typing-stop', handleTypingStop)
    }
  }, [activeConversationId, queryClient])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const newFiles = files.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }))
    setSelectedFiles((prev) => [...prev, ...newFiles])
    e.target.value = null
  }

  const handleRemoveFile = (fileId) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter((f) => f.id !== fileId)
    })
  }

  const uploadFile = async (file) => {
    try {
      setUploadProgress((prev) => ({
        ...prev,
        [file.id]: 50,
      }))

      const uploadedFiles = await uploadFilesMutation.mutateAsync([file.file])
      const uploadedFile = uploadedFiles[0]

      setUploadProgress((prev) => ({
        ...prev,
        [file.id]: 100,
      }))

      return uploadedFile
    } catch (error) {
      console.error("[DirectMessageWindow] File upload error:", error)
      setUploadProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[file.id]
        return newProgress
      })
      throw error
    }
  }

  /**
   * Handle sending direct message
   * Why: Send message via WebSocket or API
   * How: Uses WebSocket if available, falls back to API
   * Impact: Message sent to recipient
   */
  const handleSendMessage = async () => {
    if (!messageContent.trim() && selectedFiles.length === 0) {
      return
    }
    
    const targetRecipientId = recipient?._id || userId
    if (!targetRecipientId) {
      setError("Recipient not found to send message.")
      return
    }

    setError("")

    try {
      let attachments = []
      if (selectedFiles.length > 0) {
        attachments = await Promise.all(selectedFiles.map(uploadFile))
      }

      // Create optimistic message
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        sender: {
          _id: currentUser._id,
          username: currentUser.username,
          email: currentUser.email,
          avatar: currentUser.avatar,
        },
        conversation: activeConversationId,
        content: messageContent.trim(),
        messageType: attachments.length > 0 ? "file" : "text",
        attachments: attachments.length > 0 ? attachments : undefined,
        timestamp: new Date(),
        createdAt: new Date(),
        isOptimistic: true,
      }

      // Optimistically update cache
      if (activeConversationId) {
        queryClient.setQueryData(directMessageKeys.conversationMessages(activeConversationId), (oldData) => {
          if (!oldData) return oldData
          
          const lastPageIndex = oldData.pages.length - 1
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) => {
              if (index === lastPageIndex) {
                return {
                  ...page,
                  messages: [...page.messages, optimisticMessage],
                }
              }
              return page
            }),
          }
        })
      }

      const messageData = {
        recipientId: targetRecipientId,
        content: messageContent.trim(),
        messageType: attachments.length > 0 ? "file" : "text",
        attachments: attachments.length > 0 ? attachments : undefined,
      }

      if (socket) {
        socket.emit('send-direct-message', messageData)
      } else {
        await sendDirectMessageMutation.mutateAsync(messageData)
      }

      setMessageContent("")
      setSelectedFiles([])
      setUploadProgress({})
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } catch (error) {
      console.error("[DirectMessageWindow] Send error:", error)
      setError(error.message || "Failed to send message. Please try again.")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }

  useEffect(() => {
    autoResizeTextarea()
  }, [messageContent])

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    )
  }

  if (!recipient && !userId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-destructive">Conversation not found</p>
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
      {/* Header - Fixed */}
      <motion.div
        className="border-b border-primary/20 p-4 bg-card/95 backdrop-blur-sm flex-shrink-0"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 hover:bg-primary/10 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
            <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-9 w-9">
              <AvatarImage src={recipient?.avatar} alt={recipient?.username} />
              <AvatarFallback>{recipient?.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {recipient?.username || "Loading..."}
              </h1>
              <p className="text-xs text-muted-foreground">
                {recipient?.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Messages List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : (
          <MessageList messages={messages} conversationId={activeConversationId} channelId={null} />
        )}
      </div>

      {/* Typing Indicator - Fixed above input */}
      {typingUsers.length > 0 && (
        <div className="flex-shrink-0">
          <TypingIndicator typingUsers={typingUsers} />
        </div>
      )}

      {/* Message Input - Fixed at bottom */}
      <motion.div
        className="border-t border-primary/20 p-2 sm:p-3 md:p-4 bg-card/95 backdrop-blur-sm flex-shrink-0"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -top-12 left-0 right-0 bg-destructive/10 text-destructive text-sm p-2 rounded-md border border-destructive/20 flex items-center justify-between"
            >
              <span>{error}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setError("")}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 p-2 border-b border-primary/20">
              <AnimatePresence>
                {selectedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative flex items-center gap-2 bg-muted/50 rounded-md pr-2 text-sm overflow-hidden"
                  >
                    {file.preview ? (
                      <img src={file.preview} alt={file.name} className="h-8 w-8 object-cover rounded-l-md" />
                    ) : (
                      <div className="h-8 w-8 flex items-center justify-center bg-primary/20 rounded-l-md">
                        <Paperclip className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="truncate max-w-[100px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {uploadProgress[file.id] !== undefined && uploadProgress[file.id] < 100 && (
                      <div
                        className="absolute inset-0 bg-primary/20"
                        style={{ width: `${uploadProgress[file.id]}%` }}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:bg-primary/10"
                  title="Attach files"
                >
                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <textarea
                  ref={textareaRef}
                  value={messageContent}
                  onChange={(e) => {
                    setMessageContent(e.target.value)
                    autoResizeTextarea()
                  }}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={`Message ${recipient?.username || "user"}`}
                  className="flex-1 resize-none overflow-hidden bg-background/50 border border-primary/20 rounded-lg py-2 px-3 sm:px-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all max-h-28 sm:max-h-32"
                  disabled={sendDirectMessageMutation.isPending || uploadFilesMutation.isPending}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  disabled={(!messageContent.trim() && selectedFiles.length === 0) || sendDirectMessageMutation.isPending || uploadFilesMutation.isPending}
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DirectMessageWindow

