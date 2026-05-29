# HerenciaRD Handoff - 2026-05-28

## Estado actual

- Produccion fue actualizada en Hostinger con autorizacion explicita de Victor.
- GitHub esta alineado con main / origin/main.
- No se tocaron DB, datos de produccion, fotos de produccion, documentos, .env ni migraciones.
- Ultimo commit desplegado y pusheado: 30cf4f8 Reset stale PWA cache.

## Verificacion de produccion

- https://herenciard.vmsencf.com/sienna responde 200.
- https://herenciard.vmsencf.com/sienna/juego responde 200.
- https://herenciard.vmsencf.com/api/health responde {"ok":true,"storage":"mysql","runtime":"php"}.
- sw.js en produccion usa CACHE_VERSION = legado-sangiovanni-v8-pwa-reset.
- manifest.webmanifest en produccion usa:
  - id: /sienna?pwa=20260528-reset-v8
  - start_url: /sienna?pwa=20260528-reset-v8

## Cambios cerrados

- Se corrigio el PWA/home-screen en iPhone para mitigar pantalla blanca por cache viejo:
  - public/sw.js subio a version legado-sangiovanni-v8-pwa-reset.
  - El service worker borra caches existentes al activar.
  - El service worker reclama clientes y fuerza navegacion con pwa-reset.
  - manifest.webmanifest fue versionado.
  - index.html ahora referencia /manifest.webmanifest?v=20260528-reset-v8.
- Se amplio el texto en escenas sin fotos laterales:
  - src/story/legado/NarrativeText.tsx permite mas ancho cuando no hay columna de fotos.
- Se restauraron controles narrativos:
  - La pausa aplica tambien durante creditos.
  - En creditos se puede activar musica desde el boton aunque se haya llegado con musica apagada.
- Se elimino el experimento de la tercera cancion; el audio vuelve a las dos canciones originales.
- Se corrigio el flujo de creditos/dedicatoria:
  - El efecto constelacion no depende de que exista texto de dedicatoria IA.
  - La dedicatoria legacy y el cierre de creditos quedan separados.
- Se estabilizo el menu narrativo:
  - Evita mostrar fallback incompleto como si fuera definitivo.
  - Versiones/cache del storybook fueron actualizadas.
- Se agrego/refino la escena documental del puente del presente:
  - Enfoque en actas, documentos y esfuerzo historico.
  - Carrusel/documentos ajustados segun feedback de Victor.
- /sienna/asistente fue ajustada para sentirse mas como chat y ser responsive.

## Commits relevantes

- 30cf4f8 Reset stale PWA cache
- 36b4c0d Widen narrative text without side photos
- 63472e3 Refine legacy narrative controls
- 24c076d Refine narrative timing and assistant chat UI
- b235551 Add documentary memory scene
- 027849d Refine Sangiovanni narrative experience

## Pendientes / riesgos a revisar despues del reinicio

- Confirmar en el iPhone de Victor si el icono instalado ya abre bien.
  - Si Safari abre bien pero el icono sigue blanco, probablemente iOS conserva cache interna del PWA instalado.
  - Siguiente paso recomendado: borrar el icono de pantalla de inicio y agregarlo nuevamente desde Safari.
- Validar visualmente la ultima escena en produccion:
  - Texto usando ancho completo cuando no hay fotos laterales.
  - Sin flash blanco.
  - Creditos pausables con toque/botones.
  - Constelacion visible despues de los creditos.
- Si vuelve pantalla blanca:
  - Revisar consola remota de iPhone/Safari si es posible.
  - Verificar que todos los chunks referenciados por index.html existan en /assets/.
  - Confirmar que sw.js y manifest.webmanifest no esten siendo servidos desde cache viejo.

## MarkItDown

- Instalado globalmente para uso operativo local:
  - Binario: ~/.local/bin/markitdown
  - Version: markitdown 0.1.6
- Nota: util para extraer texto/markdown de documentos cuando convenga ahorrar tokens.
- Para imagenes que requieren interpretacion visual, seguir usando vision; MarkItDown puede ayudar con OCR/metadatos, pero no sustituye analisis visual.

## Regla critica para retomar

- Local primero salvo autorizacion expresa de Victor.
- Para Hostinger/GitHub, pedir o verificar permiso explicito antes de desplegar.
- Nunca tocar DB, datos, fotos de produccion, documentos, .env ni migraciones sin permiso explicito.
