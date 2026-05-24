# Auditoria de reestructuracion Sienna

Fecha: 2026-05-23

## Objetivo

Convertir Sienna en la experiencia principal de HerenciaRD. La aplicacion debe dejar de sentirse como un conjunto de modulos administrativos y pasar a sentirse como una experiencia moderna de exploracion genealogica familiar, con herramientas legacy disponibles pero secundarias.

## Diagnostico actual

Sienna ya tiene los modulos mas valiosos del producto, pero la jerarquia visual todavia no lo comunica con suficiente fuerza.

Problemas principales:

- La ruta de entrada autenticada sigue siendo `/dashboard`, no una experiencia Sienna.
- El menu principal mezcla Dashboard, arbol legacy, determinacion, Sienna y admin en el mismo nivel.
- Hay duplicidad conceptual entre `/arbol-genealogico`, `/arbol-genealogico-clasico` y `/sienna/arbol-genealogico`.
- Algunas paginas que ya son parte de la experiencia Sienna aun viven fuera del prefijo `/sienna`, como `/hallazgos`, `/calculo-filiacion` y `/documentos-probatorios`.
- Las herramientas administrativas aparecen demasiado visibles para una experiencia que debe sentirse premium y familiar.
- La home publica aun vende HerenciaRD como plataforma/modulos; la identidad futura debe presentar Sienna como la experiencia central.

## Inventario y clasificacion

| Ruta actual | Pantalla | Clasificacion recomendada | Destino propuesto |
|---|---|---|---|
| `/` | Home publica | Moderna, pero debe reposicionarse | Home publica Sienna/HerenciaRD |
| `/dashboard` | Dashboard autenticado | Moderna/Sienna, requiere renombrar | `/sienna` |
| `/sienna/arbol-genealogico` | Arbol Sienna | Sienna principal | `/sienna/arbol` con alias actual |
| `/sienna/dobles-linajes` | Analisis de dobles linajes | Sienna principal | `/sienna/linajes` con alias actual |
| `/hallazgos` | Correccion por miembro | Sienna principal-operativa | `/sienna/hallazgos` con alias actual |
| `/sienna/explicacion-herederos` | Explicacion para herederos | Sienna principal/reunion | `/sienna/explicacion` con alias actual |
| `/sienna/miembros-arbol` | Miembros del arbol | Sienna admin-operativa | `/sienna/miembros` con alias actual |
| `/documentos-probatorios` | Documentos probatorios | Sienna evidencia, no legacy | `/sienna/documentos` con alias actual |
| `/calculo-filiacion` | Calculo por filiacion | Sienna analitica / herramienta avanzada | `/sienna/filiacion` o `/legacy/calculo-filiacion` segun uso final |
| `/determinacion-herederos` | Determinacion formal | Caso/documento legal | `/caso/determinacion-herederos` |
| `/lineas-familiares` | Lineas familiares | Legacy/consulta tradicional | `/legacy/lineas-familiares` |
| `/arbol-genealogico` | Arbol completo legacy | Legacy/redundante | `/legacy/arbol-genealogico` |
| `/arbol-genealogico-clasico` | Arbol clasico legacy | Legacy/redundante | `/legacy/arbol-clasico` |
| `/calculo-herencias` | Calculo de herencias | Admin/tecnica | `/admin/calculo-herencias` |
| `/admin-users` | Admin usuarios | Admin/tecnica | `/admin/usuarios` con alias actual |
| `/admin/settings` | Settings | Admin/tecnica | Mantener `/admin/settings` |
| `/perfil` | Perfil | Cuenta | Mantener `/perfil` |
| `/legal` | Legal | Soporte | Mantener `/legal` |
| `/auth` | Login | Acceso | Mantener `/auth` |

## Nueva arquitectura recomendada

### 1. Sienna como aplicacion principal

Rutas nuevas recomendadas:

- `/sienna` - Centro Sienna, reemplazo conceptual de Dashboard.
- `/sienna/arbol` - Arbol genealogico principal.
- `/sienna/hallazgos` - Hallazgos accionables.
- `/sienna/linajes` - Dobles linajes y convergencias.
- `/sienna/timeline` - Timeline familiar futuro.
- `/sienna/insights` - Insights inteligentes futuro.
- `/sienna/miembros` - Gestion de miembros.
- `/sienna/documentos` - Expediente probatorio.
- `/sienna/explicacion` - Vista para reunion/herederos.

### 2. Caso

Rutas recomendadas:

- `/caso/determinacion-herederos`
- `/caso/documentos-formales` si se separa de documentos Sienna en el futuro.

Esta zona debe sentirse formal/legal, no exploratoria.

### 3. Legacy

Rutas recomendadas:

- `/legacy/arbol-genealogico`
- `/legacy/arbol-clasico`
- `/legacy/lineas-familiares`
- `/legacy/calculo-filiacion` si no se integra dentro de Sienna.

Legacy debe existir para continuidad, comparacion y soporte, pero no debe competir en la navegacion principal.

### 4. Admin

Rutas recomendadas:

- `/admin/usuarios`
- `/admin/settings`
- `/admin/calculo-herencias`

Admin debe quedar visible solo para administradores y fuera de la narrativa emocional.

## Navegacion propuesta

Navegacion principal autenticada:

1. Sienna
2. Arbol
3. Hallazgos
4. Linajes
5. Documentos
6. Miembros
7. Caso
8. Legacy

Para admins, agregar menu secundario:

- Admin
- Usuarios
- Settings
- Calculo tecnico

Regla UX:

- El usuario comun debe ver Sienna, no una lista de herramientas.
- Legacy debe estar al final y con menor peso visual.
- Admin no debe contaminar la experiencia principal.

## Recomendacion de ejecucion

### Fase 1 - Reordenar sin romper

Objetivo: cambiar percepcion sin riesgo alto.

- Crear ruta `/sienna` como nuevo dashboard principal.
- Hacer que login redirija a `/sienna` para usuarios aprobados.
- Reordenar navegacion desktop y movil con Sienna primero.
- Agrupar paginas legacy bajo un dropdown secundario.
- Mantener todas las rutas actuales como alias para no romper permisos ni enlaces.

Definition of done:

- Local build OK.
- Navegacion desktop/movil muestra Sienna como centro.
- Rutas antiguas siguen funcionando.
- Sin deploy a Hostinger hasta autorizacion explicita.

### Fase 2 - Renombrar rutas canonicas

Objetivo: limpiar arquitectura tecnica gradualmente.

- Agregar rutas canonicas cortas: `/sienna/arbol`, `/sienna/linajes`, `/sienna/miembros`, `/sienna/documentos`, `/sienna/explicacion`.
- Conservar rutas anteriores como compatibilidad.
- Actualizar permisos sembrados en `pages`.
- Actualizar tracking de visitas.

Definition of done:

- Permisos nuevos y antiguos resueltos.
- Enlaces internos apuntan a rutas nuevas.
- Alias antiguos validan 200.

### Fase 3 - Consolidacion visual

Objetivo: que Sienna se sienta como una experiencia premium, no una coleccion de pantallas.

- Crear shell visual Sienna con navegacion lateral o superior contextual.
- Usar entrada tipo command center: resumen, hallazgos criticos, arbol, linajes, documentos y acciones pendientes.
- Integrar timeline e insights como proximos modulos.
- Reducir cards administrativas y lenguaje tecnico en la primera pantalla.

Definition of done:

- Primera pantalla autenticada transmite identidad Sienna.
- El usuario entiende donde explorar, validar y presentar.
- Admin/legacy quedan accesibles pero secundarios.

## Riesgos y decisiones pendientes

- `/calculo-filiacion`: decidir si se convierte en modulo Sienna de analitica o si queda como legacy tecnico. Recomendacion: mantenerlo en Sienna como `/sienna/filiacion` si sigue consumiendo calculo API y aporta valor explicativo.
- `/documentos-probatorios`: no debe ir a legacy; es parte vital de la experiencia Sienna porque conecta evidencia con miembros.
- `/determinacion-herederos`: debe ir a Caso, no a Legacy, porque es salida formal legal.
- Permisos: hay que migrar con alias, no reemplazar rutas en seco.
- Produccion: no desplegar hasta probar local y recibir autorizacion explicita.

## Recomendacion ejecutiva

Avanzar primero con Fase 1. Es el mejor balance entre impacto visual y riesgo bajo: cambia la jerarquia del producto, deja a Sienna como centro, mantiene compatibilidad con las rutas existentes y permite probar localmente antes de tocar Hostinger.

## Direccion visual aportada por Victor

Victor compartio dos referencias visuales el 2026-05-23. No deben copiarse literalmente, pero si fijan una direccion:

- Usar Sienna como marca protagonista con sidebar fuerte y navegacion principal abierta.
- Mantener las secciones Caso, Legacy, Configuracion, Mantenimiento y Admin como grupos secundarios/colapsados.
- Priorizar un tablero inicial con KPIs accionables: miembros/personas registradas, herederos, monto/reparto, dobles linajes, hallazgos y convergencias.
- Dar al arbol un contenedor mas profesional, con herramientas de zoom/export/compartir, sin reemplazar el arbol actual que ya funciona.
- Incorporar una busqueda global por personas, ramas y hallazgos.
- Mostrar el caso activo y el usuario actual como contexto persistente.
- Usar un tono visual mas premium y alegre: dorado, verde, azul, acentos calidos, celebracion moderada por el dinero a repartir, sin perder seriedad legal.
- Evitar que todos los usuarios reciban el mismo mensaje inicial. La portada debe adaptarse a rol/permisos/circunstancia.

Recomendacion de sintesis: tomar la identidad emocional y sidebar de la segunda referencia, y la claridad SaaS/operativa de KPIs y arbol de la primera.
