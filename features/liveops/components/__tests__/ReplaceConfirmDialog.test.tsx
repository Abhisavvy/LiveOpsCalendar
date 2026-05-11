import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReplaceConfirmDialog } from '../ReplaceConfirmDialog'

describe('ReplaceConfirmDialog', () => {
  it('calls onConfirm when destructive action is activated', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ReplaceConfirmDialog
        open
        existingCount={3}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /replace all events/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
