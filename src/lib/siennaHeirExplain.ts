import jsPDF from 'jspdf';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { ConfirmedHeir, EvidenceDocument, SiennaFamilyMember } from '@/lib/api';
import { caseCausanteName, getSiennaCaseConfig, InheritanceShare, normalizeName } from '@/lib/dominicanInheritance';
import { resolveSpouseDisplayLabel, SiennaGenealogyBundle } from '@/lib/siennaGenealogy';

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
  const birthCertificateDocs = documents.filter((document) =>
    [document.document_type, document.title]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .match(/acta|nacimiento|birth/)
  );
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

  if (confirmedDocs.length >= 1 || birthCertificateDocs.length >= 1) {
    return {
      level: 'green',
      label: 'Verificado',
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
      issues: ['Hay un documento vinculado, pero falta marcarlo como confirmación del heredero o clasificarlo como acta de nacimiento.'],
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
  share?: InheritanceShare,
  members?: SiennaFamilyMember[],
  genealogy?: SiennaGenealogyBundle
): LifeTimelineEvent[] => {
  const events: LifeTimelineEvent[] = [];

  if (member.birth) {
    events.push({ kind: 'nacimiento', date: member.birth, label: 'Nacimiento', detail: member.name });
  }
  const spouseLabel = members
    ? resolveSpouseDisplayLabel(member, members, genealogy)
    : member.spouse?.trim() || null;
  if (spouseLabel) {
    events.push({
      kind: 'matrimonio',
      date: member.spouse_birth || 'Por documentar',
      label: 'Matrimonio / unión',
      detail: `Con ${spouseLabel}`,
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
  const lineageBreakdown =
    share.sourceBreakdown.length > 1
      ? ' En este caso hay doble linaje: ' +
        share.sourceBreakdown
          .map((segment) => `${segment.source}: ${formatPercent(segment.share)}`)
          .join('; ') +
        '.'
      : '';
  return [
    `Usted hereda porque está llamado dentro de la ${branches}, siguiendo la cadena familiar desde ${caseCausanteName}.`,
    share.reason,
    lineageBreakdown,
    `Su participación estimada es ${formatPercent(simulatedShare)} del neto explicado, equivalente a ${formatMoney(simulatedAmount)}.`,
    share.paymentBasis,
  ].join(' ');
};

export const buildCaseGlossary = (activeHeirNames: string[]) => {
  const { active_collateral_roots } = getSiennaCaseConfig();
  const rootsLabel = active_collateral_roots.map((root) => root.label).join(' y ');
  return [
    {
      term: 'Causante',
      text: `Persona cuyo patrimonio se distribuye. En este expediente: ${caseCausanteName}.`,
      example: `Todo el análisis parte de ${caseCausanteName} porque no hay descendencia directa registrada.`,
    },
  {
    term: 'Representación',
    text: 'Cuando un ascendiente falleció, sus hijos ocupan su lugar en la rama para recibir la cuota.',
    example: 'Domingo Ramón falleció; sus descendientes entran por representación en la rama Vincenzo/Vicente.',
  },
  {
    term: 'Estirpe',
    text: 'Rama que recibe una porción y luego la divide entre quienes están vivos y documentados.',
    example: `Las estirpes de ${rootsLabel} parten la cuota base en este caso.`,
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
    example: `${rootsLabel} son ramas colaterales activas definidas en la configuración del caso.`,
  },
  {
    term: 'Doble filiación',
    text: 'Cuando la misma persona se conecta al tronco por dos rutas familiares documentadas.',
    example: 'María Rosa y Pedro Pablo eran primos; sus descendientes pueden mostrar doble línea Sangiovanni.',
  },
  ];
};

type HeirBriefExport = {
  share: InheritanceShare;
  documents: EvidenceDocument[];
  simulatedShare: number;
  simulatedAmount: number;
  photoData?: string | null;
  traffic: EvidenceTrafficState;
};

const buildTextPreview = (document: EvidenceDocument): string[] => {
  const sourceText = (document.extracted_text || document.notes || '').trim();
  if (!sourceText) return ['Sin vista previa textual disponible.'];
  const compact = sourceText.replace(/\s+/g, ' ').slice(0, 190);
  return compact.split(/(?<=\.)\s+/).slice(0, 3);
};

const inferImageMimeType = (rawData: string): string | null => {
  const sample = rawData.trim().slice(0, 40);
  if (sample.startsWith('/9j/')) return 'image/jpeg';
  if (sample.startsWith('iVBORw0KGgo')) return 'image/png';
  if (sample.startsWith('R0lGOD')) return 'image/gif';
  if (sample.startsWith('UklGR')) return 'image/webp';
  return null;
};

const resolveImageDataUrl = (evidence: EvidenceDocument): string | null => {
  const raw = (evidence.file_data || '').trim();
  if (!raw) return null;
  if (raw.startsWith('data:image/')) return raw;
  if (raw.startsWith('data:')) return null;

  const declaredType = (evidence.file_type || '').toLowerCase().trim();
  const mimeType =
    (declaredType.startsWith('image/') ? declaredType : null) || inferImageMimeType(raw);
  if (!mimeType) return null;

  return `data:${mimeType};base64,${raw}`;
};

const isPdfDocument = (document: EvidenceDocument) =>
  (document.file_type || '').toLowerCase() === 'application/pdf' ||
  (document.file_data || '').trim().startsWith('data:application/pdf');

const resolvePdfBase64 = (document: EvidenceDocument): string | null => {
  const raw = (document.file_data || '').trim();
  if (!raw) return null;
  if (raw.startsWith('data:application/pdf')) {
    const [, base64] = raw.split(',');
    return base64 || null;
  }
  if ((document.file_type || '').toLowerCase() === 'application/pdf') {
    return raw.startsWith('data:') ? null : raw;
  }
  return null;
};

const base64ToUint8Array = (base64: string) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const renderPdfFirstPageThumbnail = async (evidence: EvidenceDocument): Promise<string | null> => {
  const base64 = resolvePdfBase64(evidence);
  if (!base64) return null;

  try {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const pdf = await pdfjs.getDocument({ data: base64ToUint8Array(base64) }).promise;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1000 / baseViewport.width, 700 / baseViewport.height, 2);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.86);
  } catch {
    return null;
  }
};

const normalizeImageForPdf = async (dataUrl: string): Promise<string | null> => {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = dataUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const ratio = Math.min(canvas.width / (img.naturalWidth || 1), canvas.height / (img.naturalHeight || 1));
    const drawW = (img.naturalWidth || canvas.width) * ratio;
    const drawH = (img.naturalHeight || canvas.height) * ratio;
    const drawX = (canvas.width - drawW) / 2;
    const drawY = (canvas.height - drawH) / 2;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    return canvas.toDataURL('image/jpeg', 0.86);
  } catch {
    return null;
  }
};

const loadImageDataUrl = async (path: string): Promise<string | null> => {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const downloadHeirBriefPdf = async (brief: HeirBriefExport, netAmount: number) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = 216;
  const pageHeight = 279;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight <= pageHeight - margin) return;
    pdf.addPage();
    y = margin;
    pdf.setFillColor(250, 246, 238);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  const startNewPage = () => {
    pdf.addPage();
    pdf.setFillColor(250, 246, 238);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    y = margin;
  };

  const writeParagraph = (text: string, options?: { size?: number; bold?: boolean; color?: [number, number, number]; lineHeight?: number }) => {
    const size = options?.size ?? 10;
    const lineHeight = options?.lineHeight ?? 4.8;
    pdf.setFont('helvetica', options?.bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    if (options?.color) {
      pdf.setTextColor(options.color[0], options.color[1], options.color[2]);
    } else {
      pdf.setTextColor(35, 35, 35);
    }
    const lines = pdf.splitTextToSize(text, contentWidth - 4);
    ensureSpace(lines.length * lineHeight + 2);
    pdf.text(lines, margin + 2, y);
    y += lines.length * lineHeight + 2;
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(11);
    pdf.setDrawColor(215, 186, 118);
    pdf.line(margin, y - 2, pageWidth - margin, y - 2);
    pdf.setFillColor(255, 253, 248);
    pdf.roundedRect(margin, y, contentWidth, 8.5, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(9, 27, 58);
    pdf.text(title.toUpperCase(), margin + 3, y + 5.4);
    y += 11.5;
  };

  const drawMetricCard = (x: number, cardTitle: string, value: string, subtitle?: string) => {
    const cardWidth = (contentWidth - 4) / 2;
    pdf.setFillColor(255, 253, 248);
    pdf.setDrawColor(226, 210, 170);
    pdf.roundedRect(x, y, cardWidth, 19, 2, 2, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(91, 82, 65);
    pdf.text(cardTitle, x + 2.5, y + 5);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(9, 27, 58);
    pdf.text(value, x + 2.5, y + 11.5);
    if (subtitle) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(111, 122, 139);
      pdf.text(subtitle, x + 2.5, y + 16.2);
    }
  };

  const drawTrafficBadge = () => {
    const palette =
      brief.traffic.level === 'green'
        ? { bg: [233, 250, 239] as [number, number, number], border: [52, 160, 100] as [number, number, number], text: [35, 112, 70] as [number, number, number] }
        : brief.traffic.level === 'amber'
          ? { bg: [255, 247, 220] as [number, number, number], border: [218, 156, 40] as [number, number, number], text: [140, 98, 26] as [number, number, number] }
          : { bg: [255, 236, 236] as [number, number, number], border: [205, 82, 82] as [number, number, number], text: [132, 48, 48] as [number, number, number] };
    const badgeText = `Semaforo: ${brief.traffic.label}`;
    const width = Math.max(38, badgeText.length * 1.75);
    const x = pageWidth - margin - width;
    pdf.setFillColor(palette.bg[0], palette.bg[1], palette.bg[2]);
    pdf.setDrawColor(palette.border[0], palette.border[1], palette.border[2]);
    pdf.roundedRect(x, y - 2, width, 7, 2, 2, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
    pdf.text(badgeText, x + 2, y + 2.6);
  };

  const drawDeceasedMarker = (x: number, markerY: number) => {
    if (!brief.share.member.death?.trim()) return;
    pdf.setFillColor(31, 31, 31);
    pdf.setDrawColor(31, 31, 31);
    pdf.circle(x + 2, markerY + 2.4, 2, 'F');
    pdf.circle(x + 6.2, markerY + 2.4, 2, 'F');
    pdf.setFillColor(31, 31, 31);
    pdf.triangle(x + 4.1, markerY + 3, x + 1.2, markerY + 10, x + 4.1, markerY + 7, 'F');
    pdf.triangle(x + 4.1, markerY + 3, x + 7, markerY + 10, x + 4.1, markerY + 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(45, 45, 45);
    pdf.text('Fallecido', x + 11, markerY + 5.2);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(105, 105, 105);
    pdf.text(`m. ${brief.share.member.death}`, x + 11, markerY + 9.2);
  };

  const getLineageRoutes = () =>
      brief.share.sourceBreakdown.length > 0
        ? brief.share.sourceBreakdown.flatMap((segment) =>
            segment.routes.map((route) => ({
              source: segment.source,
              share: segment.share,
              route,
            }))
          )
        : [
            {
              source: brief.share.sources.join(' + ') || 'Ruta sucesoral',
              share: brief.share.share,
              route: brief.share.route,
            },
          ];

  const lineageRoutes = getLineageRoutes();
  const primaryRoute = lineageRoutes[0]?.route || brief.share.route;
  const primaryRouteNodes = primaryRoute
    .split('->')
    .map((item) => item.trim())
    .filter(Boolean);
  const generationsInvolved = Math.max(1, primaryRouteNodes.length);
  const confidencePercent = brief.traffic.level === 'green' ? 95 : brief.traffic.level === 'amber' ? 72 : 45;
  const alertCount = brief.traffic.issues.length;

  const drawMiniMetricGrid = () => {
    drawSectionTitle('3. Resumen hereditario');
    const metrics = [
      ['Estado', brief.traffic.label],
      ['Participacion', formatPercent(brief.simulatedShare)],
      ['Monto heredado', formatMoney(brief.simulatedAmount)],
      ['Rutas', String(lineageRoutes.length || 1)],
      ['Generaciones', String(generationsInvolved)],
      ['Confianza', `${confidencePercent}%`],
    ];
    const columns = 3;
    const gap = 3;
    const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
    const cardHeight = 18;
    metrics.forEach(([label, value], index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = margin + col * (cardWidth + gap);
      const cardY = y + row * (cardHeight + 3);
      pdf.setFillColor(255, 253, 248);
      pdf.setDrawColor(226, 210, 170);
      pdf.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.4);
      pdf.setTextColor(91, 82, 65);
      pdf.text(label, x + 2.5, cardY + 5);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(9, 27, 58);
      pdf.text(value, x + 2.5, cardY + 12.5);
    });
    y += (cardHeight + 3) * 2 + 3;
  };

  const drawDoubleLineageAnalysis = () => {
    if (lineageRoutes.length < 2 && brief.share.sources.length < 2) return;
    drawSectionTitle('6. Analisis de doble linaje');
    const commonAncestor = primaryRouteNodes.length > 1 ? primaryRouteNodes[1] : 'Ancestro comun por documentar';
    const explanation =
      `${brief.share.member.name} presenta mas de una ruta familiar dentro del legado. El sistema detecta convergencia entre ${brief.share.sources.join(' y ') || 'las ramas documentadas'}, lo que explica la doble participacion o doble vinculacion en el caso.`;
    const rows = [
      ['Tipo de convergencia', 'Por rutas familiares documentadas'],
      ['Ancestro comun', commonAncestor],
      ['Profundidad generacional', `${generationsInvolved} generaciones`],
      ['Validacion del sistema', brief.traffic.label],
    ];
    rows.forEach(([label, value]) => {
      ensureSpace(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.2);
      pdf.setTextColor(9, 27, 58);
      pdf.text(label + ':', margin + 3, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(45, 49, 57);
      pdf.text(pdf.splitTextToSize(value, 105), margin + 48, y);
      y += 6;
    });
    writeParagraph(explanation, { size: 9, lineHeight: 4.4 });
  };

  const drawLinksTable = () => {
    drawSectionTitle('7. Tabla de vinculos');
    const rows = [
      ['Heredero', brief.share.member.name, brief.traffic.label],
      ['Rama principal', brief.share.sources[0] || 'Ruta documentada', 'Detectada'],
      brief.share.sources[1] ? ['Rama secundaria', brief.share.sources[1], 'Detectada'] : null,
      ['Ruta sucesoral', primaryRouteNodes.slice(0, 3).join(' -> ') || 'Por documentar', 'Registrada'],
    ].filter(Boolean) as string[][];
    const widths = [42, 106, 40];
    ensureSpace(10 + rows.length * 8);
    pdf.setFillColor(9, 27, 58);
    pdf.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.6);
    pdf.setTextColor(255, 255, 255);
    pdf.text('RELACION', margin + 3, y + 5.2);
    pdf.text('PERSONA / RUTA', margin + widths[0] + 3, y + 5.2);
    pdf.text('ESTADO', margin + widths[0] + widths[1] + 3, y + 5.2);
    y += 8;
    rows.forEach((row) => {
      pdf.setDrawColor(226, 210, 170);
      pdf.line(margin, y, pageWidth - margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.6);
      pdf.setTextColor(45, 49, 57);
      pdf.text(row[0], margin + 3, y + 5.2);
      pdf.text(pdf.splitTextToSize(row[1], widths[1] - 4).slice(0, 1), margin + widths[0] + 3, y + 5.2);
      pdf.text(row[2], margin + widths[0] + widths[1] + 3, y + 5.2);
      y += 8;
    });
    y += 3;
  };

  const drawFindings = () => {
    drawSectionTitle('8. Hallazgos importantes');
    const findings = brief.traffic.issues.length
      ? brief.traffic.issues
      : ['No se detectan inconsistencias criticas para este heredero.', 'Documentacion vinculada al expediente familiar.', 'Se recomienda preservar y digitalizar cualquier soporte adicional disponible.'];
    findings.forEach((finding) => writeParagraph(`- ${finding}`, { size: 9, lineHeight: 4.4 }));
  };

  const drawDocumentList = () => {
    drawSectionTitle('9. Documentos relacionados');
    if (!brief.documents.length) {
      writeParagraph('No hay documentos asociados directamente a este heredero.', { size: 9 });
      return;
    }
    brief.documents.slice(0, 8).forEach((document) => {
      const label = [
        document.title || 'Documento',
        document.document_type || null,
        document.event_date || null,
      ].filter(Boolean).join(' - ');
      writeParagraph(`- ${label}`, { size: 8.8, lineHeight: 4.2 });
    });
  };

  const drawTimeline = () => {
    drawSectionTitle('10. Timeline familiar');
    const timeline = buildMemberLifeTimeline(brief.share.member, brief.share).slice(0, 5);
    if (!timeline.length) {
      writeParagraph('No hay eventos familiares fechados para mostrar en esta ficha.', { size: 9 });
      return;
    }
    timeline.forEach((event) => {
      writeParagraph(`${event.date} · ${event.label}${event.detail ? ` — ${event.detail}` : ''}`, {
        size: 8.8,
        lineHeight: 4.2,
      });
    });
  };

  const drawSystemValidation = () => {
    drawSectionTitle('11. Validacion del sistema');
    [
      ['Fecha de calculo', new Date().toLocaleString('es-DO')],
      ['Version del motor', 'Sienna Genealogy Engine'],
      ['API utilizada', 'Sienna backend / datos reales del expediente'],
      ['Estado del analisis', brief.traffic.level === 'green' ? 'Completo y actualizado' : 'Requiere revision documental'],
    ].forEach(([label, value]) => writeParagraph(`${label}: ${value}`, { size: 8.8, lineHeight: 4.2 }));
  };

  const drawAcceptanceRelease = () => {
    drawSectionTitle('12. Descargo y aceptacion');
    writeParagraph(
      `Yo, ${brief.share.member.name}, declaro haber recibido esta ficha individual de herencia, con la explicacion de mi participacion, ruta sucesoral, soporte documental, monto estimado y validaciones disponibles dentro del expediente familiar de ${caseCausanteName}.`,
      { size: 9.1, lineHeight: 4.35 }
    );
    writeParagraph(
      'Reconozco que la informacion presentada emana del calculo vigente del backend sobre los datos reales del expediente y acepto esta constancia para fines de revision, conciliacion y documentacion familiar, sin perjuicio de correcciones documentales o validaciones legales posteriores.',
      { size: 9.1, lineHeight: 4.35 }
    );
    writeParagraph(
      `Dejo constancia de que el monto indicado es estimado sobre el neto actualmente configurado (${formatMoney(netAmount)}) y sobre mi participacion calculada (${formatPercent(brief.simulatedShare)}).`,
      { size: 9.1, lineHeight: 4.35 }
    );

    ensureSpace(31);
    pdf.setFillColor(255, 253, 248);
    pdf.setDrawColor(218, 190, 129);
    pdf.roundedRect(margin, y, contentWidth, 28, 2, 2, 'FD');
    const lineY = y + 16;
    const columnWidth = (contentWidth - 18) / 2;
    pdf.setDrawColor(120, 128, 145);
    pdf.line(margin + 7, lineY, margin + 7 + columnWidth, lineY);
    pdf.line(margin + 11 + columnWidth, lineY, margin + 11 + columnWidth * 2, lineY);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.8);
    pdf.setTextColor(9, 27, 58);
    pdf.text('Firma del heredero / receptor', margin + 7, lineY + 5.5);
    pdf.text('Fecha', margin + 11 + columnWidth, lineY + 5.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.4);
    pdf.setTextColor(95, 108, 126);
    pdf.text('Documento de descargo y aceptacion para expediente familiar interno.', margin + 7, y + 25);
    y += 32;
  };

  const drawRouteTreeCopy = () => {

    drawSectionTitle(
      lineageRoutes.length > 1
        ? '5. Rutas genealogicas'
        : '5. Ruta genealogica'
    );

    lineageRoutes.forEach((lineage, lineageIndex) => {
      const nodes = lineage.route
        .split('->')
        .map((item) => item.trim())
        .filter(Boolean);
      const routeNodes = nodes.length > 0 ? nodes : [brief.share.member.name];

      ensureSpace(13);
      pdf.setFillColor(245, 248, 252);
      pdf.setDrawColor(194, 210, 230);
      pdf.roundedRect(margin + 4, y, contentWidth - 8, 9, 2, 2, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(26, 62, 108);
      pdf.text(lineage.source + ' - ' + formatPercent(lineage.share), margin + 7, y + 5.8);
      y += 12;

      routeNodes.forEach((step, index) => {
        ensureSpace(16);
        const nodeWidth = contentWidth - 22;
        const nodeX = margin + 12;
        pdf.setFillColor(250, 251, 253);
        pdf.setDrawColor(214, 224, 238);
        pdf.roundedRect(nodeX, y, nodeWidth, 9, 2, 2, 'FD');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(33, 58, 96);
        const text = pdf.splitTextToSize(step, nodeWidth - 5);
        pdf.text(text, nodeX + 2.5, y + 5.8);

        if (index < routeNodes.length - 1) {
          const centerX = nodeX + nodeWidth / 2;
          pdf.setDrawColor(179, 194, 214);
          pdf.line(centerX, y + 9.2, centerX, y + 12.2);
          pdf.setFillColor(179, 194, 214);
          pdf.triangle(centerX - 1.3, y + 12.2, centerX + 1.3, y + 12.2, centerX, y + 13.6, 'F');
        }
        y += 14;
      });

      if (lineageIndex < lineageRoutes.length - 1) {
        y += 3;
      }
    });
  };

  const drawDocumentMosaic = async () => {
    drawSectionTitle('Documentos de soporte (mosaico)');
    if (!brief.documents.length) {
      writeParagraph('Sin documentos asociados directamente en el expediente.', { size: 10 });
      return;
    }

    const columns = 2;
    const gap = 4;
    const cardWidth = (contentWidth - gap) / columns;
    const cardHeight = 54;
    let column = 0;

    for (const document of brief.documents) {
      if (column === 0) {
        ensureSpace(cardHeight + 4);
      }
      const x = margin + column * (cardWidth + gap);
      const cardY = y;

      pdf.setFillColor(251, 252, 253);
      pdf.setDrawColor(224, 231, 242);
      pdf.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');

      const previewX = x + 2;
      const previewY = cardY + 2;
      const previewW = cardWidth - 4;
      const previewH = 31;
      pdf.setFillColor(241, 245, 251);
      pdf.setDrawColor(216, 225, 237);
      pdf.roundedRect(previewX, previewY, previewW, previewH, 1.5, 1.5, 'FD');

      const isPdf = isPdfDocument(document);
      const resolvedImageDataUrl = resolveImageDataUrl(document);
      const normalizedImage = resolvedImageDataUrl
        ? await normalizeImageForPdf(resolvedImageDataUrl)
        : null;
      const pdfThumbnail = !normalizedImage && isPdf
        ? await renderPdfFirstPageThumbnail(document)
        : null;

      if (normalizedImage || pdfThumbnail) {
        try {
          pdf.addImage(normalizedImage || pdfThumbnail || '', 'JPEG', previewX + 0.8, previewY + 0.8, previewW - 1.6, previewH - 1.6);
        } catch {
          const fallbackLines = buildTextPreview(document);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor(96, 108, 126);
          const lines = pdf.splitTextToSize(fallbackLines.join(' '), previewW - 4);
          pdf.text(lines.slice(0, 3), previewX + 2, previewY + 8);
        }
      } else {
        if (isPdf) {
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(200, 65, 65);
          pdf.roundedRect(previewX + 3, previewY + 4, 18, 22, 1.5, 1.5, 'FD');
          pdf.setFillColor(200, 65, 65);
          pdf.roundedRect(previewX + 5, previewY + 15, 14, 6, 1, 1, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(6.8);
          pdf.setTextColor(255, 255, 255);
          pdf.text('PDF', previewX + 7.1, previewY + 19.2);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.2);
          pdf.setTextColor(57, 73, 97);
          pdf.text('PDF adjunto al expediente', previewX + 25, previewY + 8);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.2);
          pdf.setTextColor(95, 108, 126);
          const pdfPreview = [
            document.file_name ? `Archivo: ${document.file_name}` : null,
            ...buildTextPreview(document),
          ]
            .filter(Boolean)
            .join(' ');
          const lines = pdf.splitTextToSize(pdfPreview, previewW - 29);
          pdf.text(lines.slice(0, 3), previewX + 25, previewY + 14);
        } else {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(57, 73, 97);
          pdf.text('Vista resumida', previewX + 2, previewY + 7);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor(95, 108, 126);
          const lines = pdf.splitTextToSize(buildTextPreview(document).join(' '), previewW - 4);
          pdf.text(lines.slice(0, 3), previewX + 2, previewY + 13);
        }
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(35, 63, 103);
      const titleLines = pdf.splitTextToSize(document.title || 'Documento', cardWidth - 4);
      pdf.text(titleLines.slice(0, 2), x + 2, cardY + 38);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(102, 114, 130);
      const meta = `${document.document_type || 'Documento'}${document.event_date ? ` · ${document.event_date}` : ''}`;
      const metaLines = pdf.splitTextToSize(meta, cardWidth - 4);
      pdf.text(metaLines.slice(0, 2), x + 2, cardY + 47);

      column += 1;
      if (column >= columns) {
        column = 0;
        y += cardHeight + 4;
      }
    }

    if (column !== 0) {
      y += cardHeight + 4;
    }
  };

  pdf.setFillColor(250, 246, 238);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  const logoData = await loadImageDataUrl('/legado-sangiovanni-logo-transparent.png');
  if (logoData) {
    try {
      pdf.addImage(logoData, 'PNG', margin + 4, 8, 48, 32);
    } catch {
      // omitir logo incompatible
    }
  }

  pdf.setFont('times', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(9, 27, 58);
  pdf.text('DESCARGO Y ACEPTACION', margin + 64, 19);
  pdf.text('INDIVIDUAL DE HERENCIA', margin + 64, 29);
  pdf.setDrawColor(196, 157, 73);
  pdf.line(margin + 64, 34, margin + 122, 34);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(61, 65, 72);
  pdf.text('Constancia familiar generada para el Legado Sangiovanni', margin + 64, 40);
  pdf.text('Explicacion, validacion, descargo y aceptacion individual del heredero.', margin + 64, 45);

  pdf.setFontSize(7.5);
  pdf.setTextColor(85, 88, 95);
  pdf.text(`Generado: ${new Date().toLocaleString('es-DO')}`, pageWidth - margin - 49, 12);

  y = 54;
  pdf.setFillColor(255, 253, 248);
  pdf.setDrawColor(218, 190, 129);
  pdf.roundedRect(margin, y, contentWidth, 34, 2.5, 2.5, 'FD');

  const avatarX = margin + 5;
  const avatarY = y + 6;
  pdf.setFillColor(9, 27, 58);
  pdf.setDrawColor(196, 157, 73);
  pdf.circle(avatarX + 11, avatarY + 11, 11, 'FD');
  if (brief.photoData?.startsWith('data:image')) {
    try {
      const format = brief.photoData.includes('image/png') ? 'PNG' : 'JPEG';
      pdf.addImage(brief.photoData, format, avatarX, avatarY, 22, 22);
    } catch {
      pdf.setFont('times', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(212, 175, 55);
      pdf.text(brief.share.member.name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase(), avatarX + 5, avatarY + 14);
    }
  } else {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(212, 175, 55);
    pdf.text(brief.share.member.name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase(), avatarX + 5, avatarY + 14);
  }

  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(9, 27, 58);
  const nameLines = pdf.splitTextToSize(brief.share.member.name.toUpperCase(), 80);
  pdf.text(nameLines.slice(0, 2), margin + 32, y + 12);
  drawDeceasedMarker(margin + 32, y + 21);

  const badgeY = y + 22;
  const badges = [
    'HEREDERO FINAL',
    brief.share.sources.length > 1 ? 'DOBLE LINAJE' : brief.share.sources[0] || 'RUTA DOCUMENTADA',
    brief.traffic.label.toUpperCase(),
  ];
  let badgeX = margin + 32;
  badges.forEach((badge, index) => {
    const width = Math.max(20, badge.length * 1.7);
    pdf.setFillColor(index === 1 ? 28 : index === 2 ? 38 : 155, index === 1 ? 105 : index === 2 ? 74 : 118, index === 1 ? 88 : index === 2 ? 125 : 45);
    pdf.roundedRect(badgeX, badgeY, width, 5.5, 0.8, 0.8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(badge, badgeX + 1.8, badgeY + 3.8);
    badgeX += width + 2;
  });

  pdf.setDrawColor(218, 190, 129);
  pdf.line(pageWidth - margin - 84, y + 5, pageWidth - margin - 84, y + 29);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(9, 27, 58);
  pdf.text('Fecha de generacion:', pageWidth - margin - 78, y + 9);
  pdf.text('Nivel de validacion:', pageWidth - margin - 78, y + 17);
  pdf.text('Monto heredado estimado:', pageWidth - margin - 78, y + 25);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(45, 49, 57);
  pdf.text(new Date().toLocaleDateString('es-DO'), pageWidth - margin - 25, y + 9);
  pdf.text(brief.traffic.label, pageWidth - margin - 25, y + 17);
  pdf.text(formatMoney(brief.simulatedAmount), pageWidth - margin - 25, y + 25);

  y += 43;

  drawSectionTitle('2. Resumen ejecutivo');
  writeParagraph(
    `Este documento presenta el analisis genealogico y hereditario correspondiente a ${brief.share.member.name}, incluyendo sus rutas familiares, vinculos de herencia, validaciones y hallazgos detectados dentro del caso Alessandro de Paola Sangiovanni.`,
    { size: 9.5, lineHeight: 4.6 }
  );

  drawMiniMetricGrid();

  const cardsY = y;
  drawMetricCard(margin, 'Participacion detectada', formatPercent(brief.simulatedShare), `Ramas: ${brief.share.sources.join(' + ') || 'N/A'}`);
  drawMetricCard(margin + ((contentWidth - 4) / 2) + 4, 'Monto heredado estimado', formatMoney(brief.simulatedAmount), `Neto usado: ${formatMoney(netAmount)}`);
  y = cardsY + 24;

  drawSectionTitle('4. Por que aparece esta persona en la herencia');
  writeParagraph(buildWhyIInheritText(brief.share, brief.simulatedShare, brief.simulatedAmount), {
    size: 10,
    lineHeight: 4.9,
  });

  startNewPage();
  drawRouteTreeCopy();

  drawDoubleLineageAnalysis();

  drawLinksTable();

  drawFindings();

  startNewPage();
  drawDocumentList();

  await drawDocumentMosaic();

  drawTimeline();

  drawSystemValidation();

  drawAcceptanceRelease();

  pdf.setFillColor(9, 27, 58);
  pdf.rect(0, pageHeight - 11, pageWidth, 11, 'F');
  pdf.setFont('times', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(212, 175, 55);
  pdf.text('EL LEGADO SANGIOVANNI', margin, pageHeight - 4.2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 253, 248);
  pdf.text('Raices que nos unen. Legado que trasciende.', pageWidth - margin - 61, pageHeight - 4.2);

  const safeName = brief.share.member.name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  pdf.save(`ficha-sienna-${safeName || 'heredero'}.pdf`);
};

export const heirPhotoByName = (heirs: ConfirmedHeir[]) =>
  new Map(heirs.map((heir) => [normalizeName(heir.heir_name), heir]));
