'use client'
import { Button, Input, InputNumber } from 'antd'
import { Minus, Plus } from 'lucide-react'
import { Player } from '../types/billing.types'

interface Props {
  players: Player[]
  onChange: (players: Player[]) => void
}

export default function PlayerScoreList({ players, onChange }: Props) {
  const updateName = (idx: number, name: string) => {
    const next = players.map((p, i) => i === idx ? { ...p, name } : p)
    onChange(next)
  }

  const updateScore = (idx: number, score: number) => {
    if (idx === players.length - 1) return // last is auto-fill
    const next = players.map((p, i) => i === idx ? { ...p, score } : p)
    // auto-fill last
    const sumExceptLast = next.slice(0, -1).reduce((s, p) => s + (p.score || 0), 0)
    next[next.length - 1] = { ...next[next.length - 1], score: -sumExceptLast }
    onChange(next)
  }

  const adjustScore = (idx: number, delta: number) => {
    if (idx === players.length - 1) return
    updateScore(idx, (players[idx].score || 0) + delta)
  }

  return (
    <div className="space-y-2">
      {players.map((player, idx) => {
        const isLast = idx === players.length - 1
        return (
          <div key={player.id} className="flex items-center gap-2">
            <div className="w-6 text-center text-xs text-gray-400">{idx + 1}</div>
            <Input
              value={player.name}
              onChange={e => updateName(idx, e.target.value)}
              placeholder={`Người chơi ${idx + 1}`}
              className="flex-1"
              size="small"
            />
            <div className="flex items-center gap-1">
              <Button
                size="small"
                icon={<Minus size={12} />}
                onClick={() => adjustScore(idx, -1)}
                disabled={isLast}
                className="!w-7 !h-7 !p-0"
              />
              <InputNumber
                value={player.score || 0}
                onChange={v => !isLast && updateScore(idx, v || 0)}
                readOnly={isLast}
                controls={false}
                className="!w-16 text-center"
                size="small"
                style={isLast ? { background: '#1a1a2e', color: '#94a3b8' } : undefined}
              />
              <Button
                size="small"
                icon={<Plus size={12} />}
                onClick={() => adjustScore(idx, 1)}
                disabled={isLast}
                className="!w-7 !h-7 !p-0"
              />
            </div>
            {isLast && (
              <span className="text-xs text-indigo-400 whitespace-nowrap">auto</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
