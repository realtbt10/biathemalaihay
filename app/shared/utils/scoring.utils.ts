/** Tính thứ tự lượt mới khi người chơi mất lượt */
export function computeMissTurnOrder(order: string[], playerId: string): string[] {
  const idx = order.indexOf(playerId)
  if (idx === -1) return order

  const misser = playerId
  const promoted = idx > 0 ? order[idx - 1] : order[order.length - 1]
  const alreadyPlayed = idx > 1 ? order.slice(0, idx - 1) : []
  const notYetPlayed = order.slice(idx + 1).filter(id => id !== promoted)

  return [promoted, ...notYetPlayed, ...alreadyPlayed, misser]
}

/** Lấy người chơi trước (vòng tròn) */
export function getPreviousPlayerId(order: string[], idx: number): string | null {
  if (order.length < 2) return null
  return idx > 0 ? order[idx - 1] : order[order.length - 1]
}

/** Lấy người chơi sau (vòng tròn) */
export function getNextPlayerId(order: string[], idx: number): string | null {
  if (order.length < 2) return null
  return idx < order.length - 1 ? order[idx + 1] : order[0]
}
