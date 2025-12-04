/**
 * Video URL Utilities
 * 
 * Why: Detect and parse video URLs from various platforms
 * How: Uses regex patterns to identify video platforms and extract IDs
 * Impact: Enables video embedding in chat messages
 */

/**
 * Extract YouTube video ID from URL
 * Why: Get video ID for embedding
 * How: Parses various YouTube URL formats
 * Impact: Enables YouTube video embedding
 */
export const extractYouTubeVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Extract Vimeo video ID from URL
 * Why: Get video ID for embedding
 * How: Parses Vimeo URL format
 * Impact: Enables Vimeo video embedding
 */
export const extractVimeoVideoId = (url) => {
  const pattern = /(?:vimeo\.com\/)(\d+)/
  const match = url.match(pattern)
  return match ? match[1] : null
}

/**
 * Check if URL is a YouTube link
 * Why: Identify YouTube URLs for special handling
 * How: Checks URL against YouTube domain patterns
 * Impact: Enables YouTube-specific processing
 */
export const isYouTubeUrl = (url) => {
  return /(?:youtube\.com|youtu\.be)/.test(url)
}

/**
 * Check if URL is a Vimeo link
 * Why: Identify Vimeo URLs for special handling
 * How: Checks URL against Vimeo domain pattern
 * Impact: Enables Vimeo-specific processing
 */
export const isVimeoUrl = (url) => {
  return /vimeo\.com/.test(url)
}

/**
 * Check if URL is a video platform URL
 * Why: Determine if URL should be embedded as video
 * How: Checks against known video platform patterns
 * Impact: Enables video embedding for supported platforms
 */
export const isVideoUrl = (url) => {
  return isYouTubeUrl(url) || isVimeoUrl(url)
}

/**
 * Create video embed object from URL
 * Why: Generate embed data structure for video platforms
 * How: Extracts video ID and creates embed URL
 * Impact: Enables video embedding in messages
 */
export const createVideoEmbed = (url) => {
  if (isYouTubeUrl(url)) {
    const videoId = extractYouTubeVideoId(url)
    if (videoId) {
      return {
        provider: 'youtube',
        videoId: videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      }
    }
  }

  if (isVimeoUrl(url)) {
    const videoId = extractVimeoVideoId(url)
    if (videoId) {
      return {
        provider: 'vimeo',
        videoId: videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
      }
    }
  }

  return null
}

/**
 * Extract URLs from text
 * Why: Find all URLs in message content
 * How: Uses regex to match URL patterns
 * Impact: Enables link detection and processing
 */
export const extractUrls = (text) => {
  const urlPattern = /(https?:\/\/[^\s]+)/g
  return text.match(urlPattern) || []
}

