'use client'

import { Button } from '@/components/ui/button'
import { MapPin, Trash2 } from 'lucide-react'
import type { PointOfInterest, Place } from '@/hooks/useTripStore'

interface PoiListProps {
  pois: PointOfInterest[]
  onPoiClick: (poi: Place) => void
  onRemove: (poiId: string) => void
}

export function PoiList({ pois, onPoiClick, onRemove }: PoiListProps) {
  if (!pois || pois.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
        <MapPin className="h-3 w-3 text-orange-500" />
        Puntos de interes ({pois.length})
      </p>
      <div className="space-y-2">
        {pois.map((poi) => (
          <div
            key={poi.id}
            className="flex items-center gap-2 p-2 rounded-md border bg-orange-50/50 border-orange-200 hover:bg-orange-50 transition-colors cursor-pointer"
            onClick={() => onPoiClick(poi as Place)}
          >
            <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{poi.name}</p>
              {poi.address && (
                <p className="text-xs text-muted-foreground truncate">{poi.address}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(poi.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
