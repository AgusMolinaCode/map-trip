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
import { Plus, Trash2, Timer, Route } from 'lucide-react'
import { useTripStore, type Day, type Place } from '@/hooks/useTripStore'

interface DayItemProps {
  day: Day
  dayIndex: number
  onPlaceClick: (place: Place) => void
}

export function DayItem({ day, dayIndex, onPlaceClick }: DayItemProps) {
  const [isAddingPlace, setIsAddingPlace] = useState(false)
  const removeDay = useTripStore((state) => state.removeDay)
  const addPlace = useTripStore((state) => state.addPlace)
  const removePlace = useTripStore((state) => state.removePlace)
  const reorderPlaces = useTripStore((state) => state.reorderPlaces)

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
            {day.places.length} {day.places.length === 1 ? 'lugar' : 'lugares'}
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

          {isAddingPlace ? (
            <PlaceSearch
              onSelect={handleAddPlace}
              onClose={() => setIsAddingPlace(false)}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-accent hover:shadow-md hover:cursor-pointer"
              onClick={() => setIsAddingPlace(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar destino
            </Button>
          )}

          {day.places.length > 0 && (
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
          )}

          {day.places.length === 0 && !isAddingPlace && (
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
