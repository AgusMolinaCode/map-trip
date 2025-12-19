'use client'

import { useTripContext } from '@/contexts/TripContext'
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function SyncStatusIndicator() {
  const { syncStatus, syncError } = useTripContext()

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'loading':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: 'Cargando...',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
        }
      case 'saving':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: 'Guardando...',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-600',
        }
      case 'saved':
        return {
          icon: <Check className="h-4 w-4" />,
          label: 'Guardado',
          bgColor: 'bg-green-100',
          textColor: 'text-green-600',
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: syncError || 'Error al guardar',
          bgColor: 'bg-red-100',
          textColor: 'text-red-600',
        }
      default: // idle
        return {
          icon: <Cloud className="h-4 w-4" />,
          label: 'Sincronizado',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${config.bgColor} ${config.textColor} text-xs font-medium shadow-sm border border-white/50`}
          >
            {config.icon}
            <span className="hidden sm:inline">{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
