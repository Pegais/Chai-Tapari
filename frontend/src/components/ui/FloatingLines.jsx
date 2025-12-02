/**
 * Floating Lines Background Component
 * 
 * Why: Creates an animated background with floating lines for visual appeal
 * How: Uses Framer Motion to animate SVG lines with different speeds and directions
 * Impact: Enhances UI with subtle, non-distracting background animation
 */

import React from "react"
import { motion } from "framer-motion"

function FloatingLines() {
  // Generate random lines with different properties
  // Why: Create varied, organic-looking animation
  // How: Creates array of line configurations with random positions and durations
  // Impact: Natural, non-repetitive background animation
  const lines = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x1: Math.random() * 100,
    y1: Math.random() * 100,
    x2: Math.random() * 100,
    y2: Math.random() * 100,
    duration: 15 + Math.random() * 25, // 15-40 seconds
    delay: Math.random() * 5,
    opacity: 0.08 + Math.random() * 0.12, // 0.08-0.20 opacity for subtle effect
  }))

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {lines.map((line) => (
          <motion.line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-primary/30"
            initial={{ 
              pathLength: 0,
              opacity: 0,
            }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, line.opacity, 0],
              x1: [`${line.x1}%`, `${line.x1 + (Math.random() - 0.5) * 30}%`, `${line.x1}%`],
              y1: [`${line.y1}%`, `${line.y1 + (Math.random() - 0.5) * 30}%`, `${line.y1}%`],
              x2: [`${line.x2}%`, `${line.x2 + (Math.random() - 0.5) * 30}%`, `${line.x2}%`],
              y2: [`${line.y2}%`, `${line.y2 + (Math.random() - 0.5) * 30}%`, `${line.y2}%`],
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

export default FloatingLines

