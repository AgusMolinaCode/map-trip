'use client'

import { Button } from '@/components/ui/button'
import { MapPin, Trash2, Loader2, Check } from 'lucide-react'
import type { PointOfInterest, Place } from '@/hooks/useTripStore'
import { useTripContext } from '@/contexts/TripContext'

interface PoiListProps {
  pois: PointOfInterest[]
  onPoiClick: (poi: Place) => void
  onRemove: (poiId: string) => void
  dayColor: string
}

export function PoiList({ pois, onPoiClick, onRemove, dayColor }: PoiListProps) {
  const { syncStatus } = useTripContext()

  if (!pois || pois.length === 0) return null

  // Determinar el estado de guardado
  const isSaving = syncStatus === 'saving'
  const isSaved = syncStatus === 'saved'

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
        <MapPin className="h-3 w-3" style={{ color: dayColor }} />
        Puntos de interes ({pois.length})
      </p>
      <div className="space-y-2">
        {pois.map((poi) => {
          // Convertir hex a rgba para transparencia
          const hexToRgba = (hex: string, alpha: number = 0.15) => {
            const r = parseInt(hex.slice(1, 3), 16)
            const g = parseInt(hex.slice(3, 5), 16)
            const b = parseInt(hex.slice(5, 7), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
          }

          return (
            <div
              key={poi.id}
              className="flex items-center gap-2 p-2 rounded-md border hover:shadow-sm transition-all cursor-pointer"
              style={{
                backgroundColor: hexToRgba(dayColor),
                borderColor: dayColor
              }}
              onClick={() => onPoiClick(poi as Place)}
            >
              <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: dayColor }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{poi.name}</p>
                  {isSaving && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 flex-shrink-0">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Guardando...
                    </span>
                  )}
                  {isSaved && (
                    <span className="flex items-center gap-1 text-xs text-green-600 flex-shrink-0">
                      <Check className="h-3 w-3" />
                      Guardado
                    </span>
                  )}
                </div>
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
          )
        })}
      </div>
    </div>
  )
}
