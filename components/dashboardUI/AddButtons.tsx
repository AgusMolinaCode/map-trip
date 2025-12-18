'use client'

import { Button } from '@/components/ui/button'
import { Plus, MapPin } from 'lucide-react'

interface AddButtonsProps {
  onAddPlace: () => void
  onAddPoi: () => void
}

export function AddButtons({ onAddPlace, onAddPoi }: AddButtonsProps) {
  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        className="flex-1 bg-accent hover:shadow-md hover:cursor-pointer text-xs"
        onClick={onAddPlace}
      >
        <Plus className="h-3 w-3 mr-1" />
        Agregar destino
      </Button>
      <div className="flex items-center text-muted-foreground">|</div>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 bg-orange-50 hover:bg-orange-100 hover:shadow-md hover:cursor-pointer text-xs border-orange-200"
        onClick={onAddPoi}
      >
        <MapPin className="h-3 w-3 mr-1 text-orange-500" />
        Punto interes
      </Button>
    </div>
  )
}
