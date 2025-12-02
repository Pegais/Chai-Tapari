/**
 * React Bits Floating Lines Background Component
 * 
 * Why: Creates the exact floating lines background from React Bits
 * How: Uses SVG paths with animated strokes that float across the screen
 * Impact: Professional animated background matching React Bits design
 */

import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"

function FloatingLinesBackground() {
  const svgRef = useRef(null)

  // Generate floating lines similar to React Bits
  // Why: Create organic, flowing line animations
  // How: Creates curved paths that animate across the viewport
  // Impact: Dynamic, engaging background without distraction
  const lines = Array.from({ length: 15 }, (_, i) => {
    const startX = Math.random() * 100
    const startY = Math.random() * 100
    const endX = startX + (Math.random() - 0.5) * 40
    const endY = startY + (Math.random() - 0.5) * 40
    const controlX1 = startX + (Math.random() - 0.5) * 30
    const controlY1 = startY + (Math.random() - 0.5) * 30
    const controlX2 = endX + (Math.random() - 0.5) * 30
    const controlY2 = endY + (Math.random() - 0.5) * 30

    return {
      id: i,
      path: `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`,
      duration: 20 + Math.random() * 30,
      delay: Math.random() * 5,
      opacity: 0.1 + Math.random() * 0.15,
    }
  })

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <svg
        ref={svgRef}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {lines.map((line) => (
          <motion.path
            key={line.id}
            d={line.path}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
            className="text-primary/20"
            initial={{
              pathLength: 0,
              opacity: 0,
            }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, line.opacity, 0],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: line.duration,
              delay: line.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export default FloatingLinesBackground

