import { useState } from 'react'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import type { ParsedParameter } from '../../services/openapi/types'
import { ParameterInput } from './ParameterInput'

interface ParameterFormProps {
  parameters: ParsedParameter[]
  onSubmit: (values: Record<string, string>) => void
  loading?: boolean
}

export function ParameterForm({ parameters, onSubmit, loading = false }: ParameterFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    // Initialize with default values from schema
    const initial: Record<string, string> = {}
    for (const param of parameters) {
      if (param.schema.default !== undefined) {
        initial[param.name] = String(param.schema.default)
      } else {
        initial[param.name] = ''
      }
    }
    return initial
  })

  // Filter to show only query and path parameters
  const visibleParams = parameters.filter(
    (p) => p.in === 'query' || p.in === 'path'
  )

  // Split into required and optional
  const requiredParams = visibleParams.filter((p) => p.required)
  const optionalParams = visibleParams.filter((p) => !p.required)

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  // If no visible parameters, just show submit button
  if (visibleParams.length === 0) {
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
      {/* Required Parameters */}
      {requiredParams.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Required Parameters</h3>
          <div className="space-y-3">
            {requiredParams.map((param) => (
              <ParameterInput
                key={param.name}
                parameter={param}
                value={values[param.name] ?? ''}
                onChange={(value) => handleChange(param.name, value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optional Parameters (Collapsible) */}
      {optionalParams.length > 0 && (
        <Disclosure>
          {({ open }) => (
            <>
              <DisclosureButton className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
                <ChevronRightIcon
                  className={`h-5 w-5 transition-transform ${open ? 'rotate-90' : ''}`}
                />
                <span>
                  {optionalParams.length} Optional Parameter{optionalParams.length !== 1 ? 's' : ''}
                </span>
              </DisclosureButton>
              <DisclosurePanel className="mt-3 space-y-3">
                {optionalParams.map((param) => (
                  <ParameterInput
                    key={param.name}
                    parameter={param}
                    value={values[param.name] ?? ''}
                    onChange={(value) => handleChange(param.name, value)}
                  />
                ))}
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      )}

      {/* Submit Button */}
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
