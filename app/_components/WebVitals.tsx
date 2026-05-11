'use client'

import { useReportWebVitals } from 'next/web-vitals'

type WebVitalsMetric = Parameters<typeof useReportWebVitals>[0] extends (m: infer M) => void ? M : unknown

export function WebVitals() {
  useReportWebVitals((metric: WebVitalsMetric) => {
    // Phase 0 baseline: log metrics in dev for quick iteration.
    if (process.env.NODE_ENV !== 'production') {
      console.log('[web-vitals]', metric)
    }
  })

  return null
}

