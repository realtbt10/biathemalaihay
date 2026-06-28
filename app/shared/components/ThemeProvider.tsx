'use client'
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import { ConfigProvider, theme } from 'antd'
import viVN from 'antd/locale/vi_VN'

type ThemeMode = 'dark' | 'light'

interface ThemeContextValue {
  mode: ThemeMode
  toggle: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  toggle: () => {},
  isDark: true,
})

export function useThemeMode() {
  return useContext(ThemeContext)
}

const STORAGE_KEY = 'ca_bia_theme'

function buildAntdTheme(isDark: boolean) {
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#6366f1',
      colorBgContainer: isDark ? '#0f0f1a' : '#ffffff',
      colorBgBase: isDark ? '#0a0a12' : '#f1f5f9',
      colorBorder: isDark ? '#2d2d5a' : '#e2e8f0',
      colorBorderSecondary: isDark ? '#1e1e3f' : '#cbd5e1',
      borderRadius: 10,
      fontFamily: 'Inter, system-ui, sans-serif',
      colorText: isDark ? '#e2e8f0' : '#1e293b',
      colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
    },
    components: {
      Card: { colorBgContainer: isDark ? '#0f0f1a' : '#ffffff' },
      Input: { colorBgContainer: isDark ? '#1a1a2e' : '#f8fafc' },
      InputNumber: { colorBgContainer: isDark ? '#1a1a2e' : '#f8fafc' },
      Select: {
        colorBgContainer: isDark ? '#1a1a2e' : '#f8fafc',
        colorBgElevated: isDark ? '#1a1a2e' : '#ffffff',
      },
      DatePicker: {
        colorBgContainer: isDark ? '#1a1a2e' : '#f8fafc',
        colorBgElevated: isDark ? '#1a1a2e' : '#ffffff',
      },
      Button: { colorBgContainer: isDark ? '#1a1a2e' : '#f8fafc' },
      Modal: { colorBgElevated: isDark ? '#0f0f1a' : '#ffffff' },
      Drawer: { colorBgElevated: isDark ? '#0f0f1a' : '#ffffff' },
      Tabs: {
        colorBgContainer: isDark ? '#0a0a12' : '#f1f5f9',
        itemActiveColor: '#6366f1',
        itemSelectedColor: '#6366f1',
        inkBarColor: '#6366f1',
      },
    },
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (saved === 'light' || saved === 'dark') setMode(saved)
    setMounted(true)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  const toggle = () => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  const antdTheme = useMemo(() => buildAntdTheme(mode === 'dark'), [mode])

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a12' }} />
    )
  }

  return (
    <ThemeContext.Provider value={{ mode, toggle, isDark: mode === 'dark' }}>
      <ConfigProvider locale={viVN} theme={antdTheme}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}
