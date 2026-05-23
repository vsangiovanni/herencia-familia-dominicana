import { FamilyUnion, MemberParentLink, SiennaFamilyMember } from '@/lib/api';
import {
  formatUnionLabel,
  getDescendantsForRepresentation,
  getParentLinksForChild,
  getUnionsForMember,
  SiennaGenealogyBundle,
} from '@/lib/siennaGenealogy';

export type MemberIssueKind =
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

const isChildMember = (member: SiennaFamilyMember) => {
  const relationship = member.relationship_to_parent;
  if (relationship === 'hijo' || relationship === 'hija') return true;
  return relationship == null || relationship === '';
};

const isDeceased = (member: SiennaFamilyMember) => Boolean(member.death?.trim());

export const buildUnionOptionsForParent = (
  parentId: string,
  unions: FamilyUnion[],
  membersById: Map<string, SiennaFamilyMember>
) =>
  getUnionsForMember(parentId, unions)
    .map((union) => ({
      id: union.id,
      label: `${formatUnionLabel(union, membersById)}${union.is_inconsistent ? ' (inconsistente)' : ''}`,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, 'es', { sensitivity: 'base' }));

export const buildSecondParentOptions = (
  parentId: string,
  unionId: string | null,
  members: SiennaFamilyMember[],
  unions: FamilyUnion[]
) => {
  if (!unionId) return [];

  const membersById = new Map(members.map((member) => [member.id, member]));
  const parent = membersById.get(parentId);
  if (!parent) return [];

  const union = unions.find((item) => item.id === unionId);
  if (!union) return [];

  const otherId =
    union.partner_a_member_id === parentId ? union.partner_b_member_id : union.partner_a_member_id;
  if (!otherId || !membersById.get(otherId)) return [];

  return [{ id: otherId, name: membersById.get(otherId)!.name }];
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

  members.forEach((child) => {
    if (!isChildMember(child) || !child.parent_id) return;
    if (getParentLinksForChild(child.id, parentLinks).length > 0) return;

    const parent = membersById.get(child.parent_id);
    const unionOptions = parent ? buildUnionOptionsForParent(parent.id, unions, membersById) : [];

    rows.push({
      id: `sync-link-${child.id}`,
      memberId: child.id,
      memberName: child.name,
      kind: 'sync_parent_link',
      severity: 'Alta prioridad',
      problem: 'Es hijo/hija en el árbol visual pero no tiene vínculo formal de filiación en la base de datos.',
      solution:
        'Guarde para crear el vínculo por parent_id. La unión matrimonial es opcional si proviene de otra relación.',
      context: parent ? `Superior en árbol: ${parent.name}` : undefined,
      defaults: {
        spouseMemberId: '',
        filiationUnionId: '',
        secondParentId: '',
      },
      spouseOptions: [],
      unionOptions,
      secondParentOptions: [],
    });
  });

  members.forEach((child) => {
    if (!isChildMember(child) || !child.parent_id) return;

    const links = getParentLinksForChild(child.id, parentLinks);
    if (!links.length) return;

    const parent = membersById.get(child.parent_id);
    if (!parent) return;

    const unionOptions = buildUnionOptionsForParent(parent.id, unions, membersById).filter(
      (option) => !option.label.includes('inconsistente')
    );

    const inconsistentUnion = links
      .map((link) => unions.find((union) => union.id === link.union_id))
      .find((union): union is FamilyUnion => Boolean(union?.is_inconsistent));
    if (inconsistentUnion) {
      const defaultUnion = unionOptions[0]?.id || '';
      const secondParentOptions = buildSecondParentOptions(parent.id, defaultUnion, members, unions);

      rows.push({
        id: `inconsistent-filiation-${child.id}`,
        memberId: child.id,
        memberName: child.name,
        kind: 'complete_filiation',
        severity: 'Alta prioridad',
        problem: 'Su filiación usa una unión marcada como inconsistente.',
        solution: 'Seleccione una unión formal válida y el segundo progenitor, luego guarde la filiación.',
        context: inconsistentUnion.inconsistency_reason || `Unión actual: ${formatUnionLabel(inconsistentUnion, membersById)}`,
        defaults: {
          spouseMemberId: '',
          filiationUnionId: defaultUnion,
          secondParentId: secondParentOptions[0]?.id || '',
        },
        spouseOptions: [],
        unionOptions,
        secondParentOptions,
      });
      return;
    }
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
    { sync_parent_link: 0, complete_filiation: 0, dead_branch: 0 } as Record<
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
  sync_parent_link: 'Vínculo filiación',
  complete_filiation: 'Matrimonio del hijo',
  dead_branch: 'Rama cortada',
};
