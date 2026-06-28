'use client'
import { useEffect, useRef } from 'react'
import { Button, Skeleton, Empty, Modal } from 'antd'
import { Plus, Trophy } from 'lucide-react'
import { useBillingStorage } from '../hooks/useBillingStorage'
import SessionCard from './SessionCard'
import { BillingSession } from '../types/billing.types'
import { APP_CONFIG } from '@/shared/constants/config'
import { generateId } from '@/shared/utils/id'
import dayjs from 'dayjs'

export default function BillingPage() {
  const { state, hydrated, addSession, updateSession, deleteSession, resetAll } = useBillingStorage()
  const newCardRef = useRef<HTMLDivElement>(null)

  const handleAdd = () => {
    const session: BillingSession = {
      id: generateId(),
      date: dayjs().format(APP_CONFIG.DATE_FORMAT),
      tableFee: 0,
      playerCount: 0,
      scoreRate: 0,
      players: [],
      extraCosts: [],
      tableFeePayment: null,
      paymentAssignments: [],
      isSettled: false
    }
    addSession(session)
    setTimeout(() => {
      newCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleReset = () => {
    Modal.confirm({
      title: 'Làm mới dữ liệu Tính Cá Bi-A?',
      content: 'Toàn bộ phiên chơi sẽ bị xóa. Tab Bảng Điểm Mâm không bị ảnh hưởng.',
      okText: 'Xóa hết',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: resetAll,

    })
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xóa phiên này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => deleteSession(id),
    })
  }

  if (!hydrated) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2].map(i => <Skeleton key={i} active paragraph={{ rows: 5 }} />)}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy size={20} className="text-indigo-400" />
            Tính Cá Bi-A
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {state.sessions.length} phiên chơi
          </p>
        </div>
        <div className="flex gap-2">
          {state.sessions.length > 0 && (
            <Button size="small" onClick={handleReset} danger ghost>
              Làm mới
            </Button>
          )}
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={handleAdd}
            style={{ background: '#6366f1' }}
            className="touch-btn"
          >
            Thêm phiên
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {state.sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🎱</div>
          <Empty
            description={
              <div className="text-center">
                <div className="text-gray-300 font-medium mb-1">Chưa có phiên chơi nào</div>
                <div className="text-gray-500 text-sm">Bấm "Thêm phiên" để bắt đầu tính cá bi-a</div>
              </div>
            }
            imageStyle={{ display: 'none' }}
          />
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={handleAdd}
            style={{ background: '#6366f1', marginTop: 16 }}
            size="large"
            className="touch-btn"
          >
            Thêm phiên đầu tiên
          </Button>
        </div>
      )}

      {/* Sessions */}
      <div className="space-y-4" ref={newCardRef}>
        {state.sessions.map((session, idx) => (
          <div key={session.id} ref={idx === 0 ? newCardRef : undefined}>
            <SessionCard
              session={session}
              onChange={updateSession}
              onDelete={() => handleDelete(session.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
