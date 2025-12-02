/**
 * Link Preview Component
 * 
 * Why: Display rich previews for URLs shared in messages
 * How: Shows title, description, image, and clickable link
 * Impact: Better context for shared links without leaving chat
 */

import React from "react"
import { ExternalLink } from "lucide-react"
import { Card, CardContent } from "../ui/card"

function LinkPreview({ preview }) {
  if (!preview) return null

  /**
   * Handle link click
   * Why: Open link in new tab
   * How: Opens URL in new window
   * Impact: Users can view full content while keeping chat open
   */
  const handleClick = (e) => {
    e.preventDefault()
    window.open(preview.url, "_blank", "noopener,noreferrer")
  }

  return (
    <Card className="mt-2 max-w-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      {preview.image && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={preview.image}
            alt={preview.title || "Link preview"}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none"
            }}
          />
        </div>
      )}
      <CardContent className="p-3">
        {preview.siteName && (
          <div className="text-xs text-muted-foreground mb-1">{preview.siteName}</div>
        )}
        {preview.title && (
          <h4 className="font-semibold text-sm mb-1 line-clamp-2">{preview.title}</h4>
        )}
        {preview.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{preview.description}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          <span className="truncate">{preview.url}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default LinkPreview

