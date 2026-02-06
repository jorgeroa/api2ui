import type { ParsedParameter } from '../../services/openapi/types'
import { TypeIcon } from './TypeIcon'

interface ParameterInputProps {
  parameter: ParsedParameter
  value: string
  onChange: (value: string) => void
  inferredType?: string // Type from inference
  typeOverride?: string // User's override (from store)
  onTypeOverride?: (type: string) => void // Callback for override
  onClear?: () => void // Callback to clear this field
}

export function ParameterInput({
  parameter,
  value,
  onChange,
  inferredType,
  typeOverride,
  onTypeOverride,
  onClear,
}: ParameterInputProps) {
  const { name, required, description, schema } = parameter

  // Determine effective type: override > inferred > schema > string
  const effectiveType = typeOverride ?? inferredType ?? undefined

  // Determine input type based on effective type or parameter schema
  const renderInput = () => {
    const baseClasses =
      'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
    // Build placeholder: prefer example, then default
    const exampleHint = schema.example !== undefined ? `e.g. ${schema.example}` : undefined
    const defaultHint = schema.default !== undefined ? String(schema.default) : undefined
    const placeholder = exampleHint ?? defaultHint

    // Enum → select dropdown (schema takes precedence)
    if (schema.enum && schema.enum.length > 0) {
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
          required={required}
        >
          <option value="">-- Select {name} --</option>
          {schema.enum.map((option, idx) => (
            <option key={idx} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      )
    }

    // If we have an effective type from inference/override, use it
    if (effectiveType) {
      switch (effectiveType) {
        case 'boolean':
          return (
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          )

        case 'number':
          return (
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              min={schema.minimum}
              max={schema.maximum}
              placeholder={placeholder}
              className={baseClasses}
              required={required}
            />
          )

        case 'date':
          return (
            <input
              type="date"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={baseClasses}
              required={required}
            />
          )

        case 'email':
          return (
            <input
              type="email"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={baseClasses}
              required={required}
            />
          )

        case 'url':
          return (
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={baseClasses}
              required={required}
            />
          )

        case 'coordinates':
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder ?? 'lat, lng'}
              className={baseClasses}
              required={required}
            />
          )

        case 'zip':
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder ?? '12345 or 12345-6789'}
              pattern="^\d{5}(-\d{4})?$"
              className={baseClasses}
              required={required}
            />
          )

        case 'string':
        default:
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              maxLength={schema.maxLength}
              className={baseClasses}
              required={required}
            />
          )
      }
    }

    // Fall back to schema-based type detection (backward compatibility)

    // Boolean → checkbox
    if (schema.type === 'boolean') {
      return (
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      )
    }

    // Number/Integer → number input with min/max
    if (schema.type === 'integer' || schema.type === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={schema.minimum}
          max={schema.maximum}
          placeholder={placeholder}
          className={baseClasses}
          required={required}
        />
      )
    }

    // Date/DateTime → date/datetime-local input
    if (schema.format === 'date') {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClasses}
          required={required}
        />
      )
    }

    if (schema.format === 'date-time') {
      return (
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClasses}
          required={required}
        />
      )
    }

    // Email → email input
    if (schema.format === 'email') {
      return (
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClasses}
          required={required}
        />
      )
    }

    // URI → url input
    if (schema.format === 'uri') {
      return (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClasses}
          required={required}
        />
      )
    }

    // Default → text input
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={schema.maxLength}
        className={baseClasses}
        required={required}
      />
    )
  }

  const hintParts: string[] = []
  if (description) hintParts.push(description)
  if (schema.example !== undefined && !description?.includes(String(schema.example))) {
    hintParts.push(`Example: ${schema.example}`)
  }
  const hint = hintParts.join(' — ')

  // Show type icon if we have an inferred or overridden type
  const showTypeIcon = Boolean(inferredType || typeOverride)
  const displayType = effectiveType ?? 'string'

  // Show clear button only if we have a value and an onClear handler
  const showClearButton = Boolean(onClear && value)

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {name}
          {required && <span className="text-red-500 ml-1">*</span>}
          {parameter.in === 'path' && (
            <span className="text-gray-400 ml-1 font-normal text-xs">(path)</span>
          )}
        </label>
        {showTypeIcon && (
          <TypeIcon
            type={displayType}
            onTypeChange={onTypeOverride ?? (() => {})}
            disabled={!onTypeOverride}
          />
        )}
      </div>
      <div className="relative">
        {renderInput()}
        {showClearButton && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
            title="Clear value"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
