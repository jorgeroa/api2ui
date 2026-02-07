interface EnumCheckboxGroupProps {
  value: string[]
  onChange: (value: string[]) => void
  options: string[]
  label: string
}

export function EnumCheckboxGroup({
  value,
  onChange,
  options,
  label,
}: EnumCheckboxGroupProps) {
  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      // Remove
      onChange(value.filter((v) => v !== option))
    } else {
      // Add
      onChange([...value, option])
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700">{label}</legend>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => handleToggle(option)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              {option}
            </span>
          </label>
        ))}
      </div>
      {/* Selection count */}
      {value.length > 0 && (
        <p className="text-xs text-gray-500">
          {value.length} of {options.length} selected
        </p>
      )}
    </fieldset>
  )
}

/**
 * Helper to check if a parameter should use EnumCheckboxGroup.
 * Returns true if schema has enum AND type is array.
 */
export function shouldUseEnumCheckboxGroup(schema: {
  type?: string
  enum?: unknown[]
  items?: { enum?: unknown[] }
}): boolean {
  // Array of enum values
  if (schema.type === 'array' && schema.items?.enum && schema.items.enum.length > 0) {
    return true
  }
  return false
}

/**
 * Get enum options from schema.
 */
export function getEnumOptions(schema: {
  items?: { enum?: unknown[] }
}): string[] {
  if (schema.items?.enum) {
    return schema.items.enum.map(String)
  }
  return []
}
