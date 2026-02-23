import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ReactNode } from 'react'

const THEME_LIST = ['light', 'dark', 'midnight', 'forest', 'sand', 'ocean']

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      themes={THEME_LIST}
      defaultTheme="light"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  )
}
