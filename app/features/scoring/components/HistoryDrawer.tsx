'use client'
import { Drawer, Tag } from 'antd'
import { TurnState } from '../types/scoring.types'
import { ScoringPlayer } from '../types/scoring.types'
import dayjs from 'dayjs'

interface Props {
  open: boolean
  onClose: () => void
  history: TurnState[]
  players: ScoringPlayer[]
}

export default function HistoryDrawer({ open, onClose, history, players }: Props) {
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || id

  return (
    <Drawer
      title="📜 Lịch sử thao tác"
      placement="right"
      onClose={onClose}
      open={open}
      width={360}
      styles={{
        body: { background: '#0f0f1a', padding: 12 },
        header: { background: '#0f0f1a', borderBottom: '1px solid #1e1e3f' }
      }}
    >
      {history.length === 0 ? (
        <div className="text-center text-gray-500 py-10">Chưa có thao tác nào</div>
      ) : (
        <div className="space-y-2">
          {[...history].reverse().map((snap, i) => (
            <div
              key={i}
              className="rounded-lg p-2.5 text-xs border"
              style={{ background: '#1a1a2e', borderColor: '#2d2d5a' }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Tag
                  color={snap.action === 'miss_turn' ? 'orange' : 'purple'}
                  className="text-xs"
                >
                  #{history.length - i} {snap.action === 'miss_turn' ? 'Mất lượt' : 'Điểm'}
                </Tag>
                <span className="text-gray-500">
                  {dayjs(snap.timestamp).format('HH:mm:ss')}
                </span>
              </div>
              <div className="text-gray-300 mb-1.5">{snap.description}</div>
              <div className="flex flex-wrap gap-1">
                {snap.order.map((id, pos) => (
                  <span
                    key={id}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: '#6366f115', border: '1px solid #6366f130', color: '#a5b4fc' }}
                  >
                    {pos + 1}. {getPlayerName(id)}: {snap.scores[id] ?? 0}đ
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  )
}
