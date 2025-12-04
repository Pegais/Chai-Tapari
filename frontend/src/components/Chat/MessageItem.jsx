/**
 * Message Item Component
 * 
 * Why: Individual message display with sender info, content, and actions
 * How: Renders message content based on type (text, file, link, video) with edit/delete
 * Impact: Clear message presentation with rich content support
 */

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { format } from "date-fns"
import { Edit2, Trash2 } from "lucide-react"
import LinkPreview from "./LinkPreview"
import VideoEmbed from "./VideoEmbed"
import { useAuth } from "../../context/AuthContext"
import { useEditMessage, useDeleteMessage } from "../../hooks/useMessages"
import { getSocket } from "../../services/socket"

function MessageItem({ message, showAvatar, showTimestamp }) {
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
   * How: Calls API to update message, updates local state
   * Impact: Message content updated in database and UI
   */
  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      return
    }

    try {
      if (socket) {
        // Send via WebSocket for real-time update
        socket.emit('edit-message', {
          messageId: message._id,
          content: editContent.trim(),
        })
      } else {
        // Fallback to REST API
        await editMessage.mutateAsync({
          messageId: message._id,
          content: editContent.trim(),
        })
      }
      setIsEditing(false)
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

    try {
      if (socket) {
        // Send via WebSocket for real-time update
        socket.emit('delete-message', {
          messageId: message._id,
        })
      } else {
        // Fallback to REST API
        await deleteMessage.mutateAsync(message._id)
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
                {format(new Date(message.timestamp), "h:mm a")}
              </span>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div className={`flex items-start gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
          <motion.div
            className={`rounded-lg px-3 sm:px-4 py-2 max-w-[85%] sm:max-w-[70%] ${
              isOwnMessage
                ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20"
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
                      <div key={index} className="rounded overflow-hidden">
                        {file.fileType.startsWith("image/") ? (
                          <img
                            src={file.thumbnailUrl || file.fileUrl}
                            alt={file.fileName}
                            className="max-w-full h-auto rounded"
                            loading="lazy"
                          />
                        ) : (
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
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Edited Indicator */}
                {message.editedAt && (
                  <span className="text-xs opacity-70 mt-1 block">(edited)</span>
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
      </div>
    </motion.div>
  )
}

export default MessageItem

