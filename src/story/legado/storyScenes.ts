export type LegadoStoryVisual = 'calabria' | 'migration' | 'puertoPlata' | 'familyTree' | 'legacy';

export type LegadoStoryScene = {
  id: string;
  title: string;
  text: string;
  location: string;
  visual: LegadoStoryVisual;
  durationMs: number;
  backgroundImage: string;
  archiveImage?: string;
  archiveCaption?: string;
  memberPhotos?: Array<{
    memberId: string;
    name: string;
    photoData: string;
    deceased: boolean;
    birth?: string | null;
    death?: string | null;
  }>;
  tone: 'origin' | 'migration' | 'arrival' | 'lineage' | 'memory';
  members?: string[];
  year?: number | string;
  eventKind?: string;
  assetPrompt?: string;
};

export const legadoStoryScenes: LegadoStoryScene[] = [
  {
    id: 'calabria',
    title: 'Calabria, Italia',
    text:
      'En un pueblo de Calabria, Santa Domenica Talao, la joven familia de Domenico Sangiovanni y Maria Rosa Grisolia tomaron una decision que cambiaria sus vidas y las generaciones venideras.',
    location: 'Santa Domenica Talao, Calabria',
    visual: 'calabria',
    durationMs: 12500,
    backgroundImage: '/game/legado/generated/storyteller/legado-santa-domenica-origen-documental.png',
    archiveImage: '/game/legado/archive/domenico-maria-rosa-clean.webp',
    archiveCaption: 'Domenico Sangiovanni y Maria Rosa Grisolia',
    tone: 'origin',
  },
  {
    id: 'migration',
    title: 'La casa Sangiovanni',
    text:
      'La puerta familiar quedo como testigo del momento en que la historia comenzo a dividirse entre dos orillas. Domenico y Maria Rosa saldrian con Paolo y Vincenzo; Maria Magdalena permaneceria en Italia.',
    location: 'Casa Sangiovanni, Santa Domenica Talao',
    visual: 'migration',
    durationMs: 13500,
    backgroundImage: '/game/legado/generated/storyteller/legado-puerta-sangiovanni-santa-domenica-escenario.png',
    tone: 'migration',
  },
  {
    id: 'migration-ship',
    title: 'La ruta hacia America',
    text:
      'El matrimonio parte con sus hijos varones, Paolo y Vincenzo. Maria Magdalena queda en Italia, y la historia familiar se bifurca.',
    location: 'Italia -> Puerto Plata',
    visual: 'migration',
    durationMs: 13000,
    backgroundImage: '/game/legado/generated/legado-slide-02-migracion-barco.png',
    tone: 'migration',
  },
  {
    id: 'puerto-plata',
    title: 'Puerto Plata recibe el legado',
    text:
      'La llegada abre una nueva etapa: el apellido se arraiga en Republica Dominicana y empieza a expandirse en nuevas ramas.',
    location: 'Puerto Plata, Republica Dominicana',
    visual: 'puertoPlata',
    durationMs: 12000,
    backgroundImage: '/game/legado/generated/legado-slide-03-puerto-plata.png',
    archiveImage: '/game/legado/archive/paolo-vicente-sangiovanni-puerto-plata.jpg',
    archiveCaption: 'Paolo Sangiovanni y Vincenzo/Vicente Sangiovanni',
    tone: 'arrival',
  },
  {
    id: 'primeros-hogares',
    title: 'Los primeros hogares',
    text:
      'Con el tiempo, Paolo y Vincenzo no solo llevaron un apellido: comenzaron a formar hogares. En esas uniones, la historia dejo de ser solamente una migracion y se convirtio en familia dominicana, con nuevas ramas destinadas a crecer.',
    location: 'Puerto Plata, Republica Dominicana',
    visual: 'puertoPlata',
    durationMs: 12000,
    backgroundImage: '/game/legado/generated/storyteller/legado-puerto-plata-llegada-documental.png',
    archiveImage: '/game/legado/archive/paolo-vicente-sangiovanni-matrimonios.jpg',
    archiveCaption: 'Paolo Sangiovanni y Vincenzo/Vicente Sangiovanni al formar sus hogares',
    tone: 'arrival',
  },
  {
    id: 'family-tree',
    title: 'El arbol empieza a moverse',
    text:
      'Nacimientos, despedidas, hijos, primos y documentos empiezan a conectarse como una memoria familiar que cruza generaciones.',
    location: 'Base genealogica familiar',
    visual: 'familyTree',
    durationMs: 12500,
    backgroundImage: '/game/legado/santa-domenica-concept.png',
    tone: 'lineage',
  },
  {
    id: 'legacy',
    title: 'Raices que sobreviven generaciones',
    text:
      'Esta no es solo una familia. Es una historia de migracion, identidad y memoria que sigue creciendo.',
    location: 'Legado Sangiovanni',
    visual: 'legacy',
    durationMs: 12000,
    backgroundImage: '/game/legado/references/images-santa-domenica/vista-montanas-tejados-santa-domenica.jpg',
    archiveImage: '/game/legado/archive/domenico-maria-rosa-clean.webp',
    archiveCaption: 'Domenico Sangiovanni y Maria Rosa Grisolia',
    tone: 'memory',
  },
];
