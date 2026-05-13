'use client'

import * as React from 'react'
import { useId } from 'react'
import dayjs from 'dayjs'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatDateTimeForInput, inputDateToISO } from '@/features/liveops/lib/date-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface DateTimePickerProps {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  className?: string
  disabled?: boolean
  /** Optional separate accessible name for the text field (e.g. "End date" for form QA tests). */
  textInputAriaLabel?: string
  /** Passed by react-hook-form + FormControl (Slot) onto the underlying text field */
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: React.AriaAttributes['aria-invalid']
}

function mergePreserveLocalTime(existingIso: string | null | undefined, clickedDay: Date): string {
  const clicked = dayjs(clickedDay).second(0).millisecond(0)
  const baseTime = existingIso ? dayjs(existingIso) : null
  const next = baseTime
    ? clicked.hour(baseTime.hour()).minute(baseTime.minute())
    : clicked.hour(12).minute(0)
  return next.toISOString()
}

export const DateTimePicker = React.forwardRef<HTMLInputElement, DateTimePickerProps>(
  (
    {
      label,
      value,
      onChange,
      className,
      disabled,
      textInputAriaLabel,
      id: idFromField,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
    },
    forwardedRef,
  ) => {
    const fallbackInputId = useId()
    const inputId = idFromField ?? fallbackInputId

    const committed = value ? formatDateTimeForInput(value) : ''
    const [draft, setDraft] = React.useState(committed)
    const lastExplicitPickRef = React.useRef<Date | null>(null)

    React.useEffect(() => {
      setDraft(committed)
    }, [committed])

    const [open, setOpen] = React.useState(false)
    const [viewMonth, setViewMonth] = React.useState(() => new Date())

    const handleOpenChange = (next: boolean) => {
      setOpen(next)
      if (next) {
        const fromLast = lastExplicitPickRef.current
        const fromValue = value ? dayjs(value).toDate() : null
        const seed = fromLast ?? fromValue ?? new Date()
        setViewMonth(startOfMonth(seed))
      }
    }

    const handleTextChange = (raw: string) => {
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

    const handlePickDay = (day: Date) => {
      lastExplicitPickRef.current = dayjs(day).startOf('day').toDate()
      setViewMonth(startOfMonth(day))
      const iso = mergePreserveLocalTime(value, day)
      onChange(iso)
      setDraft(formatDateTimeForInput(iso))
      setOpen(false)
    }

    const monthStart = startOfMonth(viewMonth)
    const monthEnd = endOfMonth(viewMonth)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

    const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    const valueDate = value ? dayjs(value).toDate() : null

    return (
      <div className={cn('flex flex-1 flex-col gap-1', className)}>
        <Label htmlFor={inputId} className="sr-only">
          {label} time
        </Label>
        <div className="flex items-center gap-2">
          <DropdownMenu open={disabled ? false : open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" disabled={disabled}>
                {label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-auto min-w-[280px] p-2"
              align="start"
              data-datepicker-panel="true"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Previous month"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setViewMonth((d) => addMonths(d, -1))
                  }}
                >
                  ‹
                </Button>
                <span className="text-sm font-medium tabular-nums">
                  {format(viewMonth, 'MMMM yyyy')}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Next month"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setViewMonth((d) => addMonths(d, 1))
                  }}
                >
                  ›
                </Button>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-0.5 text-center text-xs text-muted-foreground">
                {weekdayLabels.map((d) => (
                  <div key={d} className="font-medium">
                    {d}
                  </div>
                ))}
              </div>
              <div role="grid" aria-label="Calendar" className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day) => {
                  const active = valueDate !== null && isSameDay(day, valueDate)
                  const inMonth = isSameMonth(day, viewMonth)
                  const ariaName = `${format(day, 'MMMM d, yyyy')}`
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      role="gridcell"
                      aria-label={ariaName}
                      data-day-slot="true"
                      className={cn(
                        'h-8 rounded-md text-sm tabular-nums transition-colors hover:bg-accent',
                        !inMonth && 'text-muted-foreground opacity-45',
                        active && 'border border-primary font-semibold',
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handlePickDay(day)
                      }}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            ref={forwardedRef}
            id={inputId}
            disabled={disabled}
            type="text"
            spellCheck={false}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-label={textInputAriaLabel ?? `${label} time`}
            value={draft}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="YYYY-MM-DDTHH:mm"
            className="flex-1"
          />
        </div>
      </div>
    )
  },
)
DateTimePicker.displayName = 'DateTimePicker'
