# HerenciaRD - Plan Pantalla Declaraciones de No Participacion 2026-06-04

## Estado previo obligatorio

- Antes de implementar esta pantalla, el repositorio debe quedar claro y respaldado.
- Verificacion realizada el 2026-06-04:
  - La rama main esta alineada con origin/main en commits remotos.
  - Existen cambios locales sin commit de rondas recientes, incluyendo Laboratorio de Compensacion Familiar, documentacion de postal Dia de las Madres y handoff 2026-06-04.
  - No se debe iniciar esta nueva pantalla hasta hacer commit/push de esos cambios o recibir una decision explicita de Victor.
- Regla vigente: local primero. No Hostinger, produccion, GitHub ni migraciones sin autorizacion explicita.

## Entendimiento de la solicitud

Crear una pantalla nueva e independiente para herederos confirmados, con el objetivo de organizar documentos donde un heredero declare que no desea involucrarse en el proceso legal, gestiones, audiencias o reclamaciones.

La pantalla debe:

- listar solo herederos confirmados, no todos los miembros del arbol;
- permitir generar un PDF individual por heredero;
- permitir imprimir o descargar el PDF;
- registrar estado operativo del documento;
- no mencionar montos de herencia;
- no alterar calculos, porcentajes, distribucion, base legal ni pantallas existentes.

## Nombre recomendado

Nombre funcional recomendado para la pantalla:

**Declaraciones de No Participacion**

Razon:

- Describe con precision la intencion operativa sin afirmar una renuncia legal definitiva.
- Evita confundir la pantalla con el calculo sucesoral oficial.
- Es mas claro para usuarios no tecnicos que declinatoria o disclaimer.

Titulo secundario sugerido:

**Documentos de declinacion de gestion y participacion**

Uso interno opcional:

- Ruta: /sienna/declaraciones-no-participacion
- Help key: sienna-declaraciones-no-participacion
- Modulo/API: heir_declarations

## Recomendacion terminologica

- No participacion: mejor termino inicial para esta pantalla de prueba. Enfatiza que el heredero no desea involucrarse en gestiones/proceso.
- Declinacion: util como termino operativo complementario, especialmente para gestiones o participacion procesal.
- Renuncia: debe usarse con cuidado. Puede tener implicaciones legales fuertes sobre derechos hereditarios y podria requerir formalidades especificas. No conviene usarlo como etiqueta principal sin validacion de abogado/notario.
- Descargo: suele sonar mas a liberacion, finiquito o constancia posterior; no es ideal para una decision previa de no participar.
- Disclaimer: no recomendado para contexto legal dominicano ni para usuarios finales en espanol.
- Declinatoria: puede confundirse con figuras procesales; no es el termino mas claro para esta pantalla.

Texto recomendado en UI/PDF: Declaracion de No Participacion y Declinacion de Gestion.

## Estructura visual de pantalla

1. Encabezado documental
   - Titulo: Declaraciones de No Participacion
   - Subtitulo: Generacion y seguimiento de documentos individuales para herederos confirmados
   - Aviso visible: pantalla de prueba, no modifica reparto ni calculo oficial.

2. Resumen superior
   - Herederos confirmados
   - Documentos pendientes
   - Documentos generados
   - Documentos firmados/recibidos

3. Filtros
   - Buscar por nombre o documento
   - Filtrar por estado
   - Filtrar por heredero con/sin documento generado

4. Tabla principal
   - Nombre completo
   - Documento de identidad, si existe
   - Calidad/relacion de heredero, si el API la entrega
   - Estado del documento
   - Fecha de generacion
   - Codigo interno
   - Acciones: generar PDF, descargar, imprimir, cambiar estado

5. Panel/modal de previsualizacion
   - Vista del texto base antes de generar
   - Campo opcional de observaciones internas
   - Confirmacion para generar PDF

## Campos necesarios por heredero

Datos leidos desde backend/API:

- heir_id o identificador confirmado
- member_id, si aplica
- full_name
- identity_document, si existe
- relationship_label o calidad de heredero, si existe
- is_confirmed_heir
- heir_status, si existe

Datos propios del documento:

- document_id
- document_code
- document_type
- status
- generated_at
- delivered_at
- signed_at
- received_at
- annulled_at
- pdf_file_name o pdf_storage_key
- template_version
- notes
- created_by
- updated_by

## Estados posibles

Estados recomendados:

1. pendiente
2. generado
3. entregado
4. firmado
5. recibido
6. anulado

Estados visibles:

- Pendiente
- Generado
- Entregado
- Firmado
- Recibido
- Anulado

Regla sugerida: permitir retroceder o anular con nota, pero no borrar registros historicos en la primera version.

## Modelo de datos sugerido

Tabla nueva sugerida: heir_declaration_documents

Campos:

- id CHAR/VARCHAR UUID
- heir_id VARCHAR/CHAR nullable segun modelo actual
- member_id VARCHAR/CHAR nullable
- document_code VARCHAR unique
- document_type VARCHAR default no_participacion
- status ENUM/VARCHAR
- template_version VARCHAR
- heir_name_snapshot VARCHAR
- identity_document_snapshot VARCHAR nullable
- relationship_snapshot VARCHAR nullable
- generated_at DATETIME nullable
- delivered_at DATETIME nullable
- signed_at DATETIME nullable
- received_at DATETIME nullable
- annulled_at DATETIME nullable
- pdf_storage_key VARCHAR nullable
- notes TEXT nullable
- created_by VARCHAR nullable
- updated_by VARCHAR nullable
- created_at DATETIME
- updated_at DATETIME

Razon de los snapshots:

- El PDF debe conservar el nombre/documento/relacion usados al momento de generar, aunque luego se corrija un dato del heredero.

## API sugerida

- GET /api/sienna-declaration-documents
  - Retorna herederos confirmados con estado documental actual.
- POST /api/sienna-declaration-documents/:heirId/generate
  - Genera registro y PDF para un heredero.
- GET /api/sienna-declaration-documents/:documentId/download
  - Descarga PDF.
- PATCH /api/sienna-declaration-documents/:documentId/status
  - Actualiza estado y fechas.

La fuente de herederos confirmados debe ser backend/API. El frontend no debe filtrar todo el arbol para decidir herederos.

## Plantilla base del PDF

Titulo:

DECLARACION DE NO PARTICIPACION Y DECLINACION DE GESTION

Contenido minimo:

- Proyecto: Herencia RD
- Codigo interno del documento
- Fecha de generacion
- Nombre completo del heredero
- Documento de identidad, si esta disponible
- Calidad/relacion de heredero, si aplica
- Texto formal de declaracion
- Espacio de firma del declarante
- Espacio de testigo, si aplica
- Espacio de notario/legalizacion, si luego se decide usar

Restriccion critica:

- El PDF no debe mencionar monto de herencia, porcentaje, monto estimado, monto neto, deducciones ni calculos.

Texto base inicial sujeto a revision legal:

Yo, [NOMBRE COMPLETO], identificado(a) con [DOCUMENTO], en mi calidad de heredero(a) confirmado(a) dentro del proyecto Herencia RD, declaro de manera libre y voluntaria que no deseo participar ni involucrarme en las gestiones, reclamaciones, audiencias, coordinaciones legales o actuaciones relacionadas con el proceso administrado dentro del referido proyecto.

Esta declaracion se emite para fines de constancia interna y organizacion documental del proyecto Herencia RD, sin incluir montos, porcentajes ni detalles economicos de la herencia.

Firmo la presente declaracion en fecha [FECHA], dejando constancia de mi decision.

Nota legal:

- Si se pretende que el documento implique renuncia real a derechos hereditarios, el texto debe revisarse con abogado/notario antes de usarlo fuera de prueba.

## Flujo para generar, descargar e imprimir

1. Usuario entra a la pantalla.
2. Frontend solicita al API la lista de herederos confirmados con estado documental.
3. Usuario selecciona Generar PDF en un heredero.
4. Backend crea o actualiza el registro documental y asigna codigo interno.
5. Backend genera o entrega los datos necesarios para renderizar PDF.
6. Frontend permite descargar/imprimir el PDF individual.
7. Usuario cambia estado manualmente segun avance fisico del documento.
8. El historial queda separado del calculo sucesoral.

Primera version aceptable:

- Generar PDF en frontend con jsPDF, usando datos entregados por API.
- Registrar estado en backend.
- Mantener descarga local.

Version mas robusta:

- Generar PDF en backend y servirlo como descarga controlada.
- Guardar snapshot y storage key.

## Proteccion para no afectar el sistema actual

- Pantalla nueva con ruta nueva.
- Tabla nueva, sin modificar tablas de calculo ni distribucion.
- Endpoint nuevo, sin cambiar /api/sienna-calculation.
- No escribir en confirmed_heirs salvo lectura.
- No modificar porcentajes, montos, estatus de heredero ni base legal.
- Permiso de pagina independiente en pages.
- Feature local primero.
- Build y validacion local antes de cualquier commit posterior.
- Produccion/Hostinger solo con autorizacion explicita.

## Implementacion inicial recomendada

Fase 1:

- Crear pantalla basica y ruta protegida.
- Consumir endpoint nuevo de herederos confirmados.
- Mostrar tabla y estados en memoria/backend simple.
- Generar PDF individual sin montos.
- Descargar/imprimir PDF.

Fase 2:

- Persistir estados y snapshots en tabla nueva.
- Agregar historial de cambios.
- Agregar previsualizacion y notas.

Fase 3:

- Validacion legal del texto.
- Version notarial/legalizada si Victor decide usarla formalmente.

