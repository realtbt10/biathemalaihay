import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ThemeProvider } from '@/shared/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Cá Bi-A 🎱',
  description: 'Ứng dụng tính cá bi-a và điểm mâm đền',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="app-body">
        <AntdRegistry>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
