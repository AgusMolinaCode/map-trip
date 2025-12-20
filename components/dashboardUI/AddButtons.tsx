'use client'

import { Button } from '@/components/ui/button'
import { Plus, MapPin } from 'lucide-react'

interface AddButtonsProps {
  onAddPlace: () => void
  onAddPoi: () => void
  dayColor: string
}

export function AddButtons({ onAddPlace, onAddPoi, dayColor }: AddButtonsProps) {
  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        className="flex-1 hover:shadow-md hover:cursor-pointer text-xs text-white hover:text-white active:text-white"
        style={{ backgroundColor: dayColor, borderColor: dayColor }}
        onClick={onAddPlace}
      >
        <Plus className="h-3 w-3 mr-1" />
        Agregar destino
      </Button>
      <div className="flex items-center text-muted-foreground">|</div>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 hover:shadow-md hover:cursor-pointer text-xs text-white hover:text-white active:text-white"
        style={{ backgroundColor: dayColor, borderColor: dayColor }}
        onClick={onAddPoi}
      >
        <MapPin className="h-3 w-3 mr-1" />
        Punto interes
      </Button>
    </div>
  )
}
