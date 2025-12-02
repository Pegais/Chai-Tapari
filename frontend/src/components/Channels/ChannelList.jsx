/**
 * Channel List Component
 * 
 * Why: Displays all available channels for navigation
 * How: Renders list of channels with active state, member count, and create button
 * Impact: Primary navigation for users to switch between channels
 */

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { mockChannels } from "../../data/mockData"
import ChannelItem from "./ChannelItem"
import CreateChannel from "./CreateChannel"
import { Button } from "../ui/button"
import { Plus } from "lucide-react"

function ChannelList() {
  const [channels] = useState(mockChannels)
  const [selectedChannelId, setSelectedChannelId] = useState("channel1")
  const [showCreateModal, setShowCreateModal] = useState(false)

  /**
   * Handle channel selection
   * Why: Update active channel when user clicks a channel
   * How: Sets selected channel ID and triggers navigation
   * Impact: User can switch between channels to view different conversations
   */
  const handleChannelSelect = (channelId) => {
    setSelectedChannelId(channelId)
    // TODO: Navigate to channel route or update chat window
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Channels</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowCreateModal(true)}
            title="Create Channel"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {channels.map((channel, index) => (
            <motion.div
              key={channel._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
            >
              <ChannelItem
                channel={channel}
                isSelected={selectedChannelId === channel._id}
                onSelect={() => handleChannelSelect(channel._id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
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

