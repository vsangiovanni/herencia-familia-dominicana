import jsPDF from 'jspdf';
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
    ensureSpace(10);
    pdf.setFillColor(242, 246, 252);
    pdf.roundedRect(margin, y - 1.5, contentWidth, 8, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(26, 62, 108);
    pdf.text(title, margin + 3, y + 3.5);
    y += 10;
  };

  const drawMetricCard = (x: number, cardTitle: string, value: string, subtitle?: string) => {
    const cardWidth = (contentWidth - 4) / 2;
    pdf.setFillColor(249, 250, 252);
    pdf.setDrawColor(224, 231, 242);
    pdf.roundedRect(x, y, cardWidth, 19, 2, 2, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(99, 112, 130);
    pdf.text(cardTitle, x + 2.5, y + 5);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(28, 70, 122);
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

  const drawRouteTreeCopy = () => {
    const lineageRoutes =
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

    drawSectionTitle(
      lineageRoutes.length > 1
        ? 'Copia del arbol Sienna (rutas de doble linaje)'
        : 'Copia del arbol Sienna (ruta del heredero)'
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

      const resolvedImageDataUrl = resolveImageDataUrl(document);
      const normalizedImage = resolvedImageDataUrl
        ? await normalizeImageForPdf(resolvedImageDataUrl)
        : null;

      if (normalizedImage) {
        try {
          pdf.addImage(normalizedImage, 'JPEG', previewX + 0.8, previewY + 0.8, previewW - 1.6, previewH - 1.6);
        } catch {
          const fallbackLines = buildTextPreview(document);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor(96, 108, 126);
          const lines = pdf.splitTextToSize(fallbackLines.join(' '), previewW - 4);
          pdf.text(lines.slice(0, 3), previewX + 2, previewY + 8);
        }
      } else {
        const isPdf = (document.file_type || '').toLowerCase() === 'application/pdf' || (document.file_data || '').startsWith('data:application/pdf');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(57, 73, 97);
        const previewHeader = isPdf ? 'PDF - Vista resumida' : 'Vista resumida';
        pdf.text(previewHeader, previewX + 2, previewY + 7);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(95, 108, 126);
        const lines = pdf.splitTextToSize(buildTextPreview(document).join(' '), previewW - 4);
        pdf.text(lines.slice(0, 3), previewX + 2, previewY + 13);
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

  // Encabezado moderno
  pdf.setFillColor(24, 61, 109);
  pdf.rect(0, 0, pageWidth, 27, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('HerenciaRD · Informe de Explicacion Sucesoral', margin, 11);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Salida oficial para entrega al heredero', margin, 17);
  pdf.text(`Fecha: ${new Date().toLocaleString('es-DO')}`, margin, 22);

  y = 32;
  drawTrafficBadge();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(29, 64, 106);
  pdf.text(brief.share.member.name, margin, y + 2);
  drawDeceasedMarker(pageWidth - margin - 48, y - 3);
  y += 8;

  if (brief.photoData?.startsWith('data:image')) {
    ensureSpace(33);
    try {
      const format = brief.photoData.includes('image/png') ? 'PNG' : 'JPEG';
      pdf.addImage(brief.photoData, format, margin, y, 24, 24);
    } catch {
      // omitir imagen incompatible
    }
  }

  const cardsY = y;
  const cardsX = margin + 28;
  drawMetricCard(cardsX, 'Participacion estimada', formatPercent(brief.simulatedShare), `Ramas: ${brief.share.sources.join(' + ') || 'N/A'}`);
  drawMetricCard(cardsX + ((contentWidth - 4) / 2) + 4, 'Monto estimado', formatMoney(brief.simulatedAmount), `Neto usado: ${formatMoney(netAmount)}`);
  y = cardsY + 22;

  drawSectionTitle('Por que heredo');
  writeParagraph(buildWhyIInheritText(brief.share, brief.simulatedShare, brief.simulatedAmount), {
    size: 10,
    lineHeight: 4.9,
  });

  drawRouteTreeCopy();

  await drawDocumentMosaic();

  if (brief.traffic.issues.length) {
    drawSectionTitle('Observaciones');
    brief.traffic.issues.forEach((issue) =>
      writeParagraph(`- ${issue}`, { size: 9.5, color: [125, 52, 52], lineHeight: 4.6 })
    );
  }

  ensureSpace(12);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.setTextColor(124, 132, 143);
  pdf.text(
    'Documento generado por HerenciaRD. Este informe resume la explicacion del reparto segun la configuracion activa del expediente.',
    margin,
    pageHeight - margin
  );

  const safeName = brief.share.member.name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  pdf.save(`ficha-sienna-${safeName || 'heredero'}.pdf`);
};

export const heirPhotoByName = (heirs: ConfirmedHeir[]) =>
  new Map(heirs.map((heir) => [normalizeName(heir.heir_name), heir]));
