/**
 * Message Item Component
 * 
 * Why: Individual message display with sender info, content, and actions
 * How: Renders message content based on type (text, file, link, video) with edit/delete
 * Impact: Clear message presentation with rich content support
 */

import React, { useState, useRef, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { format } from "date-fns"
import { Edit2, Trash2, Check, CheckCheck, AlertCircle, RefreshCw } from "lucide-react"
import LinkPreview from "./LinkPreview"
import VideoEmbed from "./VideoEmbed"
import { useAuth } from "../../context/AuthContext"
import { useEditMessage, useDeleteMessage, messageKeys } from "../../hooks/useMessages"
import { getSocket } from "../../services/socket"
import { manualRetryMessage, deleteFailedMessage } from "../../services/messageRetryService"
import { directMessageKeys } from "../../hooks/useDirectMessages"
import { useMessageStore } from "../../stores/useMessageStore"
import { useDirectMessageStore } from "../../stores/useDirectMessageStore"

// Helper to get valid date from message
const getMessageTime = (msg) => {
  const timestamp = msg?.timestamp || msg?.createdAt
  if (!timestamp) return new Date()
  const date = new Date(timestamp)
  return isNaN(date.getTime()) ? new Date() : date
}

function MessageItem({ message, showAvatar, showTimestamp, channelId = null, conversationId = null }) {
  const { user } = useAuth()
  const editMessage = useEditMessage()
  const deleteMessage = useDeleteMessage()
  const socket = getSocket()
  
  // Get sender info from message (populated by backend)
  const sender = message.sender && typeof message.sender === 'object' 
    ? message.sender 
    : { _id: message.sender, username: 'Unknown', avatar: null }
  
  const isOwnMessage = user && (message.sender?._id || message.sender) === user._id
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  /**
   * Handle message edit
   * Why: Allow users to correct their messages
   * How: Toggles edit mode, updates message content
   * Impact: Better user experience with message correction
   */
  const handleEdit = () => {
    setIsEditing(true)
  }

  /**
   * Handle edit save
   * Why: Save edited message content
   * How: Optimistically updates UI, then sends to server
   * Impact: Message content updated immediately in UI
   */
  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      return
    }

    const messageId = message._id || message.id
    if (!messageId) return

    const updatedContent = editContent.trim()
    const updates = { 
      content: updatedContent, 
      isEdited: true,
      updatedAt: new Date().toISOString() 
    }

    // Optimistically update UI immediately
    if (channelId) {
      useMessageStore.getState().updateMessage(channelId, messageId, updates)
    } else if (conversationId) {
      useDirectMessageStore.getState().updateMessage(conversationId, messageId, updates)
    }

    setIsEditing(false)

    try {
      if (socket) {
        // Send via WebSocket for real-time update
        socket.emit('edit-message', {
          messageId,
          content: updatedContent,
        })
      } else {
        // Fallback to REST API
        await editMessage.mutateAsync({
          messageId,
          content: updatedContent,
        })
      }
    } catch (error) {
      console.error("[MessageItem] Edit error:", error)
    }
  }

  /**
   * Handle message delete
   * Why: Allow users to remove their messages
   * How: Calls API to soft-delete message
   * Impact: Message marked as deleted, hidden from view
   */
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return
    }

    const messageId = message._id || message.id
    if (!messageId) return

    // Optimistically update UI immediately
    if (channelId) {
      useMessageStore.getState().deleteMessage(channelId, messageId)
    } else if (conversationId) {
      useDirectMessageStore.getState().deleteMessage(conversationId, messageId)
    }

    try {
      if (socket) {
        // Send via WebSocket for real-time update
        socket.emit('delete-message', { messageId })
      } else {
        // Fallback to REST API
        await deleteMessage.mutateAsync(messageId)
      }
    } catch (error) {
      console.error("[MessageItem] Delete error:", error)
    }
  }

  if (message.isDeleted) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground italic text-sm">
        <span>This message was deleted</span>
      </div>
    )
  }

  return (
    <motion.div
      className={`flex gap-2 sm:gap-3 px-2 sm:px-4 py-2 hover:bg-accent/20 group ${isOwnMessage ? "flex-row-reverse" : ""}`}
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Avatar - shown only for first message in group */}
      {showAvatar && (
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
          <AvatarImage src={sender?.avatar || null} alt={sender?.username || 'User'} />
          <AvatarFallback className="text-xs sm:text-sm">{(sender?.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      
      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${!showAvatar ? "ml-9 sm:ml-11" : ""} ${isOwnMessage ? "items-end" : ""}`}>
        {/* Sender Name and Timestamp - shown only for first message */}
        {showAvatar && (
          <div className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
            <span className="font-semibold text-xs sm:text-sm">{sender?.username || 'Unknown User'}</span>
            {showTimestamp && (
              <span className="text-xs text-muted-foreground">
                {format(getMessageTime(message), "h:mm a")}
              </span>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div className={`flex items-start gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
          <motion.div
            className={`rounded-lg px-3 sm:px-4 py-2 max-w-[85%] sm:max-w-[70%] ${
              isOwnMessage
                ? message.status === 'failed' 
                  ? "bg-destructive/20 text-destructive border border-destructive/30"
                  : "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-muted/80 backdrop-blur-sm text-foreground border border-primary/10"
            }`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-transparent border-none outline-none resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Text Content */}
                {message.content && (
                  <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{message.content}</p>
                )}

                {/* Link Preview */}
                {message.linkPreview && (
                  <LinkPreview preview={message.linkPreview} />
                )}

                {/* Video Embed */}
                {message.videoEmbed && (
                  <VideoEmbed embed={message.videoEmbed} />
                )}

                {/* File Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((file, index) => (
                      <LazyImage
                        key={index}
                        file={file}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Action Buttons - shown on hover for own messages */}
          {isOwnMessage && !isEditing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleEdit}
                title="Edit message"
              >
                <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleDelete}
                title="Delete message"
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Message Metadata - Separate from message bubble */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwnMessage ? "justify-end" : "justify-start"} px-1`}>
          {showTimestamp && !showAvatar && (
            <span className="text-[10px] text-muted-foreground">
              {format(getMessageTime(message), "h:mm a")}
            </span>
          )}
          {message.editedAt && (
            <span className="text-[10px] text-muted-foreground opacity-70">(edited)</span>
          )}
          {isOwnMessage && (
            <MessageStatus 
              status={message.status || 'sent'} 
              message={message}
              channelId={channelId}
              conversationId={conversationId}
              onRetry={message.isOptimistic && message.status === 'failed' ? () => {
                // Retry logic will be handled by parent component
                console.log('[MessageItem] Retry message:', message._id)
              } : undefined}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Lazy Image Component
 * Why: Load images only when in viewport and fully loaded
 * How: Uses Intersection Observer and image load events
 * Impact: Better performance and user experience
 */
function LazyImage({ file, index }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '50px' } // Start loading 50px before entering viewport
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  if (file.fileType.startsWith("image/")) {
    return (
      <div ref={containerRef} className="rounded overflow-hidden relative">
        {!isLoaded && (
          <div className="w-full h-48 bg-muted/50 animate-pulse flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Loading image...</span>
          </div>
        )}
        {isInView && (
          <img
            ref={imgRef}
            src={file.thumbnailUrl || file.fileUrl}
            alt={file.fileName}
            className={`max-w-full h-auto rounded transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true)
              setIsLoaded(true)
            }}
            loading="lazy"
          />
        )}
        {hasError && (
          <div className="w-full h-48 bg-muted/50 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Failed to load image</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <a
      href={file.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 bg-background/50 rounded hover:bg-background/80"
    >
      <span className="text-sm">{file.fileName}</span>
      <span className="text-xs text-muted-foreground">
        {(file.fileSize / 1024).toFixed(1)} KB
      </span>
    </a>
  )
}

/**
 * Message Status Component
 * Why: Show message delivery status (sending, sent, delivered, read)
 * How: Displays single or double checkmark with color coding
 * Impact: Users know if their messages were seen
 * 
 * Status Icons:
 * - pending: Spinner (loading/queued)
 * - sending: Single tick (gray) - message is being sent
 * - sent: Double tick (gray) - message saved on server
 * - delivered: Double tick (gray) - delivered to recipient
 * - read: Double tick (orange/colored) - recipient has read
 */
function MessageStatus({ status, message, onRetry, channelId = null, conversationId = null }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'read':
        // Double tick colored (orange) - message was read
        return <CheckCheck className="h-3.5 w-3.5 text-orange-500" />
      case 'delivered':
        // Double tick gray - message delivered to recipient
        return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
      case 'sent':
        // Double tick gray - message saved on server
        return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
      case 'sending':
        // Single tick gray - message is being sent
        return <Check className="h-3.5 w-3.5 text-muted-foreground" />
      case 'failed':
      case 'failed_permanently':
        // Error icon - message failed to send
        return <AlertCircle className="h-3.5 w-3.5 text-destructive" />
      case 'pending':
        // Spinner - message is queued/loading
        return <div className="h-3.5 w-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      default:
        // Default to single tick for unknown status
        return <Check className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  // Show failed message with retry/delete options
  if ((status === 'failed' || status === 'failed_permanently') && message?.queueId) {
    return (
      <FailedMessageActions message={message} channelId={channelId} conversationId={conversationId} />
    )
  }

  // Show failed message with retry option (for optimistic messages)
  if (status === 'failed' && onRetry) {
    return (
      <div className="flex items-center gap-1">
        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onRetry}
          title="Retry sending message"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <span className="flex items-center" title={status === 'failed' ? 'Failed to send' : ''}>
      {getStatusIcon()}
    </span>
  )
}

/**
 * Failed Message Actions Component
 * Why: Provide retry and delete options for failed messages
 * How: Shows buttons to retry or delete failed messages
 * Impact: Users can recover from failed message sends
 */
function FailedMessageActions({ message, channelId = null, conversationId = null }) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const handleRetry = async () => {
    if (isRetrying) return
    
    setIsRetrying(true)
    
    // Update message status to pending in cache
    const updateCache = () => {
      if (channelId) {
        queryClient.setQueryData(messageKeys.list(channelId), (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              messages: page.messages.map(msg => 
                msg._id === message._id ? { ...msg, status: 'pending' } : msg
              )
            }))
          }
        })
      } else if (conversationId) {
        queryClient.setQueryData(directMessageKeys.conversationMessages(conversationId), (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              messages: page.messages.map(msg => 
                msg._id === message._id ? { ...msg, status: 'pending' } : msg
              )
            }))
          }
        })
      }
    }

    try {
      if (message.queueId) {
        updateCache()
        await manualRetryMessage(message.queueId)
      }
    } catch (error) {
      console.error('[FailedMessageActions] Retry error:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    if (!window.confirm('Are you sure you want to delete this failed message?')) {
      return
    }
    
    setIsDeleting(true)
    try {
      if (message.queueId) {
        await deleteFailedMessage(message.queueId)
        // Also remove from React Query cache
        window.dispatchEvent(new CustomEvent('message-deleted-from-queue', {
          detail: { messageId: message._id, queueId: message.queueId }
        }))
      }
    } catch (error) {
      console.error('[FailedMessageActions] Delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleRetry}
        disabled={isRetrying || isDeleting}
        title="Retry sending message"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Retrying...' : 'Retry'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        disabled={isRetrying || isDeleting}
        title="Delete failed message"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

export default MessageItem

