export type LegadoStoryVisual = 'calabria' | 'migration' | 'samana' | 'familyTree' | 'legacy';

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
  creditMembers?: Array<{
    memberId: string;
    name: string;
    birth?: string | null;
    death?: string | null;
    generation?: number | null;
    treePosition?: string | null;
    photoData?: string | null;
    importance?: string | null;
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
      'La historia familiar empieza en Santa Domenica Talao, un pueblo montanoso de Calabria, al sur de Italia. Desde alli, Domenico, tambien recordado como Domingo Sangiovanni, y Maria Rosa Grisolia guardaron una raiz que con el tiempo miraria hacia America: no como despedida del origen, sino como deseo de abrir caminos nuevos para los suyos.',
    location: 'Santa Domenica Talao, Calabria',
    visual: 'calabria',
    durationMs: 12500,
    backgroundImage: '/game/legado/generated/storyteller/legado-santa-domenica-origen-documental.png',
    archiveImage: '/game/legado/archive/domenico-maria-rosa-clean.webp',
    archiveCaption: 'Domenico Sangiovanni y Maria Rosa Grisolia',
    memberPhotos: [
      {
        id: 'domenico',
        name: 'Domenico Sangiovanni',
        photoData: '/game/legado/archive/domenico-sangiovanni-portrait.webp',
        deceased: true,
      },
      {
        id: 'maria-rosa-grisolia',
        name: 'Maria Rosa Grisolia',
        photoData: '/game/legado/archive/maria-rosa-grisolia-portrait.webp',
        deceased: true,
      },
    ],
    tone: 'origin',
  },
  {
    id: 'migration',
    title: 'La casa Sangiovanni',
    text:
      'Se recuerda que desde Santa Domenica Talao, Domenico Sangiovanni Cino emprendio camino hacia Republica Dominicana con Maria Rosa Grisolia Di Vanna y sus hijos. En esa memoria familiar aparecen Bonifacio, Paolo Sangiovanni Grisolia y Vincenzo Sangiovanni Grisolia, luego conocido como Vicente. Maria Magdalena permanecio en Santa Domenica, como esa rama que siguio cuidando el origen.',
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
      'Aquel viaje hacia America fue mas que cruzar distancia. La familia llevo consigo idioma, fe, oficio y apellido. En Samana, el apellido calabres empezo a encontrar casa, trabajo y una manera nueva de pertenecer a la vida dominicana sin soltar lo que venia de Italia.',
    location: 'Italia -> Samana',
    visual: 'migration',
    durationMs: 13000,
    backgroundImage: '/game/legado/generated/legado-slide-02-migracion-barco.png',
    tone: 'migration',
  },
  {
    id: 'samana-comercial',
    title: 'Samana y la Casa Hermanos Sangiovanni',
    text:
      'En Republica Dominicana, los hijos de Domenico llevaron aquel impulso familiar a una escala mayor. En 1904, la Casa Hermanos Sangiovanni se convirtio en una presencia comercial importante de Samana, dedicada al comercio importador y exportador. Alli, Paolo y Vincenzo no solo trabajaban: ayudaban a mover mercancias, credito, relaciones y confianza dentro de la vida economica del pueblo.',
    location: 'Samana, Republica Dominicana',
    visual: 'samana',
    durationMs: 12000,
    backgroundImage: '/game/legado/generated/storyteller/legado-samana-casa-hermanos-sangiovanni-v2.jpg',
    memberPhotos: [
      {
        id: 'domenico',
        name: 'Domenico (Domingo) Sangiovanni',
        photoData: '/game/legado/archive/domenico-sangiovanni-portrait.webp',
        deceased: true,
      },
      {
        id: 'maria-rosa-grisolia',
        name: 'Maria Rosa Grisolia',
        photoData: '/game/legado/archive/maria-rosa-grisolia-portrait.webp',
        deceased: true,
      },
      {
        id: 'paolo',
        name: 'Paolo (Paulino) Sangiovanni',
        photoData: '/game/legado/archive/extracted-faces/named/paolo-sangiovanni.jpg',
      },
      {
        id: 'vincenzo',
        name: 'Vincenzo (Vicente) Sangiovanni',
        photoData: '/game/legado/archive/extracted-faces/named/vincenzo-vicente-sangiovanni.jpg',
      },
    ],
    tone: 'arrival',
  },
  {
    id: 'domenico-joyero',
    title: 'El oficio de Domenico',
    text:
      'En Samana, Domenico no aparece como una figura lejana, sino como un hombre de oficio. Hacia 1896 se le recuerda como joyero ambulante: alguien que llevaba trabajo fino, palabra y confianza de un lugar a otro. Ese comienzo artesanal ayuda a entender la raiz comercial de la familia, nacida primero en el trato directo con la gente.',
    location: 'Santa Barbara de Samana',
    visual: 'samana',
    durationMs: 14500,
    backgroundImage: '/game/legado/generated/storyteller/legado-samana-casa-hermanos-sangiovanni-v2.jpg',
    memberPhotos: [
      {
        id: 'domenico',
        name: 'Domenico (Domingo) Sangiovanni',
        photoData: '/game/legado/archive/domenico-sangiovanni-portrait.webp',
        deceased: true,
      },
      {
        id: 'maria-rosa-grisolia',
        name: 'Maria Rosa Grisolia',
        photoData: '/game/legado/archive/maria-rosa-grisolia-portrait.webp',
        deceased: true,
      },
    ],
    tone: 'arrival',
  },
  {
    id: 'paolo-hielo-cine',
    title: 'Hielo, cine y vida urbana',
    text:
      'Paulino, tambien recordado como Paolo o Paolino, llego a ocupar un lugar visible en la vida economica y social de Samana. Se le asocia con la primera fabrica de hielo de la ciudad, un avance clave para conservar alimentos y sostener el comercio costero, y tambien con el Cine Colon, un espacio que habla de entretenimiento, encuentro y vida urbana. Su historia muestra que la familia no solo echo raices: tambien aporto movimiento y modernidad a su comunidad.',
    location: 'Samana, Republica Dominicana',
    visual: 'samana',
    durationMs: 15500,
    backgroundImage: '/game/legado/generated/storyteller/legado-samana-casa-hermanos-sangiovanni-v2.jpg',
    memberPhotos: [
      {
        id: 'paolo',
        name: 'Paolo (Paulino) Sangiovanni',
        photoData: '/game/legado/archive/extracted-faces/named/paolo-sangiovanni.jpg',
      },
    ],
    tone: 'arrival',
  },
  {
    id: 'primeros-hogares',
    title: 'Los primeros hogares',
    text:
      'Con el tiempo, la familia se fue haciendo dominicana desde Samana. Paolo formo hogar con Matilde Perez Alvarez, y Vicente con Maria Balbina Perez Alvarez. Desde esas uniones nacieron ramas Sangiovanni Perez que conservaron el apellido, la memoria calabresa y una identidad cada vez mas unida al pais.',
    location: 'Samana, Republica Dominicana',
    visual: 'samana',
    durationMs: 12000,
    backgroundImage: '/game/legado/generated/storyteller/legado-primeros-hogares-casa-familiar.png',
    archiveImage: '/game/legado/archive/paolo-vicente-sangiovanni-matrimonios.jpg',
    archiveCaption: 'Paolo Sangiovanni y Vincenzo/Vicente Sangiovanni al formar sus hogares',
    memberPhotos: [
      {
        id: 'paolo',
        name: 'Paolo (Paulino) Sangiovanni',
        photoData: '/game/legado/archive/paolo-vicente-sangiovanni-matrimonios.jpg',
      },
      {
        id: 'vincenzo',
        name: 'Vincenzo (Vicente) Sangiovanni',
        photoData: '/game/legado/archive/paolo-vicente-sangiovanni-matrimonios.jpg',
      },
    ],
    tone: 'arrival',
  },
  {
    id: 'family-tree',
    title: 'El arbol empieza a moverse',
    text:
      'Empiezan a encontrarse nacimientos, despedidas, hijos, primos y recuerdos. Poco a poco, el arbol deja de ser una lista de nombres y se vuelve una memoria familiar que cruza generaciones.',
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
      'Esta no es solo una familia. Es una historia de origen, viaje, identidad y memoria que sigue creciendo cada vez que alguien vuelve a contarla.',
    location: 'Legado Sangiovanni',
    visual: 'legacy',
    durationMs: 12000,
    backgroundImage: '/game/legado/references/images-santa-domenica/vista-montanas-tejados-santa-domenica.jpg',
    archiveImage: '/game/legado/archive/domenico-maria-rosa-clean.webp',
    archiveCaption: 'Domenico Sangiovanni y Maria Rosa Grisolia',
    tone: 'memory',
  },
];
