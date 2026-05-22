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
    title: 'Panel de control',
    intro: 'Punto de entrada tras iniciar sesión. Desde aquí accede a las herramientas del expediente.',
    sections: [
      {
        title: 'Tarjetas',
        items: [
          'Cada tarjeta abre un módulo: árbol, herederos, documentos o sección Sienna.',
          'Las opciones de administración solo aparecen si su rol es administrador.',
        ],
      },
      {
        title: 'Ayuda en cada pantalla',
        items: [
          'En el resto de módulos verá un icono ? arriba a la derecha con instrucciones de esa pantalla.',
          'No bloquea el trabajo: ábralo solo cuando lo necesite.',
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
          'Para trabajo operativo con cálculo use el Árbol Sienna.',
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
          'Sirve para ubicar parentescos antes de registrar miembros en Sienna.',
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
    sections: [
      {
        title: 'Tabla caso por caso',
        items: [
          'Cada fila es un problema que afecta filiación o reparto: vínculo de filiación, matrimonio del hijo o rama cortada.',
          'El cónyuge en texto (ej. «Ana Julia Rodríguez») es referencia documental: no se pide enlazarlo ni crear nodo aparte en el árbol.',
          'Use los selectores en «Corregir aquí» y pulse Guardar sin salir de la pantalla.',
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
          'Complementa, no reemplaza, el motor automático de la sección Sienna.',
        ],
      },
    ],
  },
  'calculo-filiacion': {
    title: 'Cálculo por filiación',
    sections: [
      {
        title: 'Líneas',
        items: [
          'Distribución por línea familiar (p. ej. Vincenzo vs Paolo).',
          'Ingrese montos si la pantalla lo solicita para ver totales por heredero.',
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
    ],
  },
  'sienna-arbol': {
    title: 'Árbol genealógico Sienna',
    intro: 'Vista principal del reparto: árbol completo, porcentajes, montos, doble linaje e impresión para reunión.',
    sections: [
      {
        title: 'Monto de la herencia',
        items: [
          'Indique el monto total del caudal y el % de firma de abogados (sobre el bruto).',
          'Neto repartible = bruto − firma. Los montos por heredero usan siempre ese neto.',
          'El % se carga desde Settings. Use Calcular y guardar pagos solo después de revisar el reparto.',
          'Sin monto, verá porcentajes; con monto, cada heredero muestra RD$ calculados.',
        ],
      },
      {
        title: 'Navegación del árbol',
        items: [
          'El zoom ahora escala todo el canvas del árbol, no solo las tarjetas.',
          'Use +, −, Fit y reset para vista global o detalle por rama.',
          'Puede arrastrar el canvas con mouse o dedo; en móvil también puede hacer pinch zoom.',
          'Pantalla completa y modo exposición ayudan para reuniones en monitor o TV.',
        ],
      },
      {
        title: 'Tarjetas del árbol',
        items: [
          'Cada nodo muestra rol (heredero, enlace), % y monto si hay caudal.',
          'Los colores y badges reflejan el estado sucesoral automático.',
          'En hijos registrados con unión, aparece "Filiación: Matrimonio: …" para distinguir hijos de esa pareja.',
          'Los miembros con fecha de defunción muestran lacito negro y etiqueta "Fallecido".',
          'Los casos de doble linaje muestran ambas rutas y un bloque visual de cruce de ramas.',
        ],
      },
      {
        title: 'Impresión',
        items: [
          'Imprimir árbol abre una vista preparada en A3 horizontal y ajusta el árbol completo al ancho disponible.',
          'La impresión conserva indicadores de doble linaje, fotos, montos y marcador de fallecido.',
        ],
      },
    ],
  },
  'sienna-dobles-linajes': {
    title: 'Análisis de Dobles Linajes',
    intro: 'Consola visual para auditar convergencias familiares sin reemplazar el árbol Sienna.',
    sections: [
      {
        title: 'Qué analiza',
        items: [
          'Detecta personas conectadas por más de una ruta genealógica usando el backend y la base de datos real.',
          'Compara rutas por fuente familiar, identifica ancestros compartidos y estima complejidad del cruce.',
          'Muestra alertas por duplicados, vínculos dudosos, fechas incoherentes y relaciones sospechosas.',
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
        title: 'Al guardar (qué persiste)',
        items: [
          'Tabla sienna_family_members: nombre, fechas, parent_id, cónyuge, estado hereditario, etc.',
          'family_unions: pareja cuando hay cónyuge enlazado o unión elegida para el hijo.',
          'member_parent_links: vínculos hijo↔progenitor con union_id cuando corresponde.',
          'Tras guardar, el panel lateral muestra "Hijos por filiación" agrupados por unión u otra relación.',
        ],
      },
      {
        title: 'Estado hereditario',
        items: [
          'Autodetectar (recomendado): el sistema clasifica según ley y árbol; use el simulador antes de guardar.',
          'Forzar manual: solo si está seguro; deje trazabilidad en la razón.',
          'Requiere revisión: use cuando falten datos o haya duda en la filiación.',
        ],
      },
      {
        title: 'Chequeo antes de seguir',
        items: [
          'Línea parental y rama sucesoral deben verse coherentes en el panel del formulario.',
          'En la tabla, abra un progenitor y revise "Hijos por filiación": matrimonio vs otras relaciones.',
          'En Árbol Sienna, los hijos con unión muestran línea "Filiación: Matrimonio: …".',
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
          'Sin este enlace, las uniones antiguas solo en texto quedan marcadas como inconsistentes.',
        ],
      },
      {
        title: 'Resaltar nodo y simulador',
        items: [
          'Resaltar nodo: solo ayuda visual en el árbol; no cambia herencia ni montos.',
          'Simulador: muestra cambio de % antes de guardar (no incluye montos en RD$; esos van en Árbol Sienna).',
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
    intro: 'Pantalla para reuniones: lenguaje claro, cálculo en vivo, doble linaje, simulador y documentación.',
    sections: [
      {
        title: 'Pestañas',
        items: [
          'Por qué heredo: texto personalizado por heredero, con doble linaje desglosado cuando aplica.',
          'Simulador: excluir herederos hipotéticos y ver impacto en % y monto.',
          'Semáforo: estado documental por heredero y conflictos detectados.',
          'Línea de tiempo y glosario: contexto para explicar filiación, representación y vocación sucesoral.',
        ],
      },
      {
        title: 'Monto',
        items: [
          'Ingrese el caudal bruto y el mismo % de firma de abogados que en Árbol Sienna.',
          'Neto = bruto − (bruto × % abogados). Los montos por heredero se calculan sobre el neto.',
          'La pantalla consulta el cálculo en vivo de la API para mantenerse consistente con el árbol.',
          'Actualizar esta vista refresca datos y cálculo sin cambiar Settings globales.',
        ],
      },
      {
        title: 'PDF',
        items: [
          'El PDF individual incluye ruta sucesoral, doble linaje cuando existe, monto estimado y mosaico de documentos soporte.',
          'Las imágenes de actas se normalizan para que aparezcan visibles; PDF u otros formatos muestran vista resumida.',
          'Si el heredero o miembro tiene fecha de defunción, el PDF muestra el indicador "Fallecido" con fecha.',
        ],
      },
    ],
  },
};

export const getScreenHelp = (key: string): ScreenHelpContent | undefined => SCREEN_HELP[key];
