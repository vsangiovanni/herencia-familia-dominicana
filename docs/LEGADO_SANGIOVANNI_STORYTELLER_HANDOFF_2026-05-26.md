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

- slides: 21
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
4. Samana / Casa Hermanos Sangiovanni
5. Integracion dominicana en Samana
6. Primeras ramas documentadas
7. Generacion 1929-1932
8. Generacion 1935-1939
9. Generacion 1957-1959
10. Generacion 1960-1964
11. Generacion 1963 con contexto exterior cuando aplica
12. Generacion 1965-1969
13. Generacion 1971-1978
14. Entrada moderna / memoria final
15. Ramas de memoria sin fecha exacta agrupadas
16. Cierre del libro familiar

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

Estado DB produccion 2026-05-27:

- `maria-rosa-grisolia` existe en produccion como miembro propio.
- Maria Rosa Grisolia y Maria Rosa Grisolia Divanna deben tratarse como la misma persona dentro del expediente.
- Domenico queda vinculado por `spouse_member_id = maria-rosa-grisolia`.
- Su foto fue copiada desde local a `confirmed_heirs` como `maria-rosa-grisolia-portrait.webp` (`image/webp`).
- Esta sincronizacion fue puntual: no tocar otros miembros ni recalcular sucesion por este ajuste.
- Ajuste posterior autorizado por Victor: `confirmed_heirs` de produccion ahora tambien contiene a `domenico` con `domenico-sangiovanni-portrait.webp` (`image/webp`). Antes el asset estatico existia en produccion, pero faltaba la fila de foto por miembro. Backup previo: `backups/prod_domenico_photo_before_2026-05-27T12-31-45.207Z.json`.

Referencias de puerta/casa:

- `public/game/legado/references/puerta-casa-sangiovanni-santa-domenica-video.jpg`
- `public/game/legado/references/puerta-casa-sangiovanni-santa-domenica.jpg`
- `public/game/legado/references/puerta-casa-sangiovanni-santa-domenica-talao.jpg`
- `public/game/legado/references/video-santa-domenica/recorrido-nocturno-casa-sangiovanni.mp4`

Fondos generados relevantes:

- `public/game/legado/generated/storyteller/legado-puerta-sangiovanni-santa-domenica-escenario.png`
- `public/game/legado/generated/storyteller/legado-santa-domenica-origen-documental.png`
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
- naturalizar el contexto historico: usarlo como trasfondo de oportunidad, viaje, iniciativa familiar e integracion; evitar cargar el relato con miseria, hambre, tragedia o condiciones negativas salvo que Victor lo pida explicitamente,
- no mencionar HerenciaRD,
- no sonar tecnica ni administrativa,
- no mostrar IDs ni lenguaje de DB,
- no ser una lista fria,
- mencionar a todos los miembros en algun capitulo,
- agrupar cuando haga falta para no crear cientos de escenas,
- mantener el fondo visual como protagonista emocional.
- Resaltar con sobriedad a personas clave cuando aparezcan: Alessandro de Paola Sangiovanni debe sentirse como figura central del legado familiar; Jocelyn del Jesus Sangiovanni Baez debe sentirse como presencia importante de la rama de Jose Vicente dentro de la linea Vincenzo/Vicente.
- Usar como canon historico contextual, sin modificar datos genealogicos: raices en Santa Domenica Talao, Calabria; migracion de Domenico/Domingo Sangiovanni y Maria Rosa Grisolia hacia Republica Dominicana; hijos Paolo Sangiovanni Grisolia y Vincenzo/Vicente Sangiovanni Grisolia; Maria Magdalena permanece en Santa Domenica como rama que guarda el origen; presencia en Samana; actividad comercial de Paolo y Vincenzo mediante la Casa Hermanos Sangiovanni; evitar referencias historicas descartadas por Victor.
- Enriquecimiento contextual autorizado por Victor, sin tocar DB ni datos genealogicos: Domenico Sangiovanni Cino y Maria Rosa Grisolia Di Vanna llegan a Samana a fines del siglo XIX; se menciona tambien a Bonifacio como hijo contextual historico sin crear miembro; Domenico aparece hacia 1896 como joyero ambulante; la Casa Hermanos Sangiovanni fue una casa comercial importante de Samana fundada en 1904, dedicada a comercio importador/exportador; Paulino/Paolo se asocia con la primera fabrica de hielo de Samana y el Cine Colon; Vicente/Vincenzo forma parte del nucleo comercial familiar y casa con Maria Balbina Perez Alvarez.
- La voz debe sentirse como relato familiar contado con orgullo, no como expediente ni reporte: evitar frases tipo "los registros indican", "los registros ubican", "documentado", "evidencia", "base de datos", "sin fecha exacta", "se suma a la historia" o "queda integrado".

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

## Ajuste de lectura 2026-05-27

- Victor recibio feedback familiar positivo sobre el storyteller, pero pidieron que las letras pasen mas lento.
- Se bajo la velocidad del typewriter en `LegadoSangiovanniGame.tsx` y `NarrativeText.tsx`.
- Se aumento el margen despues de terminar de escribir cada texto para dejar tiempo real de lectura antes del cambio de slide.
- Los creditos tambien esperan un poco mas despues de terminar la narrativa antes de aparecer.

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

Regla dinamica de fotos futuras:

- Si un familiar sube o actualiza su foto desde `Miembros del arbol`, la app guarda la foto en `confirmed_heirs` vinculada por `sienna_member_id`.
- El storyteller resuelve fotos primero por `sienna_member_id` y luego por nombre, por lo que una foto subida posteriormente aparece automaticamente en el slide generacional o familiar donde ese miembro participa.
- El backend invalida la cache del storyteller al crear/actualizar fotos de herederos o miembros; la cache actual del endpoint es corta, de 20 segundos.
- El frontend invalida `sienna-storybook` despues de guardar miembros/fotos; ademas el storyteller refetch al montarse y al volver el foco a la ventana, con `staleTime` de 20 segundos, para no quedarse con fotos viejas en cache.
- Esta regla aplica a fotos disponibles en la base de datos real; no requiere editar slides uno por uno.

Ayuda contextual actualizada:

- Nueva clave `sienna-legado` en `src/data/screenHelp.ts`.
- `src/pages/LegadoSangiovanniGame.tsx` ya no muestra el boton de help dentro de la experiencia fullscreen; quedan solo volver, musica, pausa y navegacion.
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
   - La referencia historica descartada por Victor no debe usarse en la narrativa Sangiovanni.
   - Ramas sin fecha usan 3 variantes de archivo; si se sienten repetidas, generar mas variantes.

4. Arbol genealogico vivo:
   - La linea actual es una primera capa visual.
   - Futuro: construir conexiones reales padre/hijo en overlay SVG desde `family.parent_links`.

5. Audio:
   - Implementada musica de fondo desde el MP3 final enviado por Victor.
   - Asset local: `public/game/legado/audio/across-two-shores.mp3`.
   - Se activa manualmente desde el boton de musica del menu superior porque los navegadores bloquean autoplay con sonido.
   - Se reproduce solo como audio, en loop y sin mostrar el video.
   - Volumen moderado para que se perciba sin dominar la narrativa.
   - Futuro: reemplazar por pista masterizada si se aprueba una pieza musical final.

## Prohibiciones activas

- No tocar DB sin permiso.
- No deploy a produccion/Hostinger/GitHub sin permiso.
- No volver a enfoque whiteboard infantil.
- No usar placeholders genericos como solucion final.
- No decir que esta 100% final si quedan ajustes visuales por validar en celular.

## Ajustes visuales finales antes de deploy 2026-05-26 noche

Autorizacion de Victor: subir a Hostinger y GitHub solo cuando el storyteller quedara validado localmente. Alcance autorizado: frontend, backend PHP y assets necesarios. La base de datos de produccion no debe tocarse.

Cambios aplicados:

- El slide inicial \`Calabria, Italia\` muestra fotos circulares de Domenico Sangiovanni y Maria Rosa Grisolia.
- Los slides de ruta/llegada muestran el grupo familiar de cuatro: Domenico, Maria Rosa Grisolia, Paolo y Vincenzo.
- El slide \`Los primeros hogares\` muestra solo a Paolo y Vincenzo, porque ahi no corresponden Domenico ni Maria Rosa.
- Domenico y Maria Rosa Grisolia quedan marcados visualmente como difuntos con lacito negro dentro del storyteller, sin modificar datos genealogicos.
- Se oculto el hilo inferior duplicado en escenas donde ya existe collage familiar, para evitar fotos cortadas o competencia visual.
- Regla vigente: si una escena trae `memberPhotos`, solo se muestra el collage lateral/superior; no se repiten esas mismas fotos en el hilo inferior.
- Se ajusto el margen del collage y del hilo inferior para que las fotos no queden pegadas al borde derecho.
- \`Los primeros hogares\` usa un fondo de casa/hogar visto desde la calle: \`public/game/legado/generated/storyteller/legado-primeros-hogares-casa-familiar.png\`.
- El fondo anterior de matrimonios queda como archivo de referencia/archivo historico, no como fondo principal.
- El temporizador automatico de cada slide ya no tiene limite fijo de 32 segundos; se calcula por longitud real del texto typewriter y agrega margen despues de terminar para evitar cortes antes de que el texto completo este escrito.
- En mobile, el contenedor del texto narrativo se extendio a `61vh` para permitir aproximadamente dos lineas mas antes de empezar a desplazar el texto hacia arriba.
- Se agrego boton de musica en el menu superior. La musica usa el audio del video enviado por Victor como asset local, activada por el usuario para respetar restricciones de autoplay.
- Ajuste posterior: botones superiores con opacidad 95%, fondo 90% y sombra mas marcada; la pista de fondo queda en volumen 72%.
- La musica del storyteller usa playlist: primero `public/game/legado/audio/across-two-shores.mp3`, luego `public/game/legado/audio/across-the-atlantic.mp3` enviado por Victor el 2026-05-27. La transicion entre pistas usa crossfade estilo DJ para evitar corte seco.
- Ajuste narrativo posterior: los capitulos de memoria ya no repiten la frase `no entran por una fecha exacta`; ahora usan intros variadas y no tecnicas. Verificacion read-only local/produccion: los miembros de esos capitulos no tienen fecha de nacimiento cargada en la tabla `sienna_family_members` al momento de la revision, pero la narrativa evita sonar como excusa de data y se concentra en su lugar dentro del linaje.
- Prototipo local posterior: narrativa dinamica con Nano bajo demanda. Se activa solo con `?ai=1` en `/sienna/legado-game?ai=1`; la ruta normal sigue usando narrativa deterministica estable.
- El endpoint local acepta `GET /api/sienna-storybook?includeMedia=1&aiNarrative=1`. Usa `gpt-5-nano` por defecto (`STORYBOOK_OPENAI_MODEL` puede sobrescribirlo), cachea cada slide por hash del paquete de datos y cae a la narrativa deterministica si Nano falla, tarda demasiado o devuelve texto incompleto.
- Cuando una pantalla viene generada por Nano, el frontend muestra una marca discreta `Nano` en el menu superior. Si no aparece la marca, ese slide esta usando texto deterministico/fallback.
- Este prototipo de Nano esta documentado y probado localmente, pero no debe desplegarse a Hostinger/GitHub hasta que Victor lo valide en local y lo autorice explicitamente.
- Cierre cinematografico local: en el ultimo slide, despues de terminar el typewriter, la narrativa se desvanece y entra un roll de creditos con los 77 miembros ordenados por ano de nacimiento y generacion/posicion en el arbol. Los creditos salen desde `creditMembers` generado por el backend.
- Ajuste posterior del cierre: el titulo del ultimo slide permanece fijo; solo se desvanece el cuerpo narrativo. Los creditos aparecen a la izquierda.
- Las fotos del cierre salen ordenadas por aparicion: primero viven en una columna lateral tipo fila de espera y, cuando aparece el nombre del miembro, se deslizan visualmente hacia su nombre, desaparecen de la columna lateral y suben junto con el credito; la columna se desplaza para que las siguientes fotos ocupen el espacio disponible.
- Si se abre `/sienna/legado-game?credits=1`, la experiencia arranca directamente en el ultimo slide para probar el cierre sin recorrer todo el storytelling.
- En modo Nano (`?ai=1`), el boton superior de play/pausa recibe borde y aro verde cuando el texto visible de ese slide proviene de Nano/cache.

Archivos principales modificados:

- \`server/index.js\`
- \`public/api.php\`
- \`src/pages/LegadoSangiovanniGame.tsx\`
- \`src/hooks/useSiennaData.ts\`
- \`src/lib/api.ts\`
- \`src/story/legado/storyScenes.ts\`
- \`public/game/legado/generated/storyteller/legado-primeros-hogares-casa-familiar.png\`

Verificacion local realizada antes de deploy:

- \`php -l public/api.php\`
- \`node --check server/index.js\`
- \`pnpm build\`
- \`GET /api/sienna-storybook?includeMedia=1\`: 21 slides, 77 miembros cubiertos, 0 miembros faltantes, 0 assets faltantes.

Nota de deploy:

- Hostinger debe recibir \`dist/\` completo para asegurar \`index.html\`, bundles, \`api.php\` y assets bajo \`game/legado/\`.
- No subir ni sobrescribir \`.env\`.
- No ejecutar migraciones ni updates sobre miembros en produccion para este deploy.
