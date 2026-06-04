# HerenciaRD - Dia de las Madres 2026-05-31

## Resumen

- Victor pidio una postal digna para enviar por WhatsApp por el Dia de las Madres en Republica Dominicana.
- Se uso HerenciaRD local como fuente operativa para identificar madres registradas en miembros del arbol.
- Se genero un fondo animado con Veo3 y una postal final estatica con texto controlado para evitar texto deformado por IA generativa.
- No se hizo deploy a Hostinger, no se hizo push a GitHub y no se tocaron datos de produccion.

## Artefactos generados

- Postal final WhatsApp:
  - docs/mockups/postal-dia-madres-sangiovanni-2026-05-31.jpg
  - copia temporal de trabajo: tmp/mothers-day-2026/postal-dia-madres-sangiovanni-2026.jpg
- Fondo animado Veo3:
  - docs/mockups/postal-dia-madres-sangiovanni-veo3-bg-2026-05-31.mp4
  - media original OpenClaw: /home/pc/.openclaw/media/tool-video-generation/herenciard-dia-madres-sangiovanni-bg---8f53a440-2f44-4724-b32e-19fa872fa876.mp4
- Fondo estatico generado:
  - media original OpenClaw: /home/pc/.openclaw/media/tool-image-generation/herenciard-dia-madres-bg---f267e407-82b7-494f-afe1-0cf117101d8e.jpg

## Entrega a Victor

- Se envio por Telegram el primer corte del fondo animado Veo3.
- Se envio por Telegram la postal final JPG lista para WhatsApp.
- Ante la pregunta de Victor por las madres registradas, se envio una lista normalizada con 12 nombres.

## Criterio usado para identificar madres

- Fuente consultada: base local herencia_rd, tablas sienna_family_members y relaciones parent_id/relationship_to_parent.
- Debido a inconsistencias observadas en member_parent_links.parent_role local, no se uso esa columna como unica verdad para la postal.
- Criterio aplicado para presentacion:
  - mujeres/personas femeninas registradas en sienna_family_members con hijos directos en el arbol;
  - inclusion manual de Maria Rosa Grisolia Di Vanna como matriarca raiz registrada como conyuge de Domenico, aunque su descendencia en el arbol local no cuelgue directamente por parent_id.
- Los nombres se normalizaron solo para presentacion, agregando acentos donde la DB local los tenia incompletos.

## Madres registradas usadas / reportadas

1. Maria Rosa Grisolia Di Vanna
2. Maria Magdalena Sangiovanni
3. Maria Rosa Sangiovanni Perez
4. Milagros Lucia Sangiovanni Gesualdo
5. Yolanda Providencia Sangiovanni Gesualdo
6. Maria Amparo Sangiovanni Gesualdo
7. Gilda Altagracia Sangiovanni Gesualdo
8. Irma Mercedes Sangiovanni Gesualdo
9. Fulvia Sangiovanni Sangiovanni
10. Rosa Julia Sangiovanni Rodriguez
11. Maria Jose Sangiovanni
12. Arleen Sangiovanni Montas

Version presentada a Victor con acentos normalizados:

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

## Prompt base Veo3

    Use case: ads-marketing
    Asset type: vertical WhatsApp Mother's Day animated postcard background, no readable text
    Primary request: Create an elegant, heartfelt Dominican Mother's Day family heritage postcard background for the Sangiovanni family. Use warm Caribbean morning light, soft white orchids, pale blush roses, subtle Dominican home textures, antique family album paper, and a refined genealogical tree motif with delicate golden branches. The tone should feel premium, intimate, respectful, and family-memory oriented.
    Subject: A dignified cinematic tribute to mothers across generations, inspired by Dominican family heritage and Italian-Dominican ancestry. No individual recognizable faces. No text, no logos, no watermarks.
    Composition: vertical 9:16, central soft empty area for later Spanish typography overlay; floral framing at top/bottom; gentle depth of field; slow elegant camera drift; subtle motion in petals and light. Keep the center readable and uncluttered.
    Style: cinematic, refined, warm, premium family memorial aesthetic, natural textures, realistic flowers, elegant gold accents, WhatsApp-ready.
    Avoid: written words, misspelled text, faces, clutter, cartoon style, harsh colors, heavy sadness, religious iconography, generic stock look.

## Texto final usado en la postal

    Feliz Dia de las Madres
    A las madres de nuestra familia Sangiovanni

    Hoy honramos a las mujeres que dieron vida, raiz y memoria a nuestra historia familiar.

    [lista de madres]

    Con gratitud, respeto y amor.
    Que su legado siga floreciendo en cada generacion.

    Familia Sangiovanni · Republica Dominicana · 2026

Nota: la imagen final usa acentos en el texto visible.

## Validacion

- El fondo estatico fue revisado con vision: composicion vertical correcta, area central segura para texto, sin caras, sin marcas de agua y sin texto accidental.
- La postal final fue revisada con vision: legible, sin solapes y con apariencia pulida.
- Se corrigieron acentos de nombres despues de la revision visual.

## Pendientes / posibles mejoras

- Si Victor quiere una version mas formal, se puede hacer variante con menos nombres y mas espacio negativo.
- Si Victor quiere una version familiar mas completa, conviene corregir primero inconsistencias de filiacion/roles en member_parent_links antes de automatizar futuras listas de madres.
- No asumir que member_parent_links.parent_role = madre esta limpio hasta auditarlo; se observaron roles cruzados en datos locales.
