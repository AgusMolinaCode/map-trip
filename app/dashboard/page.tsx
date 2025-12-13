'use client'

import { MapView } from '@/components/MapView'
import { useTripContext } from '@/contexts/TripContext'

export default function DashboardPage() {
  const { mapRef, handlePlaceClick } = useTripContext()

  return (
    <div className="h-full w-full">
      <MapView ref={mapRef} onPlaceClick={handlePlaceClick} />
    </div>
  )
}