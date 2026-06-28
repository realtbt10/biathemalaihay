'use client'
import { useState } from 'react'
import { Card, DatePicker, InputNumber, Button, Tag, Alert } from 'antd'
import { Trash2, Calculator, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import dayjs from 'dayjs'
import { BillingSession } from '../types/billing.types'
import { APP_CONFIG } from '@/shared/constants/config'
import { MONEY_INPUT_PROPS } from '@/shared/utils/money'
import { generateId } from '@/shared/utils/id'
import TouchTooltip from '@/shared/components/TouchTooltip'
import PlayerScoreList from './PlayerScoreList'
import ExtraCostSection from './ExtraCostSection'
import SettlementModal from './SettlementModal'
import { validateScores } from '../utils/billing.utils'

interface Props {
  session: BillingSession
  onChange: (session: BillingSession) => void
  onDelete: () => void
}

export default function SessionCard({ session, onChange, onDelete }: Props) {
  const [showExtra, setShowExtra] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const update = (patch: Partial<BillingSession>) => {
    onChange({ ...session, ...patch })
  }

  const handlePlayerCountChange = (count: number | null) => {
    const n = count || 2
    const currentPlayers = session.players
    const newPlayers = Array.from({ length: n }, (_, i) => {
      return currentPlayers[i] || {
        id: generateId(),
        name: `${APP_CONFIG.DEFAULT_PLAYER_PREFIX} ${i + 1}`,
        score: 0
      }
    })
    // Re-calc last player auto-fill
    if (newPlayers.length > 1) {
      const sumExceptLast = newPlayers.slice(0, -1).reduce((s, p) => s + (p.score || 0), 0)
      newPlayers[newPlayers.length - 1] = {
        ...newPlayers[newPlayers.length - 1],
        score: -sumExceptLast
      }
    }
    update({ playerCount: n, players: newPlayers })
  }

  const scoresValid = validateScores(session)
  const borderColor = session.isSettled ? '#10b981' : !scoresValid && session.players.length > 0 ? '#f59e0b' : '#6366f1'

  return (
    <>
      <Card
        className="session-card"
        style={{ borderColor, boxShadow: `0 0 0 1px ${borderColor}30` }}
        styles={{ body: { padding: '16px' }, header: { padding: '12px 16px', minHeight: 48 } }}
        title={
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">
              {session.date ? `Ngày ${session.date}` : 'Phiên mới'}
            </span>
            {session.isSettled && (
              <Tag icon={<CheckCircle2 size={10} />} color="green" className="text-xs">
                Đã tính
              </Tag>
            )}
            {!scoresValid && session.players.length > 0 && (
              <Tag color="warning" className="text-xs">Điểm chưa cân</Tag>
            )}
          </div>
        }
        extra={
          <div className="flex flex-wrap items-center gap-1">
            <TouchTooltip title="Chi phí khác">
              <Button
                size="small"
                type={showExtra ? 'primary' : 'default'}
                ghost={showExtra}
                onClick={() => setShowExtra(!showExtra)}
                icon={showExtra ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                className="touch-btn"
              >
                Chi phí khác
              </Button>
            </TouchTooltip>
            <TouchTooltip title="Tính kết quả">
              <Button
                size="small"
                type="primary"
                icon={<Calculator size={14} />}
                onClick={() => setShowModal(true)}
                disabled={!scoresValid || session.players.length < 2}
                style={{ background: '#6366f1' }}
                className="touch-btn"
              >
                Tính kết quả
              </Button>
            </TouchTooltip>
            <TouchTooltip title="Xóa phiên">
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={onDelete}
                className="touch-btn !w-8 !h-8 !p-0"
              />
            </TouchTooltip>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Basic config row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ngày chơi</label>
              <DatePicker
                value={session.date ? dayjs(session.date, APP_CONFIG.DATE_FORMAT) : null}
                format={APP_CONFIG.DATE_FORMAT}
                onChange={d => update({ date: d ? d.format(APP_CONFIG.DATE_FORMAT) : '' })}
                size="small"
                className="w-full"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Số cá bàn</label>
              <InputNumber
                value={session.tableFee || undefined}
                onChange={v => update({ tableFee: v || 0 })}
                min={0}
                size="small"
                className="w-full"
                suffix={APP_CONFIG.UNIT}
                placeholder="0"
                {...MONEY_INPUT_PROPS}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Số cá / điểm</label>
              <InputNumber
                value={session.scoreRate || undefined}
                onChange={v => update({ scoreRate: v || 0 })}
                min={0}
                size="small"
                className="w-full"
                suffix={`${APP_CONFIG.UNIT}/đ`}
                placeholder="0"
                {...MONEY_INPUT_PROPS}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Số người chơi</label>
              <InputNumber
                value={session.playerCount || undefined}
                onChange={handlePlayerCountChange}
                min={2}
                max={10}
                size="small"
                className="w-full"
                placeholder="2"
              />
            </div>
          </div>

          {/* Score validation alert */}
          {!scoresValid && session.players.length > 1 && (
            <Alert
              type="warning"
              className="!bg-yellow-500/10 !border-yellow-500/30"
              message={
                <span className="text-xs">
                  ⚠️ Tổng điểm chưa bằng 0. Kiểm tra lại điểm từng người.
                  (Tổng hiện tại: {session.players.reduce((s, p) => s + p.score, 0)})
                </span>
              }
              showIcon={false}
            />
          )}

          {/* Player score list */}
          {session.players.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Điểm từng người</label>
              <PlayerScoreList
                players={session.players}
                onChange={players => update({ players })}
              />
            </div>
          )}
        </div>

        {/* Extra costs section */}
        {showExtra && session.players.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <label className="text-xs text-gray-400 mb-2 block">💸 Chi phí khác</label>
            <ExtraCostSection
              players={session.players}
              extraCosts={session.extraCosts}
              onChange={extraCosts => update({ extraCosts })}
            />
          </div>
        )}
      </Card>

      <SettlementModal
        session={session}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={updated => { onChange(updated); setShowModal(false) }}
      />
    </>
  )
}
