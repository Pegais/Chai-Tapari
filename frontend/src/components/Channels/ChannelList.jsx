/**
 * Channel List Component
 * 
 * Why: Displays all available channels for navigation
 * How: Renders list of channels with active state, member count, and create button
 * Impact: Primary navigation for users to switch between channels
 */

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Hash, Plus } from "lucide-react"
import { mockChannels } from "../../data/mockData"
import CardNav from "../ui/CardNav"
import CreateChannel from "./CreateChannel"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

function ChannelList() {
  const navigate = useNavigate()
  const [channels] = useState(mockChannels)
  const [selectedChannelId, setSelectedChannelId] = useState("channel1")
  const [showCreateModal, setShowCreateModal] = useState(false)

  /**
   * Handle channel selection
   * Why: Update active channel when user clicks a channel
   * How: Sets selected channel ID and navigates to channel
   * Impact: User can switch between channels to view different conversations
   */
  const handleChannelSelect = (channelId) => {
    setSelectedChannelId(channelId)
    navigate(`/chat/${channelId}`)
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Channels
          </h2>
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

      {/* CardNav with Search */}
      <div className="flex-1 overflow-hidden">
        <CardNav
          items={channels}
          onItemSelect={handleChannelSelect}
          selectedItemId={selectedChannelId}
          renderItem={renderChannelItem}
          searchPlaceholder="Search channels..."
        />
      </div>

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

