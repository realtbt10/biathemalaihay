'use client'
import { useState } from 'react'
import { Button, InputNumber, Input, Skeleton, Tag, Modal, Divider } from 'antd'
import { Minus, Plus, Undo2, Redo2, History, RotateCcw, Play, Crown } from 'lucide-react'
import { useScoringStorage } from '../hooks/useScoringStorage'
import HistoryDrawer from './HistoryDrawer'
import { APP_CONFIG } from '@/shared/constants/config'
import TouchTooltip from '@/shared/components/TouchTooltip'

export default function ScoringPage() {
  const { state, hydrated, startGame, changeScore, missTurn, undo, redo, resetAll } = useScoringStorage()
  const [playerCount, setPlayerCount] = useState(4)
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const handleStart = () => {
    const names = Array.from({ length: playerCount }, (_, i) =>
      playerNames[i] || `Người ${i + 1}`
    )
    startGame(names)
  }

  const handleReset = () => {
    Modal.confirm({
      title: 'Làm mới Mâm Đền Đại Chiến?',
      content: 'Toàn bộ điểm và lịch sử sẽ bị xóa. Tab Tính Cá Bi-A không bị ảnh hưởng.',
      okText: 'Xóa hết',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: resetAll,
    })
  }

  if (!hydrated) {
    return <div className="p-4"><Skeleton active paragraph={{ rows: 6 }} /></div>
  }

  if (!state.started) {
    // Setup screen
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-xl font-bold text-white">Mâm Đền Đại Chiến</h2>
          <p className="text-gray-500 text-sm mt-1">Tính điểm mâm đền theo lượt</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Số người chơi</label>
            <InputNumber
              value={playerCount}
              onChange={v => {
                setPlayerCount(v || 2)
                setPlayerNames(prev => {
                  const n = v || 2
                  return Array.from({ length: n }, (_, i) => prev[i] || '')
                })
              }}
              min={2}
              max={8}
              size="large"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400 mb-1 block">Tên người chơi</label>
            {Array.from({ length: playerCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: `${APP_CONFIG.BORDER_COLORS[i % APP_CONFIG.BORDER_COLORS.length]}20`,
                    color: APP_CONFIG.BORDER_COLORS[i % APP_CONFIG.BORDER_COLORS.length]
                  }}
                >
                  {i + 1}
                </span>
                <Input
                  placeholder={`Người ${i + 1}`}
                  value={playerNames[i] || ''}
                  onChange={e => {
                    const next = [...playerNames]
                    next[i] = e.target.value
                    setPlayerNames(next)
                  }}
                  size="small"
                />
              </div>
            ))}
          </div>

          <Button
            type="primary"
            size="large"
            icon={<Play size={16} />}
            onClick={handleStart}
            className="w-full"
            style={{ background: '#6366f1', height: 48, fontSize: 16 }}
          >
            Bắt đầu
          </Button>
        </div>
      </div>
    )
  }

  // Game screen
  const sorted = [...state.players].sort((a, b) => b.score - a.score)
  const topScore = sorted[0]?.score

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🏆 Mâm Đền Đại Chiến
          </h2>
          <p className="text-xs text-gray-500">{state.players.length} người chơi</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <TouchTooltip title="Xem lịch sử">
            <Button size="small" icon={<History size={14} />} onClick={() => setShowHistory(true)} ghost className="touch-btn">
              Lịch sử
            </Button>
          </TouchTooltip>
          <TouchTooltip title="Undo">
            <Button
              size="small"
              icon={<Undo2 size={14} />}
              onClick={undo}
              disabled={state.history.length === 0}
              className="touch-btn !w-9 !h-9 !p-0"
            />
          </TouchTooltip>
          <TouchTooltip title="Redo">
            <Button
              size="small"
              icon={<Redo2 size={14} />}
              onClick={redo}
              disabled={state.future.length === 0}
              className="touch-btn !w-9 !h-9 !p-0"
            />
          </TouchTooltip>
          <Button size="small" icon={<RotateCcw size={14} />} onClick={handleReset} danger ghost className="touch-btn">
            Làm mới
          </Button>
        </div>
      </div>

      {/* Score leaderboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {sorted.map((player, rank) => {
          const color = APP_CONFIG.BORDER_COLORS[
            state.players.findIndex(p => p.id === player.id) % APP_CONFIG.BORDER_COLORS.length
          ]
          return (
            <div
              key={player.id}
              className="rounded-xl p-2.5 text-center"
              style={{ background: `${color}10`, border: `1px solid ${color}30` }}
            >
              {rank === 0 && topScore > 0 && (
                <Crown size={12} className="mx-auto mb-0.5 text-yellow-400" />
              )}
              <div className="text-xs text-gray-400 truncate">{player.name}</div>
              <div
                className="text-2xl font-bold mt-0.5"
                style={{ color: player.score > 0 ? '#10b981' : player.score < 0 ? '#ef4444' : '#94a3b8' }}
              >
                {player.score}
              </div>
              <div className="text-xs text-gray-500">điểm</div>
            </div>
          )
        })}
      </div>

      <Divider className="!my-3 !border-gray-800">
        <span className="text-xs text-gray-600">Thứ tự lượt chơi</span>
      </Divider>

      {/* Player order list */}
      <div className="space-y-2">
        {state.currentOrder.map((playerId, idx) => {
          const player = state.players.find(p => p.id === playerId)
          if (!player) return null
          const pidx = state.players.findIndex(p => p.id === playerId)
          const color = APP_CONFIG.BORDER_COLORS[pidx % APP_CONFIG.BORDER_COLORS.length]
          const isFirst = idx === 0

          return (
            <div
              key={playerId}
              className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
              style={{
                background: isFirst ? `${color}15` : '#1a1a2e',
                border: `1px solid ${isFirst ? color + '50' : '#2d2d5a'}`,
              }}
            >
              {/* Rank badge */}
              <div
                className="text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}20`, color }}
              >
                {idx + 1}
              </div>

              {/* Name + score */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-white truncate flex items-center gap-1">
                  {player.name}
                  {isFirst && <Tag color="purple" className="text-xs !py-0">Lượt này</Tag>}
                </div>
                <div
                  className="text-lg font-bold leading-tight"
                  style={{ color: player.score > 0 ? '#10b981' : player.score < 0 ? '#ef4444' : '#94a3b8' }}
                >
                  {player.score > 0 ? '+' : ''}{player.score} đ
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0 touch-controls">
                <TouchTooltip title={`${player.name} -1 (người sau +1)`}>
                  <Button
                    size="small"
                    icon={<Minus size={13} />}
                    onClick={() => changeScore(playerId, -1)}
                    className="touch-btn !w-9 !h-9 !p-0 !border-red-500/30 !text-red-400 hover:!bg-red-500/20"
                    ghost
                  />
                </TouchTooltip>
                <TouchTooltip title={`${player.name} +1 (người trước -1)`}>
                  <Button
                    size="small"
                    icon={<Plus size={13} />}
                    onClick={() => changeScore(playerId, 1)}
                    className="touch-btn !w-9 !h-9 !p-0 !border-green-500/30 !text-green-400 hover:!bg-green-500/20"
                    ghost
                  />
                </TouchTooltip>
                <TouchTooltip title="Mất lượt — người trước lên đầu, người này xuống cuối">
                  <Button
                    size="small"
                    onClick={() => missTurn(playerId)}
                    className="touch-btn !text-xs !px-2 !h-9 !border-orange-500/30 !text-orange-400 hover:!bg-orange-500/20"
                    ghost
                  >
                    Mất lượt
                  </Button>
                </TouchTooltip>
              </div>
            </div>
          )
        })}
      </div>

      <HistoryDrawer
        open={showHistory}
        onClose={() => setShowHistory(false)}
        history={state.history}
        players={state.players}
      />
    </div>
  )
}
