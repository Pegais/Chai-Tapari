/**
 * Direct Message Window Component
 * 
 * Why: Main interface for direct messaging between users
 * How: Combines MessageList and MessageInput for direct messages
 * Impact: Enables private messaging functionality
 */

import React, { useState, useEffect, useRef, useCallback } from "react"
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
import { extractUrls, createVideoEmbed, isVideoUrl } from "../../utils/videoUtils"

// Debounce utility for typing indicator
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

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
  const typingStopTimeoutRef = useRef(null)
  const uploadAbortControllers = useRef({}) // Track abort controllers for each file
  const uploadIntervals = useRef({}) // Track progress intervals for each file

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
          
          if (messageExists) {
        // Replace optimistic message with real message
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            messages: page.messages.map(msg => {
              const msgId = msg._id || msg
              const newMsgId = message._id || message
              const senderId = msg.sender?._id || msg.sender
              const newSenderId = message.sender?._id || message.sender
              // Replace optimistic message with real one
              if (msg.isOptimistic && msg.content === message.content && senderId === newSenderId) {
                return message
              }
              // Update if same ID
              if (msgId === newMsgId) {
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
      const messageConversationId = data.conversationId || data.conversation
      if (messageConversationId && activeConversationId && 
          messageConversationId.toString() === activeConversationId.toString()) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username]
          }
          return prev
        })
        
        // Auto-remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter(u => u !== data.username))
        }, 3000)
      }
    }

    const handleTypingStop = (data) => {
      const messageConversationId = data.conversationId || data.conversation
      if (messageConversationId && activeConversationId && 
          messageConversationId.toString() === activeConversationId.toString()) {
        setTypingUsers((prev) => prev.filter(u => u !== data.username))
      }
    }

    // Listen for message status updates
    const handleMessageStatusUpdate = (data) => {
      const { messageId, status } = data
      const { directMessageKeys } = require('../../hooks/useDirectMessages')
      queryClient.setQueryData(directMessageKeys.conversationMessages(activeConversationId), (oldData) => {
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

    // Listen for message edits in direct messages
    const handleMessageEdited = (data) => {
      const message = data.message || data
      if (!message || !message._id) return
      
      const messageConversationId = typeof message.conversation === 'object' 
        ? message.conversation._id || message.conversation 
        : message.conversation
      
      // Update if this message belongs to the active conversation
      if (messageConversationId && activeConversationId && 
          messageConversationId.toString() === activeConversationId.toString()) {
        console.log('[DirectMessageWindow] Message edited:', message)
        queryClient.setQueryData(directMessageKeys.conversationMessages(activeConversationId), (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              messages: page.messages.map(msg => {
                // Replace optimistic message or update existing
                if (msg._id === message._id) {
                  return message
                }
                // Replace optimistic message with same content
                if (msg.isOptimistic && msg.content === message.content) {
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
        })
      }
    }

    // Listen for message deletes in direct messages
    const handleMessageDeleted = (data) => {
      const { messageId, conversationId } = data
      const targetConversationId = conversationId || activeConversationId
      
      if (!targetConversationId) return
      
      // Check if this is for the active conversation
      if (targetConversationId.toString() === activeConversationId?.toString()) {
        queryClient.setQueryData(directMessageKeys.conversationMessages(activeConversationId), (oldData) => {
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

    socket.on('new-direct-message', handleNewDirectMessage)
    socket.on('direct-message-typing', handleTyping)
    socket.on('direct-message-typing-stop', handleTypingStop)
    socket.on('message-status-update', handleMessageStatusUpdate)
    socket.on('message-edited', handleMessageEdited)
    socket.on('message-deleted', handleMessageDeleted)

    return () => {
      socket.off('new-direct-message', handleNewDirectMessage)
      socket.off('direct-message-typing', handleTyping)
      socket.off('direct-message-typing-stop', handleTypingStop)
      socket.off('message-status-update', handleMessageStatusUpdate)
      socket.off('message-edited', handleMessageEdited)
      socket.off('message-deleted', handleMessageDeleted)
    }
  }, [activeConversationId, queryClient, recipient, userId])

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

  /**
   * Cancel file upload
   * Why: Allow users to cancel ongoing uploads
   * How: Aborts the upload request and cleans up
   * Impact: Users can stop unwanted uploads
   */
  const cancelFileUpload = (fileId) => {
    // Abort the upload request if it exists
    if (uploadAbortControllers.current[fileId]) {
      uploadAbortControllers.current[fileId].abort()
      delete uploadAbortControllers.current[fileId]
    }

    // Clear progress interval
    if (uploadIntervals.current[fileId]) {
      clearInterval(uploadIntervals.current[fileId])
      delete uploadIntervals.current[fileId]
    }

    // Remove file from selected files
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== fileId)
    })

    // Clear progress
    setUploadProgress((prev) => {
      const newProgress = { ...prev }
      delete newProgress[fileId]
      return newProgress
    })
  }

  const uploadFile = async (file) => {
    // Create abort controller for this upload
    const abortController = new AbortController()
    uploadAbortControllers.current[file.id] = abortController

    try {
      // Simulate progress for better UX
      setUploadProgress((prev) => ({
        ...prev,
        [file.id]: 10,
      }))

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        // Check if upload was cancelled
        if (abortController.signal.aborted) {
          clearInterval(progressInterval)
          return
        }

        setUploadProgress((prev) => {
          const current = prev[file.id] || 10
          if (current < 90) {
            return {
              ...prev,
              [file.id]: Math.min(current + 10, 90),
            }
          }
          return prev
        })
      }, 200)

      uploadIntervals.current[file.id] = progressInterval

      // Upload file with abort signal
      const uploadedFiles = await uploadFilesMutation.mutateAsync({
        files: [file.file],
        signal: abortController.signal,
      })
      const uploadedFile = uploadedFiles[0]

      // Clean up
      clearInterval(progressInterval)
      delete uploadIntervals.current[file.id]
      delete uploadAbortControllers.current[file.id]

      setUploadProgress((prev) => ({
        ...prev,
        [file.id]: 100,
      }))

      // Keep progress at 100% briefly before clearing
      setTimeout(() => {
        setUploadProgress((prev) => {
          const newProgress = { ...prev }
          delete newProgress[file.id]
          return newProgress
        })
      }, 500)

      return uploadedFile
    } catch (error) {
      // Clean up on error
      if (uploadIntervals.current[file.id]) {
        clearInterval(uploadIntervals.current[file.id])
        delete uploadIntervals.current[file.id]
      }
      delete uploadAbortControllers.current[file.id]

      // Don't show error if it was cancelled
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        console.log("[DirectMessageWindow] File upload cancelled:", file.name)
        return null
      }

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
      const textContent = messageContent.trim()
      const hasFiles = selectedFiles.length > 0

      // Detect video URLs FIRST before creating optimistic message
      const { extractUrls, createVideoEmbed, isVideoUrl } = require("../../utils/videoUtils")
      let videoEmbed = null
      const urls = extractUrls(textContent)
      if (urls.length > 0) {
        const firstUrl = urls[0]
        if (isVideoUrl(firstUrl)) {
          videoEmbed = createVideoEmbed(firstUrl)
        }
      }

      // Handle file uploads - send text immediately if both text and files exist
      if (textContent && hasFiles) {
        // Send text message immediately
        const textMessageData = {
          recipientId: targetRecipientId,
          content: textContent,
          messageType: videoEmbed ? "video" : "text",
          videoEmbed: videoEmbed || undefined,
        }

        // Create optimistic message for text
        const optimisticTextMessage = {
          _id: `temp-${Date.now()}`,
          sender: {
            _id: currentUser._id,
            username: currentUser.username,
            email: currentUser.email,
            avatar: currentUser.avatar,
          },
          conversation: activeConversationId,
          content: textContent,
          messageType: textMessageData.messageType,
          videoEmbed: videoEmbed || undefined,
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
                    messages: [...page.messages, optimisticTextMessage],
                  }
                }
                return page
              }),
            }
          })
        }

        // Send text message immediately
        if (socket) {
          socket.emit('send-direct-message', textMessageData)
        } else {
          await sendDirectMessageMutation.mutateAsync(textMessageData)
        }

        // Upload files in background and send as separate message
        Promise.all(selectedFiles.map(uploadFile))
          .then((uploadedFiles) => {
            const fileMessageData = {
              recipientId: targetRecipientId,
              content: "",
              messageType: "file",
              attachments: uploadedFiles,
            }

            if (socket) {
              socket.emit('send-direct-message', fileMessageData)
            } else {
              sendDirectMessageMutation.mutateAsync(fileMessageData)
            }
          })
          .catch((error) => {
            console.error('[DirectMessageWindow] File upload error:', error)
            setError("Some files failed to upload")
          })

        // Reset form
        setMessageContent("")
        setSelectedFiles([])
        setUploadProgress({})
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto"
        }
        return
      }

      // Handle normal case: only text or only files
      let attachments = []
      if (hasFiles) {
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
        content: textContent || "",
        messageType: attachments.length > 0 ? "file" : (videoEmbed ? "video" : "text"),
        attachments: attachments.length > 0 ? attachments : undefined,
        videoEmbed: videoEmbed || undefined,
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
        content: textContent || "",
        messageType: attachments.length > 0 ? "file" : (videoEmbed ? "video" : "text"),
        attachments: attachments.length > 0 ? attachments : undefined,
        videoEmbed: videoEmbed || undefined,
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

  /**
   * Handle typing indicator for direct messages
   * Why: Show recipient when sender is typing
   * How: Emits typing event via WebSocket
   * Impact: Better real-time communication feedback
   */
  const emitTyping = useCallback(() => {
    if (!socket || !activeConversationId) return
    
    const targetRecipientId = recipient?._id || userId
    if (!targetRecipientId) return
    
    // Clear any existing stop timeout
    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current)
      typingStopTimeoutRef.current = null
    }
    
    // Emit typing start
    socket.emit('direct-message-typing', {
      conversationId: activeConversationId,
      recipientId: targetRecipientId,
    })
    
    // Set stop timeout
    typingStopTimeoutRef.current = setTimeout(() => {
      if (socket && activeConversationId) {
        socket.emit('direct-message-typing-stop', {
          conversationId: activeConversationId,
          recipientId: targetRecipientId,
        })
      }
    }, 3000)
  }, [socket, activeConversationId, recipient, userId])

  // Debounced typing indicator
  const debouncedEmitTyping = useCallback(
    debounce(emitTyping, 300),
    [emitTyping]
  )

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // Clear typing indicator
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current)
        typingStopTimeoutRef.current = null
      }
      if (socket && activeConversationId) {
        socket.emit('direct-message-typing-stop', {
          conversationId: activeConversationId,
          recipientId: recipient?._id || userId,
        })
      }
      handleSendMessage()
    }
  }

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }

  const handleInputChange = (e) => {
    setMessageContent(e.target.value)
    autoResizeTextarea()
    if (e.target.value.trim()) {
      debouncedEmitTyping()
    } else {
      // Clear typing immediately if input is empty
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current)
        typingStopTimeoutRef.current = null
      }
      if (socket && activeConversationId) {
        socket.emit('direct-message-typing-stop', {
          conversationId: activeConversationId,
          recipientId: recipient?._id || userId,
        })
      }
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
                {selectedFiles.map((file) => {
                  const progress = uploadProgress[file.id] || 0
                  const isUploading = progress > 0 && progress < 100
                  const isUploaded = progress === 100

                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative flex items-center gap-2 bg-muted/50 rounded-md pr-2 text-sm overflow-hidden group"
                    >
                      {file.preview ? (
                        <img src={file.preview} alt={file.name} className="h-8 w-8 object-cover rounded-l-md" />
                      ) : (
                        <div className="h-8 w-8 flex items-center justify-center bg-primary/20 rounded-l-md">
                          <Paperclip className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      {isUploading && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(progress)}%
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 text-muted-foreground hover:text-destructive transition-opacity ${
                          isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={() => {
                          if (isUploading) {
                            cancelFileUpload(file.id)
                          } else {
                            handleRemoveFile(file.id)
                          }
                        }}
                        title={isUploading ? "Cancel upload" : "Remove file"}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {isUploading && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20"
                        >
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
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
                  onChange={handleInputChange}
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

