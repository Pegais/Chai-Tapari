/**
 * Direct Message Window Component
 * 
 * Why: Main interface for direct messaging between users
 * How: Uses React Query for initial fetch, Zustand for real-time updates
 * Impact: Fast real-time messaging with persistent data fetching
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, User, Paperclip, Send, X } from "lucide-react"
import MessageList from "../Chat/MessageList"
import TypingIndicator from "../Chat/TypingIndicator"
import { useConversationMessages, useSendDirectMessage, useConversations, useConversation } from "../../hooks/useDirectMessages"
import { useAuth } from "../../context/AuthContext"
import { getSocket } from "../../services/socket"
import { useUploadMultipleFiles } from "../../hooks/useFileUpload"
import { useUser } from "../../hooks/useUsers"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import { extractUrls, createVideoEmbed, isVideoUrl } from "../../utils/videoUtils"
import { addToQueue, updateQueueStatus, removeFromQueue, getMessageByOptimisticId } from "../../services/indexedDBQueue"
import { useRestorePendingMessages } from "../../hooks/useMessageQueue"
import { useDirectMessageStore } from "../../stores/useDirectMessageStore"
import { useTypingStore } from "../../stores/useTypingStore"

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
  const sendDirectMessageMutation = useSendDirectMessage()
  const uploadFilesMutation = useUploadMultipleFiles()
  
  // Get Zustand store conversation messages (object, not array)
  const conversationMessages = useDirectMessageStore((state) => state.messages[activeConversationId])
  
  // Get typing users from Zustand
  const typingUsersSet = useTypingStore((state) => state.typingUsers.get(activeConversationId))
  
  const typingUsers = useMemo(() => {
    return typingUsersSet ? Array.from(typingUsersSet) : []
  }, [typingUsersSet])
  
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

  // Extract initial messages from React Query
  const initialMessages = useMemo(() => {
    return messagesData?.pages?.flatMap(page => page.messages || []) || []
  }, [messagesData])

  // Merge React Query + Zustand messages and sort (in component, NOT in selector)
  const messages = useMemo(() => {
    if (!activeConversationId) return []
    
    const messageMap = new Map()
    const deletedIds = new Set()
    
    // First pass: collect all deleted IDs from Zustand
    if (conversationMessages) {
      Object.values(conversationMessages).forEach(msg => {
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
    if (conversationMessages) {
      Object.values(conversationMessages).forEach(msg => {
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
  }, [activeConversationId, initialMessages, conversationMessages])
  
  // Use ref for conversation ID to avoid stale closures
  const activeConversationIdRef = useRef(activeConversationId)
  activeConversationIdRef.current = activeConversationId

  // Restore pending messages from IndexedDB queue on mount
  useRestorePendingMessages(null, activeConversationId)

  /**
   * Set up WebSocket listeners for direct messages
   * Uses refs and getState() to avoid infinite re-renders
   */
  useEffect(() => {
    if (!activeConversationId) return

    const socket = getSocket()
    if (!socket) return

    // Get store actions directly (not from hooks)
    const { mergeMessage, updateMessage, deleteMessage } = useDirectMessageStore.getState()
    const { addTypingUser, removeTypingUser } = useTypingStore.getState()

    // Join conversation room
    socket.emit('join-conversation', activeConversationId)

    // Handler for new direct messages
    const handleNewDirectMessage = (data) => {
      const message = data.message || data
      if (!message) return
      
      const messageConversationId = typeof message.conversation === 'object' 
        ? message.conversation._id || message.conversation 
        : message.conversation
      
      if (messageConversationId?.toString() === activeConversationIdRef.current?.toString()) {
        // First, find and replace any matching optimistic message
        const state = useDirectMessageStore.getState()
        const msgs = state.messages[activeConversationIdRef.current] || {}
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
          const { replaceOptimistic } = useDirectMessageStore.getState()
          const tempId = optimistic._id || optimistic.id
          replaceOptimistic(activeConversationIdRef.current, tempId, { ...message, status: 'sent' })
          
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
          mergeMessage(activeConversationIdRef.current, { ...message, status: message.status || 'sent' })
        }
      }
    }

    // Handler for typing
    const handleTyping = (data) => {
      const convId = data.conversationId || data.conversation
      if (convId?.toString() === activeConversationIdRef.current?.toString() && data.username) {
        addTypingUser(activeConversationIdRef.current, data.username)
        setTimeout(() => {
          removeTypingUser(activeConversationIdRef.current, data.username)
        }, 3000)
      }
    }

    const handleTypingStop = (data) => {
      const convId = data.conversationId || data.conversation
      if (convId?.toString() === activeConversationIdRef.current?.toString() && data.username) {
        removeTypingUser(activeConversationIdRef.current, data.username)
      }
    }

    // Handler for status updates
    const handleMessageStatusUpdate = (data) => {
      const { messageId, status } = data
      if (messageId && activeConversationIdRef.current) {
        updateMessage(activeConversationIdRef.current, messageId, { status })
      }
    }

    // Handler for message edits
    const handleMessageEdited = (data) => {
      const message = data.message || data
      if (!message) return
      
      const messageConversationId = typeof message.conversation === 'object' 
        ? message.conversation._id || message.conversation 
        : message.conversation
      
      const msgId = message._id || message.id
      if (messageConversationId?.toString() === activeConversationIdRef.current?.toString() && msgId) {
        updateMessage(activeConversationIdRef.current, msgId, message)
      }
    }

    // Handler for message deletes
    const handleMessageDeleted = (data) => {
      const { messageId, conversationId } = data
      if (!messageId) return
      
      const shouldUpdate = !conversationId || 
        String(conversationId) === String(activeConversationIdRef.current)
      
      if (shouldUpdate && activeConversationIdRef.current) {
        deleteMessage(activeConversationIdRef.current, messageId)
      }
    }

    // Handler for message sent confirmation
    const handleDirectMessageSent = (data) => {
      const message = data.message || data
      if (!message?._id) return
      
      const messageConversationId = typeof message.conversation === 'object' 
        ? message.conversation._id || message.conversation 
        : message.conversation
      
      if (messageConversationId?.toString() === activeConversationIdRef.current?.toString()) {
        // Find and replace optimistic message with the confirmed one
        const state = useDirectMessageStore.getState()
        const msgs = state.messages[activeConversationIdRef.current] || {}
        const senderId = message.sender?._id || message.sender
        
        // Find optimistic message by matching content and sender
        const optimistic = Object.values(msgs).find(m => {
          if (!m.isOptimistic) return false
          if (!String(m._id || m.id || '').startsWith('temp-')) return false
          if (m.content !== message.content) return false
          
          const optSenderId = m.sender?._id || m.sender
          return String(optSenderId) === String(senderId)
        })
        
        if (optimistic) {
          // Replace optimistic with confirmed message
          const { replaceOptimistic } = useDirectMessageStore.getState()
          const tempId = optimistic._id || optimistic.id
          replaceOptimistic(activeConversationIdRef.current, tempId, { ...message, status: 'sent' })
          
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
          // No optimistic found - just merge (shouldn't happen normally)
          mergeMessage(activeConversationIdRef.current, { ...message, status: 'sent' })
        }
      }
    }

    // Attach listeners
    socket.on('new-direct-message', handleNewDirectMessage)
    socket.on('direct-message-sent', handleDirectMessageSent)
    socket.on('direct-message-typing', handleTyping)
    socket.on('direct-message-typing-stop', handleTypingStop)
    socket.on('message-status-update', handleMessageStatusUpdate)
    socket.on('message-edited', handleMessageEdited)
    socket.on('message-deleted', handleMessageDeleted)

    // Cleanup
    return () => {
      socket.off('new-direct-message', handleNewDirectMessage)
      socket.off('direct-message-sent', handleDirectMessageSent)
      socket.off('direct-message-typing', handleTyping)
      socket.off('direct-message-typing-stop', handleTypingStop)
      socket.off('message-status-update', handleMessageStatusUpdate)
      socket.off('message-edited', handleMessageEdited)
      socket.off('message-deleted', handleMessageDeleted)
      socket.emit('leave-conversation', activeConversationId)
    }
  }, [activeConversationId]) // Only activeConversationId - no function dependencies

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
        return null
      }

      // File upload error - error will be shown via UI state
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

        // Optimistically add to Zustand store
        if (activeConversationId) {
          useDirectMessageStore.getState().mergeMessage(activeConversationId, optimisticTextMessage)
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

      // Prepare message data
      const messageData = {
        recipientId: targetRecipientId,
        content: textContent || "",
        messageType: attachments.length > 0 ? "file" : (videoEmbed ? "video" : "text"),
        attachments: attachments.length > 0 ? attachments : undefined,
        videoEmbed: videoEmbed || undefined,
      }

      // Create optimistic message with unique ID
      const optimisticMessageId = `temp-${Date.now()}-${Math.random()}`
      
      /**
       * Generate Client Message ID (Idempotency Key)
       * Why: Prevent duplicate messages on network retries
       * How: Unique ID sent with message, server uses for atomic upsert
       * Impact: Guarantees exactly-once delivery even with retries
       */
      const clientMessageId = `${currentUser._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Add message to IndexedDB queue BEFORE sending
      let queueId = null
      try {
        queueId = await addToQueue({
          recipientId: targetRecipientId,
          conversationId: activeConversationId,
          sender: {
            _id: currentUser._id,
            username: currentUser.username,
            email: currentUser.email,
            avatar: currentUser.avatar,
          },
          clientMessageId, // Include idempotency key in queue
          ...messageData,
        }, 'direct', optimisticMessageId)
      } catch (queueError) {
        console.error('[DirectMessageWindow] Error adding to queue:', queueError)
      }

      const optimisticMessage = {
        _id: optimisticMessageId,
        clientMessageId, // Include for tracking
        sender: {
          _id: currentUser._id,
          username: currentUser.username,
          email: currentUser.email,
          avatar: currentUser.avatar,
        },
        conversation: activeConversationId,
        content: textContent || "",
        messageType: messageData.messageType,
        attachments: attachments.length > 0 ? attachments : undefined,
        videoEmbed: videoEmbed || undefined,
        timestamp: new Date(),
        createdAt: new Date(),
        isOptimistic: true,
        status: 'pending',
        queueId: queueId,
      }

      // Optimistically add to Zustand store
      if (activeConversationId) {
        useDirectMessageStore.getState().mergeMessage(activeConversationId, optimisticMessage)
      }

      // Send message with timeout and error handling (includes idempotency key)
      const sendPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message send timeout. Please check your connection.'))
        }, 10000)

        if (socket && socket.connected) {
          try {
            socket.emit('send-direct-message', {
              ...messageData,
              clientMessageId, // Idempotency key for exactly-once delivery
            })
            setTimeout(() => {
              clearTimeout(timeout)
              resolve()
            }, 1000)
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        } else {
          clearTimeout(timeout)
          sendDirectMessageMutation.mutateAsync({
            ...messageData,
            clientMessageId, // Include idempotency key
          })
            .then(() => resolve())
            .catch((error) => reject(error))
        }
      })

      try {
        await sendPromise
        
        // Update queue status
        if (queueId) {
          await updateQueueStatus(queueId, 'sending')
        }

        // Update message status in Zustand store
        if (activeConversationId) {
          useDirectMessageStore.getState().updateMessage(activeConversationId, optimisticMessageId, { status: 'sending', queueId })
        }

        setMessageContent("")
        setSelectedFiles([])
        setUploadProgress({})
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto"
        }
      } catch (sendError) {
        // Mark as failed in queue
        if (queueId) {
          await updateQueueStatus(queueId, 'failed', sendError.message)
        }

        // Mark as failed in Zustand store
        if (activeConversationId) {
          useDirectMessageStore.getState().updateMessage(activeConversationId, optimisticMessageId, { 
            status: 'failed', 
            error: sendError.message, 
            queueId 
          })
        }
        
        throw sendError
      }
    } catch (error) {
      console.error("[DirectMessageWindow] Send error:", error)
      
      // Handle rate limit errors specifically
      if (error.status === 429 || error.error === 'RATE_LIMIT_EXCEEDED') {
        const retryAfter = error.retryAfter || 1
        setError(`Too many messages. Please wait ${retryAfter} minute${retryAfter > 1 ? 's' : ''} before sending more.`)
      } else {
        setError(error.message || "Failed to send message. Please try again.")
      }
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
          
          {/* Privacy Notice */}
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

