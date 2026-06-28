'use client'
import { useState, useCallback } from 'react'
import { Modal, Select, Button, InputNumber, Alert, Divider, Tag, Tooltip, message } from 'antd'
import { Plus, Trash2, CheckCircle, AlertTriangle, Edit3, ChevronRight } from 'lucide-react'
import { BillingSession, PaymentAssignment } from '../types/billing.types'
import { APP_CONFIG, formatCa } from '@/shared/constants/config'
import { generateId } from '@/shared/utils/id'
import {
  calcTableFeePerPerson,
  calcPlayerMamDen,
  calcPlayerExtraCost,
  calcRemainingPoints,
  calcRemainingCapacity
} from '../utils/billing.utils'

interface Props {
  session: BillingSession
  open: boolean
  onClose: () => void
  onSave: (session: BillingSession) => void
}

interface DraftAssignment {
  id: string
  fromPlayerId: string
  toPlayerId: string
  points: number
}

export default function SettlementModal({ session, open, onClose, onSave }: Props) {
  const [tablePayerId, setTablePayerId] = useState<string>(
    session.tableFeePayment?.payerId || ''
  )
  const [assignments, setAssignments] = useState<DraftAssignment[]>(
    session.paymentAssignments.map(a => ({ ...a, id: generateId() }))
  )
  const [showFinal, setShowFinal] = useState(session.isSettled)
  const [editing, setEditing] = useState(!session.isSettled)

  const negativePlayers = session.players.filter(p => p.score < 0)
  const positivePlayers = session.players.filter(p => p.score > 0)
  const tableFeePerPerson = calcTableFeePerPerson(session)

  // Validate assignments
  const getValidationErrors = () => {
    const errors: string[] = []
    for (const p of negativePlayers) {
      const totalAssigned = assignments
        .filter(a => a.fromPlayerId === p.id)
        .reduce((sum, a) => sum + (a.points || 0), 0)
      if (totalAssigned !== Math.abs(p.score)) {
        errors.push(`${p.name}: cần đền ${Math.abs(p.score)} điểm, đã gán ${totalAssigned} điểm`)
      }
    }
    for (const p of positivePlayers) {
      const totalReceived = assignments
        .filter(a => a.toPlayerId === p.id)
        .reduce((sum, a) => sum + (a.points || 0), 0)
      if (totalReceived > p.score) {
        errors.push(`${p.name}: nhận vượt quá ${p.score} điểm`)
      }
    }
    return errors
  }

  const addAssignment = (fromPlayerId: string) => {
    setAssignments(prev => [...prev, {
      id: generateId(),
      fromPlayerId,
      toPlayerId: '',
      points: 0
    }])
  }

  const removeAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id))
  }

  const updateAssignment = (id: string, field: keyof DraftAssignment, value: string | number) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  const handleFullSettle = (fromPlayerId: string, toPlayerId: string, assignmentId: string) => {
    const fromPlayer = session.players.find(p => p.id === fromPlayerId)
    const toPlayer = session.players.find(p => p.id === toPlayerId)
    if (!fromPlayer || !toPlayer) return

    const totalNeeded = Math.abs(fromPlayer.score)
    const alreadyAssignedFrom = assignments
      .filter(a => a.fromPlayerId === fromPlayerId && a.id !== assignmentId)
      .reduce((s, a) => s + (a.points || 0), 0)
    const remainingNeed = totalNeeded - alreadyAssignedFrom

    const totalCapacity = toPlayer.score
    const alreadyReceivedTo = assignments
      .filter(a => a.toPlayerId === toPlayerId && a.id !== assignmentId)
      .reduce((s, a) => s + (a.points || 0), 0)
    const remainingCapacity = totalCapacity - alreadyReceivedTo

    const fill = Math.min(remainingNeed, remainingCapacity)
    updateAssignment(assignmentId, 'points', fill)
  }

  const handleSave = () => {
    const errors = getValidationErrors()
    if (errors.length > 0) {
      message.error('Vui lòng kiểm tra lại phân chia mâm đền!')
      return
    }
    const finalAssignments: PaymentAssignment[] = assignments.map(a => ({
      fromPlayerId: a.fromPlayerId,
      toPlayerId: a.toPlayerId,
      points: a.points,
      amount: a.points * session.scoreRate
    }))
    onSave({
      ...session,
      tableFeePayment: tablePayerId ? { payerId: tablePayerId } : null,
      paymentAssignments: finalAssignments,
      isSettled: true
    })
    setShowFinal(true)
    setEditing(false)
    message.success('Đã lưu kết quả mâm đền! 🎱')
  }

  const errors = getValidationErrors()

  // Final summary per player
  const getFinalSummary = () => {
    return session.players.map((player, idx) => {
      const color = APP_CONFIG.BORDER_COLORS[idx % APP_CONFIG.BORDER_COLORS.length]
      const tableFeeShare = tableFeePerPerson
      const mamDenItems: { label: string; amount: number }[] = []

      // Mâm đền paid by this player
      session.paymentAssignments
        .filter(a => a.fromPlayerId === player.id)
        .forEach(a => {
          const toP = session.players.find(p => p.id === a.toPlayerId)
          mamDenItems.push({ label: `Đền cho ${toP?.name}`, amount: -a.amount })
        })

      // Mâm đền received by this player
      session.paymentAssignments
        .filter(a => a.toPlayerId === player.id)
        .forEach(a => {
          const fromP = session.players.find(p => p.id === a.fromPlayerId)
          mamDenItems.push({ label: `Nhận từ ${fromP?.name}`, amount: a.amount })
        })

      // Table fee
      let tableFeeLabel = ''
      let tableFeeNet = -tableFeeShare
      if (session.tableFeePayment) {
        if (session.tableFeePayment.payerId === player.id) {
          tableFeeLabel = `Đã trả bàn (${formatCa(session.tableFee)}) + nhận lại từ ${session.playerCount - 1} người`
          tableFeeNet = session.tableFee - tableFeeShare
        } else {
          const payer = session.players.find(p => p.id === session.tableFeePayment?.payerId)
          tableFeeLabel = `Nợ tiền bàn → ${payer?.name}`
          tableFeeNet = -tableFeeShare
        }
      }

      const extraCost = calcPlayerExtraCost(player.id, session)
      const extraItems = session.extraCosts.find(e => e.playerId === player.id)?.items || []

      const net = tableFeeNet + mamDenItems.reduce((s, i) => s + i.amount, 0) - extraCost

      return { player, color, tableFeeLabel, tableFeeNet, mamDenItems, extraItems, extraCost, net }
    })
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: 960, top: 20 }}
      styles={{ body: { maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' } }}
      title={
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">🎱 Mâm Đền – {session.date}</span>
          {errors.length > 0 && !showFinal && (
            <AlertTriangle size={16} className="text-yellow-400" />
          )}
        </div>
      }

      className="settlement-modal"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">

        {/* Section 1: Tổng hợp phí */}
        <div>
          <h3 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-1">
            <span>1.</span> Tổng hợp phí từng người
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {session.players.map((player, idx) => {
              const color = APP_CONFIG.BORDER_COLORS[idx % APP_CONFIG.BORDER_COLORS.length]
              const mamDen = calcPlayerMamDen(player.id, session)
              const extraCost = calcPlayerExtraCost(player.id, session)
              const extraItems = session.extraCosts.find(e => e.playerId === player.id)?.items || []
              const net = -tableFeePerPerson - mamDen - extraCost
              return (
                <div
                  key={player.id}
                  className="rounded-xl p-3 bg-gray-900/60"
                  style={{ border: `1px solid ${color}40` }}
                >
                  <div className="font-semibold mb-2" style={{ color }}>{player.name}</div>
                  <div className="text-xs space-y-1 text-gray-300">
                    <div className="flex justify-between">
                      <span>Tiền bàn</span>
                      <span className="text-red-400">-{formatCa(tableFeePerPerson)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mâm đền ({player.score} đ)</span>
                      <span className={mamDen > 0 ? 'text-red-400' : mamDen < 0 ? 'text-green-400' : 'text-gray-400'}>
                        {mamDen > 0 ? '-' : mamDen < 0 ? '+' : ''}{formatCa(Math.abs(mamDen))}
                      </span>
                    </div>
                    {extraItems.map(item => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.name || 'Chi phí'}</span>
                        <span className="text-red-400">-{formatCa(item.amount)}</span>
                      </div>
                    ))}
                    {extraItems.length > 0 && (
                      <div className="flex justify-between text-orange-300">
                        <span>Tổng chi phí khác</span>
                        <span>-{formatCa(extraCost)}</span>
                      </div>
                    )}
                    <Divider className="!my-1 !border-gray-700" />
                    <div className="flex justify-between font-bold">
                      <span>Tổng</span>
                      <span className={net >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {net >= 0 ? '+' : ''}{formatCa(net)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Divider className="!my-3 !border-gray-700" />

        {/* Section 2: Ai trả tiền bàn */}
        {!showFinal && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-1">
                <span>2.</span> Ai đã trả tiền bàn?
              </h3>
              <Select
                value={tablePayerId || undefined}
                onChange={v => setTablePayerId(v)}
                placeholder="Chọn người đã trả bàn"
                className="w-full"
                options={session.players.map(p => ({ label: p.name, value: p.id }))}
              />
              {tablePayerId && (
                <div className="mt-2 text-xs text-gray-400 bg-indigo-500/10 rounded-lg p-2 border border-indigo-500/20">
                  <span className="text-indigo-300 font-medium">
                    {session.players.find(p => p.id === tablePayerId)?.name}
                  </span>
                  {' '}đã trả {formatCa(session.tableFee)} →
                  Mỗi người còn lại nợ <span className="text-yellow-300">{formatCa(tableFeePerPerson)}</span>
                </div>
              )}
            </div>

            <Divider className="!my-3 !border-gray-700" />

            {/* Section 3: Phân chia mâm đền */}
            <div>
              <h3 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-1">
                <span>3.</span> Phân chia mâm đền
              </h3>

              {errors.length > 0 && (
                <Alert
                  type="warning"
                  className="mb-3 !bg-yellow-500/10 !border-yellow-500/30"
                  message={
                    <ul className="text-xs space-y-0.5">
                      {errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  }
                />
              )}

              {negativePlayers.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-4">
                  Không có người âm điểm — không cần phân chia mâm đền
                </div>
              )}

              {negativePlayers.map(player => {
                const myAssignments = assignments.filter(a => a.fromPlayerId === player.id)
                const totalAssigned = myAssignments.reduce((s, a) => s + (a.points || 0), 0)
                const needed = Math.abs(player.score)
                const done = totalAssigned === needed
                return (
                  <div key={player.id} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-red-400">{player.name}</span>
                      <Tag color="red" className="text-xs">
                        -{needed} điểm = {formatCa(needed * session.scoreRate)} phải đền
                      </Tag>
                      {done && <CheckCircle size={14} className="text-green-400" />}
                    </div>
                    <div className="space-y-2 pl-3">
                      {myAssignments.map(a => (
                        <div key={a.id} className="flex gap-2 items-center">
                          <span className="text-xs text-gray-400 whitespace-nowrap">Đền cho</span>
                          <Select
                            value={a.toPlayerId || undefined}
                            onChange={v => updateAssignment(a.id, 'toPlayerId', v)}
                            placeholder="Chọn người nhận"
                            size="small"
                            className="flex-1"
                            options={positivePlayers.map(p => ({
                              label: p.name,
                              value: p.id
                            }))}
                          />
                          <InputNumber
                            value={a.points || undefined}
                            onChange={v => updateAssignment(a.id, 'points', v || 0)}
                            min={0}
                            size="small"
                            className="!w-20"
                            suffix="đ"
                            placeholder="Điểm"
                          />
                          {a.toPlayerId && (
                            <Tooltip title="Đền toàn bộ có thể">
                              <Button
                                size="small"
                                type="primary"
                                ghost
                                onClick={() => handleFullSettle(player.id, a.toPlayerId, a.id)}
                                className="text-xs !px-2"
                              >
                                Đền hết
                              </Button>
                            </Tooltip>
                          )}
                          <Button
                            size="small"
                            danger
                            icon={<Trash2 size={12} />}
                            onClick={() => removeAssignment(a.id)}
                            className="!w-7 !h-7 !p-0"
                          />
                        </div>
                      ))}
                      <Button
                        size="small"
                        icon={<Plus size={12} />}
                        onClick={() => addAssignment(player.id)}
                        type="dashed"
                        className="!text-indigo-400 !border-indigo-500/50"
                      >
                        Thêm dòng đền
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <Button onClick={onClose}>Đóng</Button>
              <Button
                type="primary"
                onClick={handleSave}
                disabled={errors.length > 0 || !tablePayerId}
                style={{ background: errors.length === 0 && tablePayerId ? '#6366f1' : undefined }}
              >
                Lưu kết quả đền mâm
              </Button>
            </div>
          </>
        )}

        {/* Section 4: Kết quả cuối */}
        {showFinal && (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-green-400 flex items-center gap-1">
                  <CheckCircle size={14} /> Kết quả cuối cùng
                </h3>
                <Button
                  size="small"
                  icon={<Edit3 size={12} />}
                  onClick={() => { setShowFinal(false); setEditing(true) }}
                  ghost
                >
                  Chỉnh sửa
                </Button>
              </div>
              <div className="space-y-3">
                {getFinalSummary().map(({ player, color, tableFeeLabel, tableFeeNet, mamDenItems, extraItems, extraCost, net }) => (
                  <div
                    key={player.id}
                    className="rounded-xl p-3"
                    style={{ border: `1px solid ${color}50`, background: `${color}08` }}
                  >
                    <div className="font-bold mb-2" style={{ color }}>{player.name}</div>
                    <div className="text-xs space-y-1 text-gray-300">
                      <div className="flex justify-between">
                        <span>{tableFeeLabel || 'Tiền bàn'}</span>
                        <span className={tableFeeNet >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {tableFeeNet >= 0 ? '+' : ''}{formatCa(tableFeeNet)}
                        </span>
                      </div>
                      {mamDenItems.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.label}</span>
                          <span className={item.amount >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {item.amount >= 0 ? '+' : ''}{formatCa(item.amount)}
                          </span>
                        </div>
                      ))}
                      {extraItems.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.name || 'Chi phí'}</span>
                          <span className="text-red-400">-{formatCa(item.amount)}</span>
                        </div>
                      ))}
                      <Divider className="!my-1 !border-gray-700" />
                      <div className="flex justify-between font-bold text-sm">
                        <span>Còn lại</span>
                        <span className={net >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {net >= 0 ? '+' : ''}{formatCa(net)} ({net >= 0 ? 'nhận' : 'trả'})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-800">
              <Button onClick={onClose} type="primary" style={{ background: '#6366f1' }}>
                Đóng
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
