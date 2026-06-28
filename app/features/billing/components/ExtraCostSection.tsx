'use client'
import { Button, Input, InputNumber, Card } from 'antd'
import { Plus, Trash2 } from 'lucide-react'
import { Player, PlayerExtraCost, ExtraCostItem } from '../types/billing.types'
import { APP_CONFIG } from '@/shared/constants/config'
import { formatMoney, MONEY_INPUT_PROPS } from '@/shared/utils/money'
import { generateId } from '@/shared/utils/id'

interface Props {
  players: Player[]
  extraCosts: PlayerExtraCost[]
  onChange: (costs: PlayerExtraCost[]) => void
}

export default function ExtraCostSection({ players, extraCosts, onChange }: Props) {
  const getExtra = (playerId: string): PlayerExtraCost =>
    extraCosts.find(e => e.playerId === playerId) || { playerId, items: [] }

  const updateExtra = (playerId: string, items: ExtraCostItem[]) => {
    const exists = extraCosts.find(e => e.playerId === playerId)
    if (exists) {
      onChange(extraCosts.map(e => e.playerId === playerId ? { ...e, items } : e))
    } else {
      onChange([...extraCosts, { playerId, items }])
    }
  }

  const addItem = (playerId: string) => {
    const extra = getExtra(playerId)
    updateExtra(playerId, [
      ...extra.items,
      { id: generateId(), name: '', amount: 0 }
    ])
  }

  const removeItem = (playerId: string, itemId: string) => {
    const extra = getExtra(playerId)
    updateExtra(playerId, extra.items.filter(i => i.id !== itemId))
  }

  const updateItem = (playerId: string, itemId: string, field: 'name' | 'amount', value: string | number) => {
    const extra = getExtra(playerId)
    updateExtra(playerId, extra.items.map(i =>
      i.id === itemId ? { ...i, [field]: value } : i
    ))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
      {players.map((player, idx) => {
        const extra = getExtra(player.id)
        const total = extra.items.reduce((s, i) => s + (i.amount || 0), 0)
        return (
          <Card
            key={player.id}
            size="small"
            title={
              <span className="text-sm font-medium" style={{ color: APP_CONFIG.BORDER_COLORS[idx % APP_CONFIG.BORDER_COLORS.length] }}>
                {player.name || `Người chơi ${idx + 1}`}
              </span>
            }
            extra={
              total > 0 && (
                <span className="text-xs text-orange-400">
                  Tổng: {formatMoney(total)} {APP_CONFIG.UNIT}
                </span>
              )
            }
            className="!bg-gray-900/50"
            styles={{ header: { minHeight: 36 } }}
          >
            <div className="space-y-2">
              {extra.items.map(item => (
                <div key={item.id} className="flex gap-2 items-center">
                  <Input
                    placeholder="Tên khoản"
                    value={item.name}
                    onChange={e => updateItem(player.id, item.id, 'name', e.target.value)}
                    size="small"
                    className="flex-1"
                  />
                  <InputNumber
                    placeholder="Số cá"
                    value={item.amount || undefined}
                    onChange={v => updateItem(player.id, item.id, 'amount', v || 0)}
                    suffix={APP_CONFIG.UNIT}
                    size="small"
                    className="!w-32"
                    min={0}
                    {...MONEY_INPUT_PROPS}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<Trash2 size={12} />}
                    onClick={() => removeItem(player.id, item.id)}
                    className="!w-7 !h-7 !p-0"
                  />
                </div>
              ))}
              <Button
                size="small"
                icon={<Plus size={12} />}
                onClick={() => addItem(player.id)}
                className="w-full !text-indigo-400 !border-indigo-500/50"
                type="dashed"
              >
                Thêm khoản phí
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
