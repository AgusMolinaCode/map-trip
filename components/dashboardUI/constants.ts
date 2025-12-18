// Colores por día (ciclo cada 8 días)
export const DAY_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
] as const

export const getDayColor = (dayIndex: number): string => {
  return DAY_COLORS[dayIndex % DAY_COLORS.length]
}

// Formatear duración (segundos a horas/minutos)
export const formatDuration = (seconds?: number): string | null => {
  if (!seconds) return null
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Formatear distancia (metros a km)
export const formatDistance = (meters?: number): string | null => {
  if (!meters) return null
  const km = (meters / 1000).toFixed(1)
  return `${km} km`
}
