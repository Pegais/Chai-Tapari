/**
 * Conversation List Component
 * 
 * Why: Display list of user's direct message conversations
 * How: Shows conversations sorted by last message time
 * Impact: Enables users to navigate between conversations
 */

import React from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { useConversations } from "../../hooks/useDirectMessages"
import { format } from "date-fns"
import { MessageCircle } from "lucide-react"
import { cn } from "../../lib/utils"

function ConversationList({ selectedConversationId }) {
  const navigate = useNavigate()
  const { data: conversations = [], isLoading } = useConversations()

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading conversations...</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-2">
          Start a conversation by selecting a user
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2 space-y-1">
        <AnimatePresence>
          {conversations.map((conversation, index) => {
            const otherUser = conversation.participants?.[0]
            const lastMessage = conversation.lastMessage
            const isSelected = selectedConversationId === conversation._id

            return (
              <motion.div
                key={conversation._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/chat/dm/${conversation._id}`)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                  isSelected
                    ? "bg-primary/20 border border-primary/30"
                    : "bg-card/50 border border-primary/10 hover:border-primary/30 hover:bg-card/80"
                )}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={otherUser?.avatar} alt={otherUser?.username} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {otherUser?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {otherUser?.isOnline && (
                    <motion.div
                      className="absolute bottom-0 right-0 h-3 w-3 bg-primary border-2 border-background rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={cn(
                      "font-semibold text-sm truncate",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {otherUser?.username || "Unknown User"}
                    </h3>
                    {lastMessage && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {format(new Date(lastMessage.timestamp), "h:mm a")}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className="text-xs text-muted-foreground truncate">
                      {lastMessage.content || "Attachment"}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ConversationList

