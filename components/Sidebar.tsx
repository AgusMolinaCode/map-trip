'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion } from '@/components/ui/accordion'
import { DayItem } from '@/components/DayItem'
import { Plus, Map } from 'lucide-react'
import { useTripStore, type Place } from '@/hooks/useTripStore'

interface SidebarProps {
  onPlaceClick: (place: Place) => void
}

export function Sidebar({ onPlaceClick }: SidebarProps) {
  const days = useTripStore((state) => state.days)
  const addDay = useTripStore((state) => state.addDay)

  return (
    <Card className="w-80 h-full flex flex-col border-r rounded-none">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Map className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Trip Planner</h1>
        </div>
        <Button onClick={addDay} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Day
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {days.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No days planned yet
              </p>
              <p className="text-sm text-muted-foreground">
                Click &quot;Add Day&quot; to start planning your trip
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {days.map((day, index) => (
                <DayItem
                  key={day.id}
                  day={day}
                  dayIndex={index}
                  onPlaceClick={onPlaceClick}
                />
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t text-xs text-muted-foreground">
        <p>Total days: {days.length}</p>
        <p>
          Total places: {days.reduce((acc, day) => acc + day.places.length, 0)}
        </p>
      </div>
    </Card>
  )
}
