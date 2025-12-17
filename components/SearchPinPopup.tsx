'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Plus, MapPin } from 'lucide-react'
import { useTripStore, type SearchPin } from '@/hooks/useTripStore'

interface SearchPinPopupProps {
  pin: SearchPin
  onClose: () => void
  onAddToDay: (dayId: string) => void
}

export function SearchPinPopup({ pin, onClose, onAddToDay }: SearchPinPopupProps) {
  const days = useTripStore((state) => state.days)
  const removeSearchPin = useTripStore((state) => state.removeSearchPin)
  const addDay = useTripStore((state) => state.addDay)

  const handleAddToDay = (dayId: string) => {
    onAddToDay(dayId)
    removeSearchPin(pin.id)
    onClose()
  }

  const handleCreateNewDay = () => {
    addDay()
    // We need to wait for the state to update, so we'll use a timeout
    setTimeout(() => {
      const state = useTripStore.getState()
      const lastDay = state.days[state.days.length - 1]
      if (lastDay) {
        handleAddToDay(lastDay.id)
      }
    }, 0)
  }

  const handleRemove = () => {
    removeSearchPin(pin.id)
    onClose()
  }

  return (
    <Card className="w-64 p-3 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-2">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <MapPin className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{pin.name}</p>
            {pin.address && (
              <p className="text-xs text-muted-foreground truncate">{pin.address}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Agregar a:</p>

        {days.length > 0 ? (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {days.map((day, index) => (
              <Button
                key={day.id}
                size="sm"
                className="w-full justify-start text-left h-8 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200"
                onClick={() => handleAddToDay(day.id)}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2 shrink-0"
                  style={{
                    backgroundColor: [
                      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
                      '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
                    ][index % 8],
                  }}
                />
                <span className="truncate">{day.name}</span>
                <span className="text-xs text-blue-600 ml-auto">
                  {day.places.length} lugares
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No hay dias creados
          </p>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleCreateNewDay}
          >
            <Plus className="h-3 w-3 mr-1" />
            Nuevo dia
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleRemove}
            title="Eliminar pin de búsqueda"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
