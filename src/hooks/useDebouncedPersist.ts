import { useRef, useEffect } from 'react'
import { useParameterStore } from '../store/parameterStore'

/**
 * Debounced autosave hook for parameter values.
 * Persists parameter values to store after a delay of inactivity.
 *
 * @param endpoint - The endpoint identifier to persist values for
 * @param values - Current parameter values to persist
 * @param delay - Debounce delay in milliseconds (default 300ms)
 */
export function useDebouncedPersist(
  endpoint: string,
  values: Record<string, string>,
  delay: number = 300
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevValuesRef = useRef<Record<string, string>>({})
  const setValues = useParameterStore((state) => state.setValues)

  useEffect(() => {
    // Skip if no values to persist
    if (Object.keys(values).length === 0) {
      return
    }

    // Shallow compare to check if values actually changed
    const hasChanged = Object.keys(values).some(
      (key) => values[key] !== prevValuesRef.current[key]
    ) || Object.keys(prevValuesRef.current).some(
      (key) => !(key in values)
    )

    if (!hasChanged) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setValues(endpoint, values)
      prevValuesRef.current = { ...values }
    }, delay)

    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [endpoint, values, delay, setValues])
}
