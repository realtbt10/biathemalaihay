export interface ScoringPlayer {
  id: string
  name: string
  score: number
}

export interface TurnState {
  order: string[]
  scores: Record<string, number>
  timestamp: number
  action: 'score_change' | 'miss_turn'
  description: string
}

export interface ScoringState {
  players: ScoringPlayer[]
  currentOrder: string[]
  scores: Record<string, number>
  history: TurnState[]
  future: TurnState[]
  started: boolean
}
