/**
 * Channel Item Component
 * 
 * Why: Individual channel display in the channel list
 * How: Shows channel name, member count, and highlights when selected
 * Impact: Visual channel representation with selection state
 */

import React from "react"
import { motion } from "framer-motion"
import { Hash } from "lucide-react"
import { Badge } from "../ui/badge"
import { cn } from "../../lib/utils"

function ChannelItem({ channel, isSelected, onSelect }) {
  /**
   * Render channel item with selection state
   * Why: Visual feedback for active channel
   * How: Applies selected styles when channel is active
   * Impact: Clear indication of current channel
   */
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "w-full px-4 py-3 text-left hover:bg-accent/20 transition-colors flex items-center justify-between group",
        isSelected && "bg-primary/10 border-l-2 border-l-primary"
      )}
      whileHover={{ x: 4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Hash className={cn(
          "h-4 w-4 flex-shrink-0 transition-colors",
          isSelected ? "text-primary" : "text-muted-foreground"
        )} />
        <span className={cn(
          "font-medium truncate transition-colors",
          isSelected && "text-primary"
        )}>
          {channel.name}
        </span>
      </div>
      <Badge variant="secondary" className="ml-2 flex-shrink-0 bg-primary/20 text-primary">
        {channel.memberCount}
      </Badge>
    </motion.button>
  )
}

export default ChannelItem

