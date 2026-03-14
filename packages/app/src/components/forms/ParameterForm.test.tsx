import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParameterForm } from './ParameterForm'

describe('ParameterForm', () => {
  describe('handleSubmit filters empty values', () => {
    it('does not send empty string values as query params', () => {
      const onSubmit = vi.fn()

      render(
        <ParameterForm
          parameters={[
            { name: 'offset', in: 'query', required: true, description: '', schema: { type: 'integer', default: 0 } },
            { name: 'limit', in: 'query', required: true, description: '', schema: { type: 'integer' } },
          ]}
          onSubmit={onSubmit}
        />
      )

      // offset starts with default "0", limit starts empty ""
      // Clear offset to empty
      const inputs = screen.getAllByRole('spinbutton')
      fireEvent.change(inputs[0]!, { target: { value: '' } })

      // Submit
      fireEvent.submit(screen.getByRole('button', { name: /Fetch Data/i }))

      // Both empty — neither should be sent
      expect(onSubmit).toHaveBeenCalledWith({}, undefined)
    })

    it('sends non-empty values and filters out empty ones', () => {
      const onSubmit = vi.fn()

      render(
        <ParameterForm
          parameters={[
            { name: 'offset', in: 'query', required: true, description: '', schema: { type: 'integer', default: 0 } },
            { name: 'limit', in: 'query', required: true, description: '', schema: { type: 'integer' } },
          ]}
          onSubmit={onSubmit}
        />
      )

      // offset starts with default "0", limit starts empty ""
      // Change offset to "5"
      const inputs = screen.getAllByRole('spinbutton')
      fireEvent.change(inputs[0]!, { target: { value: '5' } })

      // Submit
      fireEvent.submit(screen.getByRole('button', { name: /Fetch Data/i }))

      // offset="5" sent, limit="" filtered out
      expect(onSubmit).toHaveBeenCalledWith({ offset: '5' }, undefined)
    })
  })
})
