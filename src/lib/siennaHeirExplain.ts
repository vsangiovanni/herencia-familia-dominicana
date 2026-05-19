import jsPDF from 'jspdf';
import { ConfirmedHeir, EvidenceDocument, SiennaFamilyMember } from '@/lib/api';
import { InheritanceShare, normalizeName } from '@/lib/dominicanInheritance';

export type EvidenceTrafficLevel = 'green' | 'amber' | 'red';

export type EvidenceTrafficState = {
  level: EvidenceTrafficLevel;
  label: string;
  value: number;
  className: string;
  issues: string[];
};

export type LifeTimelineEvent = {
  kind: 'nacimiento' | 'matrimonio' | 'defuncion' | 'vinculo';
  date: string;
  label: string;
  detail?: string;
};

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(amount || 0);

export const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value || 0)}%`;

const normalizeDateToken = (value: string) => value.replace(/\s+/g, '').toLowerCase();

export const detectMemberDateConflicts = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[]
): string[] => {
  const issues: string[] = [];
  const sameName = members.filter((item) => normalizeName(item.name) === normalizeName(member.name) && item.id !== member.id);
  if (sameName.length) {
    issues.push(`Nombre repetido en el árbol (${sameName.length} coincidencia(s)).`);
  }

  const deathVariants = new Map<string, string>();
  members
    .filter((item) => normalizeName(item.name) === normalizeName(member.name))
    .forEach((item) => {
      if (item.death) deathVariants.set(normalizeDateToken(item.death), item.death);
    });
  if (deathVariants.size > 1) {
    issues.push(`Fechas de defunción distintas: ${Array.from(deathVariants.values()).join(' vs ')}.`);
  }

  if (member.birth && member.death && normalizeDateToken(member.birth) === normalizeDateToken(member.death)) {
    issues.push('La fecha de nacimiento y defunción coinciden.');
  }

  return issues;
};

export const evaluateEvidenceSupport = (
  documents: EvidenceDocument[],
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[]
): EvidenceTrafficState => {
  const issues = detectMemberDateConflicts(member, members);
  const confirmedDocs = documents.filter((document) => document.confirms_heir);
  const hasConflict = issues.length > 0;

  if (hasConflict) {
    return {
      level: 'red',
      label: 'Conflicto',
      value: 18,
      className: 'border-red-300 bg-red-50 text-red-800',
      issues,
    };
  }

  if (documents.length >= 2 && confirmedDocs.length >= 1) {
    return {
      level: 'green',
      label: 'Sólido',
      value: 100,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      issues: [],
    };
  }

  if (documents.length === 1) {
    return {
      level: 'amber',
      label: 'En progreso',
      value: 62,
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      issues: ['Falta al menos un documento adicional que respalde el vínculo.'],
    };
  }

  return {
    level: 'red',
    label: 'Falta soporte',
    value: 28,
    className: 'border-red-200 bg-red-50 text-red-700',
    issues: ['No hay actas ni documentos asociados directamente a este heredero.'],
  };
};

export const routeSteps = (share: InheritanceShare) =>
  share.route
    .split('|')
    .flatMap((route) => route.split('->').map((item) => item.trim()))
    .filter(Boolean);

export const buildMemberLifeTimeline = (
  member: SiennaFamilyMember,
  share?: InheritanceShare
): LifeTimelineEvent[] => {
  const events: LifeTimelineEvent[] = [];

  if (member.birth) {
    events.push({ kind: 'nacimiento', date: member.birth, label: 'Nacimiento', detail: member.name });
  }
  if (member.spouse) {
    events.push({
      kind: 'matrimonio',
      date: member.spouse_birth || 'Por documentar',
      label: 'Matrimonio / unión',
      detail: `Con ${member.spouse}`,
    });
  }
  if (member.death) {
    events.push({ kind: 'defuncion', date: member.death, label: 'Defunción', detail: member.name });
  }

  if (share) {
    routeSteps(share).forEach((step, index) => {
      events.push({
        kind: 'vinculo',
        date: `Paso ${index + 1}`,
        label: 'Vínculo sucesoral',
        detail: step,
      });
    });
  }

  return events;
};

export const buildWhyIInheritText = (share: InheritanceShare, simulatedShare: number, simulatedAmount: number) => {
  const branches = share.sources.length ? share.sources.join(' y ') : 'rama documentada';
  return [
    `Usted hereda porque está llamado dentro de la ${branches}, siguiendo la cadena familiar desde Alessandro de Paola Sangiovanni.`,
    share.reason,
    `Su participación estimada es ${formatPercent(simulatedShare)} del neto explicado, equivalente a ${formatMoney(simulatedAmount)}.`,
    share.paymentBasis,
  ].join(' ');
};

export const buildCaseGlossary = (activeHeirNames: string[]) => [
  {
    term: 'Causante',
    text: 'Persona cuyo patrimonio se distribuye. En este expediente: Alessandro de Paola Sangiovanni (fallecido 14/01/1998).',
    example: 'Todo el análisis parte de Alessandro porque no hay descendencia directa registrada.',
  },
  {
    term: 'Representación',
    text: 'Cuando un ascendiente falleció, sus hijos ocupan su lugar en la rama para recibir la cuota.',
    example: 'Domingo Ramón falleció; sus descendientes entran por representación en la rama Vincenzo/Vicente.',
  },
  {
    term: 'Estirpe',
    text: 'Rama que recibe una porción y luego la divide entre quienes están vivos y documentados.',
    example: 'La estirpe de Vincenzo/Vicente y la de Paolo/Paulino parten el 50% cada una en este caso.',
  },
  {
    term: 'Vocación sucesoral',
    text: 'Razón jurídica y familiar por la que alguien puede ser llamado a heredar.',
    example:
      activeHeirNames.includes('Víctor Manuel Martín Sangiovanni Rodríguez')
        ? 'Víctor tiene doble vocación: entra por María Rosa (Vincenzo) y por Pedro Pablo (Paolo).'
        : 'Cada heredero activo tiene una vocación explicada en su ficha.',
  },
  {
    term: 'Rama colateral',
    text: 'Línea que no desciende directamente del causante, pero entra cuando no hay hijos directos.',
    example: 'Vincenzo y Paolo son hermanos de la madre del causante; abren ramas colaterales activas.',
  },
  {
    term: 'Doble filiación',
    text: 'Cuando la misma persona se conecta al tronco por dos rutas familiares documentadas.',
    example: 'María Rosa y Pedro Pablo eran primos; sus descendientes pueden mostrar doble línea Sangiovanni.',
  },
];

type HeirBriefExport = {
  share: InheritanceShare;
  documents: EvidenceDocument[];
  simulatedShare: number;
  simulatedAmount: number;
  photoData?: string | null;
  traffic: EvidenceTrafficState;
};

export const downloadHeirBriefPdf = (brief: HeirBriefExport, netAmount: number) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const margin = 18;
  let y = margin;

  const writeLine = (text: string, size = 11, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, 180);
    lines.forEach((line: string) => {
      if (y > 265) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += size * 0.45 + 2;
    });
  };

  pdf.setTextColor(25, 55, 95);
  writeLine('HerenciaRD · Ficha explicativa Sienna', 10);
  writeLine(brief.share.member.name, 16, true);
  y += 2;

  if (brief.photoData?.startsWith('data:image')) {
    try {
      const format = brief.photoData.includes('image/png') ? 'PNG' : 'JPEG';
      pdf.addImage(brief.photoData, format, margin, y, 28, 28);
      y += 32;
    } catch {
      // omitir foto si el formato no es compatible
    }
  }

  pdf.setTextColor(40, 40, 40);
  writeLine(`Porcentaje estimado: ${formatPercent(brief.simulatedShare)}`, 12, true);
  writeLine(`Monto estimado: ${formatMoney(brief.simulatedAmount)}`, 12, true);
  writeLine(`Neto del caso usado: ${formatMoney(netAmount)}`, 10);
  writeLine(`Semáforo documental: ${brief.traffic.label}`, 10);

  y += 2;
  writeLine('Por qué heredo (lenguaje simple)', 12, true);
  writeLine(buildWhyIInheritText(brief.share, brief.simulatedShare, brief.simulatedAmount), 10);

  y += 2;
  writeLine('Ruta genealógica', 12, true);
  writeLine(brief.share.route.replace(/\|/g, ' · '), 10);

  y += 2;
  writeLine('Documentos de soporte', 12, true);
  if (!brief.documents.length) {
    writeLine('- Sin documentos asociados en el expediente.', 10);
  } else {
    brief.documents.forEach((document) => {
      writeLine(`- ${document.title} (${document.document_type})`, 10);
    });
  }

  if (brief.traffic.issues.length) {
    y += 2;
    writeLine('Observaciones', 12, true);
    brief.traffic.issues.forEach((issue) => writeLine(`- ${issue}`, 10));
  }

  const safeName = brief.share.member.name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  pdf.save(`ficha-sienna-${safeName || 'heredero'}.pdf`);
};

export const heirPhotoByName = (heirs: ConfirmedHeir[]) =>
  new Map(heirs.map((heir) => [normalizeName(heir.heir_name), heir]));
