# Sienna Game Handoff - El Legado Sangiovanni

Fecha: 2026-05-25
Estado: desarrollo local, NO desplegado a produccion.

## Contexto principal

Victor quiere crear un videojuego narrativo cooperativo real dentro de Sienna/HerenciaRD: "El Legado Sangiovanni".

No debe ser trivia, minijuego ni gamification. Debe sentirse como videojuego premium con:
- exploracion lateral;
- narrativa familiar;
- plataformas;
- documentos;
- convergencias;
- mundos familiares;
- arbol genealogico como mapa vivo;
- IA integrada desde el inicio;
- PWA/offline;
- lectura read-only desde backend;
- nunca modificar el expediente/arbol real.

Regla critica:
El juego solo consume datos controlados del backend. No escribe, no edita, no calcula expediente real desde frontend.

## Direccion de arte aprobada por Victor

### Mundo 1: Santa Domenica Talao, Calabria 1860

Debe sentirse:
- pueblo historico mediterraneo montanoso del sur de Italia;
- origen familiar;
- calido, nostalgico, elegante, cinematografico;
- hora dorada italiana;
- piedra envejecida, techos terracota, balcones con flores;
- calles estrechas, escaleras, puentes, iglesias, plazas, monasterios, fuentes;
- montanas, cipreses, olivares, vegetacion mediterranea, mar lejano;
- raices, enredaderas, arboles antiguos, flores, particulas;
- documentos, cartas, sellos, retratos, campanas, velas;
- sin tecnologia moderna, sin autos, sin elementos futuristas.

Frase emocional:
"Aqui comenzo la historia de nuestra familia."

### Mundo 2: Puerto Plata historico

Debe sentirse:
- expansion del legado en America;
- tropical, calido, luminoso, caribeno, elegante;
- arquitectura victoriana caribena y colonial;
- puertos, muelles, mercados, iglesias, fortalezas, barcos;
- palmeras, mar, aves, flores tropicales, humedad;
- no moderno/turistico actual.

Frase emocional:
"Aqui el legado comenzo a crecer."

## Gameplay canonico

Storyboard de gameplay enviado por Victor:
1. Inicio.
2. Documento encontrado.
3. Convergencia.
4. Viaje.
5. Nueva mision.
6. Progreso del legado.

Reglas:
- No puede sentirse como caminar hacia un papel.
- Documento debe tener glow y consecuencia jugable.
- Al recoger documento, personaje debe seguir controlable.
- Convergencia debe abrir portal/nueva ruta/arbol vivo.
- Progreso debe mostrarse como arbol familiar vivo, no menu administrativo.

## Feedback reciente de Victor

Victor NO esta satisfecho todavia con la escena actual.

Problemas detectados por Victor:
- El escenario se ve demasiado pegado/cercano a una puerta.
- La puerta se siente gigante; debe sentirse que el personaje esta en el pueblo.
- El escenario debe estar proporcionalmente coherente con el personaje.
- El ambiente debe tener el mismo estilo ilustrado/stylized premium del personaje.
- El personaje debe moverse de verdad, con pasos, no solo deslizarse o "intentar" moverse.
- Debe parecer videojuego normal/profesional, no composicion improvisada.

Ultimo pedido:
"Prepárate para reiniciar y no pierdas el hilo cuando volvamos."

## Estado tecnico actual

Proyecto:
`/home/pc/.openclaw/workspace-sienna/projects/herencia-familia-dominicana`

Ruta local:
`http://10.0.0.93:8080/sienna/legado-game`

Rutas agregadas:
- `/sienna/legado-game`
- `/sienna/juego`

Archivos principales:
- `docs/LEGADO_SANGIOVANNI_GAME.md`
- `src/pages/LegadoSangiovanniGame.tsx`
- `src/game/legado/LegadoGameCanvas.tsx`
- `src/game/legado/LegadoVincenzoScene.ts`
- `src/game/legado/legacyGameAi.ts`
- `src/game/legado/mockWorld.ts`
- `src/game/legado/types.ts`

Assets importantes:
- `public/game/legado/sangiovanni-door-game-scene.png`
- `public/game/legado/characters/victor-explorer.png`
- `public/game/legado/characters/victor-explorer-v2.png`
- `public/game/legado/references/puerta-casa-sangiovanni-santa-domenica-talao.jpg`
- videos/fotos de Santa Domenica en `public/game/legado/references/`

Dependencia:
- Phaser agregado con `pnpm add phaser@3.90.0`.

Build:
- `pnpm build` pasa.
- Dev server local estaba en puerto 8080.

## Cambios actuales no necesariamente aceptados

Se implemento una base funcional pero Victor aun no la considera profesional:
- fullscreen mobile;
- HUD tipo juego;
- controles tactiles;
- personaje visible tambien como capa React;
- movimiento lateral simple en la capa React;
- Phaser canvas con escena base;
- documento/portal/progreso;
- IA read-only/fallback;
- canon de arte documentado.

Pero la escena debe rehacerse mejor.

## Proximo paso recomendado al volver

No seguir puliendo encima de la puerta cercana. Hacer corte limpio:

1. Crear un nuevo fondo vertical/landscape jugable de Santa Domenica como pueblo, NO close-up de puerta:
   - plano lateral tipo plataformas;
   - calle de piedra;
   - casas mediterraneas al fondo;
   - montanas y mar lejano;
   - puerta/casa Sangiovanni como landmark pequeño/medio, no gigante;
   - foreground jugable con escala clara para el personaje.

2. Usar ese fondo como escena principal.
3. Colocar personaje con escala fija coherente.
4. Mantener movimiento real de la capa visible mientras se genera spritesheet real.
5. Luego reemplazar personaje estatico por spritesheet/rig:
   - idle;
   - walk 6-8 frames;
   - jump;
   - pickup.
6. Despues: documento, portal, viaje a Puerto Plata, mapa de arbol.

## Nota operativa

No desplegar a produccion/Hostinger/GitHub sin permiso explicito de Victor.
Local primero.

