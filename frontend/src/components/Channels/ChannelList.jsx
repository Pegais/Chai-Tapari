/**
 * Channel List Component
 * 
 * Why: Displays all available channels for navigation
 * How: Renders list of channels with active state, member count, and create button
 * Impact: Primary navigation for users to switch between channels
 */

import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Hash, Plus, ChevronDown, ChevronUp } from "lucide-react"
import CardNav from "../ui/CardNav"
import CreateChannel from "./CreateChannel"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { useChannels } from "../../hooks/useChannels"

function ChannelList() {
  const navigate = useNavigate()
  const { channelId } = useParams()
  const { data: channels = [], isLoading, error } = useChannels()
  const [selectedChannelId, setSelectedChannelId] = useState(channelId || null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Update selected channel when route changes
  useEffect(() => {
    if (channelId) {
      setSelectedChannelId(channelId)
    }
  }, [channelId])

  /**
   * Handle channel selection
   * Why: Update active channel when user clicks a channel
   * How: Sets selected channel ID and navigates to channel
   * Impact: User can switch between channels to view different conversations
   */
  const handleChannelSelect = (channelId) => {
    setSelectedChannelId(channelId)
    navigate(`/chat/channel/${channelId}`)
  }

  /**
   * Custom render function for channel items
   * Why: Customize how channels are displayed in CardNav
   * How: Returns JSX for each channel item
   * Impact: Consistent channel display with member count
   */
  const renderChannelItem = (channel, isSelected) => {
    return (
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-md transition-colors",
          isSelected ? "bg-primary/20" : "bg-muted/50"
        )}>
          <Hash className={cn(
            "h-4 w-4",
            isSelected ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-semibold text-sm truncate",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {channel.name}
          </div>
          {channel.description && (
            <div className="text-xs text-muted-foreground truncate mt-1">
              {channel.description}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {channel.memberCount} members
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-card/95 backdrop-blur-sm">
      {/* Header with Collapse Button */}
      <div className="p-4 border-b border-primary/20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Channels
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand" : "Collapse"}
              className="hover:bg-primary/10"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowCreateModal(true)}
              title="Create Channel"
              className="hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsible CardNav with Search */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="flex-1 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading channels...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-destructive">Error loading channels</p>
              </div>
            ) : (
              <CardNav
                items={channels}
                onItemSelect={handleChannelSelect}
                selectedItemId={selectedChannelId}
                renderItem={renderChannelItem}
                searchPlaceholder="Search channels..."
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannel
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newChannel) => {
            // TODO: Add new channel to list
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

export default ChannelList

