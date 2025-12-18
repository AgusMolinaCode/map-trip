import { z } from 'zod'

// Esquema para POI creado manualmente
export const manualPoiSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  note: z
    .string()
    .max(500, 'La nota no puede exceder 500 caracteres')
    .optional(),
})

export type ManualPoiInput = z.infer<typeof manualPoiSchema>

// Función helper para validar POI manual
export function validateManualPoi(data: { name: string; note?: string }) {
  return manualPoiSchema.safeParse(data)
}
