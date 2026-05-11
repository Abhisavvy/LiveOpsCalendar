'use client'

import { cn } from '@/lib/utils'
import type { ImportStep } from '../hooks/useImportWizard'

const stepOrder: ImportStep[] = ['upload', 'validate', 'review', 'commit']

const stepLabels: Record<ImportStep, string> = {
  upload: 'Upload',
  validate: 'Validate',
  review: 'Review',
  commit: 'Commit',
}

interface ImportStepHeaderProps {
  step: ImportStep
  className?: string
}

export function ImportStepHeader({ step, className }: ImportStepHeaderProps) {
  const activeIndex = stepOrder.indexOf(step)

  return (
    <ol className={cn('flex items-center gap-3 text-sm text-muted-foreground', className)}>
      {stepOrder.map((item, index) => {
        const isActive = item === step
        const isComplete = index < activeIndex

        return (
          <li
            key={item}
            className={cn(
              'flex items-center gap-2',
              isActive && 'text-foreground font-medium',
              isComplete && 'text-foreground'
            )}
            aria-current={isActive ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border text-xs',
                isActive && 'border-primary text-primary',
                isComplete && 'border-primary bg-primary text-primary-foreground'
              )}
            >
              {index + 1}
            </span>
            <span>{stepLabels[item]}</span>
          </li>
        )
      })}
    </ol>
  )
}
