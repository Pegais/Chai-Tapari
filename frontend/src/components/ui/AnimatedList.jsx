/**
 * Animated List Component (React Bits Style)
 * 
 * Why: List component with smooth animations for items
 * How: Uses Framer Motion for staggered list animations
 * Impact: Polished, professional list display with smooth transitions
 */

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../lib/utils"

function AnimatedList({ 
  items, 
  renderItem, 
  className,
  itemClassName,
  staggerDelay = 0.05,
  layout = true 
}) {
  /**
   * Render animated list items
   * Why: Smooth, staggered animations for list items
   * How: Maps items with motion animations and stagger delays
   * Impact: Better visual hierarchy and user experience
   */
  return (
    <div className={cn("space-y-1", className)}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          const itemId = item.id || item._id || index
          
          return (
            <motion.div
              key={itemId}
              layout={layout}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{
                delay: index * staggerDelay,
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              className={itemClassName}
            >
              {renderItem(item, index)}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default AnimatedList

