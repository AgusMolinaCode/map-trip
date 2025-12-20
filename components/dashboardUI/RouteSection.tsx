'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { PlaceItem } from '@/components/PlaceItem'
import { PlaceSearch } from '@/components/PlaceSearch'
import { RouteStats } from './RouteStats'
import { Route as RouteIcon, Trash2, Plus, ArrowLeft } from 'lucide-react'
import { useTripStore, type Route, type Place } from '@/hooks/useTripStore'

interface RouteSectionProps {
  dayId: string
  route: Route
  routeIndex: number
  dayColor: string
  onPlaceClick: (place: Place) => void
  onRemove: () => void
}

export function RouteSection({ dayId, route, routeIndex, dayColor, onPlaceClick, onRemove }: RouteSectionProps) {
  const [isAddingPlace, setIsAddingPlace] = useState(false)

  const removePlace = useTripStore((state) => state.removePlace)
  const reorderPlaces = useTripStore((state) => state.reorderPlaces)
  const addPlace = useTripStore((state) => state.addPlace)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = route.places.findIndex((p) => p.id === active.id)
      const newIndex = route.places.findIndex((p) => p.id === over.id)
      reorderPlaces(dayId, route.id, arrayMove(route.places, oldIndex, newIndex))
    }
  }

  const handleAddPlace = (place: { name: string; coordinates: [number, number]; address: string }) => {
    addPlace(dayId, route.id, { id: crypto.randomUUID(), ...place })
    setIsAddingPlace(false)
  }

  if (route.places.length === 0 && !isAddingPlace) return null

  // Convertir hex a rgba para transparencia
  const hexToRgba = (hex: string, alpha: number = 0.15) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return (
    <div
      className="space-y-2 p-3 border rounded-lg"
      style={{
        backgroundColor: hexToRgba(dayColor),
        borderColor: dayColor
      }}
    >
      {/* Header de la ruta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RouteIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">
            {route.name || `Ruta ${routeIndex + 1}`} ({route.places.length})
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Botón eliminar */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            title="Eliminar ruta"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Route Stats */}
      {route.routeStats && route.places.length > 1 && (
        <RouteStats stats={route.routeStats} />
      )}

      {/* Formulario para agregar destino */}
      {isAddingPlace ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsAddingPlace(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground font-medium">
              Agregar destino a {route.name || `Ruta ${routeIndex + 1}`}:
            </p>
          </div>
          <PlaceSearch onSelect={handleAddPlace} onClose={() => setIsAddingPlace(false)} />
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs cursor-pointer hover:shadow-md text-white hover:text-white active:text-white hover:opacity-90"
          style={{ backgroundColor: dayColor, borderColor: dayColor }}
          onClick={() => setIsAddingPlace(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar destino
        </Button>
      )}

      {/* Lista de lugares con DnD */}
      {route.places.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={route.places.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {route.places.map((place) => (
                <PlaceItem
                  key={place.id}
                  place={place}
                  onRemove={() => removePlace(dayId, route.id, place.id)}
                  onClick={() => onPlaceClick(place)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
