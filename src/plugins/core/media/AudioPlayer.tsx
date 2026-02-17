import type { FieldRenderProps } from '../../../types/plugins'

/** Audio player — compact inline player for audio URLs */
export function AudioPlayer({ value }: FieldRenderProps) {
  if (typeof value !== 'string') {
    return <span className="text-gray-500 text-sm">{JSON.stringify(value)}</span>
  }

  return (
    <audio
      src={value}
      controls
      preload="metadata"
      className="w-full max-w-md h-10"
    >
      Your browser does not support the audio element.
    </audio>
  )
}
