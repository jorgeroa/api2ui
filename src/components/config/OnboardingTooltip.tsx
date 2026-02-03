import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'api2ui-onboarding-field-config'

export function OnboardingTooltip() {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Check if already dismissed
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') {
        return
      }
    } catch {
      // localStorage not available; don't show tooltip
      return
    }

    // Show after a 3-second delay
    timerRef.current = setTimeout(() => {
      setVisible(true)
    }, 3000)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Ignore localStorage write failures
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-40">
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
      <span className="text-sm font-medium">Right-click any field to customize it</span>
      <button
        onClick={handleDismiss}
        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        Got it
      </button>
    </div>
  )
}
