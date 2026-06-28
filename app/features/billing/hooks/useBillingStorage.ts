'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { BillingState, BillingSession } from '../types/billing.types'
import { loadFromStorage, saveToStorage, clearStorage } from '@/shared/utils/storage'

const STORAGE_KEY = 'billing_state'
const DEFAULT_STATE: BillingState = { sessions: [] }

export function useBillingStorage() {
  const [state, setState] = useState<BillingState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loaded = loadFromStorage<BillingState>(STORAGE_KEY, DEFAULT_STATE)
    setState(loaded)
    setHydrated(true)
  }, [])

  const saveWithDebounce = useCallback((newState: BillingState) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveToStorage(STORAGE_KEY, newState)
    }, 300)
  }, [])

  const updateState = useCallback((newState: BillingState) => {
    setState(newState)
    saveWithDebounce(newState)
  }, [saveWithDebounce])

  const addSession = useCallback((session: BillingSession) => {
    setState(prev => {
      const next = { sessions: [session, ...prev.sessions] }
      saveWithDebounce(next)
      return next
    })
  }, [saveWithDebounce])

  const updateSession = useCallback((session: BillingSession) => {
    setState(prev => {
      const next = {
        sessions: prev.sessions.map(s => s.id === session.id ? session : s)
      }
      saveWithDebounce(next)
      return next
    })
  }, [saveWithDebounce])

  const deleteSession = useCallback((sessionId: string) => {
    setState(prev => {
      const next = { sessions: prev.sessions.filter(s => s.id !== sessionId) }
      saveWithDebounce(next)
      return next
    })
  }, [saveWithDebounce])

  const resetAll = useCallback(() => {
    clearStorage(STORAGE_KEY)
    setState(DEFAULT_STATE)
  }, [])

  return { state, hydrated, addSession, updateSession, deleteSession, resetAll }
}
