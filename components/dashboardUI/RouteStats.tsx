'use client'

import { Route, Timer } from 'lucide-react'
import { formatDistance, formatDuration } from './constants'
import type { RouteStats as RouteStatsType } from '@/hooks/useTripStore'

interface RouteStatsProps {
  stats: RouteStatsType
}

export function RouteStats({ stats }: RouteStatsProps) {
  const distance = formatDistance(stats.distance)
  const duration = formatDuration(stats.duration)

  if (!distance && !duration) return null

  return (
    <div className="grid grid-cols-2 gap-2 p-2 bg-muted/50 rounded-md">
      {distance && (
        <div className="flex items-center gap-2 text-sm">
          <Route className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{distance}</span>
        </div>
      )}
      {duration && (
        <div className="flex items-center gap-2 text-sm">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{duration}</span>
        </div>
      )}
    </div>
  )
}
