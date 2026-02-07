import { Slider } from '@/components/ui/slider'

interface RangeSliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  label: string
}

export function RangeSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: RangeSliderProps) {
  return (
    <div className="space-y-3">
      {/* Label and current value */}
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          {value}
        </span>
      </div>

      {/* Slider track */}
      <Slider
        value={[value]}
        onValueChange={([newValue]) => {
          if (newValue !== undefined) {
            onChange(newValue)
          }
        }}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />

      {/* Min/max labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

/**
 * Helper to check if a parameter should use RangeSlider.
 * Only returns true if BOTH min and max are explicitly defined.
 */
export function shouldUseSlider(schema: {
  minimum?: number
  maximum?: number
  type?: string
}): boolean {
  return (
    schema.minimum !== undefined &&
    schema.maximum !== undefined &&
    (schema.type === 'integer' || schema.type === 'number')
  )
}
