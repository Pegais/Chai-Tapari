/**
 * Message Input Component
 * 
 * Why: Text input area for sending messages with file upload support
 * How: Textarea with send button, file upload, debounced typing indicator
 * Impact: Primary interface for user message creation
 */

import React, { useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"
import { Paperclip, Send, X, Check } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useUploadMultipleFiles } from "../../hooks/useFileUpload"
import { useCreateMessage } from "../../hooks/useMessages"
import { getSocket } from "../../services/socket"
import { extractUrls, createVideoEmbed, isVideoUrl } from "../../utils/videoUtils"
import { addToQueue, updateQueueStatus, removeFromQueue, getMessageByOptimisticId } from "../../services/indexedDBQueue"
import { useMessageStore } from "../../stores/useMessageStore"

// Debounce utility function
// Why: Prevent excessive API calls during rapid typing
// How: Delays function execution until user stops typing
// Impact: Reduces server load and improves performance
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

function MessageInput({ channelId, onMessageSent }) {
  const { user } = useAuth()
  const uploadFiles = useUploadMultipleFiles()
  const createMessage = useCreateMessage()
  
  // Note: Using getState() directly for store actions to avoid re-render loops
  const [message, setMessage] = useState("")
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const socket = getSocket()

  // Typing timeout ref to clear when user stops typing
  const typingTimeoutRef = useRef(null)
  const typingStopTimeoutRef = useRef(null)
  const uploadAbortControllers = useRef({}) // Track abort controllers for each file
  const uploadIntervals = useRef({}) // Track progress intervals for each file

  /**
   * Handle typing indicator
   * Why: Show other users when someone is typing
   * How: Emits typing event via WebSocket, clears after delay
   * Impact: Better real-time communication feedback
   */
  const emitTyping = useCallback(() => {
    if (!socket || !channelId) return
    
    // Clear any existing stop timeout
    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current)
      typingStopTimeoutRef.current = null
    }
    
    // Emit typing start immediately (no debounce for start)
    socket.emit('typing-start', channelId)
    
    // Set stop timeout - will be cleared if user continues typing
    typingStopTimeoutRef.current = setTimeout(() => {
      if (socket && channelId) {
        socket.emit('typing-stop', channelId)
      }
    }, 3000) // 3 seconds of inactivity
  }, [channelId, socket])

  // Debounced version for input changes
  const debouncedEmitTyping = useCallback(
    debounce(emitTyping, 300),
    [emitTyping]
  )

  /**
   * Handle message input change
   * Why: Update message state and trigger typing indicator
   * How: Updates state, calls debounced typing function
   * Impact: Real-time typing feedback for other users
   */
  const handleInputChange = (e) => {
    setMessage(e.target.value)
    if (e.target.value.trim()) {
      debouncedEmitTyping()
    } else {
      // Clear typing immediately if input is empty
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current)
        typingStopTimeoutRef.current = null
      }
      if (socket && channelId) {
        socket.emit('typing-stop', channelId)
      }
    }
  }

  /**
   * Handle file selection
   * Why: Allow users to attach files to messages
   * How: Reads selected files, creates preview objects
   * Impact: Rich message content with file sharing
   */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const newFiles = files.map((file) => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }))
    setSelectedFiles((prev) => [...prev, ...newFiles])
  }

  /**
   * Remove selected file
   * Why: Allow users to remove files before sending
   * How: Filters out file from selectedFiles array
   * Impact: Better file management before message send
   */
  const handleRemoveFile = (fileId) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
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

  /**
   * Handle file upload
   * Why: Upload files to storage before sending message
   * How: Uploads files to S3 via API, tracks progress with better granularity
   * Impact: Files stored and accessible in messages with smooth progress feedback
   */
  const uploadFile = async (file) => {
    // Create abort controller for this upload
    const abortController = new AbortController()
    uploadAbortControllers.current[file.id] = abortController

    try {
      // Simulate progress for better UX (actual progress would come from axios onUploadProgress)
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
      const files = await uploadFiles.mutateAsync({
        files: [file.file],
        signal: abortController.signal,
      })
      const uploadedFile = files[0]

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
        console.log("[MessageInput] File upload cancelled:", file.name)
        return null
      }

      console.error("[MessageInput] File upload error:", error)
      setUploadProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[file.id]
        return newProgress
      })
      throw error
    }
  }

  /**
   * Handle message send
   * Why: Send message to channel
   * How: Validates input, uploads files, creates message via API/WebSocket
   * Impact: Message appears in chat for all channel members
   */
  const handleSend = async () => {
    if (!message.trim() && selectedFiles.length === 0) {
      return
    }

    setError("")

    // Clear typing indicator immediately
    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current)
      typingStopTimeoutRef.current = null
    }
    if (socket && channelId) {
      socket.emit('typing-stop', channelId)
    }

    const textContent = message.trim()
    const hasFiles = selectedFiles.length > 0

    try {
      // Detect video URLs and create video embed
      let videoEmbed = null
      const urls = extractUrls(textContent)
      if (urls.length > 0) {
        const firstUrl = urls[0]
        if (isVideoUrl(firstUrl)) {
          videoEmbed = createVideoEmbed(firstUrl)
        }
      }

      // If we have both text and files, send text immediately, files async
      if (textContent && hasFiles) {
        // Send text message immediately
        const textMessageData = {
          content: textContent,
          messageType: videoEmbed ? "video" : "text",
          videoEmbed: videoEmbed || undefined,
        }

        // Create optimistic message for text
        const optimisticTextMessage = {
          _id: `temp-${Date.now()}`,
          sender: {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
          },
          channel: channelId,
          content: textContent,
          messageType: textMessageData.messageType,
          videoEmbed: videoEmbed || undefined,
          timestamp: new Date(),
          createdAt: new Date(),
          isOptimistic: true,
        }

        // Optimistically add to Zustand store
        if (channelId) {
          useMessageStore.getState().mergeMessage(channelId, optimisticTextMessage)
        }

        // Send text message via WebSocket immediately
        if (socket) {
          socket.emit('send-message', {
            channelId,
            ...textMessageData,
          })
        } else {
          await createMessage.mutateAsync({
            channelId,
            messageData: textMessageData,
          })
        }

        // Upload files in background and send as separate message
        if (hasFiles) {
          Promise.all(selectedFiles.map(uploadFile))
            .then((uploadedFiles) => {
              const fileMessageData = {
                content: "",
                messageType: "file",
                attachments: uploadedFiles,
              }

              if (socket) {
                socket.emit('send-message', {
                  channelId,
                  ...fileMessageData,
                })
              } else {
                createMessage.mutateAsync({
                  channelId,
                  messageData: fileMessageData,
                })
              }
            })
            .catch((error) => {
              console.error('[MessageInput] File upload error:', error)
              setError("Some files failed to upload")
            })
        }

        // Reset form
        setMessage("")
        setSelectedFiles([])
        setUploadProgress({})
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto"
        }
        return
      }

      // If only files or only text (no mix), handle normally
      let attachments = []
      if (hasFiles) {
        attachments = await Promise.all(selectedFiles.map(uploadFile))
      }

      // Prepare message data
      const messageData = {
        content: textContent || "",
        messageType: attachments.length > 0 ? "file" : (videoEmbed ? "video" : "text"),
        attachments: attachments.length > 0 ? attachments : undefined,
        videoEmbed: videoEmbed || undefined,
      }

      // Create optimistic message with status tracking
      const optimisticMessageId = `temp-${Date.now()}-${Math.random()}`
      
      /**
       * Generate Client Message ID (Idempotency Key)
       * Why: Prevent duplicate messages on network retries
       * How: Unique ID sent with message, server uses for atomic upsert
       * Impact: Guarantees exactly-once delivery even with retries
       */
      const clientMessageId = `${user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Add message to IndexedDB queue BEFORE sending (persistent storage)
      let queueId = null
      try {
        queueId = await addToQueue({
          channelId,
          sender: {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
          },
          clientMessageId, // Include idempotency key in queue
          ...messageData,
        }, 'channel', optimisticMessageId)
      } catch (queueError) {
        console.error('[MessageInput] Error adding to queue:', queueError)
        // Continue even if queue fails - message will still be sent
      }

      const optimisticMessage = {
        _id: optimisticMessageId,
        clientMessageId, // Include for tracking
        sender: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
        channel: channelId,
        content: textContent || "",
        messageType: messageData.messageType,
        attachments: attachments.length > 0 ? attachments : undefined,
        videoEmbed: videoEmbed || undefined,
        timestamp: new Date(),
        createdAt: new Date(),
        isOptimistic: true,
        status: 'pending',
        queueId: queueId, // Link queue ID for retry/delete
      }

      // Optimistically add to Zustand store immediately
      if (channelId) {
        useMessageStore.getState().mergeMessage(channelId, optimisticMessage)
      }

      // Send message with timeout and error handling
      const sendPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message send timeout. Please check your connection.'))
        }, 10000) // 10 second timeout

        if (socket && socket.connected) {
          // Send via WebSocket with error handling (includes idempotency key)
          try {
            socket.emit('send-message', {
              channelId,
              clientMessageId, // Idempotency key for exactly-once delivery
              ...messageData,
            })
            
            // Wait for confirmation or timeout
            setTimeout(() => {
              clearTimeout(timeout)
              // If no error received, assume success (will be confirmed by new-message event)
              resolve()
            }, 1000)
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        } else {
          // Fallback to REST API with timeout (includes idempotency key)
          clearTimeout(timeout)
          createMessage.mutateAsync({
            channelId,
            messageData: { ...messageData, clientMessageId },
          })
            .then(() => {
              resolve()
            })
            .catch((error) => {
              reject(error)
            })
        }
      })

      try {
        await sendPromise
        
        // Update message status to sending
        if (queueId) {
          await updateQueueStatus(queueId, 'sending')
        }
        
        // Update message status in Zustand store
        if (channelId) {
          useMessageStore.getState().updateMessage(channelId, optimisticMessageId, { status: 'sending', queueId })
        }

        // Reset form only after successful send initiation
        setMessage("")
        setSelectedFiles([])
        setUploadProgress({})
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto"
        }
      } catch (sendError) {
        // Mark message as failed in queue
        if (queueId) {
          await updateQueueStatus(queueId, 'failed', sendError.message)
        }
        
        // Mark message as failed in Zustand store and keep it visible
        if (channelId) {
          useMessageStore.getState().updateMessage(channelId, optimisticMessageId, { 
            status: 'failed', 
            error: sendError.message, 
            queueId 
          })
        }
        
        throw sendError // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("[MessageInput] Send error:", error)
      
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
   * Handle Enter key press
   * Why: Send message on Enter, new line on Shift+Enter
   * How: Checks for Shift key, sends or adds newline
   * Impact: Intuitive message sending behavior
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /**
   * Auto-resize textarea
   * Why: Better UX with expanding input area
   * How: Adjusts height based on content
   * Impact: More comfortable message composition
   */
  const handleTextareaResize = (e) => {
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="space-y-2">
      {/* File Previews with Progress */}
      {selectedFiles.length > 0 && (
        <div className="flex gap-2 flex-wrap p-2 bg-muted/30 rounded-lg border border-primary/10">
          {selectedFiles.map((file) => {
            const progress = uploadProgress[file.id] || 0
            const isUploading = progress > 0 && progress < 100
            const isUploaded = progress === 100
            
            return (
              <motion.div
                key={file.id}
                className="relative group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-background/50">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-20 w-20 object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 flex flex-col items-center justify-center text-xs p-2 bg-muted/50">
                      <Paperclip className="h-6 w-6 mb-1 text-muted-foreground" />
                      <span className="text-[10px] text-center truncate w-full px-1">{file.name}</span>
                    </div>
                  )}
                  
                  {/* Upload Progress Overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-16 h-16 relative">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-primary/20"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                            className="text-primary transition-all duration-300"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Complete Indicator */}
                  {isUploaded && !isUploading && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
                
                {/* Remove/Cancel Button */}
                <Button
                  size="icon"
                  variant="destructive"
                  className={`absolute -top-2 -right-2 h-6 w-6 transition-opacity shadow-lg ${
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
                
                {/* File Info */}
                <div className="mt-1 text-[10px] text-muted-foreground text-center max-w-[80px] truncate">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
        >
          <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onInput={handleTextareaResize}
          placeholder="Type a message..."
          className="flex-1 min-h-[40px] sm:min-h-[44px] max-h-[100px] sm:max-h-[120px] resize-none rounded-md border border-input bg-background px-2 sm:px-3 py-2 text-sm sm:text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() && selectedFiles.length === 0}
          title="Send message"
          size="icon"
          className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
        >
          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  )
}

export default MessageInput

