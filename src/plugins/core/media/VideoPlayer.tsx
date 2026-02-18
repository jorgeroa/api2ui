import { useRef, useState, useEffect } from 'react'
import type { FieldRenderProps } from '../../../types/plugins'

/** Known video file extensions */
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?|$)/i

/** Known video hosting patterns */
const YOUTUBE_PATTERN = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
const VIMEO_PATTERN = /vimeo\.com\/(\d+)/

/** Detect video platform and extract embed URL */
function getVideoInfo(url: string): {
  platform: 'youtube' | 'vimeo' | 'video'
  embedSrc: string
  watchUrl: string
} | null {
  const ytMatch = url.match(YOUTUBE_PATTERN)
  if (ytMatch) {
    const id = ytMatch[1]!
    return {
      platform: 'youtube',
      embedSrc: `https://www.youtube-nocookie.com/embed/${id}`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
    }
  }

  const vimeoMatch = url.match(VIMEO_PATTERN)
  if (vimeoMatch) {
    const id = vimeoMatch[1]!
    return {
      platform: 'vimeo',
      embedSrc: `https://player.vimeo.com/video/${id}`,
      watchUrl: `https://vimeo.com/${id}`,
    }
  }

  if (VIDEO_EXTENSIONS.test(url)) {
    return { platform: 'video', embedSrc: url, watchUrl: url }
  }

  return null
}

/** YouTube brand icon */
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

/** Vimeo brand icon */
function VimeoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="#1AB7EA">
      <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.123C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z" />
    </svg>
  )
}

/** Generic video icon */
function VideoFileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

/** External link icon */
function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-muted-foreground" fill="currentColor">
      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  )
}

/** Platform config */
const platforms = {
  youtube: { Icon: YouTubeIcon, label: 'YouTube', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
  vimeo: { Icon: VimeoIcon, label: 'Vimeo', bg: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
  video: { Icon: VideoFileIcon, label: 'Video', bg: 'bg-muted hover:bg-muted border-border' },
} as const

/** Width threshold: below this, render compact badge; above, render embedded player */
const COMPACT_THRESHOLD = 280

/**
 * Video player — context-aware rendering:
 * - Narrow containers (table cells): compact branded badge linking to the video
 * - Wide containers (detail views): embedded iframe player
 */
export function VideoPlayer({ value }: FieldRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCompact(entry.contentRect.width < COMPACT_THRESHOLD)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (typeof value !== 'string') {
    return <span className="text-muted-foreground text-sm">{JSON.stringify(value)}</span>
  }

  const info = getVideoInfo(value)
  if (!info) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 text-sm underline"
        onClick={(e) => e.stopPropagation()}
      >
        {value}
      </a>
    )
  }

  const { Icon, label, bg } = platforms[info.platform]

  return (
    <div ref={containerRef}>
      {compact ? (
        // Compact badge — opens in new tab
        <a
          href={info.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium transition-colors no-underline ${bg}`}
          title={info.watchUrl}
        >
          <Icon />
          <span className="text-foreground">{label}</span>
          <ExternalLinkIcon />
        </a>
      ) : info.platform === 'video' ? (
        // Native video — HTML5 player
        <video
          src={info.embedSrc}
          controls
          preload="metadata"
          className="w-full max-w-lg max-h-64 rounded-lg border border-border"
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        // Embedded player with link to open externally
        <div className="space-y-1.5">
          <div className="w-full max-w-lg aspect-video rounded-lg overflow-hidden border border-border">
            <iframe
              src={info.embedSrc}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              title="Video"
            />
          </div>
          <a
            href={info.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground no-underline"
          >
            <Icon />
            <span>Watch on {label}</span>
            <ExternalLinkIcon />
          </a>
        </div>
      )}
    </div>
  )
}
