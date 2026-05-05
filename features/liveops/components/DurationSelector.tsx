'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { DurationOption, DURATION_OPTIONS } from '../types/events'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DurationSelectorProps {
  value: DurationOption
  onValueChange: (value: DurationOption) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DurationSelector({
  value,
  onValueChange,
  label,
  placeholder = "Select duration",
  disabled = false,
  className,
}: DurationSelectorProps) {
  return (
    <div className={className}>
      {label && (
        <Label className="text-sm font-medium mb-2 block">
          {label}
        </Label>
      )}
      
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {DURATION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({option.hours}h)
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Helper component for form integration
interface DurationFieldProps {
  value: DurationOption
  onChange: (value: DurationOption) => void
  error?: string
  label?: string
  required?: boolean
}

export function DurationField({
  value,
  onChange,
  error,
  label = "Duration",
  required = false,
}: DurationFieldProps) {
  return (
    <div className="space-y-2">
      <DurationSelector
        value={value}
        onValueChange={onChange}
        label={required ? `${label} *` : label}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}