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
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { PlaceItem } from '@/components/PlaceItem'
import { PlaceSearch } from '@/components/PlaceSearch'
import { Plus, Trash2, Timer, Route, MapPin } from 'lucide-react'
import { useTripStore, type Day, type Place } from '@/hooks/useTripStore'

interface DayItemProps {
  day: Day
  dayIndex: number
  onPlaceClick: (place: Place) => void
}

export function DayItem({ day, dayIndex, onPlaceClick }: DayItemProps) {
  const [isAddingPlace, setIsAddingPlace] = useState(false)
  const [isAddingPoi, setIsAddingPoi] = useState(false)
  const removeDay = useTripStore((state) => state.removeDay)
  const addPlace = useTripStore((state) => state.addPlace)
  const removePlace = useTripStore((state) => state.removePlace)
  const reorderPlaces = useTripStore((state) => state.reorderPlaces)
  const addPointOfInterest = useTripStore((state) => state.addPointOfInterest)
  const removePointOfInterest = useTripStore((state) => state.removePointOfInterest)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = day.places.findIndex((p) => p.id === active.id)
      const newIndex = day.places.findIndex((p) => p.id === over.id)

      const newPlaces = arrayMove(day.places, oldIndex, newIndex)
      reorderPlaces(day.id, newPlaces)
    }
  }

  const handleAddPlace = (place: {
    name: string
    coordinates: [number, number]
    address: string
  }) => {
    const newPlace: Place = {
      id: `place-${Date.now()}`,
      name: place.name,
      coordinates: place.coordinates,
      address: place.address,
    }
    addPlace(day.id, newPlace)
    setIsAddingPlace(false)
  }

  const handleAddPoi = (place: {
    name: string
    coordinates: [number, number]
    address: string
  }) => {
    addPointOfInterest(day.id, {
      name: place.name,
      coordinates: place.coordinates,
      address: place.address,
    })
    setIsAddingPoi(false)
  }

  // Day colors for visual indicator
  const DAY_COLORS = [
    '#3B82F6',
    '#EF4444',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#F97316',
  ]
  const dayColor = DAY_COLORS[dayIndex % DAY_COLORS.length]

  // Format duration (seconds to hours/minutes)
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.round((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Format distance (meters to km)
  const formatDistance = (meters?: number) => {
    if (!meters) return null
    const km = (meters / 1000).toFixed(1)
    return `${km} km`
  }

  const totalItems = day.places.length + (day.pointsOfInterest?.length || 0)

  return (
    <AccordionItem value={day.id}>
      <AccordionTrigger className="hover:no-underline group">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: dayColor }}
          />
          <span className="font-semibold">{day.name}</span>
          <span className="text-xs text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'lugar' : 'lugares'}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pt-2">
          {/* Route Stats */}
          {day.routeStats && day.places.length > 1 && (
            <div className="grid grid-cols-2 gap-2 p-2 bg-muted/50 rounded-md">
              {day.routeStats.distance && (
                <div className="flex items-center gap-2 text-sm cursor-pointer">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium cursor-pointer">
                    {formatDistance(day.routeStats.distance)}
                  </span>
                </div>
              )}
              {day.routeStats.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formatDuration(day.routeStats.duration)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Add buttons - split for destination and POI */}
          {isAddingPlace ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Agregar destino de ruta:</p>
              <PlaceSearch
                onSelect={handleAddPlace}
                onClose={() => setIsAddingPlace(false)}
              />
            </div>
          ) : isAddingPoi ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Agregar punto de interes:</p>
              <PlaceSearch
                onSelect={handleAddPoi}
                onClose={() => setIsAddingPoi(false)}
              />
            </div>
          ) : (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-accent hover:shadow-md hover:cursor-pointer text-xs"
                onClick={() => setIsAddingPlace(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar destino
              </Button>
              <div className="flex items-center text-muted-foreground">|</div>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-orange-50 hover:bg-orange-100 hover:shadow-md hover:cursor-pointer text-xs border-orange-200"
                onClick={() => setIsAddingPoi(true)}
              >
                <MapPin className="h-3 w-3 mr-1 text-orange-500" />
                Punto interes
              </Button>
            </div>
          )}

          {/* Route destinations */}
          {day.places.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Route className="h-3 w-3" />
                Ruta ({day.places.length})
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={day.places.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {day.places.map((place) => (
                      <PlaceItem
                        key={place.id}
                        place={place}
                        onRemove={() => removePlace(day.id, place.id)}
                        onClick={() => onPlaceClick(place)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Points of Interest */}
          {day.pointsOfInterest && day.pointsOfInterest.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3 text-orange-500" />
                Puntos de interes ({day.pointsOfInterest.length})
              </p>
              <div className="space-y-2">
                {day.pointsOfInterest.map((poi) => (
                  <div
                    key={poi.id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-orange-50/50 border-orange-200 hover:bg-orange-50 transition-colors cursor-pointer"
                    onClick={() => onPlaceClick(poi as Place)}
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
                        removePointOfInterest(day.id, poi.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {day.places.length === 0 && (!day.pointsOfInterest || day.pointsOfInterest.length === 0) && !isAddingPlace && !isAddingPoi && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se añadieron lugares aún.
            </p>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:cursor-pointer"
            onClick={() => removeDay(day.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar día
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
