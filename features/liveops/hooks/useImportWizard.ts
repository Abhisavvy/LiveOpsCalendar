'use client'

import { useReducer, useMemo } from 'react'
import type { CsvProcessingResult, LiveOpsEvent } from '../types/events'
import type { BatchImportResult } from './useBatchImport'

export type ImportStep = 'upload' | 'validate' | 'review' | 'commit'

export type PendingImport =
  | { kind: 'sync'; result: CsvProcessingResult }
  | { kind: 'batch'; result: BatchImportResult }

export interface ImportWizardState {
  step: ImportStep
  pending: PendingImport | null
  appendReplace: 'append' | 'replace'
  replaceConfirmOpen: boolean
}

export type ImportWizardAction =
  | { type: 'START_FILE' }
  | { type: 'SET_PENDING_SYNC'; result: CsvProcessingResult }
  | { type: 'SET_PENDING_BATCH'; result: BatchImportResult }
  | { type: 'SET_APPEND_REPLACE'; value: 'append' | 'replace' }
  | { type: 'OPEN_REPLACE_CONFIRM' }
  | { type: 'CLOSE_REPLACE_CONFIRM' }
  | { type: 'RESET' }

export const initialImportWizardState: ImportWizardState = {
  step: 'upload',
  pending: null,
  appendReplace: 'append',
  replaceConfirmOpen: false,
}

export function importWizardReducer(
  state: ImportWizardState,
  action: ImportWizardAction
): ImportWizardState {
  switch (action.type) {
    case 'START_FILE':
      return {
        ...initialImportWizardState,
        step: 'validate',
      }
    case 'SET_PENDING_SYNC': {
      const nextStep = action.result.successfulRows > 0 ? 'review' : 'validate'
      return {
        ...state,
        step: nextStep,
        pending: { kind: 'sync', result: action.result },
      }
    }
    case 'SET_PENDING_BATCH': {
      const nextStep = action.result.successfulRows > 0 ? 'review' : 'validate'
      return {
        ...state,
        step: nextStep,
        pending: { kind: 'batch', result: action.result },
      }
    }
    case 'SET_APPEND_REPLACE':
      return {
        ...state,
        appendReplace: action.value,
        replaceConfirmOpen: action.value === 'replace' ? state.replaceConfirmOpen : false,
      }
    case 'OPEN_REPLACE_CONFIRM':
      return {
        ...state,
        replaceConfirmOpen: true,
      }
    case 'CLOSE_REPLACE_CONFIRM':
      return {
        ...state,
        replaceConfirmOpen: false,
      }
    case 'RESET':
      return initialImportWizardState
    default:
      return state
  }
}

export function useImportWizard() {
  const [state, dispatch] = useReducer(importWizardReducer, initialImportWizardState)

  const previewEvents = useMemo<LiveOpsEvent[]>(() => {
    if (!state.pending) return []
    return state.pending.result.events
  }, [state.pending])

  const canAdvanceToReview = useMemo(() => {
    if (!state.pending) return false
    return state.pending.result.successfulRows > 0
  }, [state.pending])

  return {
    state,
    dispatch,
    previewEvents,
    canAdvanceToReview,
  }
}
