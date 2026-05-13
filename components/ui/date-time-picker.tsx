'use client'

import * as React from 'react'
import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatDateTimeForInput, inputDateToISO } from '@/features/liveops/lib/date-utils'

export interface DateTimePickerProps {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  className?: string
}

export function DateTimePicker({ label, value, onChange, className }: DateTimePickerProps) {
  const inputId = useId()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const committed = value ? formatDateTimeForInput(value) : ''
  const [draft, setDraft] = React.useState(committed)

  React.useEffect(() => {
    setDraft(committed)
  }, [committed])

  const handleChange = (raw: string) => {
    setDraft(raw)
    const trimmed = raw.trim()
    if (!trimmed) {
      onChange(null)
      return
    }
    const iso = inputDateToISO(trimmed)
    if (iso) {
      onChange(iso)
    }
  }

  return (
    <div className={cn('flex flex-1 flex-col gap-1', className)}>
      <Label htmlFor={inputId} className="sr-only">
        {label} time
      </Label>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.focus()}>
          {label}
        </Button>
        <Input
          ref={inputRef}
          id={inputId}
          type="datetime-local"
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  )
}
