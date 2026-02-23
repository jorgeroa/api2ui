import { useState } from 'react'
import type { FieldRenderProps } from '../../../types/plugins'

/** Grid gallery for arrays of image URLs */
export function ImageGallery({ value }: FieldRenderProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [errorIdxs, setErrorIdxs] = useState<Set<number>>(new Set())

  if (!Array.isArray(value)) {
    return <span className="text-muted-foreground text-sm">{JSON.stringify(value)}</span>
  }

  const urls = value.filter((v): v is string => typeof v === 'string' && /^https?:\/\//i.test(v))
  if (urls.length === 0) {
    return <span className="text-muted-foreground text-sm">No image URLs found</span>
  }

  const handleError = (idx: number) => {
    setErrorIdxs((prev) => new Set(prev).add(idx))
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 max-w-lg">
        {urls.map((url, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setExpandedIdx(i) }}
            className="aspect-square rounded-lg overflow-hidden border border-border hover:border-foreground/20 transition-colors bg-muted"
          >
            {errorIdxs.has(i) ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                Failed
              </div>
            ) : (
              <img
                src={url}
                alt={`Image ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => handleError(i)}
              />
            )}
          </button>
        ))}
      </div>

      {/* Expanded view overlay */}
      {expandedIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setExpandedIdx(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={urls[expandedIdx]}
              alt={`Image ${expandedIdx + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {expandedIdx > 0 && (
                <button
                  onClick={() => setExpandedIdx(expandedIdx - 1)}
                  className="bg-white/90 rounded-full w-8 h-8 flex items-center justify-center text-foreground hover:bg-white"
                >
                  ‹
                </button>
              )}
              {expandedIdx < urls.length - 1 && (
                <button
                  onClick={() => setExpandedIdx(expandedIdx + 1)}
                  className="bg-white/90 rounded-full w-8 h-8 flex items-center justify-center text-foreground hover:bg-white"
                >
                  ›
                </button>
              )}
              <button
                onClick={() => setExpandedIdx(null)}
                className="bg-white/90 rounded-full w-8 h-8 flex items-center justify-center text-foreground hover:bg-white"
              >
                ✕
              </button>
            </div>
            <div className="text-center text-white/80 text-sm mt-2">
              {expandedIdx + 1} / {urls.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
