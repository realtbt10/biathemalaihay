import { BillingSession, PaymentAssignment } from '../types/billing.types'
import { formatCa } from '@/shared/constants/config'

export function calcTableFeePerPerson(session: BillingSession): number {
  if (!session.playerCount) return 0
  return Math.round(session.tableFee / session.playerCount)
}

export function calcPlayerMamDen(playerId: string, session: BillingSession): number {
  const player = session.players.find(p => p.id === playerId)
  if (!player) return 0
  return player.score * session.scoreRate
}

export function calcPlayerExtraCost(playerId: string, session: BillingSession): number {
  const extra = session.extraCosts.find(e => e.playerId === playerId)
  if (!extra) return 0
  return extra.items.reduce((sum, item) => sum + (item.amount || 0), 0)
}

export function calcPlayerTotal(playerId: string, session: BillingSession): number {
  const tableFeeShare = calcTableFeePerPerson(session)
  const mamDen = calcPlayerMamDen(playerId, session)
  const extraCost = calcPlayerExtraCost(playerId, session)
  return -tableFeeShare - mamDen - extraCost
}

export function validateScores(session: BillingSession): boolean {
  const total = session.players.reduce((sum, p) => sum + (p.score || 0), 0)
  return total === 0
}

export function getSettlementSummary(session: BillingSession) {
  return session.players.map(player => {
    const tableFeeShare = calcTableFeePerPerson(session)
    const mamDen = calcPlayerMamDen(player.id, session)
    const extraCost = calcPlayerExtraCost(player.id, session)
    const net = -tableFeeShare - mamDen - extraCost

    // Find who paid table fee
    const tableFeeDebt = session.tableFeePayment
      ? session.tableFeePayment.payerId === player.id
        ? { type: 'paid' as const, amount: session.tableFee }
        : { type: 'owes' as const, amount: tableFeeShare }
      : null

    return {
      player,
      tableFeeShare,
      mamDen,
      extraCost,
      net,
      tableFeeDebt,
    }
  })
}

export function calcRemainingPoints(fromPlayerId: string, session: BillingSession): number {
  const player = session.players.find(p => p.id === fromPlayerId)
  if (!player) return 0
  const totalNeeded = Math.abs(player.score)
  const assigned = session.paymentAssignments
    .filter(a => a.fromPlayerId === fromPlayerId)
    .reduce((sum, a) => sum + a.points, 0)
  return totalNeeded - assigned
}

export function calcRemainingCapacity(toPlayerId: string, session: BillingSession): number {
  const player = session.players.find(p => p.id === toPlayerId)
  if (!player) return 0
  const totalCapacity = player.score
  const assigned = session.paymentAssignments
    .filter(a => a.toPlayerId === toPlayerId)
    .reduce((sum, a) => sum + a.points, 0)
  return totalCapacity - assigned
}
