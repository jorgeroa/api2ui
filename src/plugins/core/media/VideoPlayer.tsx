import type { FieldRenderProps } from '../../../types/plugins'

/** Known video file extensions */
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?|$)/i

/** Known video hosting patterns */
const YOUTUBE_PATTERN = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
const VIMEO_PATTERN = /vimeo\.com\/(\d+)/

/** Extract embeddable URL from a video URL */
function getEmbedUrl(url: string): { type: 'native' | 'iframe'; src: string } | null {
  const ytMatch = url.match(YOUTUBE_PATTERN)
  if (ytMatch) {
    return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}` }
  }

  const vimeoMatch = url.match(VIMEO_PATTERN)
  if (vimeoMatch) {
    return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` }
  }

  if (VIDEO_EXTENSIONS.test(url)) {
    return { type: 'native', src: url }
  }

  return null
}

/** Video player — supports native video files and YouTube/Vimeo embeds */
export function VideoPlayer({ value }: FieldRenderProps) {
  if (typeof value !== 'string') {
    return <span className="text-gray-500 text-sm">{JSON.stringify(value)}</span>
  }

  const embed = getEmbedUrl(value)
  if (!embed) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 text-sm underline"
        onClick={(e) => e.stopPropagation()}
      >
        {value}
      </a>
    )
  }

  if (embed.type === 'iframe') {
    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden border border-gray-200">
        <iframe
          src={embed.src}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="Video"
        />
      </div>
    )
  }

  return (
    <video
      src={embed.src}
      controls
      preload="metadata"
      className="w-full max-h-64 rounded-lg border border-gray-200"
    >
      Your browser does not support the video tag.
    </video>
  )
}
