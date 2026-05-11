import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { WebVitals } from './_components/WebVitals'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrains = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'LiveOps Event Calendar',
  description: 'Internal LiveOps Event Calendar tool for mobile game operations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased`}>
        <div className="relative flex min-h-screen flex-col bg-background">
          <main className="flex-1">
            {children}
          </main>
        </div>
        <WebVitals />
        <Toaster />
      </body>
    </html>
  )
}