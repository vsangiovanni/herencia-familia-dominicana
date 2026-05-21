import { FamilyUnion, MemberParentLink, SiennaFamilyMember } from '@/lib/api';
import { normalizeName } from '@/lib/dominicanInheritance';
import {
  formatUnionLabel,
  getDescendantsForRepresentation,
  getParentLinksForChild,
  getUnionsForMember,
  resolveSpousePartner,
  SiennaGenealogyBundle,
} from '@/lib/siennaGenealogy';

export type MemberIssueKind =
  | 'link_spouse'
  | 'sync_parent_link'
  | 'complete_filiation'
  | 'dead_branch';

export type FindingSeverity = 'Alta prioridad' | 'Media prioridad' | 'Baja prioridad';

export type MemberIssueRow = {
  id: string;
  memberId: string;
  memberName: string;
  kind: MemberIssueKind;
  severity: FindingSeverity;
  problem: string;
  solution: string;
  context?: string;
  defaults: {
    spouseMemberId: string;
    filiationUnionId: string;
    secondParentId: string;
  };
  spouseOptions: Array<{ id: string; name: string; suggested?: boolean }>;
  unionOptions: Array<{ id: string; label: string }>;
  secondParentOptions: Array<{ id: string; name: string }>;
};

export type MemberIssuesSummary = {
  undistributedPercent: number;
  distributedPercent: number;
  totalIssues: number;
  membersAffected: number;
  byKind: Record<MemberIssueKind, number>;
};

const isChildMember = (member: SiennaFamilyMember) =>
  member.relationship_to_parent === 'hijo' || member.relationship_to_parent === 'hija';

const isDeceased = (member: SiennaFamilyMember) => Boolean(member.death?.trim());

const matchMemberByName = (name: string, members: SiennaFamilyMember[], excludeId: string) => {
  const key = normalizeName(name);
  if (!key) return null;
  return members.find((member) => member.id !== excludeId && normalizeName(member.name) === key) || null;
};

export const buildSpouseOptions = (member: SiennaFamilyMember, members: SiennaFamilyMember[]) => {
  const spouseText = member.spouse?.trim();
  const matched = spouseText ? matchMemberByName(spouseText, members, member.id) : null;

  return members
    .filter((candidate) => candidate.id !== member.id)
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      suggested: matched?.id === candidate.id,
    }))
    .sort((left, right) => {
      if (left.suggested !== right.suggested) return left.suggested ? -1 : 1;
      return left.name.localeCompare(right.name, 'es');
    });
};

export const buildUnionOptionsForParent = (
  parentId: string,
  unions: FamilyUnion[],
  membersById: Map<string, SiennaFamilyMember>
) =>
  getUnionsForMember(parentId, unions).map((union) => ({
    id: union.id,
    label: `${formatUnionLabel(union, membersById)}${union.is_inconsistent ? ' (inconsistente)' : ''}`,
  }));

export const buildSecondParentOptions = (
  parentId: string,
  unionId: string | null,
  members: SiennaFamilyMember[],
  unions: FamilyUnion[]
) => {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const parent = membersById.get(parentId);
  if (!parent) return [];

  const options = new Map<string, string>();

  if (unionId) {
    const union = unions.find((item) => item.id === unionId);
    if (union) {
      const otherId =
        union.partner_a_member_id === parentId ? union.partner_b_member_id : union.partner_a_member_id;
      if (otherId && membersById.get(otherId)) {
        options.set(otherId, membersById.get(otherId)!.name);
      }
    }
  }

  if (parent.spouse_member_id && membersById.get(parent.spouse_member_id)) {
    options.set(parent.spouse_member_id, membersById.get(parent.spouse_member_id)!.name);
  }

  const partner = resolveSpousePartner(parent, members, { unions, parent_links: [] }, 'suggestions');
  if (partner) options.set(partner.id, partner.name);

  return Array.from(options.entries()).map(([id, name]) => ({ id, name }));
};

export const buildMemberIssueRows = (
  members: SiennaFamilyMember[],
  unions: FamilyUnion[],
  parentLinks: MemberParentLink[],
  distributedPercent: number
): { rows: MemberIssueRow[]; summary: MemberIssuesSummary } => {
  const rows: MemberIssueRow[] = [];
  const genealogy: SiennaGenealogyBundle = { unions, parent_links: parentLinks };
  const membersById = new Map(members.map((member) => [member.id, member]));

  members.forEach((member) => {
    if (member.spouse_member_id) return;

    const hasInconsistentUnion = unions.some(
      (union) =>
        union.is_inconsistent &&
        (union.partner_a_member_id === member.id || union.partner_b_member_id === member.id)
    );

    // Cónyuge solo en texto (sin ID) es referencia documental; no bloquea el reparto sucesoral.
    if (!hasInconsistentUnion) return;

    const spouseText = member.spouse?.trim();
    const matched = spouseText ? matchMemberByName(spouseText, members, member.id) : null;
    const spouseOptions = buildSpouseOptions(member, members);

    rows.push({
      id: `link-spouse-${member.id}`,
      memberId: member.id,
      memberName: member.name,
      kind: 'link_spouse',
      severity: 'Alta prioridad',
      problem: spouseText
        ? 'Unión matrimonial inconsistente: el cónyuge debe enlazarse como miembro del árbol.'
        : 'Unión matrimonial inconsistente: falta enlazar el cónyuge como miembro.',
      solution:
        'Seleccione el cónyuge correcto del árbol y guarde. Esto corrige la unión usada para filiación de hijos.',
      context: spouseText ? `Texto de referencia: «${spouseText}»` : 'Unión marcada inconsistente en base de datos.',
      defaults: {
        spouseMemberId: matched?.id || '',
        filiationUnionId: '',
        secondParentId: '',
      },
      spouseOptions,
      unionOptions: [],
      secondParentOptions: [],
    });
  });

  members.forEach((child) => {
    if (!isChildMember(child) || !child.parent_id) return;
    if (getParentLinksForChild(child.id, parentLinks).length > 0) return;

    const parent = membersById.get(child.parent_id);
    const unionOptions = parent ? buildUnionOptionsForParent(parent.id, unions, membersById) : [];
    const defaultUnion =
      unionOptions.find((option) => !option.label.includes('inconsistente'))?.id || unionOptions[0]?.id || '';
    const secondParentOptions = parent
      ? buildSecondParentOptions(parent.id, defaultUnion || null, members, unions)
      : [];

    rows.push({
      id: `sync-link-${child.id}`,
      memberId: child.id,
      memberName: child.name,
      kind: 'sync_parent_link',
      severity: 'Alta prioridad',
      problem: 'Es hijo/hija en el árbol visual pero no tiene vínculo formal de filiación en la base de datos.',
      solution:
        'Confirme la unión matrimonial del progenitor y el segundo progenitor, luego guarde para crear member_parent_links.',
      context: parent ? `Superior en árbol: ${parent.name}` : undefined,
      defaults: {
        spouseMemberId: '',
        filiationUnionId: defaultUnion,
        secondParentId: secondParentOptions[0]?.id || '',
      },
      spouseOptions: [],
      unionOptions,
      secondParentOptions,
    });
  });

  members.forEach((child) => {
    if (!isChildMember(child) || !child.parent_id) return;

    const links = getParentLinksForChild(child.id, parentLinks);
    if (!links.length || links.some((link) => link.union_id)) return;

    const parent = membersById.get(child.parent_id);
    if (!parent) return;

    const unionOptions = buildUnionOptionsForParent(parent.id, unions, membersById).filter(
      (option) => !option.label.includes('inconsistente')
    );
    if (!unionOptions.length) return;

    const defaultUnion = unionOptions[0].id;
    const secondParentOptions = buildSecondParentOptions(parent.id, defaultUnion, members, unions);

    rows.push({
      id: `filiation-${child.id}`,
      memberId: child.id,
      memberName: child.name,
      kind: 'complete_filiation',
      severity: 'Media prioridad',
      problem: 'Tiene vínculo parental pero falta indicar de qué matrimonio proviene (unión de filiación).',
      solution: 'Seleccione el matrimonio / pareja del progenitor y el segundo progenitor, luego guarde.',
      context: `Progenitor de referencia: ${parent.name}`,
      defaults: {
        spouseMemberId: '',
        filiationUnionId: defaultUnion,
        secondParentId: secondParentOptions[0]?.id || '',
      },
      spouseOptions: [],
      unionOptions,
      secondParentOptions,
    });
  });

  members.forEach((member) => {
    if (!isDeceased(member)) return;

    const descendants = getDescendantsForRepresentation(member, members, genealogy);
    if (descendants.length > 0) return;

    const referencedAsParent =
      members.some((candidate) => candidate.parent_id === member.id) ||
      parentLinks.some((link) => link.parent_member_id === member.id);

    if (!referencedAsParent) return;

    rows.push({
      id: `dead-branch-${member.id}`,
      memberId: member.id,
      memberName: member.name,
      kind: 'dead_branch',
      severity: 'Media prioridad',
      problem: 'Está fallecido, aparece como progenitor en el árbol, pero no tiene descendientes registrados.',
      solution:
        'Agregue hijos faltantes en Miembros del árbol o corrija el parentesco. Sin descendencia, la cuota sucesoral de esta rama no se reparte.',
      context: member.death ? `Fallecido: ${member.death}` : undefined,
      defaults: { spouseMemberId: '', filiationUnionId: '', secondParentId: '' },
      spouseOptions: [],
      unionOptions: [],
      secondParentOptions: [],
    });
  });

  const severityRank = (value: FindingSeverity) =>
    value === 'Alta prioridad' ? 0 : value === 'Media prioridad' ? 1 : 2;

  rows.sort(
    (left, right) =>
      severityRank(left.severity) - severityRank(right.severity) ||
      left.memberName.localeCompare(right.memberName, 'es') ||
      left.kind.localeCompare(right.kind)
  );

  const membersAffected = new Set(rows.map((row) => row.memberId)).size;
  const byKind = rows.reduce(
    (acc, row) => {
      acc[row.kind] += 1;
      return acc;
    },
    { link_spouse: 0, sync_parent_link: 0, complete_filiation: 0, dead_branch: 0 } as Record<
      MemberIssueKind,
      number
    >
  );

  return {
    rows,
    summary: {
      undistributedPercent: Math.max(0, 100 - distributedPercent),
      distributedPercent,
      totalIssues: rows.length,
      membersAffected,
      byKind,
    },
  };
};

export const kindLabels: Record<MemberIssueKind, string> = {
  link_spouse: 'Unión inconsistente',
  sync_parent_link: 'Vínculo filiación',
  complete_filiation: 'Matrimonio del hijo',
  dead_branch: 'Rama cortada',
};
