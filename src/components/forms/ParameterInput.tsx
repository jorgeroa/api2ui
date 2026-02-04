import type { ParsedParameter } from '../../services/openapi/types'

interface ParameterInputProps {
  parameter: ParsedParameter
  value: string
  onChange: (value: string) => void
}

export function ParameterInput({ parameter, value, onChange }: ParameterInputProps) {
  const { name, required, description, schema } = parameter

  // Determine input type based on parameter schema
  const renderInput = () => {
    const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
    // Build placeholder: prefer example, then default
    const exampleHint = schema.example !== undefined ? `e.g. ${schema.example}` : undefined
    const defaultHint = schema.default !== undefined ? String(schema.default) : undefined
    const placeholder = exampleHint ?? defaultHint

    // Enum → select dropdown
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

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {name}
        {required && <span className="text-red-500 ml-1">*</span>}
        {parameter.in === 'path' && (
          <span className="text-gray-400 ml-1 font-normal text-xs">(path)</span>
        )}
      </label>
      {renderInput()}
      {hint && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  )
}
