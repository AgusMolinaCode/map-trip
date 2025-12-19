'use client'

import { createContext, useContext, useRef, type ReactNode } from 'react'
import type { MapViewRef } from '@/components/MapView'
import type { Place } from '@/hooks/useTripStore'
import { useTripSync, type SyncStatus } from '@/hooks/useTripSync'

interface TripContextType {
  mapRef: React.RefObject<MapViewRef | null>
  handlePlaceClick: (place: Place) => void
  handleFlyToCoordinates: (coordinates: [number, number]) => void
  getMapCenter: () => [number, number] | null
  // Sync state
  syncStatus: SyncStatus
  isLoading: boolean
  isSaving: boolean
  syncError: string | null
  forceSave: () => Promise<void>
}

const TripContext = createContext<TripContextType | undefined>(undefined)

export function TripProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<MapViewRef>(null)

  // Initialize sync with Supabase
  const {
    status: syncStatus,
    isLoading,
    isSaving,
    error: syncError,
    forceSave,
  } = useTripSync()

  const handlePlaceClick = (place: Place) => {
    mapRef.current?.flyToPlace(place)
  }

  const handleFlyToCoordinates = (coordinates: [number, number]) => {
    // Create a temporary place to fly to
    const tempPlace: Place = {
      id: 'temp',
      name: 'temp',
      coordinates,
    }
    mapRef.current?.flyToPlace(tempPlace)
  }

  const getMapCenter = (): [number, number] | null => {
    return mapRef.current?.getCenter() ?? null
  }

  return (
    <TripContext.Provider
      value={{
        mapRef,
        handlePlaceClick,
        handleFlyToCoordinates,
        getMapCenter,
        syncStatus,
        isLoading,
        isSaving,
        syncError,
        forceSave,
      }}
    >
      {children}
    </TripContext.Provider>
  )
}

export function useTripContext() {
  const context = useContext(TripContext)
  if (!context) {
    throw new Error('useTripContext must be used within TripProvider')
  }
  return context
}
