'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Download, RefreshCw, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LazyImportState, LazyImportStatus } from '../hooks/useLazyImport'

interface LibraryLoaderProps {
  libraryName: string
  state: LazyImportState
  onRetry?: () => void
  onCancel?: () => void
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'card' | 'inline' | 'minimal'
  className?: string
}

function getStatusIcon(status: LazyImportStatus, size: string = 'h-4 w-4') {
  switch (status) {
    case 'loading':
      return <Download className={cn(size, 'animate-pulse text-blue-600')} />
    case 'loaded':
      return <CheckCircle className={cn(size, 'text-green-600')} />
    case 'error':
      return <AlertCircle className={cn(size, 'text-red-600')} />
    default:
      return <Zap className={cn(size, 'text-gray-600')} />
  }
}

function getStatusLabel(status: LazyImportStatus): string {
  switch (status) {
    case 'loading': return 'Loading...'
    case 'loaded': return 'Ready'
    case 'error': return 'Failed'
    default: return 'Not loaded'
  }
}

function getStatusColor(status: LazyImportStatus): string {
  switch (status) {
    case 'loading': return 'bg-blue-500'
    case 'loaded': return 'bg-green-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

function formatLibraryName(name: string): string {
  // Convert camelCase/kebab-case to proper case
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim()
}

// Minimal variant - just status indicator
function MinimalLoader({ libraryName, state, onRetry }: LibraryLoaderProps) {
  return (
    <div className="flex items-center gap-2">
      {getStatusIcon(state.status)}
      <span className="text-sm text-muted-foreground">
        {formatLibraryName(libraryName)}
      </span>
      <Badge variant={state.status === 'loaded' ? 'default' : 'secondary'} className="text-xs">
        {getStatusLabel(state.status)}
      </Badge>
      {state.status === 'error' && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-6 px-2"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

// Inline variant - single row with progress
function InlineLoader({ libraryName, state, onRetry, showProgress = true }: LibraryLoaderProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      {getStatusIcon(state.status)}
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">
            Loading {formatLibraryName(libraryName)}
          </span>
          <Badge variant={state.status === 'loaded' ? 'default' : 'secondary'}>
            {getStatusLabel(state.status)}
          </Badge>
        </div>
        
        {showProgress && state.status === 'loading' && (
          <Progress value={state.progress} className="h-1" />
        )}
        
        {state.error && (
          <p className="text-xs text-red-600 mt-1">{state.error}</p>
        )}
      </div>
      
      {state.status === 'error' && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
}

// Card variant - full card with detailed info
function CardLoader({ 
  libraryName, 
  state, 
  onRetry, 
  onCancel, 
  showProgress = true,
  size = 'md' 
}: LibraryLoaderProps) {
  const iconSize = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className={cn(
        'pb-3',
        size === 'lg' && 'pb-4',
        size === 'sm' && 'pb-2 p-4'
      )}>
        <div className="flex items-center gap-3">
          {getStatusIcon(state.status, iconSize)}
          <div className="flex-1">
            <CardTitle className={cn(
              'text-base',
              size === 'lg' && 'text-lg',
              size === 'sm' && 'text-sm'
            )}>
              {formatLibraryName(libraryName)} Library
            </CardTitle>
            <CardDescription>
              {state.status === 'loading' && 'Downloading and initializing...'}
              {state.status === 'loaded' && 'Ready for use'}
              {state.status === 'error' && 'Failed to load'}
              {state.status === 'idle' && 'Click to load library'}
            </CardDescription>
          </div>
          <Badge variant={state.status === 'loaded' ? 'default' : 'secondary'}>
            {getStatusLabel(state.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={cn(
        'space-y-3',
        size === 'sm' && 'space-y-2 p-4 pt-0'
      )}>
        {/* Progress Section */}
        {showProgress && state.status === 'loading' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Loading progress</span>
              <span className="font-mono">{state.progress}%</span>
            </div>
            <Progress value={state.progress} className="h-2" />
          </div>
        )}

        {/* Error Section */}
        {state.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Loading Failed
              </span>
            </div>
            <p className="text-xs text-red-700">{state.error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            {state.status === 'error' && onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
            
            {state.status === 'loaded' && (
              <Badge variant="outline" className="text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Loaded
              </Badge>
            )}
          </div>
        </div>

        {/* Loading Animation */}
        {state.status === 'loading' && (
          <div className="relative">
            <div 
              className={cn(
                "absolute top-0 left-0 h-1 rounded-full transition-all duration-300",
                getStatusColor(state.status)
              )}
              style={{
                width: `${state.progress}%`,
                animation: 'pulse 2s infinite'
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function LibraryLoader(props: LibraryLoaderProps) {
  const { variant = 'card', className } = props
  
  return (
    <div className={className}>
      {variant === 'minimal' && <MinimalLoader {...props} />}
      {variant === 'inline' && <InlineLoader {...props} />}
      {variant === 'card' && <CardLoader {...props} />}
    </div>
  )
}