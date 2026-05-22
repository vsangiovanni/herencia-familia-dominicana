# HerenciaRD - Plan de estabilizacion local

Ultima actualizacion: 2026-05-21 11:20 AST

## Objetivo

Estabilizar HerenciaRD antes de cualquier despliegue a Hostinger, asegurando que la logica sucesoral, la genealogia formal y las pantallas Sienna funcionen igual en local y en produccion.

El alcance inmediato no es agregar funcionalidades nuevas grandes. Es cerrar brechas de consistencia, dejar pruebas de calculo y verificar localmente que el sistema esta listo para una futura subida controlada.

## Estado actual

- Produccion responde en https://herenciard.vmsencf.com/api/health con storage mysql y runtime php.
- Hostinger esta operando como frontend Vite estatico + backend PHP public/api.php.
- No hay despliegue JS activo en Hostinger para este dominio.
- El proyecto local esta accesible en /home/pc/.openclaw/workspace-sienna/projects/herencia-familia-dominicana.
- MySQL local esta instalado, activo y disponible.
- La base local herencia_rd existe y tiene tablas.
- Node local se usa como API de desarrollo contra MySQL local; no reemplaza a MySQL.
- Hay artefactos sin versionar de builds, zips, auditorias y scripts temporales. No se deben borrar ni limpiar sin decision explicita.

## Hallazgo principal

El frontend ya usa useSiennaWorkspace() para cargar un paquete completo de datos Sienna:

- miembros del arbol,
- uniones familiares,
- vinculos parentales,
- herederos confirmados,
- documentos,
- settings,
- ultimo snapshot de calculo.

Ese endpoint existe en el backend PHP de produccion como /api/sienna-workspace, pero faltaba en el backend Node local. Esto podia dejar produccion funcionando y local roto en pantallas criticas.

## Plan de trabajo

### 1. Documentar contexto y plan

Estado: completado.

Se deja este documento como punto de referencia para retomar el trabajo sin reconstruir el contexto desde la conversacion.

### 2. Alinear backend local Node con backend PHP

Estado: completado.

Se agrego /api/sienna-workspace a server/index.js y se extrajeron helpers locales para mantener una respuesta equivalente a public/api.php:

- loadSiennaFamilyBundle(),
- loadAppSettings(),
- loadConfirmedHeirs(includeMedia),
- loadEvidenceDocuments(includeMedia).

Tambien se alinearon /api/confirmed-heirs, /api/evidence-documents y /api/sienna-family-members para compartir esos helpers.

### 3. Blindar calculo sucesoral con pruebas locales

Estado: completado.

Se agrego scripts/test-sienna-inheritance.mjs y el script test:sienna.

Casos cubiertos:

- causante con descendientes directos vivos;
- representacion de hijo fallecido por nietos;
- ramas colaterales configuradas;
- heredero con doble linea;
- honorarios de abogados y neto repartible.

Durante la prueba se encontro y corrigio un bug real: applySiennaCaseConfig() no toleraba configuraciones parciales porque valores undefined podian pisar el canon actual.

### 4. Verificacion local

Estado: completado.

Verificaciones realizadas:

- node --check server/index.js;
- node --check scripts/test-sienna-inheritance.mjs;
- node scripts/test-sienna-inheritance.mjs;
- tsc --noEmit;
- vite build;
- API Node local en puerto temporal 3011 contra MySQL local;
- login admin local;
- /api/sienna-workspace devolvio miembros, uniones, vinculos, herederos, documentos, settings y snapshot.

### 5. Produccion Hostinger

Estado: pendiente por decision operativa.

No se desplego nada a Hostinger. La subida se hara despues de probar visualmente en local y con autorizacion explicita de Victor.

## Reglas de seguridad

- No tocar Hostinger durante esta fase.
- No borrar artefactos sin versionar sin autorizacion.
- No imprimir secretos.
- No cambiar datos reales de MySQL salvo que una prueba local lo requiera y quede claramente aislada.
- Mantener Node local y PHP produccion lo mas simetricos posible.

## Proximo paso actual

Probar visualmente las pantallas Sienna en local y, cuando Victor lo autorice, preparar una subida controlada a Hostinger con verificacion posterior.
