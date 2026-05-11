import { describe, it, expect } from 'vitest'
import {
  importWizardReducer,
  initialImportWizardState,
  type ImportWizardState,
} from '../useImportWizard'

const baseSyncResult = {
  events: [],
  errors: [],
  totalRows: 1,
  successfulRows: 1,
}

describe('importWizardReducer', () => {
  it('starts on upload step with no pending payload', () => {
    expect(initialImportWizardState.step).toBe('upload')
    expect(initialImportWizardState.pending).toBeNull()
  })

  it('moves to review on successful sync parse', () => {
    const next = importWizardReducer(initialImportWizardState, {
      type: 'SET_PENDING_SYNC',
      result: baseSyncResult,
    })
    expect(next.step).toBe('review')
    expect(next.pending?.kind).toBe('sync')
  })

  it('stays on validate when no successful rows', () => {
    const next = importWizardReducer(initialImportWizardState, {
      type: 'SET_PENDING_SYNC',
      result: { ...baseSyncResult, successfulRows: 0 },
    })
    expect(next.step).toBe('validate')
  })

  it('reset clears pending and returns to upload', () => {
    const populated: ImportWizardState = {
      ...initialImportWizardState,
      step: 'review',
      pending: { kind: 'sync', result: baseSyncResult },
      appendReplace: 'replace',
      replaceConfirmOpen: true,
    }
    const next = importWizardReducer(populated, { type: 'RESET' })
    expect(next).toEqual(initialImportWizardState)
  })

  it('opens and closes replace confirm', () => {
    const openState = importWizardReducer(initialImportWizardState, {
      type: 'OPEN_REPLACE_CONFIRM',
    })
    expect(openState.replaceConfirmOpen).toBe(true)

    const closed = importWizardReducer(openState, { type: 'CLOSE_REPLACE_CONFIRM' })
    expect(closed.replaceConfirmOpen).toBe(false)
  })
})
