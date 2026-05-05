'use client'

import React from 'react'
import { Control, Controller, UseFormWatch } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RecurrenceConfig } from '../types/events'
import { formatForInput } from '../lib/date-utils'

interface RecurrenceConfigProps {
  value?: RecurrenceConfig
  onChange: (value: RecurrenceConfig | undefined) => void
  className?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
]

export function RecurrenceConfig({ value, onChange, className }: RecurrenceConfigProps) {
  const handleFrequencyChange = (frequency: RecurrenceConfig['frequency']) => {
    const newConfig: RecurrenceConfig = {
      frequency,
      interval: value?.interval || 1,
      until: value?.until,
      count: value?.count,
    }
    
    // Reset type-specific fields when frequency changes
    if (frequency !== 'weekly') {
      delete newConfig.daysOfWeek
    }
    if (frequency !== 'monthly') {
      delete newConfig.dayOfMonth
      delete newConfig.monthlyPattern
    }
    
    onChange(newConfig)
  }

  const handleIntervalChange = (interval: string) => {
    const intervalNum = parseInt(interval, 10)
    if (value && !isNaN(intervalNum) && intervalNum > 0) {
      onChange({ ...value, interval: intervalNum })
    }
  }

  const handleDaysOfWeekChange = (dayIndex: number, checked: boolean) => {
    if (!value) return
    
    const currentDays = value.daysOfWeek || []
    const newDays = checked 
      ? [...currentDays, dayIndex].sort()
      : currentDays.filter(day => day !== dayIndex)
    
    onChange({ ...value, daysOfWeek: newDays })
  }

  const handleDayOfMonthChange = (day: string) => {
    const dayNum = parseInt(day, 10)
    if (value && !isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      onChange({ ...value, dayOfMonth: dayNum })
    }
  }

  const handleMonthlyPatternChange = (pattern: 'date' | 'weekday') => {
    if (value) {
      onChange({ ...value, monthlyPattern: pattern })
    }
  }

  const handleUntilChange = (until: string) => {
    if (value) {
      onChange({ ...value, until: until || undefined, count: undefined })
    }
  }

  const handleCountChange = (count: string) => {
    const countNum = parseInt(count, 10)
    if (value) {
      if (count === '' || isNaN(countNum)) {
        onChange({ ...value, count: undefined })
      } else if (countNum > 0) {
        onChange({ ...value, count: countNum, until: undefined })
      }
    }
  }

  const handleRemoveRecurrence = () => {
    onChange(undefined)
  }

  if (!value) {
    return (
      <div className={className}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({
            frequency: 'daily',
            interval: 1,
          })}
        >
          Add Recurrence
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 p-4 border rounded-lg bg-muted/20 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Recurrence Pattern</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveRecurrence}
          className="text-destructive hover:text-destructive"
        >
          Remove
        </Button>
      </div>

      {/* Frequency Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Repeat</Label>
          <Select value={value.frequency} onValueChange={handleFrequencyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Every</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="365"
              value={value.interval}
              onChange={(e) => handleIntervalChange(e.target.value)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">
              {value.frequency === 'daily' && (value.interval === 1 ? 'day' : 'days')}
              {value.frequency === 'weekly' && (value.interval === 1 ? 'week' : 'weeks')}
              {value.frequency === 'monthly' && (value.interval === 1 ? 'month' : 'months')}
              {value.frequency === 'custom' && 'intervals'}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Specific: Days of Week */}
      {value.frequency === 'weekly' && (
        <div>
          <Label className="text-xs mb-2 block">On these days</Label>
          <div className="flex gap-2 flex-wrap">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = value.daysOfWeek?.includes(day.value) || false
              return (
                <Button
                  key={day.value}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDaysOfWeekChange(day.value, !isSelected)}
                  className="w-12 h-8 p-0 text-xs"
                >
                  {day.short}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly Specific: Day of Month */}
      {value.frequency === 'monthly' && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Monthly pattern</Label>
            <Select
              value={value.monthlyPattern || 'date'}
              onValueChange={handleMonthlyPatternChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">On day of month</SelectItem>
                <SelectItem value="weekday">On weekday of month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {value.monthlyPattern === 'date' && (
            <div>
              <Label className="text-xs">Day of month</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={value.dayOfMonth || ''}
                onChange={(e) => handleDayOfMonthChange(e.target.value)}
                placeholder="e.g., 15"
                className="w-20"
              />
            </div>
          )}
        </div>
      )}

      {/* End Condition */}
      <div>
        <Label className="text-xs mb-2 block">End condition</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Until:</Label>
            <Input
              type="date"
              value={value.until ? formatForInput(value.until) : ''}
              onChange={(e) => handleUntilChange(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">Or after:</Label>
            <Input
              type="number"
              min="1"
              max="1000"
              value={value.count || ''}
              onChange={(e) => handleCountChange(e.target.value)}
              placeholder="Number of occurrences"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-xs text-muted-foreground p-2 bg-background rounded border">
        <strong>Summary:</strong> {getRecurrenceSummary(value)}
      </div>
    </div>
  )
}

/**
 * Generate human-readable recurrence summary
 */
function getRecurrenceSummary(config: RecurrenceConfig): string {
  const { frequency, interval, daysOfWeek, dayOfMonth, monthlyPattern, until, count } = config
  
  let summary = ''
  
  // Base frequency
  if (frequency === 'daily') {
    summary = interval === 1 ? 'Daily' : `Every ${interval} days`
  } else if (frequency === 'weekly') {
    summary = interval === 1 ? 'Weekly' : `Every ${interval} weeks`
    
    if (daysOfWeek?.length) {
      const dayNames = daysOfWeek.map(d => DAYS_OF_WEEK[d]?.short).join(', ')
      summary += ` on ${dayNames}`
    }
  } else if (frequency === 'monthly') {
    summary = interval === 1 ? 'Monthly' : `Every ${interval} months`
    
    if (monthlyPattern === 'date' && dayOfMonth) {
      summary += ` on day ${dayOfMonth}`
    }
  } else {
    summary = `Every ${interval} custom intervals`
  }
  
  // End condition
  if (until) {
    summary += ` until ${new Date(until).toLocaleDateString()}`
  } else if (count) {
    summary += ` for ${count} occurrence${count === 1 ? '' : 's'}`
  }
  
  return summary
}