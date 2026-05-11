'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen w-full flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Critical error</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The app failed to render. Try again or reload the page.
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
      </body>
    </html>
  )
}

