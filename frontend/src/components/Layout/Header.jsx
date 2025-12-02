/**
 * Header Component with Channel Navigation
 * 
 * Why: Top navigation bar with channel access and creation
 * How: Card-nav dropdown for channels with search, plus create channel button
 * Impact: Centralized navigation and channel management
 */

import React, { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Hash, Plus, X, ChevronDown } from "lucide-react"
import { mockChannels } from "../../data/mockData"
import CardNav from "../ui/CardNav"
import CreateChannel from "../Channels/CreateChannel"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

function Header() {
  const navigate = useNavigate()
  const [channels] = useState(mockChannels)
  const [selectedChannelId, setSelectedChannelId] = useState("channel1")
  const [showChannels, setShowChannels] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const dropdownRef = useRef(null)

  /**
   * Handle channel selection
   * Why: Navigate to selected channel
   * How: Sets selected channel and navigates, closes dropdown
   * Impact: User can switch channels from header
   */
  const handleChannelSelect = (channelId) => {
    setSelectedChannelId(channelId)
    navigate(`/chat/${channelId}`)
    setShowChannels(false)
  }

  /**
   * Close dropdown when clicking outside
   * Why: Better UX - dropdown closes when user clicks elsewhere
   * How: Detects clicks outside dropdown element
   * Impact: Intuitive dropdown behavior
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowChannels(false)
      }
    }

    if (showChannels) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showChannels])

  /**
   * Custom render function for channel items
   * Why: Customize channel display in card-nav
   * How: Returns JSX for each channel
   * Impact: Consistent channel presentation
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
    <>
      <header className="h-16 border-b border-primary/20 bg-card/95 backdrop-blur-sm flex-shrink-0 flex items-center px-6 relative z-20">
        {/* Left: Channel Navigation */}
        <div className="flex items-center gap-4" ref={dropdownRef}>
          <Button
            variant="ghost"
            onClick={() => setShowChannels(!showChannels)}
            className="flex items-center gap-2 hover:bg-primary/10"
          >
            <Hash className="h-5 w-5" />
            <span className="font-semibold">Channels</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              showChannels && "rotate-180"
            )} />
          </Button>

          {/* Channels Dropdown */}
          <AnimatePresence>
            {showChannels && (
              <>
                {/* Backdrop - Makes background inaccessible */}
                <motion.div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowChannels(false)}
                />
                
                {/* Dropdown Content */}
                <motion.div
                  className="absolute top-full left-0 mt-2 w-96 bg-card/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-2xl z-50 overflow-hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <div className="h-[500px] flex flex-col">
                    {/* Dropdown Header with Create Button */}
                    <div className="p-4 border-b border-primary/20 flex items-center justify-between flex-shrink-0">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        All Channels
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setShowChannels(false)
                            setShowCreateModal(true)
                          }}
                          className="h-8 w-8 hover:bg-primary/10"
                          title="Create Channel"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setShowChannels(false)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* CardNav Content */}
                    <div className="flex-1 overflow-hidden">
                      <CardNav
                        items={channels}
                        onItemSelect={handleChannelSelect}
                        selectedItemId={selectedChannelId}
                        renderItem={renderChannelItem}
                        searchPlaceholder="Search channels..."
                      />
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

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
    </>
  )
}

export default Header

