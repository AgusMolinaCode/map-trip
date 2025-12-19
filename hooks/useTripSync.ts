'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTripStore } from './useTripStore'
import {
  createTrip,
  getFirstTrip,
  loadFullTrip,
  syncTripToDb,
} from '@/lib/tripService'

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

interface UseTripSyncResult {
  status: SyncStatus
  tripId: string | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  forceSave: () => Promise<void>
}

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 1000

export function useTripSync(): UseTripSyncResult {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [tripId, setTripId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const days = useTripStore((state) => state.days)
  const searchPins = useTripStore((state) => state.searchPins)

  // Refs for debouncing and tracking
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const isMounted = useRef(true)
  const isInitialized = useRef(false)
  const previousStateRef = useRef<string>('')

  // Initialize - load or create trip
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    async function initialize() {
      setStatus('loading')
      setError(null)

      try {
        // Try to get existing trip
        let trip = await getFirstTrip()

        // If no trip exists, create one
        if (!trip) {
          trip = await createTrip('Mi Viaje')
          if (!trip) {
            throw new Error('Failed to create trip')
          }
        }

        setTripId(trip.id)

        // Load trip data
        const tripData = await loadFullTrip(trip.id)

        if (tripData) {
          // Update Zustand store with loaded data
          const store = useTripStore.getState()

          // Clear current state and load from DB
          // We need to set this directly since there's no "setAll" action
          useTripStore.setState({
            days: tripData.days,
            searchPins: tripData.searchPins,
          })

          // Store initial state for comparison
          previousStateRef.current = JSON.stringify({
            days: tripData.days,
            searchPins: tripData.searchPins,
          })
        }

        setStatus('idle')
      } catch (err) {
        console.error('Error initializing trip:', err)
        setError(err instanceof Error ? err.message : 'Failed to load trip')
        setStatus('error')
      }
    }

    initialize()

    return () => {
      isMounted.current = false
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  // Auto-save when state changes
  useEffect(() => {
    // Don't save if not initialized or no tripId
    if (!tripId || status === 'loading') return

    const currentState = JSON.stringify({ days, searchPins })

    // Don't save if state hasn't changed
    if (currentState === previousStateRef.current) return

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer for debounced save
    debounceTimer.current = setTimeout(async () => {
      if (!isMounted.current) return

      setStatus('saving')
      setError(null)

      try {
        const success = await syncTripToDb(tripId, days, searchPins)

        if (!success) {
          throw new Error('Failed to sync trip')
        }

        if (isMounted.current) {
          previousStateRef.current = currentState
          setStatus('saved')

          // Reset to idle after a short delay
          setTimeout(() => {
            if (isMounted.current) {
              setStatus('idle')
            }
          }, 2000)
        }
      } catch (err) {
        console.error('Error saving trip:', err)
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : 'Failed to save')
          setStatus('error')
        }
      }
    }, DEBOUNCE_DELAY)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [days, searchPins, tripId, status])

  // Force save function
  const forceSave = useCallback(async () => {
    if (!tripId) return

    // Clear any pending debounced save
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    setStatus('saving')
    setError(null)

    try {
      const success = await syncTripToDb(tripId, days, searchPins)

      if (!success) {
        throw new Error('Failed to sync trip')
      }

      previousStateRef.current = JSON.stringify({ days, searchPins })
      setStatus('saved')

      setTimeout(() => {
        if (isMounted.current) {
          setStatus('idle')
        }
      }, 2000)
    } catch (err) {
      console.error('Error force saving trip:', err)
      setError(err instanceof Error ? err.message : 'Failed to save')
      setStatus('error')
    }
  }, [tripId, days, searchPins])

  return {
    status,
    tripId,
    isLoading: status === 'loading',
    isSaving: status === 'saving',
    error,
    forceSave,
  }
}
