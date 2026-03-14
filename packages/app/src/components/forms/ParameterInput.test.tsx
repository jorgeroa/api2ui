import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParameterInput } from './ParameterInput'

/** Helper to create a minimal parameter for testing */
function makeParam(overrides: Partial<Parameters<typeof ParameterInput>[0]['parameter']> = {}) {
  return {
    name: 'offset',
    in: 'query' as const,
    required: false,
    description: '',
    schema: { type: 'integer' as const, default: 0 },
    ...overrides,
  }
}

describe('ParameterInput', () => {
  describe('number input wheel scroll protection', () => {
    it('blurs on wheel event to prevent accidental value changes (schema integer)', () => {
      const onChange = vi.fn()
      render(
        <ParameterInput
          parameter={makeParam({ schema: { type: 'integer', default: 0 } })}
          value="1"
          onChange={onChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      input.focus()
      expect(document.activeElement).toBe(input)

      fireEvent.wheel(input)
      expect(document.activeElement).not.toBe(input)
      // Value should remain unchanged — no onChange from wheel
      expect(onChange).not.toHaveBeenCalled()
    })

    it('blurs on wheel event to prevent accidental value changes (inferred number type)', () => {
      const onChange = vi.fn()
      render(
        <ParameterInput
          parameter={makeParam({ schema: { type: 'string' } })}
          value="5"
          onChange={onChange}
          inferredType="number"
        />
      )

      const input = screen.getByRole('spinbutton')
      input.focus()
      expect(document.activeElement).toBe(input)

      fireEvent.wheel(input)
      expect(document.activeElement).not.toBe(input)
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('number input value handling', () => {
    it('passes through typed value without transformation', () => {
      const onChange = vi.fn()
      render(
        <ParameterInput
          parameter={makeParam({ schema: { type: 'integer', default: 0 } })}
          value=""
          onChange={onChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '1' } })
      expect(onChange).toHaveBeenCalledWith('1')
    })

    it('does not coerce or transform the string value', () => {
      const onChange = vi.fn()
      render(
        <ParameterInput
          parameter={makeParam({ schema: { type: 'integer', default: 0 } })}
          value="42"
          onChange={onChange}
        />
      )

      const input = screen.getByRole('spinbutton') as HTMLInputElement
      expect(input.value).toBe('42')
    })
  })
})
