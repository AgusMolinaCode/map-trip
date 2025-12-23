# 🔧 Corrección: Datos que se Borran al Actualizar la App

## 📋 Diagnóstico del Problema

El problema de datos que se borran al actualizar la aplicación se debe a **dos causas principales**:

### 1. **Falta de Políticas RLS (Row Level Security)**
Las tablas de Supabase no tienen políticas RLS configuradas, lo que significa que:
- Las consultas SELECT pueden fallar silenciosamente
- Los usuarios no pueden leer sus propios datos
- Las operaciones INSERT/UPDATE/DELETE son bloqueadas

### 2. **Sobrescritura del Estado en useTripSync**
El hook `useTripSync.ts` sobrescribía el estado de Zustand con datos vacíos cuando la BD retornaba vacío debido a problemas de RLS.

## ✅ Soluciones Aplicadas

### Corrección 1: Protección contra Sobrescritura (✅ APLICADA)
**Archivo modificado:** `hooks/useTripSync.ts`

Ahora el hook verifica si hay datos en la BD antes de sobrescribir el estado local. Si la BD retorna vacío pero hay datos locales, mantiene los datos locales y muestra una advertencia en consola.

**Cambio realizado:**
```typescript
// ANTES: Sobrescribía siempre con datos de BD (incluso si estaba vacío)
useTripStore.setState({
  days: tripData.days,
  searchPins: tripData.searchPins,
})

// AHORA: Solo sobrescribe si hay datos o si el store está vacío
const hasDbData = tripData.days.length > 0 || tripData.searchPins.length > 0
const hasLocalData = store.days.length > 0 || store.searchPins.length > 0

if (hasDbData || !hasLocalData) {
  useTripStore.setState({
    days: tripData.days,
    searchPins: tripData.searchPins,
  })
} else {
  console.warn('⚠️ La BD retornó datos vacíos pero hay datos locales. NO sobrescribiendo.')
}
```

### Corrección 2: Configurar Políticas RLS (⏳ PENDIENTE - REQUIERE ACCIÓN)

**Archivos creados:**
- `utils/supabase/setup-rls-policies.sql` - Políticas RLS completas
- `utils/supabase/add-cascade-deletes.sql` - Foreign keys con CASCADE

**Debes ejecutar estos scripts en Supabase:**

## 🚀 Pasos para Aplicar la Corrección Completa

### Paso 1: Ejecutar Migraciones SQL en Supabase

1. **Abrir Supabase Dashboard:**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto: `lkncumkdbqlpvsmjkqlr`

2. **Ir al SQL Editor:**
   - En el menú izquierdo, haz clic en "SQL Editor"
   - Crea una nueva query

3. **Ejecutar `setup-rls-policies.sql`:**
   - Copia el contenido de `utils/supabase/setup-rls-policies.sql`
   - Pégalo en el SQL Editor
   - Haz clic en "Run" o presiona `Ctrl+Enter`
   - ✅ Deberías ver "Success" en todas las políticas creadas

4. **Ejecutar `add-cascade-deletes.sql`:**
   - Copia el contenido de `utils/supabase/add-cascade-deletes.sql`
   - Pégalo en el SQL Editor
   - Haz clic en "Run" o presiona `Ctrl+Enter`
   - ✅ Deberías ver "Success" en todas las foreign keys actualizadas

### Paso 2: Verificar las Políticas RLS

Ejecuta esta query en el SQL Editor para verificar que las políticas se crearon correctamente:

```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Resultado esperado:** Todas las tablas deben tener `rowsecurity = true`

```sql
-- Verificar políticas creadas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

**Resultado esperado:** Deberías ver 4 políticas por tabla (SELECT, INSERT, UPDATE, DELETE)

### Paso 3: Probar la Aplicación

1. **Limpiar caché del navegador:**
   - Abre DevTools (F12)
   - Haz clic derecho en el botón de recargar
   - Selecciona "Empty Cache and Hard Reload"

2. **Verificar consola del navegador:**
   - Busca los logs con emoji: 🚀, 📦, 💾, ✅
   - No deberías ver advertencias: ⚠️ sobre datos vacíos de BD

3. **Probar creación de datos:**
   - Crea un nuevo día
   - Agrega un destino (place)
   - Agrega un punto de interés (POI)
   - Recarga la página (F5)
   - ✅ Los datos deberían persistir

4. **Verificar en Supabase:**
   - Ve a "Table Editor" en Supabase Dashboard
   - Selecciona la tabla `days`, `places`, `points_of_interest`
   - ✅ Deberías ver tus datos guardados

## 🔍 Diagnóstico de Problemas

### Problema: Aún se borran los datos después de aplicar las correcciones

**Causa posible:** Las políticas RLS no se aplicaron correctamente

**Solución:**
1. Verifica que ejecutaste ambos scripts SQL
2. Verifica que estás autenticado en la aplicación
3. Abre la consola del navegador y busca:
   - `❌ Error` - indica errores de permisos
   - `⚠️ La BD retornó datos vacíos` - indica problemas de RLS

### Problema: Error "permission denied" en consola

**Causa:** Las políticas RLS están bloqueando las consultas

**Solución:**
1. Verifica que el usuario esté autenticado: `auth.uid()` debe retornar un UUID
2. Ejecuta esta query en Supabase para verificar autenticación:

```sql
SELECT auth.uid();
```

Si retorna `NULL`, el problema es de autenticación, no de RLS.

### Problema: Los datos se duplican al guardar

**Causa:** El sistema de sincronización está guardando múltiples veces

**Solución:**
1. Verifica los logs de consola
2. Busca mensajes duplicados de "💾 Auto-save"
3. Si ves duplicados, limpia el caché del navegador

## 📊 Estructura de Datos y Relaciones

```
trips (user_id)
  └─ days (trip_id) [CASCADE DELETE]
      ├─ routes (day_id) [CASCADE DELETE]
      │   ├─ places (route_id) [CASCADE DELETE]
      │   └─ custom_routes (route_id, from_place_id, to_place_id) [CASCADE DELETE]
      └─ points_of_interest (day_id) [CASCADE DELETE]
  └─ search_pins (trip_id) [CASCADE DELETE]
```

**Comportamiento CASCADE:**
- Si eliminas un `trip`, se eliminan todos sus `days`, `search_pins`
- Si eliminas un `day`, se eliminan todos sus `routes` y `points_of_interest`
- Si eliminas un `route`, se eliminan todos sus `places` y `custom_routes`
- Si eliminas un `place`, se eliminan todos los `custom_routes` que lo referencian

## 🔐 Políticas RLS Aplicadas

Cada tabla tiene 4 políticas:

1. **SELECT** - "Users can view their own ..."
2. **INSERT** - "Users can create their own ..."
3. **UPDATE** - "Users can update their own ..."
4. **DELETE** - "Users can delete their own ..."

Las políticas verifican que `auth.uid()` coincida con el `user_id` del trip correspondiente.

## 📝 Logs de Diagnóstico

Cuando uses la aplicación, la consola mostrará:

### Logs Normales (Todo OK):
```
🚀 [useTripSync] Iniciando carga de datos...
🔍 [useTripSync] Buscando primer trip del usuario...
📦 [useTripSync] Resultado getFirstTrip: {id: "..."}
📥 [useTripSync] Cargando datos completos del trip...
📊 [useTripSync] Datos cargados: {days: 2, searchPins: 0}
💾 [useTripSync] Actualizando Zustand store con datos cargados...
✅ [useTripSync] Store actualizado con: {days: 2, searchPins: 0}
✅ [useTripSync] Inicialización completada exitosamente
```

### Logs de Problema (RLS no configurado):
```
🚀 [useTripSync] Iniciando carga de datos...
🔍 [useTripSync] Buscando primer trip del usuario...
📦 [useTripSync] Resultado getFirstTrip: {id: "..."}
📥 [useTripSync] Cargando datos completos del trip...
📊 [useTripSync] Datos cargados: {days: 0, searchPins: 0}  ⚠️ VACÍO
⚠️ [useTripSync] La BD retornó datos vacíos pero hay datos locales. NO sobrescribiendo.
⚠️ [useTripSync] Esto puede indicar un problema con las políticas RLS de Supabase.
⚠️ [useTripSync] Ejecuta las migraciones en utils/supabase/setup-rls-policies.sql
```

## ✅ Checklist de Verificación

- [ ] Ejecuté `setup-rls-policies.sql` en Supabase
- [ ] Ejecuté `add-cascade-deletes.sql` en Supabase
- [ ] Verifiqué que RLS está habilitado en todas las tablas
- [ ] Verifiqué que se crearon 4 políticas por tabla
- [ ] Limpié el caché del navegador
- [ ] Probé crear un día/destino/POI
- [ ] Recargué la página y los datos persisten
- [ ] No veo advertencias ⚠️ en la consola

## 🆘 Soporte

Si después de seguir estos pasos aún tienes problemas:

1. Revisa la consola del navegador (F12) y copia los logs
2. Revisa los logs de Supabase en "Logs > Postgres Logs"
3. Verifica que estás autenticado correctamente
4. Ejecuta esta query de diagnóstico:

```sql
-- Verificar tu usuario actual
SELECT auth.uid() as my_user_id;

-- Verificar tus trips
SELECT id, name, user_id, created_at
FROM trips
WHERE user_id = auth.uid();

-- Verificar permisos en una tabla
SELECT has_table_privilege('public.trips', 'SELECT') as can_select,
       has_table_privilege('public.trips', 'INSERT') as can_insert,
       has_table_privilege('public.trips', 'UPDATE') as can_update,
       has_table_privilege('public.trips', 'DELETE') as can_delete;
```

---

**Última actualización:** 2025-12-22
**Autor:** Claude (Troubleshooting Agent)
**Estado:** Corrección parcial aplicada, requiere ejecución de migraciones SQL
