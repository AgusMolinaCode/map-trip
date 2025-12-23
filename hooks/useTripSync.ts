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
      console.log('🚀 [useTripSync] Iniciando carga de datos...')
      setStatus('loading')
      setError(null)

      try {
        // Try to get existing trip
        console.log('🔍 [useTripSync] Buscando primer trip del usuario...')
        let trip = await getFirstTrip()
        console.log('📦 [useTripSync] Resultado getFirstTrip:', trip)

        // If no trip exists, create one
        if (!trip) {
          console.log('➕ [useTripSync] No hay trip, creando uno nuevo...')
          trip = await createTrip('Mi Viaje')
          console.log('✅ [useTripSync] Trip creado:', trip)
          if (!trip) {
            throw new Error('Failed to create trip')
          }
        }

        setTripId(trip.id)
        console.log('🆔 [useTripSync] Trip ID establecido:', trip.id)

        // Load trip data
        console.log('📥 [useTripSync] Cargando datos completos del trip...')
        const tripData = await loadFullTrip(trip.id)
        console.log('📊 [useTripSync] Datos cargados:', {
          days: tripData?.days.length || 0,
          searchPins: tripData?.searchPins.length || 0,
          daysDetail: tripData?.days.map(d => ({
            id: d.id,
            name: d.name,
            routesCount: d.routes.length,
            poisCount: d.pointsOfInterest.length
          }))
        })

        if (tripData) {
          // Update Zustand store with loaded data
          console.log('💾 [useTripSync] Actualizando Zustand store con datos cargados...')
          const store = useTripStore.getState()
          console.log('📦 [useTripSync] Estado actual del store antes de actualizar:', {
            days: store.days.length,
            searchPins: store.searchPins.length
          })

          // IMPORTANTE: Solo actualizar si realmente hay datos de la BD
          // o si el store está vacío. Esto previene sobrescribir datos locales
          // con un resultado vacío de la BD debido a problemas de RLS.
          const hasDbData = tripData.days.length > 0 || tripData.searchPins.length > 0
          const hasLocalData = store.days.length > 0 || store.searchPins.length > 0

          if (hasDbData || !hasLocalData) {
            // Clear current state and load from DB
            // We need to set this directly since there's no "setAll" action
            useTripStore.setState({
              days: tripData.days,
              searchPins: tripData.searchPins,
            })

            console.log('✅ [useTripSync] Store actualizado con:', {
              days: tripData.days.length,
              searchPins: tripData.searchPins.length
            })
          } else {
            console.warn('⚠️ [useTripSync] La BD retornó datos vacíos pero hay datos locales. NO sobrescribiendo para prevenir pérdida de datos.')
            console.warn('⚠️ [useTripSync] Esto puede indicar un problema con las políticas RLS de Supabase.')
            console.warn('⚠️ [useTripSync] Ejecuta las migraciones en utils/supabase/setup-rls-policies.sql')
          }

          // Store initial state for comparison
          previousStateRef.current = JSON.stringify({
            days: tripData.days,
            searchPins: tripData.searchPins,
          })
          console.log('💾 [useTripSync] Estado inicial guardado para comparación')
        }

        setStatus('idle')
        console.log('✅ [useTripSync] Inicialización completada exitosamente')
      } catch (err) {
        console.error('❌ [useTripSync] Error inicializando trip:', err)
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
    if (!tripId) {
      console.log('⏸️ [useTripSync] Auto-save: Sin tripId, no se guarda')
      return
    }

    const currentState = JSON.stringify({ days, searchPins })

    // Don't save if state hasn't changed
    if (currentState === previousStateRef.current) {
      console.log('⏸️ [useTripSync] Auto-save: Estado no ha cambiado, no se guarda')
      return
    }

    console.log('🔄 [useTripSync] Auto-save: Detectado cambio de estado')
    console.log('📊 [useTripSync] Estado actual:', {
      daysCount: days.length,
      searchPinsCount: searchPins.length,
      days: days.map(d => ({
        id: d.id,
        name: d.name,
        routesCount: d.routes.length,
        poisCount: d.pointsOfInterest.length
      }))
    })

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer for debounced save
    debounceTimer.current = setTimeout(async () => {
      if (!isMounted.current) return

      console.log('💾 [useTripSync] Auto-save: Iniciando guardado...')
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
          console.log('✅ [useTripSync] Auto-save: Guardado exitoso')

          // Reset to idle after a short delay
          setTimeout(() => {
            if (isMounted.current) {
              setStatus('idle')
            }
          }, 2000)
        }
      } catch (err) {
        console.error('❌ [useTripSync] Auto-save: Error guardando trip:', err)
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
  }, [days, searchPins, tripId])

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
