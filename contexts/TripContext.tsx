'use client'

import { createContext, useContext, useRef, type ReactNode } from 'react'
import type { MapViewRef } from '@/components/MapView'
import type { Place } from '@/hooks/useTripStore'

interface TripContextType {
  mapRef: React.RefObject<MapViewRef | null>
  handlePlaceClick: (place: Place) => void
}

const TripContext = createContext<TripContextType | undefined>(undefined)

export function TripProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<MapViewRef>(null)

  const handlePlaceClick = (place: Place) => {
    mapRef.current?.flyToPlace(place)
  }

  return (
    <TripContext.Provider value={{ mapRef, handlePlaceClick }}>
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
