# Videojuego El Legado Sangiovanni

Documento base para disenar y desarrollar la nueva seccion de juego narrativo cooperativo dentro de Sienna / Legado Sangiovanni.

Fecha: 2026-05-25
Estado: pivot aprobado localmente hacia recuento narrativo visual, no videojuego
Alcance inicial: local solamente, sin deploy a produccion ni GitHub sin autorizacion explicita de Victor

## Pivot 2026-05-25: recuento visual del legado

Victor cancelo la direccion de videojuego porque consumia demasiado trabajo para una pieza recreativa.
La seccion debe convertirse en una experiencia narrativa visual tipo pizarra/cuaderno animado:

- escritura y trazos como hechos a mano,
- referencia visual principal: videos de animacion en pizarra/whiteboard con fondo blanco, marcador negro y mano escribiendo,
- la pantalla completa debe convertirse en pizarra blanca; evitar paneles/dashboard visibles,
- la mano debe narrar visualmente escribiendo/dibujando Santa Domenica, la ruta, Puerto Plata y el arbol familiar,
- nueva direccion aprobada: whiteboard animation premium cinematografico mezclado con motion graphics tipo documental historico/Netflix intro,
- tono visual: elegante, emocional, historico y epico; no infantil ni caricaturesco,
- recursos visuales esperados: papel antiguo, tinta, mapas envejecidos, documentos, fotografias antiguas, zoom cinematografico y arbol genealogico dinamico,
- audio futuro: piano suave, cuerdas, tinta, papel, pluma, mapas, olas y viento,
- comportamiento: debe sentirse como video; al iniciar avanza solo hasta terminar. La pausa existe, pero no debe dominar la UI ni parecer app con controles de presentacion.
- la mano/marcador debe verse claramente escribiendo y dibujando en pantalla, incluyendo mobile.
- arquitectura local implementada: React + Framer Motion + SVG + timeline por escenas.
- modulos creados para separar responsabilidades: `src/story/legado/storyScenes.ts`, `AnimatedMap.tsx`, `HandDrawing.tsx`, `NarrativeText.tsx`, `FamilyTreeOverlay.tsx`; la ruta sigue montada desde `src/pages/LegadoSangiovanniGame.tsx`.
- referencia visual adicional de Victor: storyboard whiteboard dividido en escenas, fondo papel claro, dibujos a tinta negra, acentos rojos para nombres/lugares importantes, mano visible dibujando en cada cuadro.
- asset final personalizado creado localmente: `public/game/legado/sangiovanni-legacy-map-tree-final.svg` y export PNG `public/game/legado/sangiovanni-legacy-map-tree-final.png`.
- escenas que van apareciendo mientras avanza el relato,
- recorrido desde Santa Domenica Talao hasta Puerto Plata,
- recorrido posterior mas alla de Puerto Plata, siguiendo las ramas familiares reales,
- incorporacion cronologica de nacimientos, defunciones, hijos, primos y ramas familiares,
- uso de lugares documentales cuando el miembro no tenga lugar directo registrado,
- visual premium, emocional y claro, sin mecanicas de juego complejas.

La regla de datos se mantiene: fechas, relaciones, nacimientos, ramas y documentos deben venir del backend/API.
El frontend solo presenta la cronologia autorizada con animacion, narrativa y composicion visual.
La base actual util para este recuento esta en `/api/sienna-workspace`: miembros, documentos probatorios,
fechas de nacimiento/defuncion y `event_place` de documentos. Si hace falta inferir ciudad desde actas,
esa extraccion debe resolverse en backend o en un endpoint read-only dedicado antes de presentarse como dato.

Correccion historica confirmada por Victor:

- El matrimonio migrante fue Domenico Sangiovanni y Maria Rosa Grisolia.
- Los acompanaron sus hijos varones Paolo Sangiovanni Grisolia y Vincenzo Sangiovanni Grisolia.
- Maria Magdalena, hija del matrimonio y madre de Alessandro, se quedo en Santa Domenica Talao, Italia.
- La narrativa debe mostrar esa bifurcacion: una rama migra hacia Puerto Plata y otra permanece en Santa Domenica.

## Canon visual actualizado 2026-05-26

Victor rechazo definitivamente el enfoque de dibujitos/whiteboard/mano como base visual.

Regla obligatoria para nuevas escenas:

- Cada escena/slide debe usar un asset personalizado, profesional e hiperrealista creado especificamente para esa parte de la narracion.
- No usar placeholders, rutas genericas, mapas reciclados, iconos, dibujos tipo muñequito, whiteboard ni collage artificial.
- La imagen de fondo debe corresponder 100% con el texto narrado en esa escena.
- Si la narracion habla de Calabria/Santa Domenica, el fondo debe verse como Calabria/Santa Domenica.
- Si la narracion habla de migracion, el fondo debe mostrar salida/migracion/barco/personas abordando con tono historico.
- Si la narracion habla de Puerto Plata, el fondo debe mostrar llegada/puerto/ambiente dominicano historico coherente.
- Si se usan fotos reales de miembros, deben integrarse como memoria documental dentro de la composicion: difuminadas, incrustadas o fusionadas con luz/documentos/fondo.
- Las fotos familiares no deben aparecer como tarjetas invasivas encima de la escena ni competir con la narrativa visual.
- Cuando una escena incorpore personas generadas, su apariencia debe respetar el contexto familiar, epoca, lugar y origen probable de la rama narrada.
- Si existe foto real del miembro en los datos locales, esa foto es la referencia visual principal para edad, rostro, tono de piel, rasgos generales y presencia; no se debe sustituir por un rostro generico.
- Si no existe foto, la figura generada debe ser historicamente coherente con el lugar y la rama familiar narrada, sin estereotipos exagerados ni personajes que parezcan ajenos a la familia.
- Los titulos y textos deben apoyar la historia, pero la imagen principal debe cargar la emocion y contexto.
- El resultado esperado es documental cinematografico premium, hiperrealista, sobrio y emocional.


## Storyteller canon operativo 2026-05-26

Estado local al cierre de la iteracion:

- Ruta: `/sienna/legado-game`
- Endpoint read-only: `/api/sienna-storybook?includeMedia=1`
- Cobertura validada: 77 miembros cubiertos de 77, 0 omitidos.
- Escenas generadas por API: 20 capitulos narrativos.
- DB: no modificada.

Decision de producto vigente:

- Esto no es presentacion ni demo.
- Es una experiencia narrativa historica completa basada en la base genealogica real.
- El foco es narrativa generacional, cronologia inteligente, ramas familiares, fotos, lugares y memoria historica.
- La experiencia debe sentirse cinematografica, documental y emocional.

Reglas nuevas aplicadas:

- Los nacimientos no deben producir una escena por persona.
- Se agrupan por etapas, generaciones, lugares y ramas cuando sea posible.
- Las fotos multiples en mobile van en columna lateral, una debajo de otra.
- El texto en mobile tiene altura limitada y se desplaza hacia arriba mientras se escribe para evitar taparse con fotos.
- Los chistes/guinos se quitaron temporalmente porque no se estaban viendo bien.
- Los fondos de barco/despedida no se usan como relleno de ramas sin fecha.
- Las ramas sin fecha usan fondos de archivo familiar generados.
- La primera escena usa un escenario generado de la puerta/casa Sangiovanni basado en el video real.

Documentacion detallada de la iteracion:

- `docs/LEGADO_SANGIOVANNI_STORYTELLER_HANDOFF_2026-05-26.md`

## Estado operativo 2026-05-27 noche

Deploy confirmado en produccion:

- Commit GitHub: `630de7c` (`Polish legacy finale and narrative scrolling`).
- Produccion: `https://herenciard.vmsencf.com/sienna/legado-game`.
- Build activo verificado:
  - `/assets/index-BLXndUy2.js`
  - `/assets/index-B2UL79wP.css`
  - `/assets/LegadoSangiovanniGame-sCSq9LB1.js`
- Validaciones post-deploy:
  - `/` referencia los hashes nuevos.
  - `/api/health` responde 200 JSON.
  - `/sienna/legado-game` responde 200 HTML.
  - JS/CSS principales y chunk del juego responden 200 con content-type correcto.
  - Assets inexistentes bajo `/assets/*` responden 404 para evitar pantalla blanca por fallback HTML.
- No se tocaron DB, datos de produccion, `.env` ni migraciones.

Cambios funcionales vigentes:

- La narrativa larga permite scroll natural dentro del bloque de texto, sin barra visible ni slider.
- La dedicatoria final especial dura 8 segundos; luego desaparece el texto, pero la constelacion de fotos sigue activa.
- La constelacion final aparece dispersa por casi toda la escena y sigue hasta que el usuario pause o cambie de escena.
- La mencion especial debe ser breve, emotiva y familiar, sin mencionar ni insinuar herencia, dinero, reclamos o temas legales.
- La mencion especial usa a `Alessandro de Paola Sangiovanni` y `Joseline Sangiovanni`.
- Si la respuesta IA falla o no cumple reglas, el fallback es:
  `Gracias, Alessandro de Paola Sangiovanni y Joseline Sangiovanni: una raiz ancestral y un gesto generoso nos reunieron como familia.`
- El boton Play superior solo debe ponerse verde cuando la dedicatoria/narrativa IA esta pensando o trabajando; vuelve a blanco al terminar.
- Las fechas debajo de los nombres en creditos deben mostrarse completas.
- Las fotos del inicio del slide final no deben solaparse con los creditos; el cierre visual principal es la constelacion posterior.

Reglas de continuidad tras reinicio:

- Leer primero este documento y `docs/PRODUCTION_WHITE_SCREEN_RUNBOOK.md`.
- Si se vuelve a desplegar, subir assets primero y `index.html` siempre al final.
- Si FTP falla, no subir `index.html` hasta confirmar que todos los assets nuevos existen en produccion.
- Usar Hostinger MCP para confirmar dominio/root cuando haya duda; para archivos puntuales, FTP controlado sigue siendo valido si MCP de deploy falla.
- Nunca modificar datos productivos, DB, `.env` o migraciones para ajustes visuales/narrativos.


## Regla principal

El juego es una seccion nueva, aislada y segura. Puede consumir informacion del expediente familiar, pero nunca modifica el arbol, documentos, herederos, calculos, convergencias ni hallazgos reales.

- El backend/API sigue siendo la unica fuente de verdad.
- El frontend del juego solo presenta, anima e interpreta datos ya autorizados por API.
- El juego no guarda cambios sobre miembros, filiaciones, uniones, documentos, herederos, calculos o settings.
- Cualquier progreso ludico se guarda separado del expediente real.
- Si el juego necesita una version transformada de datos genealogicos, esa transformacion debe venir de un endpoint de lectura dedicado o de un contrato controlado del backend.
- La IA del juego tambien opera en modo read-only: puede narrar, orientar, proponer pistas y generar dialogos/misiones desde contexto autorizado, pero nunca escribe ni confirma datos del expediente.

## Objetivo de producto

Crear una experiencia interactiva del legado familiar donde la familia pueda explorar, descubrir conexiones, resolver puzzles, conversar y vivir el arbol Sangiovanni como una aventura narrativa.

No es:

- trivia,
- minijuego simple,
- gamification del expediente legal,
- dashboard con puntos.

Si es:

- videojuego narrativo,
- exploracion lateral,
- arbol genealogico como overworld vivo,
- progresion por ramas,
- mundos por linaje,
- convergencias como portales y desbloqueos,
- cooperativo familiar,
- PWA preparada para modo viaje.

## Ruta y aislamiento propuesto

Ruta propuesta:

- /sienna/legado-game

Alias posible:

- /sienna/juego

Archivos propuestos:

| Area | Ruta propuesta | Responsabilidad |
|------|----------------|-----------------|
| Pagina React | src/pages/LegadoSangiovanniGame.tsx | Montar HUD, layout y canvas Phaser |
| Modulo juego | src/game/legado/ | Escenas Phaser, entidades, estados, assets y adaptadores |
| Cliente API | src/game/legado/legacyGameApi.ts | Consumir endpoints read-only del juego |
| Cliente IA | src/game/legado/legacyGameAi.ts | Pedir narrativa, pistas y misiones IA en modo read-only |
| Tipos | src/game/legado/types.ts | Contratos de mundo, personajes, nodos, documentos y convergencias |
| Estado local | src/game/legado/gameProgressStore.ts | Progreso ludico separado del expediente |
| Documentacion | docs/LEGADO_SANGIOVANNI_GAME.md | Canon de diseno y seguridad |

La pagina debe estar protegida por ProtectedRoute, igual que las pantallas Sienna actuales. No debe modificar rutas existentes ni alterar comportamiento de paginas actuales.

## Inspiracion visual

Referencia del bosquejo enviado por Victor:

- HUD superior con jugador, nivel, XP y recursos.
- Panel izquierdo de personajes desbloqueados.
- Panel inferior/izquierdo de mapa del legado.
- Centro como escena jugable de plataformas, no como dashboard.
- Panel derecho con misiones activas.
- Boton principal Jugar.
- Estetica premium stylized: navy, dorado, verde convergencia, raices luminosas, pergaminos, particulas y arquitectura historica.

Inspiraciones aceptadas:

- Ori,
- Rayman Legends,
- Trine,
- Hades,
- Mario Wonder,
- Journey,
- Prince of Persia moderno.

Linea visual propia:

- aventura familiar historica,
- fantasia genealogica elegante,
- documentos vivos,
- portales de convergencia,
- raices de luz,
- mundos por rama familiar.

## Pilares del juego

### 1. El arbol como overworld

El arbol genealogico no se presenta como menu separado. Es el mapa principal del juego.

Cada nodo puede representar:

- persona,
- rama,
- documento,
- union,
- convergencia,
- mundo,
- nivel,
- zona bloqueada o desbloqueada.

Cada desbloqueo debe sentirse como crecimiento vivo del arbol.

### 2. Convergencias como mecanica central

Cuando dos ramas conectan:

- se abre un portal,
- el arbol crece visualmente,
- aparecen nuevas rutas,
- se desbloquean zonas ocultas,
- se revela historia familiar relacionada.

Las convergencias deben ser momentos visuales importantes, no simples notificaciones.

### 3. Exploracion narrativa

Los niveles mezclan:

- plataformas laterales,
- exploracion,
- puzzles,
- caminos ocultos,
- recoleccion de documentos,
- portales,
- desafios de restauracion,
- escenas narrativas breves.

### 4. Personajes familiares jugables

Personajes iniciales propuestos:

| Personaje | Rol ludico | Habilidad |
|-----------|------------|-----------|
| Victor | Conector de rutas | Detecta vinculos ocultos y activa rutas familiares |
| Gina | Detectora de convergencias | Revela caminos secretos y portales |
| Pedro Pablo | Protector documental | Abre archivos sellados y protege documentos historicos |
| Fulvia | Salto de linajes | Doble salto y activacion de conexiones multiples |

Los personajes se inspiran en miembros reales, pero su comportamiento en juego es narrativo/ludico. No altera ni reinterpreta datos legales.

## Mundos iniciales

### Mundo Santa Domenica Talao

Ambientacion:

- Santa Domenica Talao, Italia,
- pueblo de origen de las raices Sangiovanni,
- calles, montanas, plazas, iglesia y arquitectura real del lugar,
- puerta/casa Sangiovanni como punto narrativo de partida,
- salida familiar de Domenico y Maria Rosa con sus hijos varones Paolo y Vincenzo,
- ruta migratoria hacia Puerto Plata, Republica Dominicana.

Material visual canonico solicitado:

- fotos del pueblo,
- fotos de la fachada y puerta de la casa Sangiovanni,
- videos de caminatas, panoramicas o sonido ambiente,
- detalles historicos/orales asociados a la salida familiar.

Material recibido:

- Foto real de la puerta/casa Sangiovanni en Santa Domenica Talao.
- Referencia guardada localmente para desarrollo en public/game/legado/references/puerta-casa-sangiovanni-santa-domenica-talao.jpg.
- Primer asset stylized derivado para el vertical slice en public/game/legado/sangiovanni-door-game-scene.png.
- Video real de la casa Sangiovanni y mini recorrido por calles de Santa Domenica Talao.
- Referencia de video guardada localmente en public/game/legado/references/video-santa-domenica/casa-sangiovanni-calles-santa-domenica.mp4.
- Video real de recorrido nocturno donde se senala La Casa Sangiovanni, con fachada antigua, gran puerta arqueada de madera, detalles de piedra y referencia oral a origen de siglo XVII/XVIII.
- Referencia de video nocturno guardada localmente en public/game/legado/references/video-santa-domenica/recorrido-nocturno-casa-sangiovanni.mp4.
- Video explicativo de la calle principal de Santa Domenica Talao.
- Referencia de calle principal guardada localmente en public/game/legado/references/video-santa-domenica/calle-principal-santa-domenica.mp4.
- Video de la comuna / vista abierta de Santa Domenica Talao, con edificio amarillo, arco metalico blanco, calle urbana, escaleras y vista costera.
- Referencia de comuna y vista costera guardada localmente en public/game/legado/references/video-santa-domenica/comuna-santa-domenica-vista-costera.mp4.
- Video de caminata urbana por Santa Domenica Talao, con edificios coloridos, comercios locales, salon, carros, scooters, montanas y detalles cotidianos como contenedor de pilas usadas.
- Referencia de caminata urbana guardada localmente en public/game/legado/references/video-santa-domenica/caminata-urbana-santa-domenica.mp4.
- Video del centro / plaza mirador de Santa Domenica Talao, con plaza de mosaico, fuente, mapas locales, terraza panoramica, tejados rojos, colinas verdes y vista al mar.
- Referencia de centro y plaza mirador guardada localmente en public/game/legado/references/video-santa-domenica/centro-plaza-mirador-santa-domenica.mp4.
- Foto panoramica de Santa Domenica Talao con tejados, terraza, valle verde y montanas al fondo.
- Referencia de imagen guardada localmente en public/game/legado/references/images-santa-domenica/vista-montanas-tejados-santa-domenica.jpg.

Ideas de diseno derivadas del video:

- Crear una zona jugable llamada El Camino de las Flores.
- Usar calles estrechas de piedra como pasillos laterales con profundidad parallax.
- Convertir la alfombra decorativa del suelo en puzzle de patrones, memoria y desbloqueo de ruta.
- Usar campanas/ambiente de pueblo como parte del audio del mundo Santa Domenica.
- Hacer que el camino hacia la iglesia funcione como transicion narrativa entre la casa Sangiovanni y el primer portal del legado.
- La IA puede actuar como narradora contextual del recorrido, explicando que el camino no modifica el expediente: solo ilumina el origen familiar como experiencia jugable.

Nueva escena derivada:

### La Casa Sangiovanni de Noche

Objetivo:

- Convertir el recorrido nocturno en una escena de descubrimiento historico.
- La fachada y puerta arqueada funcionan como umbral del legado.
- El guia/relato historico inspira una voz narrativa que introduce la antiguedad de la casa.
- La referencia siglo XVII/XVIII debe tratarse como contexto oral/historico hasta que exista documentacion verificable en el backend.

Mecanicas posibles:

- exploracion lenta frente a la fachada,
- activar inscripciones o detalles de piedra,
- escuchar campanas/ambiente nocturno,
- resolver un puzzle de luz sobre la puerta,
- abrir una memoria jugable sobre la salida hacia Puerto Plata,
- desbloquear el nodo Casa Sangiovanni dentro del arbol-overworld.

Regla de datos:

- El video puede inspirar escena, atmosfera y narrativa.
- Las fechas siglo XVII/XVIII no deben guardarse como hecho canonico del expediente sin soporte documental backend.
- La IA puede decirlo como relato del guia o tradicion local, no como verdad legal/genealogica confirmada.

### Calle Principal de Santa Domenica

Objetivo:

- Usar la calle principal como columna vertebral explorable del primer mundo.
- Conectar casa Sangiovanni, camino hacia la iglesia, zonas de memoria familiar y primeras bifurcaciones del arbol-overworld.
- Definir la escala real del pueblo: calles estrechas, piedra, fachadas antiguas, balcones, puertas, pendientes y pasos peatonales.

Mecanicas posibles:

- recorrido lateral con profundidad tipo parallax,
- bifurcaciones hacia casas/documentos/recuerdos,
- dialogos IA al pasar por puntos narrativos,
- rutas bloqueadas por nodos familiares incompletos,
- marcas luminosas en el suelo para guiar hacia documentos o portales,
- transiciones entre dia/festival/noche segun fragmentos desbloqueados.

Uso de IA:

- La IA puede actuar como guia del recorrido, identificando zonas del pueblo como memoria jugable.
- Puede explicar el valor narrativo de una calle, fachada o ruta usando el material de referencia.
- No debe convertir detalles del video en hechos genealogicos canonicos salvo que el backend los confirme.

### Comuna y Vista Costera

Objetivo:

- Usar la vista abierta de Santa Domenica Talao para dar escala al primer mundo.
- Mostrar que el origen familiar esta en un pueblo elevado con salida visual hacia la costa.
- Conectar emocionalmente la partida familiar hacia Puerto Plata con una ruta luminosa que mira al mar.

Elementos visuales:

- edificio amarillo,
- arco metalico blanco,
- calle urbana con estacionamiento,
- escaleras descendentes,
- cielo azul y costa distante,
- sensacion de mirador / salida hacia el viaje.

Mecanicas posibles:

- zona de mirador donde el jugador ve la ruta migratoria como linea dorada hacia el horizonte,
- desbloqueo del mapa maritimo hacia Puerto Plata,
- puzzle de orientacion usando costa, campanas y camino principal,
- transicion desde el pueblo al puerto simbolico,
- momento narrativo IA sobre la decision de partir.

Regla narrativa:

- La vista costera puede representar el impulso del viaje.
- La ruta hacia Puerto Plata debe apoyarse en datos del backend cuando se presenten nombres, fechas o hechos familiares especificos.

### Vida Cotidiana de Santa Domenica

Objetivo:

- Evitar que el primer mundo sea solo postal historica o fantasia estetica.
- Mostrar Santa Domenica como pueblo vivo: calles actuales, comercios, vehiculos, vecinos, senaletica local y rutina diaria.
- Combinar memoria historica con presente familiar para que la exploracion se sienta real.

Elementos visuales:

- edificios coloridos,
- comercios pequenos,
- salon / tienda local,
- carros y scooters en calles estrechas,
- montanas al fondo,
- cielo claro,
- contenedor amarillo de pilas usadas como detalle ambiental reconocible.

Mecanicas posibles:

- NPCs del pueblo que dan pistas narrativas,
- objetos ambientales interactivos sin valor genealogico canonico,
- pequenas tareas de exploracion para aprender la geografia del pueblo,
- rutas laterales hacia comercios o miradores,
- contraste entre pueblo actual y memorias historicas que aparecen al activar nodos del legado.

Uso de IA:

- La IA puede narrar el contraste entre la vida cotidiana actual y la memoria ancestral.
- Puede convertir detalles ambientales en pistas ludicas, no en hechos del expediente.
- Debe diferenciar claramente entre referencia visual contemporanea y dato genealogico confirmado por backend.

### Centro / Plaza Mirador

Objetivo:

- Crear un hub explorable para el primer mundo de Santa Domenica Talao.
- Usar la plaza como punto de descanso, seleccion de rutas, mapa local y orientacion narrativa.
- Conectar visualmente el pueblo, las colinas y el mar como antesala emocional del viaje hacia Puerto Plata.

Elementos visuales:

- plaza con pavimento/mosaico,
- fuente,
- mapas locales,
- terraza panoramica,
- tejados rojos,
- colinas verdes,
- costa y mar al fondo,
- luz de dia clara y ambiente pacifico.

Mecanicas posibles:

- abrir el mapa del legado desde el mirador,
- seleccionar rutas: Casa Sangiovanni, Calle Principal, Camino de las Flores, Iglesia, Mirador Costero,
- puzzle de orientacion usando mapas locales y vistas panoramicas,
- punto de conversacion IA para explicar donde esta cada zona del primer mundo,
- desbloquear la ruta simbolica hacia Puerto Plata al completar recuerdos de origen.

Uso de IA:

- La IA puede funcionar como guia de plaza/hub.
- Puede sugerir la proxima ruta segun misiones, documentos encontrados y nodos desbloqueados.
- Puede narrar el contraste entre mirar el pueblo desde arriba y entender la expansion familiar hacia Republica Dominicana.

### Vista de Montanas y Tejados

Objetivo:

- Definir el fondo panoramico del primer mundo y los parallax lejanos.
- Usar tejados, terrazas, valle verde y montanas como capas visuales del entorno.
- Reforzar que Santa Domenica es un pueblo de altura con memoria familiar mirando hacia rutas mas amplias.

Uso visual:

- capa lejana de montanas azuladas,
- capa media de valle y vegetacion,
- capa cercana de tejados, chimeneas y balcones,
- buen punto para escenas de contemplacion o apertura de capitulo.

Mecanicas posibles:

- mirador donde se revela el mapa completo del mundo,
- desbloqueo de rutas por orientacion visual,
- coleccion de recuerdos panoramicos,
- transicion dia/atardecer para marcar avance narrativo.

Primer objetivo narrativo:

- despertar la puerta de la casa Sangiovanni como primer umbral del legado y encontrar el fragmento que abre la ruta migratoria.

Uso visual:

- estos materiales deben orientar texturas, paleta, arquitectura, encuadres, fondos parallax y escenas narrativas;
- no deben subirse a produccion sin revision/autorizacion;
- cualquier dato familiar derivado debe entrar por backend/API read-only o por contenido narrativo seguro, nunca como modificacion directa del expediente.

### Mundo Vincenzo

Ambientacion:

- ruta posterior vinculada a Vincenzo,
- puertos,
- villas,
- monasterios,
- barcos,
- archivos historicos,
- migracion.

Primer objetivo narrativo:

- encontrar fragmentos documentales que conectan Santa Domenica Talao con nuevas ramas.

### Mundo Paolo

Ambientacion:

- Republica Dominicana,
- expansion familiar,
- convergencias,
- ramas ocultas,
- conexiones historicas.

Primer objetivo narrativo:

- unir rutas dispersas y abrir el primer portal de convergencia entre ramas.

## Objetos de juego

Objetos coleccionables:

- actas,
- cartas,
- retratos,
- documentos,
- sellos,
- llaves familiares,
- fragmentos del arbol,
- simbolos de ramas,
- pergaminos de ruta,
- semillas de legado.

Estos objetos pueden representar informacion real del expediente, pero deben consumirse desde endpoints read-only y presentarse con una capa narrativa.

## Obstaculos y enemigos

No usar monstruos genericos como eje principal.

Obstaculos tematicos:

- documentos perdidos,
- ramas incompletas,
- nodos corruptos,
- informacion danada,
- convergencias bloqueadas,
- registros historicos faltantes,
- niebla documental,
- sellos cerrados,
- rutas fragmentadas.

La fantasia visual representa dificultad de descubrimiento, no hechos juridicos nuevos.

## Cooperativo

Meta del cooperativo:

- familiares entrando desde movil/tablet/laptop,
- cada persona controla un personaje,
- colaboran para abrir rutas,
- restauran conexiones,
- resuelven puzzles familiares,
- desbloquean generaciones.

Fases recomendadas:

1. Single player local con cambio de personaje.
2. Cooperativo local en el mismo dispositivo o por controles simples.
3. Cooperativo multidispositivo en red local o sesion compartida.
4. Socket.IO para sincronizacion real si el vertical slice lo justifica.

## PWA y modo viaje

El juego debe funcionar como PWA y respetar modo viaje.

Reglas:

- Los assets estaticos del juego pueden cachearse.
- Datos sensibles del expediente no deben cachearse indiscriminadamente.
- Si se cachea informacion narrativa derivada, debe ser un paquete seguro de lectura, no el expediente completo.
- Offline debe permitir jugar con datos previamente autorizados o con contenido demo seguro.
- Al reconectar, el juego puede refrescar datos desde API read-only.

## Integracion backend read-only

Endpoint recomendado:

- GET /api/sienna-game-world

Responsabilidad:

- entregar un paquete controlado para juego,
- no exponer campos internos innecesarios,
- no permitir escritura,
- no recalcular en frontend reglas sucesorales ni genealogicas.

Contrato inicial sugerido:

| Campo | Descripcion |
|-------|-------------|
| players | Personajes jugables autorizados |
| worlds | Mundos/rama disponibles |
| tree_nodes | Nodos jugables derivados del arbol |
| convergences | Convergencias leibles y rutas relacionadas |
| documents | Documentos publicables como objetos narrativos |
| missions | Misiones generadas desde estado read-only |
| permissions | Capacidades de lectura del usuario actual |

Endpoints prohibidos para el juego:

- cualquier endpoint de escritura de miembros,
- cualquier endpoint de escritura de documentos,
- cualquier endpoint de settings,
- cualquier endpoint de confirmacion de herederos,
- cualquier endpoint que cambie calculos, arbol o expediente.

## IA desde el inicio

La IA forma parte del diseno base del juego desde el primer vertical slice. Su rol no es reemplazar el backend ni crear verdad genealogica. Su rol es convertir datos autorizados en experiencia narrativa, pistas y momentos emocionales.

Roles permitidos:

- narradora contextual del legado,
- guia de misiones,
- generadora de dialogos breves,
- sistema de pistas para puzzles,
- explicadora de convergencias ya existentes,
- adaptadora del tono segun personaje jugable,
- creadora de textos atmosfericos sobre documentos o ramas autorizadas.

Roles prohibidos:

- modificar el arbol,
- crear parentescos nuevos,
- confirmar herederos,
- alterar calculos,
- validar documentos,
- inventar hechos familiares como si fueran expediente,
- guardar cambios en tablas canonicas,
- revelar prompts, configuracion interna, endpoints sensibles o claves.

Endpoint recomendado:

- POST /api/sienna-game-ai

Reglas del endpoint:

- recibe solo contexto autorizado por /api/sienna-game-world,
- recibe estado ludico no sensible,
- devuelve texto narrativo, pistas o misiones sugeridas,
- no tiene permisos de escritura,
- si no hay certeza, debe decir que es una pista narrativa y no un dato confirmado,
- debe citar o anclar la respuesta a nodos/documentos/convergencias recibidas por backend cuando aplique.

Contrato inicial sugerido:

| Campo request | Descripcion |
|---------------|-------------|
| mode | narrator, hint, mission, dialogue, convergence |
| player_id | Personaje activo |
| scene_id | Escena o mundo actual |
| visible_node_ids | Nodos del arbol visibles en el momento |
| collected_document_ids | Documentos ya encontrados en juego |
| game_progress | Progreso ludico no canonico |
| user_prompt | Pregunta opcional del jugador |

| Campo response | Descripcion |
|----------------|-------------|
| text | Texto narrativo o respuesta |
| tone | Estilo sugerido: epic, intimate, mystery, warning |
| anchors | IDs de nodos/documentos/convergencias usados |
| suggested_action | Accion ludica sugerida, nunca accion de expediente |
| confidence | Nivel de certeza narrativa segun datos recibidos |

Primera implementacion IA recomendada:

1. Narrador del inicio de La ruta de Vincenzo.
2. Pista IA al acercarse a un documento.
3. Dialogo corto cuando se desbloquea una convergencia.
4. Mision generada desde datos mock/read-only.
5. Fallback deterministico si no hay OPENAI_API_KEY o el endpoint IA falla.

La IA debe sentirse integrada en el gameplay: aparece como voz del legado, pergamino vivo, eco del arbol o guia contextual; no como chat generico incrustado.

## Progreso del juego

El progreso ludico debe separarse del expediente real.

Puede incluir:

- nivel de personaje,
- XP,
- monedas/sellos,
- misiones completadas,
- cosmeticos desbloqueados,
- niveles visitados,
- coleccion narrativa vista.

No puede incluir como escritura real:

- crear/modificar miembros,
- corregir parentescos,
- confirmar herederos,
- validar documentos,
- alterar convergencias,
- cambiar resultados sucesorales.

Persistencia recomendada por fase:

1. LocalStorage/IndexedDB para demo local.
2. Tabla propia futura game_progress si se decide persistencia por usuario.
3. Nunca mezclar progreso ludico con tablas canonicas del expediente.

## Arquitectura tecnica

Stack recomendado:

- React,
- TypeScript,
- Tailwind,
- Phaser.js,
- PWA/service worker existente con reglas nuevas para assets del juego,
- Socket.IO solo en fase cooperativa real.

Principio de montaje:

- React contiene la pagina, layout, HUD y permisos.
- Phaser controla canvas, escenas, fisicas, plataformas, entidades, particulas y gameplay.
- Un adaptador traduce datos API read-only a estructuras de juego.
- El estado del expediente no entra directo a Phaser; pasa por contrato del juego.

Escenas Phaser propuestas:

| Escena | Uso |
|--------|-----|
| BootScene | Preparar escala, configuracion y carga minima |
| PreloadScene | Cargar assets del mundo activo |
| LegacyTreeScene | Overworld del arbol vivo |
| WorldVincenzoScene | Primer nivel lateral |
| ConvergencePortalScene | Evento de portal/convergencia |
| StoryScene | Dialogos y transiciones narrativas |

## Vertical slice inicial

Objetivo:

Probar que esto puede sentirse como videojuego real, no como pantalla decorativa.

Contenido minimo:

- ruta /sienna/legado-game,
- pagina aislada protegida,
- canvas Phaser embebido full-bleed dentro de la experiencia,
- HUD inspirado en el bosquejo,
- capa IA inicial para narracion, pistas y dialogos read-only,
- selector de personajes inicial,
- overworld de arbol vivo con 5-8 nodos,
- primer nivel La ruta de Vincenzo,
- punto de origen visual/narrativo en Santa Domenica Talao y la casa Sangiovanni,
- personaje controlable,
- plataformas,
- recoleccion de documento/pergamino,
- portal de convergencia bloqueado/desbloqueable,
- panel de misiones activas,
- panel o burbuja de voz del legado con texto IA/fallback,
- datos mock controlados o endpoint read-only local,
- cero escritura al expediente.

No incluido en el primer corte:

- multiplayer real,
- economia definitiva,
- todos los mundos,
- sincronizacion familiar,
- deploy produccion,
- escritura de progreso en backend.

## Secuencia de trabajo

1. Documentar canon y reglas de seguridad.
2. Agregar dependencia Phaser con pnpm si no existe.
3. Crear estructura src/game/legado/.
4. Crear pagina LegadoSangiovanniGame.tsx.
5. Registrar ruta protegida /sienna/legado-game.
6. Crear cliente IA read-only con fallback deterministico.
7. Implementar vertical slice con datos mock seguros.
8. Agregar contrato read-only propuesto para backend.
9. Reemplazar mock por API read-only cuando el endpoint este listo.
10. Revisar PWA/offline para cachear solo assets seguros.
11. Ejecutar build local y validar que paginas actuales no cambian.
12. Levantar entorno local para prueba temprana en /sienna/legado-game.

## Criterios de aceptacion

Para considerar valido el primer corte:

- Las rutas actuales siguen funcionando igual.
- La nueva ruta existe y esta protegida.
- El juego carga sin afectar el dashboard ni las paginas Sienna actuales.
- No existe ningun POST/PUT/PATCH/DELETE desde el juego hacia expediente.
- La unica llamada POST permitida en el juego sera a /api/sienna-game-ai y no tendra permisos de escritura.
- El codigo del juego no importa funciones de calculo sucesoral ni genealogico de frontend.
- El arbol real no se modifica.
- El gameplay permite mover un personaje, recolectar un objeto y activar una convergencia visual.
- La IA genera al menos narracion inicial, pista o dialogo con fallback local seguro.
- pnpm build pasa localmente.
- La ruta puede probarse localmente desde el primer corte funcional.

## Gameplay canonico del storyboard

El mockup de gameplay enviado por Victor queda como referencia de flujo, ritmo y presentacion. No es solo inspiracion visual; define la progresion base que debe sentirse dentro del juego.

Secuencia inicial:

1. Inicio / Puerto de Genova o Santa Domenica origen: el jugador entra a una escena lateral con HUD completo, avatar, nivel, monedas, gemas, pausa y controles tactiles.
2. Documento encontrado: el jugador recupera un acta o pergamino historico; aparece tarjeta de documento con contador de progreso.
3. Convergencia: al conectar ramas, aparece un portal luminoso y una tarjeta de convergencia descubierta.
4. Viaje a America: transicion narrativa hacia barco/ruta migratoria Italia -> Puerto Plata.
5. Nueva mision: se desbloquea una mision familiar concreta basada en documentos, albumes, ramas o conexiones.
6. Progreso del legado: se muestra el arbol familiar vivo con ramas conectadas, documentos, personajes y convergencias.

Reglas de gameplay derivadas:

- El objetivo no puede sentirse como “camina hasta un papel”. Cada documento debe abrir una consecuencia jugable.
- El documento debe tener presencia visual, glow y feedback claro.
- Al recoger un documento, el personaje debe seguir controlable y el siguiente objetivo debe ser evidente.
- La convergencia debe sentirse como evento importante: portal, crecimiento del arbol, nueva ruta y tarjeta de descubrimiento.
- El arbol del legado debe aparecer como progreso vivo, no como menu administrativo.
- Las escenas deben tener look de videojuego premium: profundidad, luz, capas, particulas, path jugable, personaje visible y UI de juego.

## Canon de direccion de arte

La direccion de arte queda fijada por Victor como una aventura narrativa historica, no fantasia medieval generica ni app administrativa. Cada escenario debe sentirse real, antiguo, familiar y cinematografico.

### Mundo 1: Santa Domenica Talao, Calabria 1860

Rol narrativo: origen familiar. Debe provocar la sensacion: "Aqui comenzo la historia de nuestra familia."

Atmofera:

- pueblo montanoso del sur de Italia;
- calido, nostalgico, elegante y emocional;
- historico, humano, artesanal y profundamente familiar;
- sin tecnologia moderna, sin autos, sin elementos futuristas.

Iluminacion:

- hora dorada italiana;
- atardecer naranja suave;
- sombras largas;
- niebla ligera entre montanas;
- reflejos dorados sobre piedra;
- rayos de sol entrando entre edificios antiguos.

Arquitectura y ciudad:

- calles estrechas de piedra;
- escaleras antiguas;
- puentes elevados;
- casas mediterraneas envejecidas;
- techos terracota;
- balcones con flores;
- iglesias historicas;
- plazas pequenas;
- monasterios;
- fuentes de agua;
- callejones ocultos;
- piedra clara envejecida;
- madera antigua;
- hierro forjado;
- ventanas arqueadas;
- paredes con musgo.

Profundidad visual:

- montanas italianas al fondo;
- cipreses;
- olivares;
- vegetacion mediterranea;
- mar o puertos lejanos ocasionales;
- capas de edificios;
- barcos moviendose;
- humo;
- aves;
- iluminacion volumetrica;
- arboles antiguos vinculados visualmente al legado.

Gameplay de Calabria:

- plataformas de piedra;
- ruinas familiares;
- caminos elevados;
- puentes antiguos;
- techos;
- puertos;
- tuneles;
- archivos historicos;
- iglesias;
- pasadizos ocultos.

Detalles narrativos:

- retratos viejos;
- simbolos familiares;
- documentos olvidados;
- sellos;
- cartas;
- campanas;
- velas;
- barcos alejandose;
- ropa secandose en balcones;
- humo de chimeneas;
- sonidos de pueblo antiguo.

Naturaleza viva:

- raices atravesando piedra;
- enredaderas;
- arboles antiguos;
- pequenas cascadas;
- flores silvestres;
- hojas con viento;
- particulas suaves.

Estilo visual:

- stylized premium;
- cinematografico;
- detallado sin hiperrealismo;
- inspiracion: Ori and the Blind Forest, Rayman Legends, Studio Ghibli europeo, Prince of Persia moderno, Trine.

### Mundo 2: Puerto Plata, Republica Dominicana

Rol narrativo: expansion del legado en America. Debe provocar la sensacion: "Aqui el legado comenzo a crecer."

Contraste emocional:

- Italia se siente montanosa, nostalgica, antigua y de origen;
- Puerto Plata se siente abierta, luminosa, expansiva, aventurera y llena de futuro.

Atmofera:

- tropical;
- calida;
- luminosa;
- viva;
- caribena;
- elegante;
- historica;
- no moderna, no urbana actual, no turistica contemporanea.

Iluminacion:

- sol caribeno intenso;
- luz humeda y brillante;
- atardeceres naranjas, rosados y dorados;
- reflejos sobre mar, calles, vegetacion, edificios y puertos.

Arquitectura:

- arquitectura victoriana caribena;
- casas coloniales;
- balcones de madera;
- colores tropicales desgastados por el tiempo;
- plazas abiertas;
- puertos historicos;
- mercados;
- iglesias;
- edificios comerciales antiguos.

Naturaleza:

- palmeras;
- vegetacion tropical abundante;
- manglares;
- playas;
- mar brillante;
- aves caribenas;
- flores tropicales;
- agua cristalina;
- humedad visible en el ambiente.

Gameplay de Puerto Plata:

- puertos;
- muelles;
- mercados;
- techos coloniales;
- calles tropicales;
- barcos;
- fortalezas;
- plantaciones;
- almacenes historicos;
- rutas ocultas cerca del mar;
- tuneles;
- archivos;
- iglesias antiguas;
- documentos escondidos.

Sonido y musica:

- olas;
- gaviotas;
- viento tropical;
- campanas;
- madera de barcos;
- mercados;
- musica caribena instrumental suave;
- tono epico, elegante y con identidad dominicana/caribena.

Transicion Italia a Puerto Plata:

- debe sentirse cinematografica;
- cambia color del mundo;
- cambia iluminacion;
- cambia vegetacion;
- cambia musica;
- cambia arquitectura;
- cambia energia emocional;
- el jugador debe sentir: "el legado llego al Caribe."

## Riesgos y controles

| Riesgo | Control |
|--------|---------|
| Que parezca dashboard decorado | Phaser debe controlar gameplay real desde el primer corte |
| Que duplique reglas del expediente | Endpoint read-only dedicado y tipos propios del juego |
| Que afecte paginas existentes | Ruta nueva, componentes aislados, sin modificar flujos actuales |
| Que cachee datos sensibles offline | Service worker limitado a assets y paquetes seguros |
| Que multiplayer complique el MVP | Cooperativo real queda para fase posterior |
| Que el visual sea inferior al concepto | Empezar con estilo premium: capas, particulas, luz, profundidad, no pixel art |
| Que la IA invente verdad familiar | IA recibe contexto acotado read-only y responde como narradora/pista, no como autoridad genealogica |

## Decision vigente

Se puede comenzar el desarrollo local del vertical slice despues de esta documentacion. La primera implementacion debe priorizar aislamiento, seguridad, IA read-only integrada al gameplay, sensacion de juego real y fidelidad al concepto visual enviado por Victor.

## Ronda narrativa y creditos - 2026-05-28

Alcance aprobado por Victor:

- Trabajar primero en local y luego desplegar a Hostinger/GitHub.
- No modificar DB, datos de produccion, migraciones ni \`.env\`.
- Mantener \`ai=0\` como narrativa base valida, pero permitir variacion aleatoria para usuarios normales.

Cambios aplicados:

- La ruta \`/sienna/juego\` ahora elige aleatoriamente narrativa base o narrativa AI cuando la URL no trae parametro \`ai\`.
- \`?ai=0\` fuerza narrativa base deterministica.
- \`?ai=1\` fuerza narrativa AI.
- La mencion especial final exige el nombre correcto \`Jocelyn del Jesús Sangiovanni Báez\`.
- La mencion especial mantiene tambien a \`Alessandro de Paola Sangiovanni\`.
- La constelacion de fotos al final de los creditos queda montada hasta que el usuario cambie de escena o salga de la pantalla.
- El efecto de constelacion se ajusto para que las fotos se enciendan en golpes breves y fases distintas, simulando destellos aleatorios en vez de un fade suave.
- Se sincronizaron localmente fotos de miembros existentes en produccion para el storyteller, sin escribir en produccion.

Fotos sincronizadas desde produccion como assets locales:

- \`alessandro\` -> \`/game/legado/archive/member-photos/prod-sync/alessandro.png\`
- \`paolo\` -> \`/game/legado/archive/member-photos/prod-sync/paolo.png\`
- \`vincenzo\` -> \`/game/legado/archive/member-photos/prod-sync/vincenzo.png\`
- \`jose-vicente\` -> \`/game/legado/archive/member-photos/prod-sync/jose-vicente.png\`
- \`domingo-ramon-sangiovanni-perez-1779220685351\`
- \`gilda-altagracia-sangiovanni-gesualdo-1779238018002\`
- \`irma-mercedes-sangiovanni-gesualdo-1779245439725\`
- \`javier-de-jesus-marquez-sangiovanni-1779247232889\`
- \`jose-luis-de-jesus-marquez-sangiovanni-1779247298999\`
- \`maria-amparo-sangiovanni-gesualdo-1779300884233\`
- \`yolanda-providencia-sangiovanni-gesualdo-1779220777309\`

Notas de fuente:

- Produccion fue consultada en modo solo lectura.
- Alessandro se tomo de \`confirmed_heirs\`, archivo original \`39736.png\`.
- Maria Rosa Grisolia en local y produccion aun pueden venir de fuentes distintas: local tiene el miembro canonico \`maria-rosa-grisolia\`; produccion tenia una fila adicional \`maria-rosa-grisolia-di-vanna-1779890134349\` con \`40362.png\`. No se hizo union ni cambio de datos porque eso implicaria decision de datos/DB.

Validacion local:

\`\`\`sh
pnpm run dev:up
node --check server/index.js
php -l public/api.php
pnpm run build
\`\`\`
