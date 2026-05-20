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
    title: 'Hallazgos',
    sections: [
      {
        title: 'Revisión',
        items: [
          'Inconsistencias detectadas entre documentos, árbol y herederos.',
          'Priorice ítems en rojo o marcados como riesgo antes de cerrar el expediente.',
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
    intro: 'Vista principal del reparto: árbol + porcentajes + montos en pesos.',
    sections: [
      {
        title: 'Monto de la herencia',
        items: [
          'Indique el monto total del caudal y, si aplica, honorarios de abogado.',
          'Sin monto, verá porcentajes; con monto, cada heredero muestra RD$ calculados.',
        ],
      },
      {
        title: 'Árbol',
        items: [
          'Cada nodo muestra rol (heredero, enlace), % y monto si hay caudal.',
          'Los colores y badges reflejan el estado sucesoral automático.',
        ],
      },
      {
        title: 'Guardar montos',
        items: ['Use el botón de guardar montos tras revisar el reparto para persistir en herederos confirmados.'],
      },
    ],
  },
  'sienna-miembros': {
    title: 'Miembros del árbol',
    intro: 'Guía anti-errores: aquí se crean y conectan personas. Si conectas mal un nodo, todo el reparto sale mal.',
    sections: [
      {
        title: 'Agregar miembro (campo por campo)',
        items: [
          'Nombre: nombre completo de la persona. Es obligatorio.',
          'Conectar debajo de: quién es su superior directo en el árbol. Si no tiene superior, usa Raíz.',
          'Parentesco con el superior: relación con ese superior (hijo, hija, cónyuge, padre, madre u otro).',
          'Nacimiento: fecha de nacimiento (si se conoce). Ayuda a validar coherencia del árbol.',
          'Defunción: fecha de fallecimiento (si aplica). Impacta la representación sucesoral.',
          'Cónyuge: nombre del cónyuge de esa persona (si aplica) para entender cruces de línea.',
          'Nacimiento del cónyuge: dato opcional del cónyuge para contexto documental.',
          'Orden entre hermanos: número para ordenar visualmente entre personas del mismo nivel.',
          'Estado hereditario: clasificación operativa (requiere revisión, posible heredero, no hereda o confirmado).',
          'Razón / explicación: por qué esa clasificación aplica en ese miembro.',
          'Resaltar nodo: solo resalta visualmente ese miembro en el árbol para ubicarlo rápido; no cambia porcentajes, montos ni quién hereda.',
        ],
      },
      {
        title: 'Paso a paso para crear/editar',
        items: [
          'Paso 1: escribe el nombre (obligatorio).',
          'Paso 2: en Conectar debajo de, elige su superior correcto (padre/madre o raíz).',
          'Paso 3: define parentesco con el superior (hijo, hija, cónyuge, etc.).',
          'Paso 4: guarda y valida en la tabla que quedó en la rama correcta.',
        ],
      },
      {
        title: 'Estado hereditario (en español simple)',
        items: [
          'Requiere revisión: faltan datos, no está claro.',
          'Posible heredero: sí tiene pinta de heredar.',
          'No hereda: es enlace/intermedio o no aplica.',
          'Confirmado: se fuerza manualmente. Úsalo solo si estás seguro.',
          'Si dudas, deja Requiere revisión y corrige datos primero.',
        ],
      },
      {
        title: 'Chequeo rápido antes de seguir',
        items: [
          'Busca la persona en la tabla y revisa Línea parental: debe verse lógica.',
          'Revisa ¿Hereda? y Notas para detectar errores de conexión.',
          'Usa el simulador para ver impacto en %. El monto en dinero se calcula en Árbol Sienna.',
          'Si algo se ve raro, no sigas: corrige el nodo antes de cargar más datos.',
        ],
      },
    ],
  },
  'sienna-miembros-agregar': {
    title: 'Ayuda: Agregar Miembro',
    intro: 'Esta ayuda es solo para crear o editar miembros correctamente.',
    sections: [
      {
        title: 'Que llenar en orden',
        items: [
          'Nombre: obligatorio. Escriba el nombre completo de la persona.',
          'Conectar debajo de: seleccione su superior directo en el árbol. Si no tiene, use Raíz.',
          'Parentesco con el superior: relación exacta con ese superior (hijo, hija, cónyuge, etc.).',
          'Fechas (nacimiento/defunción): si las conoce, colóquelas para evitar errores de representación.',
          'Cónyuge y nacimiento del cónyuge: úselo cuando ese vínculo ayude a explicar cruces de línea.',
          'Orden entre hermanos: número para ordenar visualmente miembros del mismo nivel.',
        ],
      },
      {
        title: 'Estado y explicación',
        items: [
          'Estado hereditario: úselo con cuidado. Si no está seguro, deje Requiere revisión.',
          'Razón / explicación: escriba el motivo de la clasificación para dejar trazabilidad.',
          'Evaluación sugerida: el sistema le muestra una guía automática antes de guardar.',
        ],
      },
      {
        title: 'Que significa Resaltar nodo',
        items: [
          'Resaltar nodo solo pinta ese miembro para ubicarlo rápido en el árbol.',
          'No cambia quién hereda, ni porcentajes, ni montos.',
          'Es una ayuda visual, no una regla legal ni de cálculo.',
        ],
      },
      {
        title: 'Chequeo antes de guardar',
        items: [
          'Verifique que quedó debajo del familiar correcto.',
          'Revise que el parentesco corresponda al superior seleccionado.',
          'Si tiene dudas, no fuerce Confirmado: guarde como Requiere revisión y valide luego.',
        ],
      },
    ],
  },
  'sienna-explicacion': {
    title: 'Explicación para herederos',
    intro: 'Pantalla para reuniones: lenguaje claro, simulador y documentación.',
    sections: [
      {
        title: 'Pestañas',
        items: [
          'Por qué heredo: texto personalizado por heredero.',
          'Simulador: excluir herederos hipotéticos y ver impacto en %.',
          'Semáforo y timeline: soporte documental y pasos del proceso.',
        ],
      },
      {
        title: 'Monto',
        items: [
          'Ingrese el caudal para mostrar montos además de porcentajes.',
          'Coherente con el monto usado en Árbol Sienna.',
        ],
      },
      {
        title: 'PDF',
        items: ['Genere resumen para entregar en la reunión tras revisar datos y simulación.'],
      },
    ],
  },
};

export const getScreenHelp = (key: string): ScreenHelpContent | undefined => SCREEN_HELP[key];
