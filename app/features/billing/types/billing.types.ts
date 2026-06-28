export interface Player {
  id: string
  name: string
  score: number
}

export interface ExtraCostItem {
  id: string
  name: string
  amount: number
}

export interface PlayerExtraCost {
  playerId: string
  items: ExtraCostItem[]
}

export interface PaymentAssignment {
  fromPlayerId: string
  toPlayerId: string
  points: number
  amount: number
}

export interface TableFeePayment {
  payerId: string
}

export interface BillingSession {
  id: string
  date: string
  tableFee: number
  playerCount: number
  scoreRate: number
  players: Player[]
  extraCosts: PlayerExtraCost[]
  tableFeePayment: TableFeePayment | null
  paymentAssignments: PaymentAssignment[]
  isSettled: boolean
}

export interface BillingState {
  sessions: BillingSession[]
}
