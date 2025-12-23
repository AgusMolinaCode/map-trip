'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getFirstTrip, getUserTrips, loadFullTrip } from '@/lib/tripService'

export default function DiagnosticoPage() {
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function runDiagnostico() {
      const supabase = createClient()
      const results: any = {}

      // 1. Verificar usuario autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      results.user = {
        isAuthenticated: !!user,
        userId: user?.id || null,
        email: user?.email || null,
        error: userError?.message || null
      }

      if (user) {
        // 2. Verificar trips del usuario
        const userTrips = await getUserTrips()
        results.trips = {
          count: userTrips.length,
          trips: userTrips.map(t => ({
            id: t.id,
            name: t.name,
            created_at: t.created_at
          }))
        }

        // 3. Verificar primer trip
        const firstTrip = await getFirstTrip()
        results.firstTrip = firstTrip ? {
          id: firstTrip.id,
          name: firstTrip.name,
          user_id: firstTrip.user_id
        } : null

        // 4. Si hay trip, cargar datos completos
        if (firstTrip) {
          const fullTripData = await loadFullTrip(firstTrip.id)
          results.fullTripData = {
            daysCount: fullTripData?.days.length || 0,
            searchPinsCount: fullTripData?.searchPins.length || 0,
            days: fullTripData?.days.map(d => ({
              id: d.id,
              name: d.name,
              routesCount: d.routes.length,
              poisCount: d.pointsOfInterest.length
            })) || []
          }
        }

        // 5. Query directa a trips con RLS
        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', user.id)

        results.directQuery = {
          tripsCount: tripsData?.length || 0,
          trips: tripsData || [],
          error: tripsError?.message || null
        }

        // 6. Query directa a days
        if (firstTrip) {
          const { data: daysData, error: daysError } = await supabase
            .from('days')
            .select('*')
            .eq('trip_id', firstTrip.id)

          results.daysQuery = {
            daysCount: daysData?.length || 0,
            days: daysData || [],
            error: daysError?.message || null
          }
        }
      }

      setDiagnostico(results)
      setLoading(false)
    }

    runDiagnostico()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">🔍 Diagnóstico de Supabase</h1>
        <p>Cargando diagnóstico...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Diagnóstico de Supabase</h1>

      <div className="space-y-6">
        {/* Usuario */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">👤 Usuario</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(diagnostico.user, null, 2)}
          </pre>
        </div>

        {diagnostico.user.isAuthenticated && (
          <>
            {/* Trips */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-3">🗺️ Trips del Usuario</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(diagnostico.trips, null, 2)}
              </pre>
            </div>

            {/* Primer Trip */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-3">📍 Primer Trip</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(diagnostico.firstTrip, null, 2)}
              </pre>
            </div>

            {/* Datos Completos */}
            {diagnostico.fullTripData && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-3">📊 Datos Completos del Trip</h2>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(diagnostico.fullTripData, null, 2)}
                </pre>
              </div>
            )}

            {/* Query Directa */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-3">🔍 Query Directa (con RLS)</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(diagnostico.directQuery, null, 2)}
              </pre>
            </div>

            {/* Days Query */}
            {diagnostico.daysQuery && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-3">📅 Query de Days</h2>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(diagnostico.daysQuery, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}

        {!diagnostico.user.isAuthenticated && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-red-800 mb-3">⚠️ No Autenticado</h2>
            <p className="text-red-600">
              El usuario no está autenticado. Por favor, inicia sesión primero.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
