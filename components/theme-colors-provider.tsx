'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface ThemeColors {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  companyName: string
  logoUrl: string | null
}

const defaults: ThemeColors = {
  primaryColor: '#0066CC',
  secondaryColor: '#FFFFFF',
  accentColor: '#003E80',
  companyName: 'TitaNet',
  logoUrl: null,
}

interface Ctx extends ThemeColors {
  refresh: () => Promise<void>
}

const ThemeColorsContext = createContext<Ctx>({
  ...defaults,
  refresh: async () => {},
})

// Converte hex (#0066CC) para HSL string "H S% L%" (sem hsl())
function hexToHslVar(hex: string): string {
  try {
    const cleaned = (hex ?? '#0066CC').replace('#', '')
    const fullHex = cleaned.length === 3
      ? cleaned.split('').map((c) => c + c).join('')
      : cleaned
    const r = parseInt(fullHex.substring(0, 2), 16) / 255
    const g = parseInt(fullHex.substring(2, 4), 16) / 255
    const b = parseInt(fullHex.substring(4, 6), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  } catch {
    return '212 100% 40%'
  }
}

function applyCssVars(colors: ThemeColors) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--primary', hexToHslVar(colors.primaryColor))
  root.style.setProperty('--ring', hexToHslVar(colors.primaryColor))
  root.style.setProperty('--chart-1', hexToHslVar(colors.primaryColor))
  root.style.setProperty('--chart-2', hexToHslVar(colors.accentColor))
  root.style.setProperty('--accent', hexToHslVar(colors.accentColor) + ' / 0.1')
}

export function ThemeColorsProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(defaults)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const next: ThemeColors = {
        primaryColor: data?.primaryColor ?? defaults.primaryColor,
        secondaryColor: data?.secondaryColor ?? defaults.secondaryColor,
        accentColor: data?.accentColor ?? defaults.accentColor,
        companyName: data?.companyName ?? defaults.companyName,
        logoUrl: data?.logoUrl ?? null,
      }
      setColors(next)
      applyCssVars(next)
    } catch (e) {
      // silencioso - mantém defaults
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <ThemeColorsContext.Provider value={{ ...colors, refresh }}>
      {children}
    </ThemeColorsContext.Provider>
  )
}

export const useThemeColors = () => useContext(ThemeColorsContext)
