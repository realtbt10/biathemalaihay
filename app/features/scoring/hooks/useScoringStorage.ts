'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ScoringState, TurnState } from '../types/scoring.types'
import { loadFromStorage, saveToStorage, clearStorage } from '@/shared/utils/storage'
import { generateId } from '@/shared/utils/id'
import { computeMissTurnOrder, getPreviousPlayerId, getNextPlayerId } from '@/shared/utils/scoring.utils'

const STORAGE_KEY = 'scoring_state'
const DEFAULT_STATE: ScoringState = {
  players: [],
  currentOrder: [],
  scores: {},
  history: [],
  future: [],
  started: false
}

export function useScoringStorage() {
  const [state, setState] = useState<ScoringState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loaded = loadFromStorage<ScoringState>(STORAGE_KEY, DEFAULT_STATE)
    setState(loaded)
    setHydrated(true)
  }, [])

  const saveWithDebounce = useCallback((s: ScoringState) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveToStorage(STORAGE_KEY, s), 300)
  }, [])

  const updateState = useCallback((s: ScoringState) => {
    setState(s)
    saveWithDebounce(s)
  }, [saveWithDebounce])

  const pushSnapshot = (next: ScoringState, snapshot: TurnState) => {
    const ns = { ...next, history: [...next.history, snapshot], future: [] }
    updateState(ns)
  }

  // Undo
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev
      const history = [...prev.history]
      const snap = history.pop()!
      const next: ScoringState = {
        ...prev,
        currentOrder: snap.order,
        scores: snap.scores,
        history,
        future: [...prev.future, {
          order: prev.currentOrder,
          scores: prev.scores,
          timestamp: Date.now(),
          action: 'score_change',
          description: 'Redo'
        }]
      }
      saveWithDebounce(next)
      return next
    })
  }, [saveWithDebounce])

  // Redo
  const redo = useCallback(() => {
    setState(prev => {
      if (prev.future.length === 0) return prev
      const future = [...prev.future]
      const snap = future.pop()!
      const next: ScoringState = {
        ...prev,
        currentOrder: snap.order,
        scores: snap.scores,
        history: [...prev.history, {
          order: prev.currentOrder,
          scores: prev.scores,
          timestamp: Date.now(),
          action: 'score_change',
          description: 'Undo'
        }],
        future
      }
      saveWithDebounce(next)
      return next
    })
  }, [saveWithDebounce])

  // Start game
  const startGame = useCallback((playerNames: string[]) => {
    const players = playerNames.map((name, i) => ({
      id: generateId(),
      name: name || `Người ${i + 1}`,
      score: 0
    }))
    const scores: Record<string, number> = {}
    players.forEach(p => { scores[p.id] = 0 })
    const next: ScoringState = {
      players,
      currentOrder: players.map(p => p.id),
      scores,
      history: [],
      future: [],
      started: true
    }
    updateState(next)
  }, [updateState])

  // Change score: bi-a rule — person after +1 → person before -1
  const changeScore = useCallback((playerId: string, delta: number) => {
    setState(prev => {
      const idx = prev.currentOrder.indexOf(playerId)
      if (idx === -1) return prev

      const snapshot: TurnState = {
        order: [...prev.currentOrder],
        scores: { ...prev.scores },
        timestamp: Date.now(),
        action: 'score_change',
        description: ''
      }

      const newScores = { ...prev.scores }
      const playerName = prev.players.find(p => p.id === playerId)?.name || ''

      if (delta > 0) {
        // Current player +1 → previous player -1 (vòng tròn: người cuối trước người đầu)
        newScores[playerId] = (newScores[playerId] || 0) + 1
        const prevId = getPreviousPlayerId(prev.currentOrder, idx)
        if (prevId) {
          newScores[prevId] = (newScores[prevId] || 0) - 1
          const prevName = prev.players.find(p => p.id === prevId)?.name || ''
          snapshot.description = `${playerName} +1 → ${prevName} -1`
        } else {
          snapshot.description = `${playerName} +1`
        }
      } else {
        // Current player -1 → next player +1 (vòng tròn)
        newScores[playerId] = (newScores[playerId] || 0) - 1
        const nextId = getNextPlayerId(prev.currentOrder, idx)
        if (nextId) {
          newScores[nextId] = (newScores[nextId] || 0) + 1
          const nextName = prev.players.find(p => p.id === nextId)?.name || ''
          snapshot.description = `${playerName} -1 → ${nextName} +1`
        } else {
          snapshot.description = `${playerName} -1`
        }
      }

      // Update player scores
      const players = prev.players.map(p => ({ ...p, score: newScores[p.id] ?? p.score }))
      const next: ScoringState = {
        ...prev,
        players,
        scores: newScores,
        history: [...prev.history, snapshot],
        future: []
      }
      saveWithDebounce(next)
      return next
    })
  }, [saveWithDebounce])

  // Miss turn: [2,1,4,3] 4 mất → [1,3,2,4]
  const missTurn = useCallback((playerId: string) => {
    setState(prev => {
      const idx = prev.currentOrder.indexOf(playerId)
      if (idx === -1) return prev

      const snapshot: TurnState = {
        order: [...prev.currentOrder],
        scores: { ...prev.scores },
        timestamp: Date.now(),
        action: 'miss_turn',
        description: `${prev.players.find(p => p.id === playerId)?.name} mất lượt`
      }

      const order = computeMissTurnOrder(prev.currentOrder, playerId)

      const next: ScoringState = {
        ...prev,
        currentOrder: order,
        history: [...prev.history, snapshot],
        future: []
      }
      saveWithDebounce(next)
      return next
    })
  }, [saveWithDebounce])

  const resetAll = useCallback(() => {
    clearStorage(STORAGE_KEY)
    setState(DEFAULT_STATE)
  }, [])

  return { state, hydrated, startGame, changeScore, missTurn, undo, redo, resetAll }
}
