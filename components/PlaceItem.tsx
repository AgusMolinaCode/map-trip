'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MapPin, X, Loader2, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Place } from '@/hooks/useTripStore'
import { useTripContext } from '@/contexts/TripContext'

interface PlaceItemProps {
  place: Place
  onRemove: () => void
  onClick: () => void
}

export function PlaceItem({ place, onRemove, onClick }: PlaceItemProps) {
  const { syncStatus } = useTripContext()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Determinar el estado de guardado
  const isSaving = syncStatus === 'saving'
  const isSaved = syncStatus === 'saved'

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 mb-2 cursor-pointer hover:bg-accent/50 transition-colors w-full max-w-full overflow-hidden"
    >
      <div className="flex items-center gap-2 w-full max-w-full">
        <button
          className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0 w-0" onClick={onClick}>
          <div className="flex items-center gap-2 w-full">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0 w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{place.name}</p>
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
              {place.address && (
                <p className="text-xs text-muted-foreground truncate">
                  {place.address}
                </p>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
