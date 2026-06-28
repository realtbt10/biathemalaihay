'use client'
import { Card, Tabs } from 'antd'
import dynamic from 'next/dynamic'
import { useThemeMode } from './ThemeProvider'

const BillingPage = dynamic(() => import('@/features/billing/components/BillingPage'), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500 text-sm">Đang tải...</div>
})

const ScoringPage = dynamic(() => import('@/features/scoring/components/ScoringPage'), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500 text-sm">Đang tải...</div>
})

export default function AppTabs() {
  const { isDark } = useThemeMode()

  return (
    <div className="page-shell">
      <Card
        className="page-shell-card"
        bordered={false}
        styles={{ body: { padding: 24 } }}
      >
        <Tabs
          defaultActiveKey="billing"
          className="app-tabs"
          destroyInactiveTabPane
          animated={false}
          tabBarStyle={{
            padding: 0,
            marginBottom: 16,
            background: 'transparent',
            borderBottom: `1px solid ${isDark ? '#1e1e3f' : '#e2e8f0'}`,
          }}
          items={[
            {
              key: 'billing',
              label: (
                <span className="flex items-center gap-1.5 font-medium">
                  🎱 Tính Cá Bi-A
                </span>
              ),
              children: <BillingPage />,
            },
            {
              key: 'scoring',
              label: (
                <span className="flex items-center gap-1.5 font-medium">
                  🏆 Mâm Đền Đại Chiến
                </span>
              ),
              children: <ScoringPage />,
            },
          ]}
        />
      </Card>
    </div>
  )
}
