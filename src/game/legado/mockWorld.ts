import type { LegacyCharacter, LegacyMission, LegacyWorldNode } from './types';

export const legacyCharacters: LegacyCharacter[] = [
  {
    id: 'victor',
    name: 'Victor',
    title: 'Conector de Rutas',
    level: 12,
    ability: 'Detecta vinculos ocultos y activa rutas familiares.',
    color: '#D4AF37',
  },
  {
    id: 'gina',
    name: 'Gina',
    title: 'Detectora de Convergencias',
    level: 10,
    ability: 'Revela caminos secretos y portales de convergencia.',
    color: '#2DD4BF',
  },
  {
    id: 'pedro-pablo',
    name: 'Pedro Pablo',
    title: 'Proteccion Documental',
    level: 11,
    ability: 'Abre archivos sellados y protege documentos historicos.',
    color: '#60A5FA',
  },
  {
    id: 'fulvia',
    name: 'Fulvia',
    title: 'Salto de Linajes',
    level: 9,
    ability: 'Ejecuta doble salto y activa conexiones multiples.',
    color: '#C084FC',
  },
];

export const legacyMissions: LegacyMission[] = [
  {
    id: 'historical-document',
    title: 'Documento Historico',
    description: 'Encuentra el acta perdida en la Ruta de Vincenzo.',
    progress: 0,
    goal: 1,
  },
  {
    id: 'lost-convergence',
    title: 'Convergencia Perdida',
    description: 'Une las ramas de Vincenzo y Paolo.',
    progress: 0,
    goal: 1,
  },
  {
    id: 'family-album',
    title: 'Album Familiar',
    description: 'Restaura tres recuerdos luminosos del legado.',
    progress: 1,
    goal: 3,
  },
];

export const legacyTreeNodes: LegacyWorldNode[] = [
  { id: 'vincenzo-root', label: 'Vincenzo', type: 'root', unlocked: true },
  { id: 'italia-1860', label: 'Italia 1860', type: 'branch', unlocked: true },
  { id: 'acta-ruta-vincenzo', label: 'Acta antigua', type: 'document', unlocked: false },
  { id: 'portal-paolo', label: 'Portal Paolo', type: 'convergence', unlocked: false },
  { id: 'rama-oculta-1', label: 'Rama oculta', type: 'locked', unlocked: false },
  { id: 'rama-oculta-2', label: 'Archivo sellado', type: 'locked', unlocked: false },
];

