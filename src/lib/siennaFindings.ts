import {
  ConfirmedHeir,
  EvidenceDocument,
  FamilyUnion,
  MemberParentLink,
  SiennaFamilyMember,
} from '@/lib/api';
import { buildDominicanInheritancePlan, normalizeName } from '@/lib/dominicanInheritance';
import { countGenealogyInconsistencies, getDescendantsForRepresentation, getParentLinksForChild, SiennaGenealogyBundle } from '@/lib/siennaGenealogy';

export type FindingCategory = 'genealogia' | 'calculo' | 'expediente';
export type FindingSeverity = 'Alta prioridad' | 'Media prioridad' | 'Baja prioridad';

export type FindingFixType =
  | 'sync_parent_link'
  | 'link_spouse'
  | 'edit_member'
  | 'navigate';

export type FindingFixAction = {
  id: string;
  label: string;
  type: FindingFixType;
  memberId?: string;
  spouseMemberId?: string;
  href?: string;
};

export type SiennaFinding = {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  issue: string;
  detail: string;
  suggestion: string;
  relatedMemberIds?: string[];
  fixActions?: FindingFixAction[];
};

export type SiennaFindingsInput = {
  members: SiennaFamilyMember[];
  unions: FamilyUnion[];
  parentLinks: MemberParentLink[];
  heirs: ConfirmedHeir[];
  documents: EvidenceDocument[];
};

const isChildMember = (member: SiennaFamilyMember) => {
  const relationship = member.relationship_to_parent;
  if (relationship === 'hijo' || relationship === 'hija') return true;
  return relationship == null || relationship === '';
};

export const resolveChildRelationship = (member: SiennaFamilyMember): 'hijo' | 'hija' | null => {
  if (member.relationship_to_parent === 'hijo' || member.relationship_to_parent === 'hija') {
    return member.relationship_to_parent;
  }
  if (!member.parent_id) return null;
  return 'hijo';
};

const isDeceased = (member: SiennaFamilyMember) => Boolean(member.death?.trim());

const matchMemberBySpouseText = (spouseText: string, members: SiennaFamilyMember[], excludeId: string) => {
  const key = normalizeName(spouseText);
  if (!key) return null;
  return (
    members.find(
      (member) => member.id !== excludeId && normalizeName(member.name) === key
    ) || null
  );
};

export const inferFiliationForChild = (
  _child: SiennaFamilyMember,
  _members: SiennaFamilyMember[],
  _unions: FamilyUnion[]
) => {
  // La filiación de cada hijo es independiente: no heredar union_id ni segundo progenitor
  // del spouse_member_id del padre/madre en el árbol.
  return {
    union_id: null,
    second_parent_id: null,
  };
};

export const buildMemberSavePayload = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[],
  unions: FamilyUnion[],
  overrides: {
    spouse_member_id?: string | null;
    filiation?: { union_id?: string | null; second_parent_id?: string | null };
  } = {}
) => {
  const resolvedFiliation =
    overrides.filiation !== undefined
      ? overrides.filiation
      : member.parent_id && isChildMember(member)
        ? inferFiliationForChild(member, members, unions)
        : undefined;

  const spouseMemberId =
    overrides.spouse_member_id !== undefined ? overrides.spouse_member_id : member.spouse_member_id;
  const spouseMember = spouseMemberId ? members.find((item) => item.id === spouseMemberId) : null;
  const childRelationship = resolveChildRelationship(member);

  return {
    id: member.id,
    parent_id: member.parent_id,
    relationship_to_parent: childRelationship ?? member.relationship_to_parent ?? null,
    name: member.name,
    birth: member.birth,
    death: member.death,
    spouse_member_id: spouseMemberId,
    spouse: spouseMember?.name || member.spouse,
    spouse_birth: member.spouse_birth,
    inheritance_status: member.inheritance_status,
    inheritance_reason: member.inheritance_reason,
    is_highlighted_ancestor: member.is_highlighted_ancestor,
    sort_order: member.sort_order ?? 0,
    filiation:
      member.parent_id && isChildMember(member) && resolvedFiliation !== undefined
        ? {
            union_id: resolvedFiliation?.union_id ?? null,
            second_parent_id: resolvedFiliation?.second_parent_id ?? null,
          }
        : undefined,
  };
};

export const buildSiennaFindings = ({
  members,
  unions,
  parentLinks,
  heirs,
  documents,
}: SiennaFindingsInput): SiennaFinding[] => {
  const items: SiennaFinding[] = [];
  const genealogy: SiennaGenealogyBundle = { unions, parent_links: parentLinks };
  const membersById = new Map(members.map((member) => [member.id, member]));
  const membersByName = new Map<string, SiennaFamilyMember[]>();

  members.forEach((member) => {
    const key = normalizeName(member.name);
    const list = membersByName.get(key) || [];
    list.push(member);
    membersByName.set(key, list);
  });

  const plan = buildDominicanInheritancePlan(members, genealogy);
  const distributed = plan.activeHeirs.reduce((sum, share) => sum + share.share, 0);
  const undistributed = Math.max(0, 100 - distributed);

  if (undistributed > 0.05) {
    items.push({
      id: 'calculo-undistributed',
      category: 'calculo',
      severity: 'Alta prioridad',
      title: 'Cuota sucesoral sin asignar',
      issue: 'El cálculo por filiación no llega al 100% del caudal simulado.',
      detail: `Solo se distribuye ${distributed.toFixed(2)}%. Quedan ${undistributed.toFixed(2)}% sin heredero vivo registrado en alguna rama (nodos fallecidos sin descendencia documentada).`,
      suggestion:
        'Revise ramas cortadas: agregue descendientes faltantes o corrija fechas de defunción y parentescos en el árbol.',
      fixActions: [
        {
          id: 'calculo-undistributed-open',
          label: 'Ver cálculo por filiación',
          type: 'navigate',
          href: '/calculo-filiacion',
        },
      ],
    });
  }

  const genealogyIssues = countGenealogyInconsistencies(genealogy);
  if (genealogyIssues > 0) {
    items.push({
      id: 'genealogy-inconsistent-unions',
      category: 'genealogia',
      severity: 'Alta prioridad',
      title: 'Vínculos de filiación inconsistentes',
      issue: 'Hay uniones o vínculos parentales que afectan el reparto y requieren corrección.',
      detail: `${genealogyIssues} registro(s) inconsistente(s) vinculado(s) a hijos o filiación formal.`,
      suggestion: 'Revise Hallazgos o Miembros del árbol para corregir vínculos de hijos y uniones usadas en filiación.',
      fixActions: [
        {
          id: 'genealogy-unions-guide',
          label: 'Ir a Hallazgos',
          type: 'navigate',
          href: '/hallazgos',
        },
      ],
    });
  }

  const childrenMissingLinks = members.filter(
    (member) =>
      isChildMember(member) &&
      Boolean(member.parent_id) &&
      (member.relationship_to_parent === 'hijo' || member.relationship_to_parent === 'hija') &&
      !parentLinks.some((link) => link.child_member_id === member.id)
  );

  childrenMissingLinks.forEach((child) => {
    const parent = child.parent_id ? membersById.get(child.parent_id) : null;
    items.push({
      id: `genealogy-missing-link-${child.id}`,
      category: 'genealogia',
      severity: 'Alta prioridad',
      title: `Filiación sin vínculo formal: ${child.name}`,
      issue: 'El hijo cuelga del árbol visual pero no tiene fila en member_parent_links.',
      detail: parent
        ? `Superior en árbol: ${parent.name}. Sin este vínculo, el cálculo y la filiación pueden quedar incompletos.`
        : 'Tiene parentesco hijo/hija pero falta el vínculo de filiación en base de datos.',
      suggestion: 'Sincronice el vínculo desde el árbol o complete bloque dorado en la ficha del hijo.',
      relatedMemberIds: [child.id, ...(parent ? [parent.id] : [])],
      fixActions: [
        {
          id: `fix-sync-link-${child.id}`,
          label: 'Sincronizar vínculo',
          type: 'sync_parent_link',
          memberId: child.id,
        },
        {
          id: `edit-sync-link-${child.id}`,
          label: 'Editar en Miembros',
          type: 'edit_member',
          memberId: child.id,
        },
      ],
    });
  });

  const deceasedWithoutDescendants = members.filter((member) => {
    if (!isDeceased(member)) return false;
    const descendants = getDescendantsForRepresentation(member, members, genealogy);
    return descendants.length === 0;
  });

  const branchDeadEnds = deceasedWithoutDescendants.filter(
    (member) =>
      members.some((candidate) => candidate.parent_id === member.id) ||
      parentLinks.some((link) => link.parent_member_id === member.id)
  );

  if (branchDeadEnds.length) {
    const sample = branchDeadEnds
      .slice(0, 5)
      .map((member) => member.name)
      .join(', ');
    items.push({
      id: 'calculo-dead-branches',
      category: 'calculo',
      severity: 'Media prioridad',
      title: 'Ramas cortadas (fallecidos sin descendencia)',
      issue: 'Hay intermedios fallecidos sin hijos registrados que cortan la representación sucesoria.',
      detail: `${branchDeadEnds.length} miembro(s) fallecido(s) sin descendientes en el árbol. Ejemplos: ${sample}${branchDeadEnds.length > 5 ? '…' : ''}.`,
      suggestion: 'Agregue hijos faltantes o verifique si la rama debe continuar por representación.',
      fixActions: branchDeadEnds.slice(0, 8).map((member) => ({
        id: `edit-dead-branch-${member.id}`,
        label: `Revisar ${member.name}`,
        type: 'edit_member' as const,
        memberId: member.id,
      })),
    });
  }

  const dualLineHeirs = heirs.filter((heir) => heir.line_vincenzo && heir.line_paolo);
  if (dualLineHeirs.length) {
    items.push({
      id: 'expediente-dual-line',
      category: 'expediente',
      severity: 'Media prioridad',
      title: 'Herederos con doble línea familiar',
      issue: 'Concurrencia Vincenzo/Vicente y Paolo/Paulino requiere narrativa y soporte documental claro.',
      detail: `${dualLineHeirs.length} heredero(s) con doble línea. Ejemplos: ${dualLineHeirs
        .slice(0, 3)
        .map((heir) => heir.heir_name)
        .join(', ')}.`,
      suggestion: 'Valide rutas en Cálculo por filiación y documentación probatoria por rama.',
      fixActions: [
        { id: 'dual-line-calculo', label: 'Ver cálculo', type: 'navigate', href: '/calculo-filiacion' },
        { id: 'dual-line-arbol', label: 'Ver árbol Sienna', type: 'navigate', href: '/sienna/arbol-genealogico' },
      ],
    });
  }

  const duplicatedNames = Array.from(membersByName.entries()).filter(([, list]) => list.length > 1);
  if (duplicatedNames.length) {
    items.push({
      id: 'expediente-duplicated-names',
      category: 'expediente',
      severity: 'Media prioridad',
      title: 'Nombres repetidos en el árbol',
      issue: 'Personas homónimas pueden confundir vínculos y documentos.',
      detail: `${duplicatedNames.length} nombre(s) duplicado(s) en miembros.`,
      suggestion: 'Use fechas, padres o rama en las fichas para distinguirlos.',
      fixActions: duplicatedNames[0][1].slice(0, 2).map((member) => ({
        id: `edit-dup-${member.id}`,
        label: `Editar ${member.name}`,
        type: 'edit_member' as const,
        memberId: member.id,
      })),
    });
  }

  const heirsWithoutEvidence = heirs.filter((heir) => {
    const memberId = heir.sienna_member_id?.trim();
    if (!memberId) return true;
    return !documents.some((document) => document.related_member_id === memberId);
  });
  if (heirsWithoutEvidence.length) {
    items.push({
      id: 'expediente-heirs-no-docs',
      category: 'expediente',
      severity: 'Alta prioridad',
      title: 'Herederos sin soporte documental',
      issue: 'Herederos sin documentos vinculados por miembro titular.',
      detail: `${heirsWithoutEvidence.length} heredero(s) sin evidencia asociada.`,
      suggestion: 'Cargue actas en Documentos probatorios y asigne miembro titular.',
      fixActions: [
        {
          id: 'heirs-docs-nav',
          label: 'Ir a Documentos probatorios',
          type: 'navigate',
          href: '/documentos-probatorios',
        },
      ],
    });
  }

  const documentsWithoutMember = documents.filter((document) => !document.related_member_id);
  if (documentsWithoutMember.length) {
    items.push({
      id: 'expediente-orphan-docs',
      category: 'expediente',
      severity: 'Media prioridad',
      title: 'Documentos sin miembro titular',
      issue: 'Documentos huérfanos reducen trazabilidad probatoria.',
      detail: `${documentsWithoutMember.length} documento(s) sin miembro titular.`,
      suggestion: 'Asigne titular en Documentos probatorios.',
      fixActions: [
        {
          id: 'orphan-docs-nav',
          label: 'Corregir documentos',
          type: 'navigate',
          href: '/documentos-probatorios',
        },
      ],
    });
  }

  if (!items.length) {
    items.push({
      id: 'all-clear',
      category: 'expediente',
      severity: 'Baja prioridad',
      title: 'Sin hallazgos críticos activos',
      issue: 'Genealogía, cálculo y expediente están alineados según las reglas evaluadas.',
      detail: 'Mantenga revisión al cargar miembros o documentos nuevos.',
      suggestion: 'Use esta pantalla periódicamente después de editar el árbol.',
    });
  }

  return items.sort((left, right) => {
    const severityRank = (value: FindingSeverity) =>
      value === 'Alta prioridad' ? 0 : value === 'Media prioridad' ? 1 : 2;
    const severityDelta = severityRank(left.severity) - severityRank(right.severity);
    if (severityDelta !== 0) return severityDelta;
    return left.title.localeCompare(right.title, 'es');
  });
};

export const countAutoFixableFindings = (findings: SiennaFinding[]) =>
  findings.filter((finding) =>
    finding.fixActions?.some(
      (action) => action.type === 'sync_parent_link' || action.type === 'link_spouse'
    )
  ).length;

export const listBulkParentLinkSyncTargets = (
  members: SiennaFamilyMember[],
  parentLinks: MemberParentLink[]
) =>
  members.filter(
    (member) =>
      isChildMember(member) &&
      Boolean(member.parent_id) &&
      (member.relationship_to_parent === 'hijo' || member.relationship_to_parent === 'hija') &&
      !getParentLinksForChild(member.id, parentLinks).length
  );
