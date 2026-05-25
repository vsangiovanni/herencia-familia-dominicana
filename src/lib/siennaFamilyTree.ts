import { SiennaFamilyMember } from '@/lib/api';
import {
  activeCollateralRoots,
  caseCausanteName,
  getSiennaCaseConfig,
  InheritancePlan,
  normalizeName,
} from '@/lib/dominicanInheritance';
import { formatPercent } from '@/lib/siennaHeirExplain';
import { getMemberEffectiveInheritanceReason, getMemberEffectiveInheritanceStatus } from '@/lib/siennaMemberInheritance';
import { ChildFiliationGroup, getDirectChildrenOfMember, groupChildrenForMember, SiennaGenealogyBundle } from '@/lib/siennaGenealogy';

export type TreeRole =
  | 'causante'
  | 'heredero_final'
  | 'enlace_intermedio'
  | 'enlace_genealogico'
  | 'pendiente';

export type MemberTreeContext = {
  ancestryPath: SiennaFamilyMember[];
  parentalLine: string;
  treeLevel: number;
  collateralLine: string;
  connectionLabel: string;
  treeRole: TreeRole;
  treeRoleLabel: string;
  inherits: boolean;
  inheritanceLabel: string;
  sharePercent: number | null;
  routeLabel: string | null;
  directChildrenCount: number;
  hasLivingDescendants: boolean;
  childFiliationGroups: ChildFiliationGroup[];
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  hijo: 'Hijo de',
  hija: 'Hija de',
  conyuge: 'Cónyuge de',
  padre: 'Padre de',
  madre: 'Madre de',
  otro: 'Vinculado a',
};

const TREE_ROLE_LABELS: Record<TreeRole, string> = {
  causante: 'Causante del expediente',
  heredero_final: 'Heredero en el reparto activo',
  enlace_intermedio: 'Enlace intermedio (transmite por representación)',
  enlace_genealogico: 'Enlace genealógico (no hereda)',
  pendiente: 'Pendiente de clasificar',
};

export const buildMembersById = (members: SiennaFamilyMember[]) =>
  new Map(members.map((member) => [member.id, member]));

export const compareSpanish = (left: string, right: string) =>
  left.localeCompare(right, 'es', { sensitivity: 'base' });

export const sortMembersByName = (members: SiennaFamilyMember[]) =>
  [...members].sort((left, right) => compareSpanish(left.name, right.name));

export const getAncestryPath = (
  memberId: string | null | undefined,
  members: SiennaFamilyMember[]
): SiennaFamilyMember[] => {
  if (!memberId) return [];
  const byId = buildMembersById(members);
  const path: SiennaFamilyMember[] = [];
  const visited = new Set<string>();
  let current = byId.get(memberId);

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }

  return path;
};

export const getParentalLine = (path: SiennaFamilyMember[]) =>
  path.length ? path.map((member) => member.name).join(' → ') : '—';

export const getTreeLevel = (path: SiennaFamilyMember[]) => Math.max(0, path.length - 1);

export const countDirectChildren = (memberId: string, members: SiennaFamilyMember[]) =>
  members.filter((member) => member.parent_id === memberId).length;

const isChildRelationship = (member: SiennaFamilyMember) =>
  member.relationship_to_parent === 'hijo' ||
  member.relationship_to_parent === 'hija' ||
  !member.relationship_to_parent;

export const detectCollateralLine = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[]
): string => {
  const { family_trunk_name } = getSiennaCaseConfig();
  const path = getAncestryPath(member.id, members);
  const pathNames = new Set(path.map((item) => normalizeName(item.name)));
  const memberKey = normalizeName(member.name);
  const causanteKey = normalizeName(caseCausanteName);

  if (memberKey === causanteKey) {
    return `Causante — ${caseCausanteName}`;
  }

  if (pathNames.has(causanteKey)) {
    return 'Rama del causante (línea Magdalena → Alessandro)';
  }

  for (const root of activeCollateralRoots) {
    if (pathNames.has(normalizeName(root.name))) {
      return `Línea colateral — ${root.label}`;
    }
  }

  if (pathNames.has(normalizeName(family_trunk_name))) {
    return `Tronco familiar — ${family_trunk_name}`;
  }

  if (path.length <= 1) {
    return 'Raíz del árbol (sin superior)';
  }

  return 'Rama no clasificada en Vincenzo/Paolo';
};

export const formatConnectionLabel = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[]
): string => {
  if (!member.parent_id) {
    return 'Sin superior — nodo raíz';
  }

  const parent = buildMembersById(members).get(member.parent_id);
  if (!parent) {
    return 'Superior no encontrado (revisar parent_id)';
  }

  const relation = member.relationship_to_parent
    ? RELATIONSHIP_LABELS[member.relationship_to_parent] || 'Vinculado a'
    : 'Descendiente de';

  return `${relation} ${parent.name}`;
};

export const resolveTreeRole = (
  member: SiennaFamilyMember,
  plan: InheritancePlan
): TreeRole => {
  if (normalizeName(member.name) === normalizeName(caseCausanteName)) {
    return 'causante';
  }

  if (plan.sharesById.has(member.id)) {
    return 'heredero_final';
  }

  const effectiveStatus = getMemberEffectiveInheritanceStatus(member);

  if (effectiveStatus === 'no_hereda') {
    return member.death ? 'enlace_intermedio' : 'enlace_genealogico';
  }

  if (effectiveStatus === 'requiere_revision') {
    return 'pendiente';
  }

  return member.death ? 'enlace_intermedio' : 'enlace_genealogico';
};

export const resolveInheritanceDisplay = (
  member: SiennaFamilyMember,
  plan: InheritancePlan
): Pick<MemberTreeContext, 'inherits' | 'inheritanceLabel' | 'sharePercent' | 'routeLabel'> => {
  if (normalizeName(member.name) === normalizeName(caseCausanteName)) {
    return {
      inherits: false,
      inheritanceLabel: 'No — es el causante',
      sharePercent: null,
      routeLabel: null,
    };
  }

  const share = plan.sharesById.get(member.id);
  if (share) {
    return {
      inherits: true,
      inheritanceLabel: `Sí — ${formatPercent(share.share)}`,
      sharePercent: share.share,
      routeLabel: share.route,
    };
  }

  const effectiveStatus = getMemberEffectiveInheritanceStatus(member);
  const effectiveReason = getMemberEffectiveInheritanceReason(member);

  if (effectiveStatus === 'confirmado') {
    return {
      inherits: true,
      inheritanceLabel: 'Sí — confirmado manualmente',
      sharePercent: null,
      routeLabel: effectiveReason || null,
    };
  }

  if (effectiveStatus === 'no_hereda') {
    return {
      inherits: false,
      inheritanceLabel: 'No — enlace o intermedio',
      sharePercent: null,
      routeLabel: effectiveReason || null,
    };
  }

  return {
    inherits: false,
    inheritanceLabel: 'Por determinar',
    sharePercent: null,
    routeLabel: null,
  };
};

export const buildMemberTreeContext = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[],
  plan?: InheritancePlan,
  genealogy?: SiennaGenealogyBundle
): MemberTreeContext => {
  const inheritancePlan = plan || {
    activeHeirs: [],
    sharesById: new Map(),
    sharesByName: new Map(),
  };
  const ancestryPath = getAncestryPath(member.id, members);
  const treeRole = resolveTreeRole(member, inheritancePlan);
  const inheritance = resolveInheritanceDisplay(member, inheritancePlan);
  const childFiliationGroups = genealogy
    ? groupChildrenForMember(member.id, members, genealogy)
    : [];
  const directChildren = childFiliationGroups.length
    ? childFiliationGroups.flatMap((group) => group.children)
    : genealogy
      ? getDirectChildrenOfMember(member.id, members, genealogy)
      : members.filter((item) => item.parent_id === member.id && isChildRelationship(item));

  return {
    ancestryPath,
    parentalLine: getParentalLine(ancestryPath),
    treeLevel: getTreeLevel(ancestryPath),
    collateralLine: detectCollateralLine(member, members),
    connectionLabel: formatConnectionLabel(member, members),
    treeRole,
    treeRoleLabel: TREE_ROLE_LABELS[treeRole],
    directChildrenCount: directChildren.length,
    hasLivingDescendants: directChildren.some((child) => !child.death?.trim()),
    childFiliationGroups,
    ...inheritance,
  };
};

export const sortMembersByTree = (
  members: SiennaFamilyMember[],
  plan?: InheritancePlan
): SiennaFamilyMember[] => {
  const pathById = new Map<string, string>();
  members.forEach((member) => {
    pathById.set(member.id, getParentalLine(getAncestryPath(member.id, members)));
  });

  return [...members].sort((left, right) => {
    const pathCompare = (pathById.get(left.id) || '').localeCompare(pathById.get(right.id) || '', 'es');
    if (pathCompare !== 0) return pathCompare;
    return Number(left.sort_order || 0) - Number(right.sort_order || 0) || left.name.localeCompare(right.name, 'es');
  });
};

export const formatParentOptionLabel = (
  parent: SiennaFamilyMember,
  members: SiennaFamilyMember[]
) => {
  const line = detectCollateralLine(parent, members);
  return `${parent.name} — ${line}`;
};
