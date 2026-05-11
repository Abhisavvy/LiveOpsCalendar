'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { LiveOpsEvent } from '../types/events'
import { cn } from '@/lib/utils'

interface ImportReviewPanelProps {
  events: LiveOpsEvent[]
  appendReplace: 'append' | 'replace'
  existingCount: number
  onAppendReplaceChange: (value: 'append' | 'replace') => void
  onBack?: () => void
  onCommit?: () => void
  className?: string
}

export function ImportReviewPanel({
  events,
  appendReplace,
  existingCount,
  onAppendReplaceChange,
  onBack,
  onCommit,
  className,
}: ImportReviewPanelProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{events.length} events ready</Badge>
        {existingCount > 0 && (
          <Badge className="bg-blue-600 text-white">{existingCount} existing</Badge>
        )}
      </div>

      {existingCount > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Commit behavior</div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={appendReplace === 'append' ? 'default' : 'outline'}
              onClick={() => onAppendReplaceChange('append')}
            >
              Append
            </Button>
            <Button
              size="sm"
              variant={appendReplace === 'replace' ? 'destructive' : 'outline'}
              onClick={() => onAppendReplaceChange('replace')}
            >
              Replace
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <caption className="sr-only">Preview of imported events</caption>
          <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Start</th>
              <th className="px-3 py-2 text-left">End</th>
              <th className="px-3 py-2 text-left">Cohort</th>
              <th className="px-3 py-2 text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(0, 5).map((event) => (
              <tr key={event.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">{event.title}</td>
                <td className="px-3 py-2">{event.start}</td>
                <td className="px-3 py-2">{event.end}</td>
                <td className="px-3 py-2">{event.cohort}</td>
                <td className="px-3 py-2">{event.eventType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        {onCommit && (
          <Button onClick={onCommit} disabled={events.length === 0}>
            Commit import
          </Button>
        )}
      </div>
    </div>
  )
}
