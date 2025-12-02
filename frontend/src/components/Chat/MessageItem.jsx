/**
 * Message Item Component
 * 
 * Why: Individual message display with sender info, content, and actions
 * How: Renders message content based on type (text, file, link, video) with edit/delete
 * Impact: Clear message presentation with rich content support
 */

import React, { useState } from "react"
import { motion } from "framer-motion"
import { getUserById, mockCurrentUser } from "../../data/mockData"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import { format } from "date-fns"
import { Edit2, Trash2, MoreVertical } from "lucide-react"
import LinkPreview from "./LinkPreview"
import VideoEmbed from "./VideoEmbed"

function MessageItem({ message, showAvatar, showTimestamp }) {
  const sender = getUserById(message.sender)
  const isOwnMessage = message.sender === mockCurrentUser._id
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
  const handleSaveEdit = () => {
    // TODO: Call API to update message
    setIsEditing(false)
  }

  /**
   * Handle message delete
   * Why: Allow users to remove their messages
   * How: Calls API to soft-delete message
   * Impact: Message marked as deleted, hidden from view
   */
  const handleDelete = () => {
    // TODO: Call API to delete message
    if (window.confirm("Are you sure you want to delete this message?")) {
      // Delete message
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
      className={`flex gap-3 px-4 py-2 hover:bg-accent/20 group ${isOwnMessage ? "flex-row-reverse" : ""}`}
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Avatar - shown only for first message in group */}
      {showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={sender?.avatar} alt={sender?.username} />
          <AvatarFallback>{sender?.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      
      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${!showAvatar ? "ml-11" : ""} ${isOwnMessage ? "items-end" : ""}`}>
        {/* Sender Name and Timestamp - shown only for first message */}
        {showAvatar && (
          <div className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
            <span className="font-semibold text-sm">{sender?.username}</span>
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
            className={`rounded-lg px-4 py-2 max-w-[70%] ${
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
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
                className="h-6 w-6"
                onClick={handleEdit}
                title="Edit message"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleDelete}
                title="Delete message"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default MessageItem

