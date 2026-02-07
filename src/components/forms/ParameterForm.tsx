import { useState, useMemo, useEffect } from 'react'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import type { ParsedParameter } from '../../services/openapi/types'
import { ParameterInput } from './ParameterInput'
import { ParameterGroup } from './ParameterGroup'
import { parseUrlParameters } from '../../services/urlParser/parser'
import { inferParameterType } from '../../services/urlParser/typeInferrer'
import { extractGroupPrefix } from '../../services/urlParser/groupUtils'
import { useParameterStore } from '../../store/parameterStore'
import { useDebouncedPersist } from '../../hooks/useDebouncedPersist'

interface ParameterFormProps {
  parameters: ParsedParameter[]
  onSubmit: (values: Record<string, string>) => void
  loading?: boolean
  endpoint?: string           // For persistence key
  rawUrl?: string             // Raw URL to parse (alternative to parameters)
}

/**
 * Get default values from parameter schema defaults/examples.
 */
function getDefaultValues(params: ParsedParameter[]): Record<string, string> {
  const initial: Record<string, string> = {}
  for (const param of params) {
    if (param.schema.default !== undefined) {
      initial[param.name] = String(param.schema.default)
    } else if (param.schema.example !== undefined) {
      initial[param.name] = String(param.schema.example)
    } else {
      initial[param.name] = ''
    }
  }
  return initial
}

export function ParameterForm({
  parameters,
  onSubmit,
  loading = false,
  endpoint,
  rawUrl,
}: ParameterFormProps) {
  // Store operations
  const { getValues, clearValue, clearEndpoint, getTypeOverride, setTypeOverride } = useParameterStore()

  // Parse URL if provided, otherwise use parameters prop
  const { effectiveParams, warnings } = useMemo(() => {
    if (rawUrl) {
      const parsed = parseUrlParameters(rawUrl)
      // Convert ParsedUrlParameter to ParsedParameter (compatible types)
      return {
        effectiveParams: parsed.parameters as ParsedParameter[],
        warnings: parsed.warnings,
      }
    }
    return { effectiveParams: parameters, warnings: [] as string[] }
  }, [rawUrl, parameters])

  // Load persisted values
  const persistedValues = endpoint ? getValues(endpoint) : {}

  // Initialize state with defaults merged with persisted values
  // For Direct API URLs (rawUrl provided), URL values take precedence over persisted
  // For OpenAPI endpoints, persisted values take precedence (user's previous inputs)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults = getDefaultValues(effectiveParams)
    if (rawUrl) {
      // Direct API URL: URL values override persisted (URL is source of truth)
      return { ...persistedValues, ...defaults }
    }
    // OpenAPI endpoint: persisted values override defaults
    return { ...defaults, ...persistedValues }
  })

  // Re-initialize values when effectiveParams changes (e.g., new URL pasted)
  useEffect(() => {
    setValues((prevValues) => {
      const defaults = getDefaultValues(effectiveParams)
      const userEnteredValues = Object.fromEntries(
        Object.entries(prevValues).filter(([key]) =>
          effectiveParams.some((p) => p.name === key)
        )
      )

      if (rawUrl) {
        // Direct API URL: URL values are source of truth, override everything
        // Only keep user-entered values for params that DON'T have URL values
        return {
          ...persistedValues,
          ...userEnteredValues,
          ...defaults,  // URL values override last
        }
      }
      // OpenAPI endpoint: persisted/user values take precedence
      return {
        ...defaults,
        ...persistedValues,
        ...userEnteredValues,
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveParams])

  // Auto-save with debounce when endpoint is provided
  useDebouncedPersist(endpoint ?? '', values)

  // Apply type inference to all params
  const paramsWithTypes = useMemo(() => {
    return effectiveParams.map((param) => ({
      ...param,
      inferredType:
        param.inferredType ?? inferParameterType(param.name, values[param.name]).type,
    }))
  }, [effectiveParams, values])

  // Extract groups from parameters
  const { grouped, ungrouped } = useMemo(() => {
    const groups = new Map<string, ParsedParameter[]>()
    const ungroupedList: ParsedParameter[] = []

    for (const param of paramsWithTypes) {
      const prefix = extractGroupPrefix(param.name)
      if (prefix) {
        if (!groups.has(prefix)) groups.set(prefix, [])
        groups.get(prefix)!.push(param)
      } else {
        ungroupedList.push(param)
      }
    }

    return { grouped: groups, ungrouped: ungroupedList }
  }, [paramsWithTypes])

  // Filter to show only query and path parameters
  const visibleUngrouped = ungrouped.filter(
    (p) => p.in === 'query' || p.in === 'path'
  )

  // Split ungrouped into required and optional
  const ungroupedRequired = visibleUngrouped.filter((p) => p.required)
  const ungroupedOptional = visibleUngrouped.filter((p) => !p.required)

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleClear = (name: string) => {
    setValues((prev) => {
      const { [name]: _, ...rest } = prev
      return { ...rest, [name]: '' }
    })
    if (endpoint) {
      clearValue(endpoint, name)
    }
  }

  const handleResetAll = () => {
    setValues(getDefaultValues(effectiveParams))
    if (endpoint) {
      clearEndpoint(endpoint)
    }
  }

  const handleTypeOverride = (name: string, type: string) => {
    if (endpoint) {
      setTypeOverride(endpoint, name, type)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  // Check if there are any values to reset
  const hasValues = Object.values(values).some((v) => v !== '')

  // If no visible parameters and no groups, just show submit button
  if (visibleUngrouped.length === 0 && grouped.size === 0) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? 'Fetching...' : 'Fetch Data'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Parse warnings (if any) */}
      {warnings.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-yellow-800">
              {warnings.map((warning, idx) => (
                <p key={idx}>{warning}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ungrouped Required Parameters */}
      {ungroupedRequired.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Required Parameters</h3>
          <div className="space-y-3">
            {ungroupedRequired.map((param) => (
              <ParameterInput
                key={param.name}
                parameter={param}
                value={values[param.name] ?? ''}
                onChange={(value) => handleChange(param.name, value)}
                inferredType={param.inferredType}
                typeOverride={endpoint ? getTypeOverride(endpoint, param.name) : undefined}
                onTypeOverride={endpoint ? (t) => handleTypeOverride(param.name, t) : undefined}
                onClear={() => handleClear(param.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ungrouped Optional Parameters (Collapsible) */}
      {ungroupedOptional.length > 0 && (
        <Disclosure>
          {({ open }) => (
            <>
              <DisclosureButton className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
                <svg
                  className={`h-5 w-5 transition-transform ${open ? 'rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  {ungroupedOptional.length} Optional Parameter{ungroupedOptional.length !== 1 ? 's' : ''}
                </span>
              </DisclosureButton>
              <DisclosurePanel className="mt-3 space-y-3">
                {ungroupedOptional.map((param) => (
                  <ParameterInput
                    key={param.name}
                    parameter={param}
                    value={values[param.name] ?? ''}
                    onChange={(value) => handleChange(param.name, value)}
                    inferredType={param.inferredType}
                    typeOverride={endpoint ? getTypeOverride(endpoint, param.name) : undefined}
                    onTypeOverride={endpoint ? (t) => handleTypeOverride(param.name, t) : undefined}
                    onClear={() => handleClear(param.name)}
                  />
                ))}
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      )}

      {/* Grouped Parameters in Accordions */}
      {grouped.size > 0 && (
        <div className="space-y-2 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Parameter Groups</h3>
          {Array.from(grouped.entries()).map(([groupName, groupParams]) => (
            <ParameterGroup key={groupName} groupName={groupName}>
              {groupParams.map((param) => (
                <ParameterInput
                  key={param.name}
                  parameter={param}
                  value={values[param.name] ?? ''}
                  onChange={(value) => handleChange(param.name, value)}
                  inferredType={param.inferredType}
                  typeOverride={endpoint ? getTypeOverride(endpoint, param.name) : undefined}
                  onTypeOverride={endpoint ? (t) => handleTypeOverride(param.name, t) : undefined}
                  onClear={() => handleClear(param.name)}
                />
              ))}
            </ParameterGroup>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Reset all button (only when endpoint is provided and has values) */}
        {endpoint && hasValues && (
          <button
            type="button"
            onClick={handleResetAll}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset All
          </button>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? 'Fetching...' : 'Fetch Data'}
        </button>
      </div>
    </form>
  )
}
