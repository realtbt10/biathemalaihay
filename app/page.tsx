'use client'
import { Button } from 'antd'
import { Moon, Sun } from 'lucide-react'
import AppTabs from '@/shared/components/AppTabs'
import { useThemeMode } from '@/shared/components/ThemeProvider'

export default function Home() {
  const { isDark, toggle } = useThemeMode()

  return (
    <main className="min-h-screen app-shell">
      <div className="app-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎱</span>
            <div>
              <h1 className="text-lg font-black leading-none app-title">
                bi-a thế mà lại _ay
              </h1>
              <p className="text-xs leading-none mt-0.5 app-subtitle">hay</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="text"
              aria-label={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
              icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
              onClick={toggle}
              className="theme-toggle-btn"
            />
            <span className="text-xs app-version">v1.0</span>
          </div>
        </div>
      </div>

      <AppTabs />
    </main>
  )
}
