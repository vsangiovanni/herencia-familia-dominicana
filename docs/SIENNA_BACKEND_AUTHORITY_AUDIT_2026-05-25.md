# Auditoria Sienna Backend-Only - 2026-05-25

## Motivo

Victor pidio revisar nuevamente el apartado Sienna porque algunas pantallas todavia podian completar, simular o presentar informacion sucesoral desde frontend cuando la regla canonica es que el backend tiene la palabra final.

Regla aplicada:

- El frontend no decide si alguien es heredero.
- El frontend no calcula cuanto hereda.
- El frontend no inventa reparto por rama, porcentajes, montos, convergencias ni estado efectivo.
- Si el backend no confirma un dato sucesoral, la pantalla no debe presentarlo como verdad.
- Local primero. No se desplego esta ronda.

## Alcance auditado

Pantallas y modulos revisados/modificados en local:

- `src/pages/Dashboard.tsx`
- `src/pages/MiembrosArbolSienna.tsx`
- `src/pages/ArbolGenealogicoSienna.tsx`
- `src/pages/CalculoFiliacion.tsx`
- `src/pages/ExplicacionHerederosSienna.tsx`
- `src/pages/AnalisisDoblesLinajesSienna.tsx`
- `src/pages/DocumentosProbatorios.tsx`
- `src/pages/Hallazgos.tsx`
- `src/lib/siennaCalculation.ts`
- `src/lib/siennaFamilyTree.ts`
- `src/lib/siennaFindings.ts`
- `server/index.js`
- `public/api.php`

## Cambios principales

### Documentos probatorios

Problema detectado:
- Personas sin `sienna_member_id` podian aparecer como herederos sin documentos porque la pantalla mezclaba registros documentales con `confirmed_heirs` desvinculados.

Correccion local:
- La lista de herederos sin soporte solo considera herederos vinculados a miembro Sienna.
- El flujo de cargar soporte exige miembro vinculado.
- El guardado de documento exige `related_member_id`.
- El boton de resolver/cargar soporte preselecciona el miembro backend, no un nombre suelto.

Backend:
- `POST /api/confirmed-heirs` y `PUT /api/confirmed-heirs/:id` ahora requieren `sienna_member_id` valido.
- Al eliminar un miembro, sus `confirmed_heirs` vinculados se eliminan en vez de quedar desvinculados.
- Node y PHP quedaron alineados.

Produccion ya corregida con autorizacion explicita:
- Se verificaron y eliminaron 3 `confirmed_heirs` desvinculados sin documentos: Ailsa Sangiovanni, Cecilia Sangiovanni y Sheila Kunhardt.
- Backup generado antes de borrar: `backups/prod_unlinked_confirmed_heirs_cleanup_2026-05-25T14-08-28-917Z.json`.
- Verificacion posterior en produccion: unlinked heirs 0, broken links 0, nombres especificos 0.

### Miembros del Arbol

Problema detectado:
- El frontend usaba reglas locales para clasificar sucesion al guardar un miembro en modo autodetectar.

Correccion local:
- Se elimino la clasificacion sucesoral automatica frontend al guardar.
- Si el estado queda en `requiere_revision`, el backend calcula el estado efectivo.
- El texto de pantalla ahora aclara que el backend confirma el estado efectivo.
- Se elimino el simulador local de cambios porcentuales antes de guardar.

### Explicacion para Herederos

Problema detectado:
- Existia un simulador frontend que podia excluir herederos y recalcular porcentajes/montos localmente.
- Tambien podia calcular monto si faltaba fila API.

Correccion local:
- Se retiro el simulador de reparto.
- Porcentaje y monto mostrados salen del endpoint `GET /api/sienna-calculation`.
- Si el backend no manda monto, no se calcula uno en React.

### Calculo por Filiacion

Problema detectado:
- La pantalla recomponia totales por heredero y monto total desde lineas de distribucion.

Correccion local:
- Totales por heredero salen de `realtimeCalculation.active_heirs`.
- Porcentaje total sale de `realtimeCalculation.total_share`.
- Monto total sale de suma directa de montos backend en `active_heirs`.

### Analisis de Dobles Linajes

Problema detectado:
- Si el backend no mandaba `source_amounts`, el frontend fabricaba filas desde `calculation_routes`.

Correccion local:
- Si `source_amounts` no viene del backend, no se presenta reparto por rama inventado.

### Arbol Genealogico Sienna

Problema detectado:
- La pantalla podia caer a montos guardados en `confirmed_heirs.inheritance_amount` cuando no habia calculo vivo.
- Durante la prueba local posterior, la pantalla quedo en blanco por una referencia a `realtimeCalculation` antes de inicializarse.

Correccion local:
- Los montos visibles usan `GET /api/sienna-calculation.active_heirs`.
- Se retiro el fallback visual a montos guardados para resumen/explicacion.
- La vista muestra ausencia de monto en vez de inventar un calculo.
- Se movio la inicializacion de `realtimeCalculation` antes de los derivados que la consumen.

### Dashboard Sienna

Problema detectado:
- El total de Herederos finales podia caer a conteo documental si faltaba calculo/resumen.

Correccion local:
- El total principal usa `summary.active_heir_count`.
- Se elimino el fallback a `confirmed_heirs.length` para ese numero.

### Librerias frontend

Correcciones locales:
- `src/lib/siennaCalculation.ts` ya no conserva helpers de simulacion/reparto de montos frontend que no estaban en uso permitido.
- `src/lib/siennaFamilyTree.ts` ya no calcula plan sucesoral local si no recibe plan/API.
- `src/lib/siennaFindings.ts` ya no calcula hallazgo de cuota no distribuida desde frontend.

## Validacion ejecutada

- `pnpm build`
- `node --check server/index.js`
- `php -l public/api.php`
- `php -l dist/api.php`

Resultado:
- Build OK.
- Node syntax OK.
- PHP API syntax OK.
- `dist/api.php` syntax OK.

Servidor local levantado:
- Frontend: `http://127.0.0.1:8080/`
- API health: `{"ok":true,"storage":"mysql"}`

## Estado

- Cambios aplicados localmente y probados por Victor.
- Despliegue a Hostinger autorizado por Victor el 2026-05-25.
- Deploy realizado por FTP subiendo solo `dist/`; no se subio ni sobrescribio `.env`.
- No se ejecutaron migraciones.
- No se tocaron DB ni datos de produccion.
- Verificacion HTTP posterior: `/api/health` OK y rutas Sienna principales HTTP 200.
- Pendiente al cierre documental: commit/push a GitHub de esta ronda.
