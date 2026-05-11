'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ImportStep } from '../hooks/useImportWizard'
import { ImportStepHeader } from './ImportStepHeader'
import { cn } from '@/lib/utils'

interface ImportWizardShellProps {
  step: ImportStep
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function ImportWizardShell({
  step,
  title = 'Batch Import',
  description = 'Upload, validate, review, and commit events in a guided flow.',
  children,
  footer,
  className,
}: ImportWizardShellProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <ImportStepHeader step={step} />
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter className="justify-end gap-2">{footer}</CardFooter> : null}
    </Card>
  )
}
