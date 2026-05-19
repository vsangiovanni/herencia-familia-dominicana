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
    sections: [
      {
        title: 'Usuarios',
        items: [
          'Apruebe o revoque acceso a nuevas cuentas.',
          'Asigne rol administrador solo a personal de confianza.',
        ],
      },
      {
        title: 'Estadísticas',
        items: ['Revise visitas por página para ver qué módulos usa el equipo.'],
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
    sections: [
      {
        title: 'Registro',
        items: [
          'Cargue actas, identifique personas y vincule con herederos confirmados.',
          'Marque si el documento confirma a un heredero para el semáforo en Sienna.',
        ],
      },
      {
        title: 'OCR / texto',
        items: ['Puede pegar o transcribir texto del acta; revise siempre antes de guardar.'],
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
    intro: 'Registro de personas y vínculos. El sistema calcula si heredan y el % al guardar.',
    sections: [
      {
        title: 'Conectar al árbol',
        items: [
          'Nombre: obligatorio.',
          'Conectar debajo de: el ascendiente directo en el árbol (o raíz si no tiene superior).',
          'Parentesco con el superior: hijo, hija, cónyuge, etc.',
          'Fechas y cónyuge: necesarios para representación y doble filiación.',
        ],
      },
      {
        title: 'Estado hereditario (desplegable)',
        items: [
          'Etiqueta administrativa. Al guardar, prevalece la Evaluación sugerida automática.',
          'Requiere revisión: el motor no pudo clasificar (faltan datos).',
          'Posible heredero: tiene cuota en el reparto (%).',
          'No hereda: causante, enlace o intermedio que transmite a descendientes.',
          'Confirmado: único valor que fuerza manualmente “sí hereda” aunque el motor diga otra cosa.',
        ],
      },
      {
        title: 'Tabla y búsqueda',
        items: [
          'Línea parental: ruta completa desde la raíz.',
          '¿Hereda?: resultado con % si aplica.',
          'El simulador muestra cómo cambian los % antes de guardar; el monto en RD$ se define en Árbol Sienna.',
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
