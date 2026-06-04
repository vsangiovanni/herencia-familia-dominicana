# HerenciaRD Handoff - 2026-05-30

## Estado actual

- Proyecto estable en produccion despues de la ronda de fotos/miembros del 2026-05-29.
- GitHub esta alineado: `main`, `origin/main` y `origin/HEAD` apuntan al ultimo commit conocido.
- Ultimo commit verificado: `33e6cae Use backend member photos only`.
- Produccion Hostinger fue validada despues del deploy.
- No se tocaron `.env`, migraciones ni base de datos de produccion durante el deploy de artefactos.

## Verificacion de produccion

- `https://herenciard.vmsencf.com/api/health` responde:
  - `ok: true`
  - `storage: mysql`
  - `runtime: php`
- Rutas verificadas con `scripts/post-deploy-check.sh`:
  - `/sienna/arbol-genealogico -> 200`
  - `/sienna/explicacion-herederos -> 200`
  - `/sienna/miembros-arbol -> 200`
- Produccion esta arriba en:
  - `https://herenciard.vmsencf.com/sienna/arbol-genealogico`

## Cambios cerrados en esta ronda

- Se ajusto el flujo de fotos de miembros para que el frontend use las fotos resueltas por backend/API.
- Se elimino dependencia de fallbacks estaticos del frontend para miembros en el arbol.
- Se preservo la regla de autoridad: frontend presenta datos; backend/API decide informacion y media disponible.
- Se agrego tooling de Playwright para validaciones visuales/funcionales futuras.
- GitHub fue actualizado con los commits de la ronda antes del deploy.
- Hostinger fue actualizado con `dist/` sin tocar datos ni DB de produccion.

## Cambio local posterior - arbol familiar conmemorativo

- Victor pidio que la pantalla del arbol deje de hablar de montos, reparto, porcentajes o herencia dentro del arbol.
- El arbol se retitulo localmente como `Árbol genealógico de la descendencia de Domenico y María Rosa`.
- La pantalla ahora enfoca la experiencia como recuerdo familiar:
  - miembros familiares;
  - ramas visibles;
  - generaciones;
  - fotos familiares;
  - fichas familiares;
  - vinculos familiares complejos sin lenguaje sucesoral.
- Se removio de esta pantalla la seccion de calculo aplicado, montos heredados, porcentajes y herederos finales.
- Se refinaron tarjetas y conectores CSS para dar una lectura mas elegante y documental.
- Se agrego selector local por ramas principales: Arbol completo, Maria Magdalena, Vincenzo/Vicente y Paolo/Paulino.
- La vista por rama mantiene a Domenico y Maria Rosa como origen y enfoca una sola linea para mejorar lectura y valor familiar.
- Se corrigio la ficha familiar del arbol para recibir `photoLookup` y mostrar fotos resueltas por API/backend.
- Se ajusto el render de conyuges para soportar el campo texto `spouse` sin obligar a crear un miembro/conyuge separado.
- En local, Victor Manuel Martin Sangiovanni Rodriguez quedo con `spouse = Vanessa Navarro`, `spouse_member_id = NULL`; no se creo miembro Vanessa Navarro ni union familiar.
- Se cambio `Imprimir arbol` para imprimir desde la misma pantalla una hoja dedicada: solo el arbol, A3 horizontal/landscape, con encabezado conmemorativo y bloques laterales familiares; ya no imprime la pagina completa con navegacion/controles ni abre una ventana aparte en movil.
- Ajuste posterior: se elimino la composicion tipo caratula de impresion; ahora el encabezado es compacto y el arbol debe ocupar directamente la hoja landscape.
- Ajuste final de impresion movil: `Imprimir arbol` ahora abre una vista previa dentro de la app con botones `Volver al arbol` e `Imprimir / Compartir`; la impresion usa esa vista, sin caratula ni ventana nueva.
- Ajuste posterior: el boton `Imprimir / Compartir` dentro de la vista previa oculta encabezado/footer/fondo y manda a imprimir solamente el arbol.
- Ajuste de escala: impresion configurada a `letter landscape` con margen minimo y escala calculada para intentar encajar todo el arbol en una sola pagina aunque quede mas pequeño.
- Ajuste Safari/iPhone: la vista impresa ahora usa un contenedor con ancho/alto ya escalados, no solo transform visual, para evitar que Safari pagine usando el tamaño original del arbol.
- Ajuste posterior de encaje: escala objetivo reducida a 900x560 px equivalentes, margen de impresion a 1mm y marco permitido ampliado para forzar una sola hoja landscape.
- Solucion limpia aplicada: el boton interno de la vista previa ya no usa `window.print`; genera un PDF real con `html2canvas` + `jsPDF`, en una sola pagina horizontal tipo letter, centrado y sin headers/pies de Safari.
- Fix posterior: se cambio la imagen interna del PDF de PNG a JPEG para evitar el error `wrong PNG signature` de `jsPDF` en Safari/iPhone.
- UX posterior: al abrir la vista previa de impresion/PDF, el contenedor hace scroll automatico al inicio para no entrar a mitad del arbol.
- Ajuste posterior: el inicio de la vista previa ahora centra horizontalmente el arbol y mantiene el scroll vertical arriba, para coincidir con la pantalla indicada por Victor.
- Fix posterior de PDF: `Generar PDF` ahora clona el arbol real en un contenedor oculto con dimensiones medidas, calcula una escala segura para Safari, valida canvas/imagen/dimensiones antes de llamar a `jsPDF.addImage` y evita el error `Invalid argument passed to jsPDF.scale`.
- UX posterior: la vista previa vuelve al inicio vertical y horizontal para mantener visibles los botones en celular; `Generar PDF` crea un Blob y dispara descarga con un enlace temporal en vez de intentar mostrar el PDF inline.
- UX iPhone posterior: la barra de la vista previa quedo fija arriba con soporte de `safe-area`, de modo que `Volver al arbol` y `Descargar PDF` permanezcan visibles al entrar desde celular.
- Flujo iOS posterior: `Descargar PDF` ahora genera un `File` y usa Web Share API primero para permitir guardar/compartir el PDF desde iPhone; solo cae al enlace temporal si el navegador no soporta compartir archivos.
- Ajuste final de descarga local: se elimino el flujo Blob/Web Share para el boton de PDF; ahora el frontend sube temporalmente el PDF generado al backend y descarga desde `/api/sienna-tree-pdf-downloads/:id/:fileName` con `Content-Disposition: attachment`, para evitar que Safari iPhone abra el preview.
- Fix posterior de descarga iPhone: el enlace temporal del PDF ya no se consume en la primera lectura y usa token privado en URL; el backend lo sirve como `application/octet-stream` con `nosniff` y `attachment` para evitar el preview de Safari y el error `PDF no disponible. Genérelo nuevamente.`
- Help actualizado: `sienna-arbol` ya describe la pantalla como arbol genealogico conmemorativo de Domenico y Maria Rosa, sin montos, porcentajes ni datos de reparto; tambien documenta la descarga PDF temporal por backend para iPhone/Safari.
- UX copy posterior: el boton `Modo exposición` fue renombrado a `Vista amplia` para aclarar que solo expande visualmente el arbol para reuniones o pantalla grande.
- Build local validado con `pnpm run build`.
- Capturas locales autenticadas generadas en:
  - `docs/mockups/herenciard-tree-branches-2026-05-30.png`
  - `docs/mockups/herenciard-tree-branch-focus-2026-05-30.png`
- Este cambio aun no ha sido subido a GitHub ni desplegado a Hostinger salvo autorizacion posterior de Victor.

## Cambio local posterior - postal Dia de las Madres 2026-05-31

- Victor pidio una postal digna para WhatsApp por el Dia de las Madres en Republica Dominicana.
- Se identificaron madres registradas usando HerenciaRD local como fuente operativa.
- Se genero un fondo animado con Veo3 y una postal final estatica con texto controlado para evitar texto deformado por IA.
- La postal final y el fondo Veo3 se copiaron al proyecto para preservar contexto:
  - `docs/mockups/postal-dia-madres-sangiovanni-2026-05-31.jpg`
  - `docs/mockups/postal-dia-madres-sangiovanni-veo3-bg-2026-05-31.mp4`
- Documento detallado creado:
  - `docs/HERENCIARD_DIA_MADRES_2026-05-31.md`
- Entrega realizada por Telegram:
  - primer corte de fondo animado Veo3;
  - postal final JPG lista para WhatsApp;
  - lista de madres registradas.
- Criterio usado: mujeres/personas femeninas en `sienna_family_members` con hijos directos en el arbol, mas `Maria Rosa Grisolia Di Vanna` como matriarca raiz registrada como conyuge de Domenico.
- Advertencia importante: `member_parent_links.parent_role` local mostro inconsistencias de roles cruzados, por lo que no debe usarse como unica verdad para futuras listas de madres sin auditoria previa.
- No se hizo deploy a Hostinger, no se hizo push a GitHub y no se tocaron datos de produccion.

### Madres registradas reportadas

1. María Rosa Grisolia Di Vanna
2. María Magdalena Sangiovanni
3. María Rosa Sangiovanni Pérez
4. Milagros Lucía Sangiovanni Gesualdo
5. Yolanda Providencia Sangiovanni Gesualdo
6. María Amparo Sangiovanni Gesualdo
7. Gilda Altagracia Sangiovanni Gesualdo
8. Irma Mercedes Sangiovanni Gesualdo
9. Fulvia Sangiovanni Sangiovanni
10. Rosa Julia Sangiovanni Rodríguez
11. María José Sangiovanni
12. Arleen Sangiovanni Montás


## Fotos y miembros trabajados

- Se trabajo la asignacion/validacion de fotos recientes indicadas por Victor para miembros del arbol.
- La fuente operativa debe seguir siendo backend/API y datos reales; evitar volver a introducir mapeos duros en frontend.
- En produccion, la lectura visual debe validarse desde las pantallas Sienna correspondientes despues de cualquier nueva carga de foto.

## Ajuste local 2026-06-03 - gestion + honorarios

- Settings ahora separa `% gestion` de `% firma de abogados`.
- Calculo secuencial: bruto -> descuento gestion -> saldo base abogados -> descuento abogados -> monto distribuible.
- API local validada con simulacion `100,000,000 / 30% gestion / 20% abogados = 56,000,000` distribuible.
- API local validada con monto real `412,300,000 / 30% gestion / 20% abogados = 230,888,000` distribuible.
- No se guardan montos por heredero en `confirmed_heirs`; las paginas Sienna consumen `/api/sienna-calculation`.
- El nuevo setting `management_fee_percentage` se crea como fila de `app_settings` con valor `0` si no existe; no requiere columna nueva.

## Commits relevantes recientes

- `33e6cae Use backend member photos only`
- `e682c7c Prefer assigned photos before static fallbacks`
- `e2f4d9b Use local member photo assets in tree`
- `db369c4 Add Playwright test tooling`
- `6e7c5ea Show member photo lookup in Sienna tree`
- `1d9c96d Fix evidence document filename headers`
- `6f379bf Documenta cierre Sienna para reinicio`
- `21caa76 Registra fecha de fallecimiento de Domenico`

## Pendientes / riesgos

- Validar visualmente desde navegador la foto de cada miembro actualizado si Victor pide confirmacion puntual.
- Si una foto no aparece, revisar primero:
  - respuesta de `/api/sienna-family-members` con sesion autenticada;
  - datos del miembro/heir en backend;
  - cache del navegador/PWA;
  - existencia real del asset o photo_data asociado.
- No reintroducir logica de fotos en frontend salvo como presentacion pura de datos ya entregados por API.

## Regla operativa agregada por Victor

- Siempre que Victor diga `prepara para reiniciar`, crear o actualizar el handoff correspondiente en `docs/` antes de cerrar.
- Cuando haya cambios importantes, crear o actualizar el handoff correspondiente aunque Victor no use exactamente esa frase.
- El handoff debe incluir:
  - estado actual;
  - cambios cerrados;
  - commits relevantes;
  - verificacion local/produccion si aplica;
  - restricciones importantes;
  - pendientes y riesgos para retomar sin perdida de contexto.

## Reglas criticas para retomar

- Local primero salvo autorizacion expresa de Victor.
- No desplegar a Hostinger, produccion ni GitHub sin permiso explicito.
- No tocar DB, datos, fotos de produccion, documentos, `.env` ni migraciones sin permiso explicito.
- Mantener DRY: backend/API es la fuente de reglas, calculos, validaciones y media resuelta; frontend solo consume y presenta.
