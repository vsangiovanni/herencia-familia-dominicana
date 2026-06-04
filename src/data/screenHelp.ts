export type HelpSection = {
  title: string;
  items: string[];
};

export type ScreenHelpContent = {
  title: string;
  intro?: string;
  sections: HelpSection[];
};

export const SCREEN_HELP: Record<string, ScreenHelpContent> = {
  landing: {
    title: 'Inicio',
    intro: 'Página de bienvenida del expediente. Desde aquí puede iniciar sesión o ir al panel si ya está aprobado.',
    sections: [
      {
        title: 'Acceso',
        items: [
          'Use Iniciar sesión con su correo y contraseña asignados.',
          'Si su cuenta está pendiente, espere la aprobación del administrador.',
        ],
      },
      {
        title: 'Módulos',
        items: [
          'Las tarjetas describen las capacidades del sistema (árbol, herederos, documentos).',
          'Tras aprobarse, entrará al panel de control con enlaces a cada pantalla.',
        ],
      },
    ],
  },
  dashboard: {
    title: 'Caso Alessandro',
    intro: 'Portada principal del expediente de Alessandro de Paola Sangiovanni: árbol familiar, reparto, conexiones de parentesco, documentos y seguimiento operativo.',
    sections: [
      {
        title: 'Accesos principales',
        items: [
          'Use las tarjetas grandes para ir directo a lo más importante.',
          'Árbol, Explicación, Filiación y Linajes consumen el cálculo vigente del backend para mantener una sola versión del reparto.',
          'Líneas de parentesco aclara si una persona está vinculada por más de una rama familiar.',
        ],
      },
      {
        title: 'Administración',
        items: [
          'La sección de administración solo la ven cuentas del equipo legal.',
          'Cambios de datos deben hacerse desde las pantallas autorizadas; las vistas de análisis no editan relaciones automáticamente.',
        ],
      },
    ],
  },
  auth: {
    title: 'Inicio de sesión',
    sections: [
      {
        title: 'Acceso',
        items: [
          'Use el correo y contraseña asignados. Las cuentas nuevas requieren aprobación del administrador.',
          'Tras aprobarse, vuelva a iniciar sesión para acceder al expediente.',
        ],
      },
    ],
  },
  perfil: {
    title: 'Mi perfil',
    sections: [
      {
        title: 'Datos personales',
        items: [
          'Actualice nombre y teléfono. El correo suele ser fijo según la cuenta creada.',
          'Si la cuenta está pendiente, aquí verá el estado hasta que un admin la apruebe.',
        ],
      },
      {
        title: 'Contraseña',
        items: ['Cambie la contraseña cuando lo necesite. Use una clave segura y distinta de otros servicios.'],
      },
    ],
  },
  legal: {
    title: 'Información legal',
    sections: [
      {
        title: 'Uso',
        items: [
          'Textos de referencia sobre el marco del expediente y uso responsable de la herramienta.',
          'No sustituye asesoría jurídica personalizada.',
        ],
      },
    ],
  },
  'sienna-asistente': {
    title: 'Sienna contigo',
    intro: 'Aquí puedes preguntarme sobre el expediente y te ayudo a ubicar qué revisar, dónde ir y cómo avanzar sin cambiar nada por ti.',
    sections: [
      {
        title: 'Uso seguro',
        items: [
          'Haga preguntas sobre reparto, árbol, documentos, hallazgos o rutas de parentesco.',
          'Te indicaré la pantalla adecuada y, si hace falta, pasos sencillos para revisar con calma.',
          'Cualquier cambio importante debe revisarlo y hacerlo una persona autorizada.',
        ],
      },
      {
        title: 'Cuidado del expediente',
        items: [
          'No creo, edito, elimino ni confirmo herederos.',
          'Para decidir, use siempre lo que muestran las pantallas oficiales del expediente.',
        ],
      },
    ],
  },
  'sienna-legado': {
    title: 'Narrativa del legado',
    intro:
      'Experiencia documental del linaje Sangiovanni construida desde los miembros, relaciones, fechas, lugares y fotografías disponibles en el expediente.',
    sections: [
      {
        title: 'Cómo verla',
        items: [
          'Use reproducir/pausar para controlar el ritmo de la historia.',
          'Use las flechas para avanzar o retroceder una escena sin salir de la experiencia.',
          'El mapa narrativo permite saltar a una escena específica sin agregar opciones al menú principal.',
        ],
      },
      {
        title: 'Qué muestra',
        items: [
          'Cada escena agrupa generaciones, nacimientos, ramas o momentos históricos sin convertir la historia en una tabla.',
          'Las fotos circulares corresponden a miembros con imagen disponible; los fallecidos se marcan con lazo negro discreto.',
          'Las imágenes de fondo son assets del storyteller y deben acompañar la narrativa, no competir con ella.',
        ],
      },
      {
        title: 'Lectura',
        items: [
          'El texto aparece letra por letra estilo typewriter y el tiempo de cada escena se ajusta según la cantidad de narrativa.',
          'En celular, el texto se desplaza hacia arriba para no quedar tapado por las fotos.',
          'Si detecta una identidad o escena incorrecta, valide el miembro exacto antes de modificar datos del expediente.',
        ],
      },
    ],
  },
  'admin-users': {
    title: 'Administración de usuarios',
    intro: 'Panel administrativo integral para controlar cuentas, permisos y auditar el uso operativo de la aplicación.',
    sections: [
      {
        title: 'Control de usuarios',
        items: [
          'Cree usuarios, apruebe o revoque accesos y cambie roles (admin/regular).',
          'Administre permisos por pantalla para cada cuenta desde el botón de permisos.',
          'Elimine usuarios solo cuando sea necesario y nunca su propia cuenta.',
        ],
      },
      {
        title: 'Auditoría por usuario',
        items: [
          'Revise visitas totales, actividad en 7 días, páginas únicas y última ruta por usuario.',
          'Use estos datos para detectar cuentas inactivas, uso irregular o necesidad de soporte.',
        ],
      },
      {
        title: 'Auditoría de uso de la app',
        items: [
          'Filtre bitácora por usuario y ruta para revisar quién accedió, cuándo y desde qué agente.',
          'Supervise top de páginas y actividad diaria para tomar decisiones operativas.',
        ],
      },
    ],
  },
  'arbol-genealogico': {
    title: 'Árbol genealógico',
    sections: [
      {
        title: 'Navegación',
        items: [
          'Explore el árbol interactivo con zoom y desplazamiento.',
          'Use las pestañas si hay vistas alternativas del mismo expediente.',
        ],
      },
    ],
  },
  'arbol-genealogico-clasico': {
    title: 'Árbol clásico (referencia)',
    sections: [
      {
        title: 'Propósito',
        items: [
          'Vista estática de referencia del caso histórico cargado en el sistema.',
          'Para trabajo operativo con cálculo use el Árbol del caso Alessandro.',
        ],
      },
    ],
  },
  'lineas-familiares': {
    title: 'Líneas familiares',
    sections: [
      {
        title: 'Análisis',
        items: [
          'Revise ramas por generación en acordeones o pestañas.',
          'Sirve para ubicar parentescos antes de registrar miembros del expediente.',
        ],
      },
    ],
  },
  'determinacion-herederos': {
    title: 'Determinación de herederos',
    sections: [
      {
        title: 'Tabla y acciones',
        items: [
          'Liste herederos identificados con parentesco y estado.',
          'Use los botones de acción para exportar o ajustar según lo disponible en pantalla.',
        ],
      },
    ],
  },
  hallazgos: {
    title: 'Corrección por miembro',
    intro: 'Lista operativa de pendientes detectados por el backend para limpiar vínculos antes de confiar en el árbol y el reparto.',
    sections: [
      {
        title: 'Tabla caso por caso',
        items: [
          'Cada fila es un problema que afecta filiación o reparto: vínculo de filiación, matrimonio del hijo o rama cortada.',
          'El cónyuge en texto (ej. «Ana Julia Rodríguez») es referencia documental: no se pide enlazarlo ni crear nodo aparte en el árbol.',
          'Use los selectores en «Corregir aquí» y pulse Guardar sin salir de la pantalla.',
          'Si el pendiente requiere una decisión genealógica, confirme contra actas antes de guardar.',
          'Los casos resueltos desaparecen al recargar; avance hasta que no queden pendientes.',
        ],
      },
    ],
  },
  'calculo-herencias': {
    title: 'Cálculo de herencias',
    sections: [
      {
        title: 'Herramienta',
        items: [
          'Simule repartos y gestione parámetros del cálculo sucesoral.',
          'Complementa, no reemplaza, el motor automático del expediente.',
        ],
      },
    ],
  },
  'calculo-filiacion': {
    title: 'Cálculo por filiación',
    intro: 'Vista comparativa de reparto por rama familiar. El cálculo viene del backend; la pantalla solo presenta y simula parámetros visibles.',
    sections: [
      {
        title: 'Líneas y montos',
        items: [
          'Distribución por línea familiar (p. ej. Vincenzo vs Paolo).',
          'El monto bruto del caso, el % de gestión y el % de firma se cargan desde Settings al abrir la pantalla.',
          'Escribir en el campo no recalcula de inmediato; use Actualizar esta vista para aplicar la simulación local.',
          'Los montos por heredero se calculan sobre el neto secuencial: bruto menos gestión; luego honorarios sobre el saldo.',
          'La pantalla no guarda montos en herederos; solo consulta y muestra el resultado vigente.',
        ],
      },
      {
        title: 'Lectura',
        items: [
          'Compare totales por rama para detectar diferencias entre líneas sucesorales.',
          'Si algo luce raro, revise primero Árbol, Linajes y Documentos antes de modificar miembros.',
        ],
      },
    ],
  },
  'documentos-probatorios': {
    title: 'Documentos probatorios',
    intro: 'Guía simple: 1) elige persona, 2) sube acta, 3) guarda. Si no estás seguro, no inventes datos.',
    sections: [
      {
        title: 'Paso a paso (sin fallar)',
        items: [
          'Paso 1: seleccione el miembro titular (la persona principal del acta).',
          'Paso 2: cargue el archivo y complete tipo de documento.',
          'Paso 3: guarde. Luego revise si quedó vinculado al miembro correcto.',
          'Regla de oro: NO cree otra persona con nombre parecido. Use el miembro que ya existe.',
        ],
      },
      {
        title: 'Padre / madre / cónyuge (muy importante)',
        items: [
          'Siempre elija padre, madre y cónyuge desde la lista; no los escriba a mano si ya existen.',
          'Si cambia el titular, use Recalcular parentescos automáticos.',
          'Si un parentesco no existe en el árbol, primero créelo en Miembros del Árbol y después vuelva aquí.',
        ],
      },
      {
        title: 'OCR (lectura automática)',
        items: [
          'El OCR ayuda, pero se equivoca. Revise todo antes de guardar.',
          'Nunca confíe ciegamente en el OCR para nombres o fechas.',
          'El texto OCR es apoyo; la verdad del sistema es la vinculación al miembro del árbol.',
        ],
      },
      {
        title: 'Soporte documental',
        items: [
          'Un documento marcado como “confirma heredero” o clasificado como acta de nacimiento ayuda a que el heredero aparezca verificado.',
          'Si un heredero tiene documento vinculado pero no está clasificado o marcado como confirmación, aparecerá como pendiente en Explicación.',
          'Si no hay documento asociado directamente, aparecerá como falta de soporte.',
        ],
      },
    ],
  },
  'sienna-arbol': {
    title: 'Árbol genealógico de Domenico y María Rosa',
    intro: 'Vista conmemorativa de la descendencia de Domenico Sangiovanni y María Rosa Grisolia: lectura familiar, ramas, fotos, fichas y PDF del árbol sin datos de herencia.',
    sections: [
      {
        title: 'Enfoque familiar',
        items: [
          'Esta pantalla no muestra montos, porcentajes ni datos de reparto sucesoral.',
          'El título oficial de esta vista es “Árbol genealógico de la descendencia de Domenico y María Rosa”.',
          'Su propósito es servir como recuerdo familiar: ramas, generaciones, fotos y fichas familiares.',
          'La información visual proviene del backend/API y de los datos reales del árbol familiar.',
        ],
      },
      {
        title: 'Navegación del árbol',
        items: [
          'El zoom ahora escala todo el canvas del árbol, no solo las tarjetas.',
          'Use +, −, Fit y reset para vista global o detalle por rama.',
          'Puede arrastrar el canvas con mouse o dedo; en móvil también puede hacer pinch zoom.',
          'Pantalla completa y Vista amplia ayudan para reuniones en monitor o TV.',
        ],
      },
      {
        title: 'Tarjetas del árbol',
        items: [
          'Cada nodo muestra la información familiar disponible: nombre, relación, foto, cónyuge textual cuando aplique y estado documental básico.',
          'Doménico Sangiovanni y María Rosa Grisolia Di Vanna se muestran como pareja raíz fundacional al mismo nivel cuando ambos están enlazados como cónyuges.',
          'En hijos registrados con unión, aparece "Filiación: Matrimonio: …" para distinguir hijos de esa pareja.',
          'Los miembros con fecha de defunción muestran lacito negro y etiqueta "Fallecido".',
          'La ficha familiar abre el detalle del miembro y debe mostrar la foto resuelta por el API cuando exista.',
        ],
      },
      {
        title: 'PDF del árbol',
        items: [
          'Descargar PDF genera el árbol en una sola página horizontal tipo carta para facilitar impresión landscape.',
          'En móvil, la vista previa mantiene arriba los botones Volver al árbol y Descargar PDF.',
          'Para evitar el preview de Safari en iPhone, el PDF se entrega desde el backend como archivo descargable temporal.',
          'El enlace temporal de descarga expira automáticamente; si caduca, genere el PDF nuevamente.',
        ],
      },
    ],
  },
  'sienna-dobles-linajes': {
    title: 'Análisis de Dobles Linajes',
    intro: 'Consola visual para auditar convergencias familiares sin reemplazar el árbol del caso.',
    sections: [
      {
        title: 'Qué analiza',
        items: [
          'Detecta personas conectadas por más de una ruta familiar usando la información registrada en el expediente.',
          'Compara rutas por fuente familiar, identifica ancestros compartidos y estima complejidad del cruce.',
          'Muestra alertas por duplicados, vínculos dudosos, fechas incoherentes y relaciones sospechosas.',
          'Una inconsistencia no siempre significa conflicto legal; puede ser un vínculo incompleto o una relación cargada con formato viejo.',
          'El cónyuge en texto (sin spouse_member_id) es referencia documental y no genera inconsistencia sucesoria.',
          'El badge Verificado indica enlaces formales correctos; Ref. doc. señala cónyuge solo en texto.',
          'Use los filtros Todos, Heredan y No heredan / Vínculo para separar quienes reciben cuota del reparto de quienes solo conectan rutas.',
          'El cuadro Reparto por rama muestra monto y porcentaje por Vincenzo/Vicente y Paolo/Paulino; Monto total heredado resume la cuota neta.',
          'Los fallecidos muestran el mismo lacito y etiqueta Fallecido que en el árbol del caso.',
        ],
      },
      {
        title: 'Cómo usarla',
        items: [
          'Use el buscador para filtrar por nombre, apellido, rama, ancestro o ID interno.',
          'Seleccione una persona para ver Ruta A, Ruta B, punto de convergencia y explicación automática.',
          'Los colores distinguen Paolo/Paulino, Vincenzo/Vicente, doble linaje, fallecidos e inconsistencias.',
        ],
      },
      {
        title: 'Corrección controlada',
        items: [
          'Esta pantalla no modifica relaciones automáticamente.',
          'Use Abrir en árbol para contexto visual general.',
          'Use Editar vínculos para ir a Miembros del Árbol, donde las correcciones quedan con usuario y fecha.',
        ],
      },
    ],
  },
  'sienna-miembros': {
    title: 'Miembros del árbol',
    intro:
      'Aquí se registran personas y tres capas de vínculo: (1) árbol visual con parent_id, (2) uniones de pareja, (3) filiación del hijo. Si mezcla hijos de distintas relaciones sin marcar la unión correcta, el reparto y el árbol pueden confundirse.',
    sections: [
      {
        title: 'Las tres capas (cómo piensa el sistema)',
        items: [
          'Árbol visual: "Conectar debajo de" define bajo quién cuelga el nodo en el dibujo (parent_id).',
          'Unión de pareja: al guardar un cónyuge enlazado (spouse_member_id) se crea o actualiza una unión (matrimonio/pareja).',
          'Filiación del hijo: si es hijo/hija, puede indicar de qué unión nació o si es hijo solo de un progenitor (otra relación).',
          'Los campos legacy (parent_id, cónyuge) siguen activos; la filiación nueva refina sin borrar datos viejos.',
        ],
      },
      {
        title: 'Registrar un adulto o raíz (sin filiación de hijo)',
        items: [
          'Nombre obligatorio.',
          'Raíz del árbol: para ancestros sin superior (tronco).',
          'O conectar debajo de un ascendiente con parentesco (cónyuge, padre, madre, otro).',
          'Cónyuge: seleccione un miembro ya existente del árbol (no solo texto). Eso crea la unión formal entre ambos.',
          'Sin cónyuge enlazado, el reparto por representación solo suma hijos colgados bajo cada progenitor por separado.',
        ],
      },
      {
        title: 'Registrar un hijo o hija (filiación)',
        items: [
          'Conectar debajo de: el progenitor bajo quien verá el nodo en el árbol (suele ser padre o madre).',
          'Parentesco: hijo o hija.',
          'Unión de filiación: elija el matrimonio/pareja si el hijo es de ambos. Si es de otra relación, deje "Sin unión".',
          'Segundo progenitor (opcional): el otro padre/madre de esa misma unión, si aplica.',
          'Ejemplo matrimonio: superior = María Rosa, unión = María Rosa y Pedro Pablo, segundo progenitor = Pedro Pablo.',
          'Ejemplo otra relación: superior = Pedro Pablo, unión = Sin unión, sin segundo progenitor.',
        ],
      },
      {
        title: 'Después de guardar',
        items: [
          'El miembro queda conectado al árbol, a su pareja si aplica y a su filiación familiar.',
          'La ficha del miembro concentra el detalle para no sobrecargar la tabla principal.',
          'Si falta algo importante, Hallazgos lo mostrará como pendiente de corrección.',
        ],
      },
      {
        title: 'Estado hereditario',
        items: [
          'Autodetectar (recomendado): el sistema clasifica según ley y árbol; use el simulador antes de guardar.',
          'Forzar manual: solo si está seguro; deje trazabilidad en la razón.',
          'Requiere revisión: use cuando falten datos o haya duda en la filiación.',
          'La fuente operativa del reparto es el backend; el formulario ayuda a capturar relaciones, no a recalcular reglas sucesorales aparte.',
        ],
      },
      {
        title: 'Chequeo antes de seguir',
        items: [
          'Línea parental y rama sucesoral deben verse coherentes en el panel del formulario.',
          'En la tabla, abra un progenitor y revise "Hijos por filiación": matrimonio vs otras relaciones.',
          'En Árbol del caso, los hijos con unión muestran línea "Filiación: Matrimonio: …".',
          'Si unión aparece inconsistente (migración), enlace el cónyuge en el miembro antes de reclasificar hijos.',
        ],
      },
    ],
  },
  'sienna-miembros-agregar': {
    title: 'Ayuda: Agregar o editar miembro',
    intro: 'Orden recomendado para no mezclar hijos del matrimonio con hijos de otras personas.',
    sections: [
      {
        title: 'Orden de llenado (siempre)',
        items: [
          '1. Nombre (obligatorio).',
          '2. Conectar debajo de → quién es el superior en el árbol.',
          '3. Parentesco con el superior (hijo, hija, cónyuge, padre, madre, otro).',
          '4. Si es hijo/hija: Unión de filiación y, si aplica, Segundo progenitor.',
          '5. Fechas de nacimiento/defunción (recomendado).',
          '6. Cónyuge de ESTE miembro (si es adulto casado): selección del árbol, no solo texto.',
          '7. Estado hereditario y orden entre hermanos.',
          '8. Guardar y revisar el panel de contexto a la derecha.',
        ],
      },
      {
        title: 'Hijo del matrimonio (ambos progenitores)',
        items: [
          'Primero asegúrese de que los dos padres existen y tienen cónyuge enlazado entre sí.',
          'Conectar debajo de: uno de los dos (convención del árbol).',
          'Unión de filiación: seleccione "Matrimonio: [A] y [B]".',
          'Segundo progenitor: el otro miembro de la pareja.',
          'Así el sistema agrupa al hijo con los hermanos de esa misma unión.',
        ],
      },
      {
        title: 'Hijo de otra relación (un solo progenitor en el árbol)',
        items: [
          'Conectar debajo de: el progenitor al que pertenece en el árbol.',
          'Unión de filiación: "Sin unión (solo este progenitor)".',
          'No asigne segundo progenitor salvo que también esté registrado y sea correcto.',
          'No use la unión del matrimonio actual si el hijo no es de esa pareja.',
        ],
      },
      {
        title: 'Cónyuge del miembro que edita',
        items: [
          'Campo "Cónyuge": vincula la pareja de la persona que está guardando (no la filiación del hijo).',
          'Al guardar, crea/actualiza la unión entre ambos IDs.',
          'Sin spouse_member_id enlazado, el sistema trata a la persona como no casada para reparto y uniones formales.',
          'El texto en cónyuge puede conservarse como referencia documental (badge Ref. doc.) sin afectar herencia.',
        ],
      },
      {
        title: 'Resaltar nodo y simulador',
        items: [
          'Resaltar nodo: solo ayuda visual en el árbol; no cambia herencia ni montos.',
          'Simulador: muestra cambio de % antes de guardar (no incluye montos en RD$; esos van en Árbol del caso).',
        ],
      },
      {
        title: 'Antes de pulsar Guardar',
        items: [
          '¿El superior es el correcto para cómo quiero ver el árbol?',
          '¿La unión de filiación refleja de qué pareja es el hijo?',
          '¿El cónyuge enlazado corresponde a esta persona (no al hijo)?',
          'Si hay duda, deje Requiere revisión y corrija después de validar en el árbol.',
        ],
      },
    ],
  },
  'sienna-explicacion': {
    title: 'Explicación para herederos',
    intro: 'Pantalla para reuniones: lenguaje claro, cálculo vigente, doble linaje, simulador y estado documental de cada heredero.',
    sections: [
      {
        title: 'Pestañas',
        items: [
          'Por qué heredo: texto personalizado por heredero, con doble linaje desglosado cuando aplica.',
          'Semáforo: estado documental por heredero, pendientes de soporte y conflictos de datos si existen; los enlaces para cargar soporte solo aparecen si el usuario tiene permiso a Documentos.',
          'Línea de tiempo: eventos familiares relevantes del heredero y su ruta documental.',
          'Glosario: términos legales y familiares usados en esta explicación.',
          'Reparto final: bruto, gestión, firma de abogados, neto y cantidad de herederos incluidos por el cálculo sucesoral vigente de la API.',
        ],
      },
      {
        title: 'Monto',
        items: [
          'Ingrese el caudal bruto y los mismos porcentajes de gestión y firma de abogados que en Settings.',
          'Neto = bruto − gestión; luego se descuenta abogados sobre el saldo después de gestión.',
          'La pantalla usa el mismo cálculo que ve en el árbol para mantenerse consistente.',
          'Escribir en los campos no recalcula automáticamente; Actualizar esta vista aplica la simulación sin cambiar Settings globales.',
          'La pantalla no guarda montos en la tabla de herederos.',
        ],
      },
      {
        title: 'Pendientes de documentación',
        items: [
          'Pendientes de documentación agrupa herederos que requieren revisión documental antes de considerarlos completamente verificados.',
          'En progreso: hay un documento vinculado, pero todavía no está marcado como “confirma heredero” ni clasificado como acta de nacimiento.',
          'Falta soporte: no hay actas ni documentos asociados directamente a ese heredero.',
          'Conflicto: el sistema detectó datos contradictorios, por ejemplo fechas distintas o nacimiento y defunción iguales.',
          'En la práctica, la mayoría de pendientes son falta de documentación o falta de clasificación del documento, no necesariamente conflicto legal.',
        ],
      },
      {
        title: 'PDF',
        items: [
          'El PDF individual incluye ruta sucesoral, doble linaje cuando existe, monto calculado, fundamento legal/documental y mosaico de documentos soporte.',
          'Las imágenes de actas se normalizan para que aparezcan visibles; los PDF muestran miniatura de la primera página cuando el navegador puede renderizarla.',
          'La foto del heredero se recorta en formato circular en el PDF.',
          'Si el heredero o miembro tiene fecha de defunción, el PDF muestra el indicador "Fallecido" con fecha.',
        ],
      },
    ],
  },
  'sienna-laboratorio-compensacion': {
    title: 'Laboratorio de compensación familiar',
    intro: 'Simulador experimental para probar reembolsos y reconocimientos de gestión sin modificar el cálculo oficial.',
    sections: [
      {
        title: 'Alcance',
        items: [
          'La pantalla no guarda datos ni modifica Settings.',
          'La base oficial viene de la API de cálculo Sienna en modo solo lectura.',
          'Los escenarios viven en memoria del navegador y se pierden al salir o recargar.',
        ],
      },
      {
        title: 'Escenarios',
        items: [
          'Reembolso de gastos permite sumar gastos comprobables de Joselyn.',
          'Compensación por gestión permite asignar monto fijo o porcentaje del neto a Joselyn, Bernardo y Víctor.',
          'El método de prorrateo define quién asume el costo y en qué proporción.',
        ],
      },
      {
        title: 'Comparación',
        items: [
          'La tabla muestra monto original, aporte, compensación recibida, monto simulado y diferencia neta.',
          'Use esta pantalla para conversar alternativas; no representa una decisión legal ni definitiva.',
        ],
      },
    ],
  },
};

export const getScreenHelp = (key: string): ScreenHelpContent | undefined => SCREEN_HELP[key];
