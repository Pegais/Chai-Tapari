/**
 * ScrollArea Component (shadcn/ui style)
 * 
 * Why: Custom scrollable container with styled scrollbar
 * How: Wraps content in scrollable div with custom styling
 * Impact: Better scrollbar appearance and consistent scrolling behavior
 */

import React from "react"
import { cn } from "../../lib/utils"

const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
})
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }

