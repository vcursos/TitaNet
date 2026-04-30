'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import { ThemeColorsProvider } from '@/components/theme-colors-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <ThemeColorsProvider>
          {children}
        </ThemeColorsProvider>
        <Toaster />
        <ChunkLoadErrorHandler />
      </ThemeProvider>
    </SessionProvider>
  )
}
