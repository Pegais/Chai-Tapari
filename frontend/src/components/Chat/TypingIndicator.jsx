/**
 * Typing Indicator Component
 * 
 * Why: Show when other users are typing in the channel
 * How: Displays animated dots with usernames
 * Impact: Real-time feedback that others are composing messages
 */

import React from "react"
import { getUserById } from "../../data/mockData"
import { motion } from "framer-motion"

function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) {
    return null
  }

  /**
   * Get typing users display text
   * Why: Format multiple users typing message
   * How: Combines usernames with proper grammar
   * Impact: Clear indication of who is typing
   */
  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const user = getUserById(typingUsers[0])
      return `${user?.username || "Someone"} is typing`
    } else if (typingUsers.length === 2) {
      const user1 = getUserById(typingUsers[0])
      const user2 = getUserById(typingUsers[1])
      return `${user1?.username || "Someone"} and ${user2?.username || "someone"} are typing`
    } else {
      return `${typingUsers.length} people are typing`
    }
  }

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
      <span>{getTypingText()}</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-1 h-1 bg-muted-foreground rounded-full"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default TypingIndicator

