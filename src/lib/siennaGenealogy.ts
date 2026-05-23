import { FamilyUnion, MemberParentLink, SiennaFamilyMember } from '@/lib/api';
import { normalizeName } from '@/lib/dominicanInheritance';

export type SiennaGenealogyBundle = {
  unions: FamilyUnion[];
  parent_links: MemberParentLink[];
};

const normalizedId = (value: string | null | undefined) => (value || '').trim();

export const buildUnionId = (partnerA: string, partnerB: string) => {
  const ids = [normalizedId(partnerA), normalizedId(partnerB)].filter(Boolean).sort();
  return ids.length === 2 ? `union-${ids[0]}-${ids[1]}` : `union-${ids[0] || 'solo'}`;
};

export const buildParentLinkId = (childId: string, parentId: string, unionId?: string | null) => {
  const base = `link-${normalizedId(childId)}-${normalizedId(parentId)}`;
  return unionId ? `${base}-${normalizedId(unionId)}` : base;
};

export const isChildRelationship = (member: SiennaFamilyMember) =>
  member.relationship_to_parent === 'hijo' ||
  member.relationship_to_parent === 'hija' ||
  member.relationship_to_parent === 'otro' ||
  !member.relationship_to_parent;

export type SpouseResolveMode = 'calculation' | 'display' | 'suggestions';

export const resolveSpousePartner = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[],
  bundle?: SiennaGenealogyBundle,
  mode: SpouseResolveMode = 'calculation'
): SiennaFamilyMember | null => {
  const membersById = new Map(members.map((item) => [item.id, item]));
  const membersByName = new Map(members.map((item) => [normalizeName(item.name), item]));
  const memberId = normalizedId(member.id);

  if (member.spouse_member_id) {
    const linked = membersById.get(normalizedId(member.spouse_member_id));
    if (linked) return linked;
  }

  if (bundle?.unions.length) {
    for (const union of getUnionsForMember(memberId, bundle.unions)) {
      const otherId =
        normalizedId(union.partner_a_member_id) === memberId
          ? union.partner_b_member_id
          : union.partner_a_member_id;
      if (otherId) {
        const other = membersById.get(normalizedId(otherId));
        if (other) return other;
      }
    }
  }

  for (const candidate of membersById.values()) {
    if (candidate.id === member.id) continue;
    if (normalizedId(candidate.spouse_member_id) === memberId) return candidate;
  }

  if (mode === 'display' || mode === 'suggestions') {
    if (member.spouse) {
      const byName = membersByName.get(normalizeName(member.spouse));
      if (byName) return byName;
    }
    const memberNameKey = normalizeName(member.name);
    for (const candidate of membersById.values()) {
      if (candidate.spouse && normalizeName(candidate.spouse) === memberNameKey) return candidate;
    }
  }

  return null;
};

export const resolveSpouseDisplayLabel = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[],
  bundle?: SiennaGenealogyBundle
): string | null => {
  const linked = resolveSpousePartner(member, members, bundle, 'display');
  if (linked) return linked.name;
  return member.spouse?.trim() || null;
};

export const getDirectChildrenOfMember = (
  parentId: string,
  members: SiennaFamilyMember[],
  bundle?: SiennaGenealogyBundle
): SiennaFamilyMember[] => {
  const childMap = new Map<string, SiennaFamilyMember>();
  const pid = normalizedId(parentId);

  members
    .filter((item) => normalizedId(item.parent_id) === pid && isChildRelationship(item))
    .forEach((child) => childMap.set(child.id, child));

  if (bundle?.parent_links.length) {
    getChildIdsFromLinks(pid, bundle.parent_links).forEach((childId) => {
      const child = members.find((item) => item.id === childId);
      if (child && isChildRelationship(child)) childMap.set(child.id, child);
    });
  }

  return Array.from(childMap.values()).sort(
    (left, right) =>
      Number(left.sort_order || 0) - Number(right.sort_order || 0) ||
      left.name.localeCompare(right.name, 'es')
  );
};

export const findUnionBetween = (
  memberAId: string,
  memberBId: string,
  unions: FamilyUnion[]
): FamilyUnion | null => {
  const a = normalizedId(memberAId);
  const b = normalizedId(memberBId);
  if (!a || !b) return null;
  return (
    unions.find((union) => {
      const pa = normalizedId(union.partner_a_member_id);
      const pb = normalizedId(union.partner_b_member_id);
      return (pa === a && pb === b) || (pa === b && pb === a);
    }) || null
  );
};

export const getUnionsForMember = (memberId: string, unions: FamilyUnion[]) => {
  const id = normalizedId(memberId);
  return unions.filter(
    (union) =>
      normalizedId(union.partner_a_member_id) === id || normalizedId(union.partner_b_member_id) === id
  );
};

export const formatUnionLabel = (union: FamilyUnion, membersById: Map<string, SiennaFamilyMember>) => {
  const a = membersById.get(normalizedId(union.partner_a_member_id))?.name || '—';
  const b = union.partner_b_member_id
    ? membersById.get(normalizedId(union.partner_b_member_id))?.name || '—'
    : 'sin segunda persona';
  const type =
    union.union_type === 'matrimonio'
      ? 'Matrimonio'
      : union.union_type === 'union_libre'
        ? 'Unión libre'
        : 'Unión';
  return `${type}: ${a} y ${b}`;
};

export const getParentLinksForChild = (childId: string, links: MemberParentLink[]) =>
  links.filter((link) => normalizedId(link.child_member_id) === normalizedId(childId));

export const getParentLinksForParent = (parentId: string, links: MemberParentLink[]) =>
  links.filter((link) => normalizedId(link.parent_member_id) === normalizedId(parentId));

export const getChildIdsFromLinks = (parentId: string, links: MemberParentLink[]) =>
  Array.from(
    new Set(
      getParentLinksForParent(parentId, links).map((link) => normalizedId(link.child_member_id)).filter(Boolean)
    )
  );

export const getChildrenByUnionId = (
  unionId: string,
  members: SiennaFamilyMember[],
  links: MemberParentLink[]
): SiennaFamilyMember[] => {
  const byId = new Map(members.map((member) => [member.id, member]));
  const childIds = Array.from(
    new Set(
      links
        .filter((link) => normalizedId(link.union_id) === normalizedId(unionId))
        .map((link) => normalizedId(link.child_member_id))
        .filter(Boolean)
    )
  );
  return childIds
    .map((id) => byId.get(id))
    .filter((member): member is SiennaFamilyMember => Boolean(member) && isChildRelationship(member));
};

export type ChildFiliationGroup = {
  key: string;
  label: string;
  union: FamilyUnion | null;
  children: SiennaFamilyMember[];
  confidence: 'alta' | 'media' | 'baja';
  hasInconsistency: boolean;
};

export const groupChildrenForMember = (
  memberId: string,
  members: SiennaFamilyMember[],
  bundle: SiennaGenealogyBundle
): ChildFiliationGroup[] => {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const member = membersById.get(memberId);
  if (!member) return [];

  const linksForParent = getParentLinksForParent(memberId, bundle.parent_links);
  const childIdsFromLinks = Array.from(new Set(linksForParent.map((link) => link.child_member_id)));
  const legacyChildren = members.filter(
    (item) => normalizedId(item.parent_id) === normalizedId(memberId) && isChildRelationship(item)
  );

  const childIds = Array.from(
    new Set([...childIdsFromLinks, ...legacyChildren.map((child) => child.id)])
  );

  const groups = new Map<string, ChildFiliationGroup>();

  const ensureGroup = (
    key: string,
    label: string,
    union: FamilyUnion | null,
    confidence: 'alta' | 'media' | 'baja',
    hasInconsistency: boolean
  ) => {
    if (!groups.has(key)) {
      groups.set(key, { key, label, union, children: [], confidence, hasInconsistency });
    }
    return groups.get(key)!;
  };

  for (const childId of childIds) {
    const child = membersById.get(childId);
    if (!child || !isChildRelationship(child)) continue;

    const childLinks = getParentLinksForChild(childId, bundle.parent_links);
    const unionLink = childLinks.find((link) => link.union_id);
    const union = unionLink?.union_id
      ? bundle.unions.find((item) => item.id === unionLink.union_id) || null
      : null;

    if (union) {
      const group = ensureGroup(
        union.id,
        formatUnionLabel(union, membersById),
        union,
        union.confidence,
        union.is_inconsistent
      );
      if (!group.children.some((item) => item.id === child.id)) group.children.push(child);
      continue;
    }

    const onlyThisParent =
      childLinks.length === 0
        ? normalizedId(child.parent_id) === normalizedId(memberId)
        : childLinks.every((link) => normalizedId(link.parent_member_id) === normalizedId(memberId));

    if (onlyThisParent) {
      const group = ensureGroup(
        `solo-${memberId}`,
        `Hijos vinculados solo a ${member.name} (otra filiación / sin unión registrada)`,
        null,
        childLinks.some((link) => link.is_inconsistent) ? 'baja' : 'media',
        childLinks.some((link) => link.is_inconsistent)
      );
      if (!group.children.some((item) => item.id === child.id)) group.children.push(child);
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      children: group.children.sort(
        (left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0) || left.name.localeCompare(right.name, 'es')
      ),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, 'es'));
};

export const getDescendantsForRepresentation = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[],
  bundle: SiennaGenealogyBundle
) => {
  const membersById = new Map(members.map((item) => [item.id, item]));
  const spousePartner = resolveSpousePartner(member, members, bundle, 'calculation');
  const union = spousePartner ? findUnionBetween(member.id, spousePartner.id, bundle.unions) : null;

  if (bundle.parent_links.length > 0) {
    const childMap = new Map<string, SiennaFamilyMember>();

    if (union) {
      getChildrenByUnionId(union.id, members, bundle.parent_links).forEach((child) => childMap.set(child.id, child));
    }

    getChildIdsFromLinks(member.id, bundle.parent_links).forEach((childId) => {
      const child = membersById.get(childId);
      if (!child || !isChildRelationship(child)) return;
      const unionIds = getParentLinksForChild(childId, bundle.parent_links)
        .filter((link) => normalizedId(link.parent_member_id) === normalizedId(member.id))
        .map((link) => link.union_id)
        .filter(Boolean);
      if (union && unionIds.includes(union.id)) return;
      if (!unionIds.length) childMap.set(child.id, child);
    });

    members
      .filter(
        (item) => normalizedId(item.parent_id) === normalizedId(member.id) && isChildRelationship(item)
      )
      .forEach((child) => childMap.set(child.id, child));

    if (childMap.size > 0) return Array.from(childMap.values());
  }

  const ownChildren = members.filter(
    (item) => normalizedId(item.parent_id) === normalizedId(member.id) && isChildRelationship(item)
  );
  const spouseChildren = spousePartner
    ? members.filter(
        (item) => normalizedId(item.parent_id) === normalizedId(spousePartner.id) && isChildRelationship(item)
      )
    : [];

  const seen = new Set<string>();
  return [...ownChildren, ...spouseChildren].filter((child) => {
    if (seen.has(child.id)) return false;
    seen.add(child.id);
    return true;
  });
};

export const countGenealogyInconsistencies = (bundle: SiennaGenealogyBundle) => {
  const referencedUnionIds = new Set(
    bundle.parent_links.map((link) => normalizedId(link.union_id)).filter(Boolean)
  );

  const unionIssues = bundle.unions.filter(
    (union) =>
      isUnionAuditRelevant(union) &&
      union.is_inconsistent &&
      (referencedUnionIds.has(union.id) || normalizedId(union.partner_b_member_id))
  ).length;

  const linkIssues = bundle.parent_links.filter((link) => link.is_inconsistent).length;

  return unionIssues + linkIssues;
};

/** Uniones creadas solo por texto legacy o sin segundo partner: no afectan cálculo ni auditoría. */
export const isInformativeOnlyUnion = (union: FamilyUnion) => {
  if ((union.migration_source || '').trim() === 'spouse_text_only') return true;
  return !normalizedId(union.partner_b_member_id);
};

export const isUnionAuditRelevant = (union: FamilyUnion) => !isInformativeOnlyUnion(union);

export type MemberLinkVerificationStatus = 'verified' | 'pending';

export const getMemberLinkVerificationStatus = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[],
  bundle: SiennaGenealogyBundle
): { status: MemberLinkVerificationStatus; detail?: string } => {
  const membersById = new Map(members.map((item) => [item.id, item]));
  const childLinks = getParentLinksForChild(member.id, bundle.parent_links);
  const parentLinks = getParentLinksForParent(member.id, bundle.parent_links);
  const allLinks = [...childLinks, ...parentLinks];

  const blockingLink = allLinks.find((link) => link.is_inconsistent);
  if (blockingLink) {
    return {
      status: 'pending',
      detail: blockingLink.inconsistency_reason || 'Vínculo parental inconsistente',
    };
  }

  const isChild =
    member.relationship_to_parent === 'hijo' || member.relationship_to_parent === 'hija';
  if (isChild && member.parent_id && childLinks.length === 0) {
    return { status: 'pending', detail: 'Falta vínculo formal de filiación' };
  }

  const spouseId = normalizedId(member.spouse_member_id);
  if (spouseId) {
    const spouse = membersById.get(spouseId);
    if (!spouse) {
      return { status: 'pending', detail: 'spouse_member_id apunta a un miembro inexistente' };
    }
    const union = findUnionBetween(member.id, spouseId, bundle.unions);
    const reciprocal = normalizedId(spouse.spouse_member_id) === normalizedId(member.id);
    if (!union && !reciprocal) {
      return { status: 'pending', detail: 'Cónyuge enlazado sin unión formal registrada' };
    }
    const unionsToCheck = union ? [union] : getUnionsForMember(member.id, bundle.unions);
    const badUnion = unionsToCheck.find(
      (item) => isUnionAuditRelevant(item) && (item.is_inconsistent || item.confidence === 'baja')
    );
    if (badUnion) {
      return {
        status: 'pending',
        detail: badUnion.inconsistency_reason || 'Unión formal por validar',
      };
    }
  }

  const badMemberUnion = getUnionsForMember(member.id, bundle.unions).find(
    (item) => isUnionAuditRelevant(item) && (item.is_inconsistent || item.confidence === 'baja')
  );
  if (badMemberUnion) {
    return {
      status: 'pending',
      detail: badMemberUnion.inconsistency_reason || 'Unión formal por validar',
    };
  }

  return { status: 'verified' };
};

export const hasDocumentalSpouseReference = (member: SiennaFamilyMember) =>
  Boolean(member.spouse?.trim()) && !normalizedId(member.spouse_member_id);
