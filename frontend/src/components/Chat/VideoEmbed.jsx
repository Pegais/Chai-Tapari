/**
 * Video Embed Component
 * 
 * Why: Display embedded videos from YouTube, Vimeo, etc. in chat
 * How: Renders iframe with video embed URL, lazy loads on scroll
 * Impact: Rich media content directly in chat without external links
 */

import React, { useState, useRef, useEffect } from "react"
import { Play } from "lucide-react"

function VideoEmbed({ embed }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef(null)

  /**
   * Lazy load video when scrolled into view
   * Why: Improve performance by loading videos only when visible
   * How: Uses Intersection Observer to detect visibility
   * Impact: Faster initial page load, reduced bandwidth usage
   */
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: "100px" } // Start loading 100px before visible
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  if (!embed) return null

  /**
   * Generate thumbnail URL based on provider
   * Why: Show preview before loading full video
   * How: Constructs thumbnail URL from video ID
   * Impact: Better UX with preview images
   */
  const getThumbnailUrl = () => {
    if (embed.provider === "youtube") {
      return `https://img.youtube.com/vi/${embed.videoId}/maxresdefault.jpg`
    }
    if (embed.provider === "vimeo") {
      return `https://vumbnail.com/${embed.videoId}.jpg`
    }
    return null
  }

  return (
    <div ref={containerRef} className="mt-2 max-w-2xl">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {!isLoaded && getThumbnailUrl() && (
          <div className="absolute inset-0">
            <img
              src={getThumbnailUrl()}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="bg-white/90 rounded-full p-4">
                <Play className="h-8 w-8 text-primary" fill="currentColor" />
              </div>
            </div>
          </div>
        )}
        {isVisible && (
          <iframe
            src={embed.embedUrl}
            title="Video embed"
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
          />
        )}
      </div>
    </div>
  )
}

export default VideoEmbed

