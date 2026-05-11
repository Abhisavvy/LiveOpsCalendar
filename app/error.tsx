'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Intentionally minimal: keep logs for local debugging without adding
    // third-party monitoring during Phase 0.
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The Live Ops tool hit an unexpected error. You can try again, or reload the page.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>

        <details className="mt-5 rounded-md bg-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-medium">Technical details</summary>
          <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ''}
          </pre>
        </details>
      </div>
    </div>
  )
}

