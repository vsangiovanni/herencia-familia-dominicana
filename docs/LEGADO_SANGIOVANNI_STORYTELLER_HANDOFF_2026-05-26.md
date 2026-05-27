# Legado Sangiovanni Storyteller Handoff - 2026-05-26

Estado: local listo para prueba
Ruta frontend: http://localhost:8080/sienna/legado-game
API local: http://localhost:3001
Alcance: local solamente. No desplegar a Hostinger, produccion ni GitHub sin permiso explicito de Victor.

## Intencion de producto

Victor definio que esto no debe sentirse como demo, slideshow, CRUD ni base de datos visual.

Debe sentirse como una experiencia narrativa historica completa:

- documental interactivo,
- intro historica cinematografica,
- storytelling visual elegante,
- experiencia genealogica viva,
- recorrido emocional de generaciones.

La experiencia debe responder a esta sensacion objetivo:

> Estoy viendo como nacio y evoluciono toda mi familia a traves del tiempo.

## Fuente de datos y seguridad

Regla obligatoria:

- La base de datos genealogica real es la fuente de verdad.
- El frontend no inventa miembros, relaciones, fechas ni reglas genealogicas.
- El storyteller consume el endpoint read-only `/api/sienna-storybook?includeMedia=1`.
- No tocar DB ni datos salvo autorizacion explicita de Victor.
- En esta iteracion no se modifico la DB.
- El endpoint actual reporta 77 miembros cubiertos, 0 omitidos.

Si se necesita enriquecer lugares de nacimiento:
- Solo hacerlo si ya existe un campo compatible.
- No crear campo nuevo solo para esto.
- No modificar API/DB sin consentimiento previo y explicito.

## Endpoint principal

Archivo: `server/index.js`

Endpoint:

- `GET /api/sienna-storybook?includeMedia=1`

Construye:

- slides/capitulos narrativos,
- resumen de cobertura,
- fotos de miembros desde herederos confirmados cuando existen,
- lugares desde documentos probatorios,
- grupos por etapas generacionales,
- fondos narrativos segun lugar/epoca.

Resumen validado localmente al final de la iteracion:

- slides: 20
- member_count: 77
- heir_count: 43
- covered_member_count: 77
- missing_member_ids: 0

## Estructura narrativa actual

Ya no se genera un slide por persona/nacimiento.
La logica actual agrupa en capitulos generacionales:

1. Calabria / Santa Domenica Talao
2. La despedida en Santa Domenica
3. Ruta hacia America
4. Llegada a Puerto Plata
5. Primeras ramas documentadas
6. Generacion 1929-1932
7. Generacion 1935-1939
8. Generacion 1957-1959
9. Generacion 1960-1964
10. Generacion 1963 con contexto exterior cuando aplica
11. Generacion 1965-1969
12. Generacion 1971-1978
13. Entrada moderna / memoria final
14. Ramas de memoria sin fecha exacta agrupadas
15. Cierre del libro familiar

Las agrupaciones deben seguir siendo inteligentes:
- por decada,
- por etapa historica,
- por lugar cuando exista,
- por familia/rama cuando la data lo permita,
- evitando que la pantalla se cargue demasiado.

## Reglas visuales aprobadas

Canon vigente:

- No whiteboard infantil.
- No mano dibujando.
- No munecos, doodles ni caricaturas.
- No placeholders genericos.
- Usar fondos hiperrealistas, historicos, profesionales y coherentes con la narrativa.
- Si ya existe un asset generado util, usarlo.
- Solo generar assets nuevos cuando haga falta para romper repeticion o cubrir una escena sin visual adecuado.
- Las fotos reales deben respetarse y usarse como referencia principal cuando existan.
- Las imagenes de miembros deben verse circulares.
- Los fallecidos llevan lacito negro o marca sobria.
- Si hay varias fotos en una escena, deben verse como collage/columna elegante sin competir con el fondo.
- En mobile, las fotos multiples se colocan en columna lateral derecha para no tapar el texto.
- La primera escena usa la puerta/casa original Sangiovanni como escenario generado completo, no como parche pegado.
- La foto conjunta de Domenico y Maria Rosa debe mantenerse grande/integrada en la primera escena, no separada en dos mini fotos.

## Assets principales

Assets de archivo familiar:

- `public/game/legado/archive/domenico-sangiovanni-maria-rosa-grisolia.webp`
- `public/game/legado/archive/domenico-sangiovanni-portrait.webp`
- `public/game/legado/archive/maria-rosa-grisolia-portrait.webp`
- `public/game/legado/archive/domenico-maria-rosa-clean.webp`

Referencias de puerta/casa:

- `public/game/legado/references/puerta-casa-sangiovanni-santa-domenica-video.jpg`
- `public/game/legado/references/puerta-casa-sangiovanni-santa-domenica.jpg`
- `public/game/legado/references/puerta-casa-sangiovanni-santa-domenica-talao.jpg`
- `public/game/legado/references/video-santa-domenica/recorrido-nocturno-casa-sangiovanni.mp4`

Fondos generados relevantes:

- `public/game/legado/generated/storyteller/legado-puerta-sangiovanni-santa-domenica-escenario.png`
- `public/game/legado/generated/storyteller/legado-santa-domenica-origen-documental.png`
- `public/game/legado/generated/storyteller/legado-puerto-plata-llegada-documental.png`
- `public/game/legado/generated/storyteller/legado-samana-capitulo-familiar-documental.png`
- `public/game/legado/generated/storyteller/legado-santo-domingo-consolidacion-familiar.png`
- `public/game/legado/generated/storyteller/legado-santo-domingo-generacion-1930s.png`
- `public/game/legado/generated/storyteller/legado-santo-domingo-generacion-1950s.png`
- `public/game/legado/generated/storyteller/legado-santo-domingo-generacion-1960s.png`
- `public/game/legado/generated/storyteller/legado-la-romana-expansion-familiar.png`
- `public/game/legado/generated/storyteller/legado-ocoa-memoria-familiar.png`
- `public/game/legado/generated/storyteller/legado-new-york-diaspora-familiar.png`
- `public/game/legado/generated/storyteller/legado-memoria-ramas-sin-fecha-01.png`
- `public/game/legado/generated/storyteller/legado-memoria-ramas-sin-fecha-02.png`
- `public/game/legado/generated/storyteller/legado-memoria-ramas-sin-fecha-03.png`

## UI/animacion actual

Archivo principal:

- `src/pages/LegadoSangiovanniGame.tsx`

Comportamiento:

- Reproduce automaticamente como video.
- Controles discretos de pausa, anterior, siguiente.
- Mapa narrativo interno en la misma pantalla, sin agregar opciones al menu oficial.
- Transicion entre escenas con crossfade suave.
- Fotos de miembros en desktop como collage circular inferior/lateral.
- Fotos de miembros en mobile como columna lateral derecha.
- Linea familiar animada con nodos/fotos para que el arbol se sienta vivo sin parecer tabla.

Texto:

- Archivo: `src/story/legado/NarrativeText.tsx`
- Typewriter letra por letra.
- En mobile, el texto tiene contenedor de altura limitada y se desplaza hacia arriba automaticamente para no meterse bajo las fotos.
- Se eliminaron los chistes/guinos por ahora porque se veian como puntos raros y Victor pidio quitarlos.

## Reglas de narrativa

La narrativa debe:

- sonar humana, historica y emocional,
- no mencionar HerenciaRD,
- no sonar tecnica ni administrativa,
- no mostrar IDs ni lenguaje de DB,
- no ser una lista fria,
- mencionar a todos los miembros en algun capitulo,
- agrupar cuando haga falta para no crear cientos de escenas,
- mantener el fondo visual como protagonista emocional.

Ejemplo de tono correcto:

> Entre 1960 y 1963, la familia abre una nueva etapa generacional. Carlos Alberto Blanco Sangiovanni nace en 1960, hijo de Yolanda Providencia Sangiovanni Gesualdo...

Ejemplo de tono incorrecto:

> Registro 1: nombre, fecha, padre_id, documento_id.

## Reglas sobre humor

Victor es alegre y le gustan guinos familiares, pero en esta iteracion se quitaron porque visualmente aparecian mal.
Si se reintroducen:
- deben ser pocos,
- elegantes,
- no invasivos,
- no deben aparecer como vinetas/puntos sueltos,
- no deben competir con el tono historico,
- preferible manejarlos como una linea breve de narrador en escenas grandes, no dentro de listas.

## Validaciones realizadas

Comandos ejecutados:

- `node --check server/index.js`
- `pnpm build`
- reinicio local del backend con `node server/index.js`
- verificacion de frontend en puerto 8080
- verificacion de API en puerto 3001
- verificacion de storyteller read-only con cookie local

Resultados:

- Build correcto.
- Backend escuchando en `localhost:3001`.
- Frontend escuchando en `localhost:8080`.
- API reporta 21 slides.
- API reporta 77/77 miembros cubiertos.
- API reporta 0 miembros omitidos.
- Validacion de frases de humor no deseadas: 0 coincidencias.

## Rostros extraidos confirmados

Victor confirmo la identificacion de estos rostros extraidos desde fotos familiares:

- `face-C.jpg` = Paolo Sangiovanni.
- `face-E.jpg` = Vincenzo/Vicente Sangiovanni.
- `face-G.jpg` = Vicente Sangiovanni Perez.

Assets locales normalizados:

- `public/game/legado/archive/extracted-faces/named/paolo-sangiovanni.jpg`
- `public/game/legado/archive/extracted-faces/named/vincenzo-vicente-sangiovanni.jpg`
- `public/game/legado/archive/extracted-faces/named/vicente-sangiovanni-perez.jpg`

Estos assets se conectaron al storyteller mediante overrides locales en `server/index.js` y `public/api.php`, sin tocar la base de datos.

## Actualizacion para produccion Hostinger

Produccion usa `public/api.php`, no el servidor Node local. Por eso el storyteller dinamico debe existir en ambos runtimes:

- Local Node: `server/index.js` expone `GET /api/sienna-storybook`.
- Hostinger PHP: `public/api.php` expone `GET /api/sienna-storybook`.
- Ambos construyen la narrativa desde `sienna_family_members`, `family_unions`, `member_parent_links`, `confirmed_heirs` y `evidence_documents`.
- No se actualizan miembros ni relaciones en base de datos durante el deploy.
- Las fotos de Paolo, Vincenzo/Vicente y Vicente Sangiovanni Perez se sirven como assets estaticos versionados bajo `public/game/legado/archive/extracted-faces/named/`.

Ayuda contextual actualizada:

- Nueva clave `sienna-legado` en `src/data/screenHelp.ts`.
- `src/pages/LegadoSangiovanniGame.tsx` muestra el help dentro de la experiencia fullscreen.
- `docs/UI.md` documenta la ayuda de la narrativa del legado.

Pagina/permisos:

- Se agrego la pagina `Narrativa del Legado Sangiovanni` para `/sienna/legado-game` en los seeds de Node y PHP.
- Se sincroniza acceso regular con `syncRegularUserPageAccess` / `sync_regular_user_page_access`.
- Esto modifica metadatos de paginas/permisos operativos, no datos genealogicos ni miembros.

## Estado local de servidores

Frontend:

- `http://localhost:8080/sienna/legado-game`
- Proceso escuchando en puerto 8080 al cierre de esta iteracion.

Backend:

- `http://localhost:3001`
- PID guardado en `.dev-api.pid`
- Logs: `/tmp/herencia-api.log`

## Pendientes recomendados

1. Revisar visualmente en mobile real:
   - que el texto suba tipo creditos,
   - que las fotos laterales no tapen caras/fondo,
   - que la columna de fotos no quede demasiado pequena.

2. Refinar narrativa:
   - convertir frases de parentesco "hijo/a de" a lenguaje mas natural cuando sea posible.
   - evitar repeticiones si varias personas comparten padres.
   - crear mini-historias por rama nuclear, no solo por decada.

3. Mejorar seleccion de fondos:
   - Santo Domingo 1960s aun se usa en 3 escenas; aceptable por ahora, pero puede dividirse con nuevo asset de 1965-1969 si Victor lo pide.
   - Puerto Plata se usa 2 veces; aceptable por contexto.
   - Ramas sin fecha usan 3 variantes de archivo; si se sienten repetidas, generar mas variantes.

4. Arbol genealogico vivo:
   - La linea actual es una primera capa visual.
   - Futuro: construir conexiones reales padre/hijo en overlay SVG desde `family.parent_links`.

5. Audio:
   - No implementado aun.
   - Futuro: musica instrumental suave y SFX discretos de papel/tinta/transicion.

## Prohibiciones activas

- No tocar DB sin permiso.
- No deploy a produccion/Hostinger/GitHub sin permiso.
- No volver a enfoque whiteboard infantil.
- No usar placeholders genericos como solucion final.
- No decir que esta 100% final si quedan ajustes visuales por validar en celular.
