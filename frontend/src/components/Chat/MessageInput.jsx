/**
 * Message Input Component
 * 
 * Why: Text input area for sending messages with file upload support
 * How: Textarea with send button, file upload, debounced typing indicator
 * Impact: Primary interface for user message creation
 */

import React, { useState, useRef, useCallback } from "react"
import { Button } from "../ui/button"
import { Paperclip, Send, X } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useUploadMultipleFiles } from "../../hooks/useFileUpload"
import { useCreateMessage, messageKeys } from "../../hooks/useMessages"
import { getSocket } from "../../services/socket"
import { useQueryClient } from "@tanstack/react-query"

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
  const queryClient = useQueryClient()
  const uploadFiles = useUploadMultipleFiles()
  const createMessage = useCreateMessage()
  const [message, setMessage] = useState("")
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const socket = getSocket()

  /**
   * Handle typing indicator
   * Why: Show other users when someone is typing
   * How: Emits typing event via WebSocket, clears after delay
   * Impact: Better real-time communication feedback
   */
  const emitTyping = useCallback(
    debounce(() => {
      if (socket && channelId) {
        socket.emit('typing-start', channelId)
        
        // Stop typing after 2 seconds
        setTimeout(() => {
          if (socket) {
            socket.emit('typing-stop', channelId)
          }
        }, 2000)
      }
    }, 500),
    [channelId, socket]
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
      emitTyping()
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
   * Handle file upload
   * Why: Upload files to storage before sending message
   * How: Uploads files to S3 via API, tracks progress
   * Impact: Files stored and accessible in messages
   */
  const uploadFile = async (file) => {
    try {
      setUploadProgress((prev) => ({
        ...prev,
        [file.id]: 50, // Show progress
      }))

      const files = await uploadFiles.mutateAsync([file.file])
      const uploadedFile = files[0]

      setUploadProgress((prev) => ({
        ...prev,
        [file.id]: 100,
      }))

      return uploadedFile
    } catch (error) {
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

    try {
      // Upload files if any
      let attachments = []
      if (selectedFiles.length > 0) {
        attachments = await Promise.all(selectedFiles.map(uploadFile))
      }

      // Prepare message data
      const messageData = {
        content: message.trim(),
        messageType: attachments.length > 0 ? "file" : "text",
        attachments: attachments.length > 0 ? attachments : undefined,
      }

      // Create optimistic message for instant UI update
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        sender: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
        channel: channelId,
        content: message.trim(),
        messageType: attachments.length > 0 ? "file" : "text",
        attachments: attachments.length > 0 ? attachments : undefined,
        timestamp: new Date(),
        createdAt: new Date(),
        isOptimistic: true, // Flag to identify optimistic messages
      }

      // Optimistically update the cache immediately
      // Messages are in chronological order (oldest first), so add new message at the end
      queryClient.setQueryData(messageKeys.list(channelId), (oldData) => {
        if (!oldData) return oldData
        
        // Get the last page (newest messages)
        const lastPageIndex = oldData.pages.length - 1
        const lastPage = oldData.pages[lastPageIndex]
        
        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === lastPageIndex) {
              // Add to end of last page (newest messages are at the end)
              return {
                ...page,
                messages: [...page.messages, optimisticMessage],
              }
            }
            return page
          }),
        }
      })

      // Send message via WebSocket (preferred for real-time)
      if (socket) {
        socket.emit('send-message', {
          channelId,
          ...messageData,
        })
      } else {
        // Fallback to REST API
        await createMessage.mutateAsync({
          channelId,
          messageData,
        })
      }

      // Call callback if provided
      if (onMessageSent) {
        onMessageSent(optimisticMessage)
      }

      // Reset form
      setMessage("")
      setSelectedFiles([])
      setUploadProgress({})
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } catch (error) {
      console.error("[MessageInput] Send error:", error)
      setError(error.message || "Failed to send message. Please try again.")
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
      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {selectedFiles.map((file) => (
            <div key={file.id} className="relative">
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="h-20 w-20 object-cover rounded border"
                />
              ) : (
                <div className="h-20 w-20 bg-muted rounded border flex items-center justify-center text-xs p-2">
                  {file.name}
                </div>
              )}
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5"
                onClick={() => handleRemoveFile(file.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              {uploadProgress[file.id] && uploadProgress[file.id] < 100 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center">
                  {uploadProgress[file.id]}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
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
          className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() && selectedFiles.length === 0}
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default MessageInput

