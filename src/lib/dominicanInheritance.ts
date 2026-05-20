import { SiennaFamilyMember } from './api';

export type InheritanceStatus = 'posible_heredero' | 'no_hereda' | 'requiere_revision' | 'confirmado';

export type InheritanceShare = {
  member: SiennaFamilyMember;
  share: number;
  role: string;
  reason: string;
  route: string;
  paymentBasis: string;
  sources: string[];
  sourceBreakdown: Array<{
    source: string;
    share: number;
    routes: string[];
  }>;
};

export type InheritancePlan = {
  sharesById: Map<string, InheritanceShare>;
  sharesByName: Map<string, InheritanceShare>;
  activeHeirs: InheritanceShare[];
};

export const caseCausanteName = 'Alessandro de Paola Sangiovanni';

export const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const activeCollateralRoots = [
  {
    name: 'Vincenzo (Vicente) Sangiovanni',
    label: 'Vincenzo/Vicente',
  },
  {
    name: 'Paolo (Paulino) Sangiovanni',
    label: 'Paolo/Paulino',
  },
];

const knownIntermediates = new Map([
  [normalizeName('Domenico (Domingo) Sangiovanni'), 'Tronco familiar común; sirve para ubicar ramas, no como heredero final.'],
  [normalizeName('María Magdalena Sangiovanni'), 'Madre del causante Alessandro; rama del causante, no heredera final en este análisis.'],
  [normalizeName('Vincenzo (Vicente) Sangiovanni'), 'Hermano de la madre del causante; abre una rama sucesoral activa por sus descendientes.'],
  [normalizeName('Paolo (Paulino) Sangiovanni'), 'Hermano de la madre del causante; abre una rama sucesoral activa por sus descendientes.'],
  [normalizeName('María Rosa Sangiovanni Pérez'), 'Intermedia fallecida en rama Vincenzo/Vicente y vínculo hacia la doble filiación.'],
  [normalizeName('Pedro Pablo Sangiovanni Simo'), 'Intermedio fallecido en rama Paolo/Paulino y vínculo hacia la doble filiación.'],
  [normalizeName('Domingo Ramón Sangiovanni Pérez'), 'Intermedio fallecido en rama Vincenzo/Vicente; transmite representación a sus descendientes.'],
  [normalizeName('Víctor Manuel Sangiovanni Sangiovanni'), 'Intermedio fallecido; conecta a Víctor Manuel Martín y a Rosa Julia/Perla.'],
  [normalizeName('Rosa Julia Sangiovanni Rodríguez'), 'Intermedia fallecida; Perla Rosa entra por representación en su rama.'],
  [normalizeName('María Amparo Sangiovanni Gesualdo'), 'Intermedia fallecida; Bernardo Martín entra por representación en su rama.'],
  [normalizeName('José Vicente Sangiovanni Gesualdo'), 'Intermedio fallecido; Jocelyn y Mayra entran por representación en su rama.'],
]);

const normalizedMemberId = (value: string | null | undefined) => (value || '').trim();

const isDescendantRelationship = (member: SiennaFamilyMember) =>
  member.relationship_to_parent === 'hijo' ||
  member.relationship_to_parent === 'hija' ||
  member.relationship_to_parent === 'otro' ||
  !member.relationship_to_parent;

const isDeceased = (member: SiennaFamilyMember) => Boolean(member.death?.trim());

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value)}%`;

const compactShare = (value: number) => Math.round(value * 1000000) / 1000000;

const byNameKey = (members: SiennaFamilyMember[]) =>
  new Map(members.map((member) => [normalizeName(member.name), member]));

const directChildrenOf = (members: SiennaFamilyMember[], parentId: string) =>
  members.filter((member) => normalizedMemberId(member.parent_id) === normalizedMemberId(parentId) && isDescendantRelationship(member));

const findSpousePartner = (member: SiennaFamilyMember, membersByName: Map<string, SiennaFamilyMember>) => {
  const memberNameKey = normalizeName(member.name);
  const spouseByOwnReference = member.spouse ? membersByName.get(normalizeName(member.spouse)) || null : null;
  if (spouseByOwnReference) return spouseByOwnReference;

  for (const candidate of membersByName.values()) {
    if (normalizeName(candidate.name) === memberNameKey) continue;
    if (candidate.spouse && normalizeName(candidate.spouse) === memberNameKey) {
      return candidate;
    }
  }

  return null;
};

const uniqueMembers = (members: SiennaFamilyMember[]) => {
  const seen = new Set<string>();
  return members.filter((member) => {
    if (seen.has(member.id)) return false;
    seen.add(member.id);
    return true;
  });
};

const addShare = (
  shares: Map<string, InheritanceShare>,
  member: SiennaFamilyMember,
  share: number,
  source: string,
  route: string
) => {
  const roundedShare = compactShare(share);
  const existing = shares.get(member.id);
  const sources = existing ? Array.from(new Set([...existing.sources, source])) : [source];
  const nextShare = compactShare((existing?.share || 0) + roundedShare);
  const sourceText = sources.join(' y ');
  const currentBreakdown = new Map(
    (existing?.sourceBreakdown || []).map((item) => [item.source, { ...item }])
  );
  const currentSource = currentBreakdown.get(source);
  const nextRoutes = Array.from(new Set([...(currentSource?.routes || []), route]));
  currentBreakdown.set(source, {
    source,
    share: compactShare((currentSource?.share || 0) + roundedShare),
    routes: nextRoutes,
  });

  shares.set(member.id, {
    member,
    share: nextShare,
    sources,
    role: 'Heredero final',
    reason:
      sources.length > 1
        ? `Heredero por representación con vocación acumulada en las ramas ${sourceText}.`
        : `Heredero por representación dentro de la rama ${sourceText}.`,
    route: existing?.route ? `${existing.route} | ${route}` : route,
    paymentBasis:
      sources.length > 1
        ? `Acumula ${formatPercent(nextShare)} por concurrencia de ramas sucesorales calculadas conforme al árbol.`
        : `Recibe ${formatPercent(nextShare)} por la rama ${sourceText}.`,
    sourceBreakdown: Array.from(currentBreakdown.values()).sort((left, right) =>
      left.source.localeCompare(right.source, 'es')
    ),
  });
};

const descendantsForRepresentation = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[],
  membersByName: Map<string, SiennaFamilyMember>
) => {
  const ownChildren = directChildrenOf(members, member.id);
  const spousePartner = findSpousePartner(member, membersByName);
  const spouseChildren = spousePartner ? directChildrenOf(members, spousePartner.id) : [];

  return uniqueMembers([...ownChildren, ...spouseChildren]);
};

const distributeByRepresentation = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[],
  membersByName: Map<string, SiennaFamilyMember>,
  shares: Map<string, InheritanceShare>,
  share: number,
  source: string,
  route: string,
  visited: Set<string>
) => {
  const visitKey = `${source}:${member.id}`;
  if (visited.has(visitKey)) return;
  visited.add(visitKey);

  if (!isDeceased(member)) {
    addShare(shares, member, share, source, route);
    return;
  }

  const descendants = descendantsForRepresentation(member, members, membersByName);
  if (!descendants.length) return;

  const childShare = share / descendants.length;
  descendants.forEach((child) => {
    distributeByRepresentation(
      child,
      members,
      membersByName,
      shares,
      childShare,
      source,
      `${route} -> ${child.name}`,
      new Set(visited)
    );
  });
};

export const buildDominicanInheritancePlan = (members: SiennaFamilyMember[]): InheritancePlan => {
  const membersByName = byNameKey(members);
  const causante = membersByName.get(normalizeName(caseCausanteName));
  const sharesById = new Map<string, InheritanceShare>();

  if (causante) {
    const directDescendants = directChildrenOf(members, causante.id);
    if (directDescendants.length) {
      const share = 100 / directDescendants.length;
      directDescendants.forEach((child) => {
        distributeByRepresentation(
          child,
          members,
          membersByName,
          sharesById,
          share,
          'Descendencia directa',
          `${causante.name} -> ${child.name}`,
          new Set()
        );
      });
      const activeHeirs = Array.from(sharesById.values()).sort((a, b) => b.share - a.share || a.member.name.localeCompare(b.member.name));
      return {
        sharesById,
        sharesByName: new Map(activeHeirs.map((share) => [normalizeName(share.member.name), share])),
        activeHeirs,
      };
    }
  }

  const roots = activeCollateralRoots
    .map((root) => ({ ...root, member: membersByName.get(normalizeName(root.name)) }))
    .filter((root): root is { name: string; label: string; member: SiennaFamilyMember } => Boolean(root.member));

  const rootShare = roots.length ? 100 / roots.length : 0;
  roots.forEach((root) => {
    distributeByRepresentation(
      root.member,
      members,
      membersByName,
      sharesById,
      rootShare,
      root.label,
      root.member.name,
      new Set()
    );
  });

  const activeHeirs = Array.from(sharesById.values()).sort((a, b) => b.share - a.share || a.member.name.localeCompare(b.member.name));

  return {
    sharesById,
    sharesByName: new Map(activeHeirs.map((share) => [normalizeName(share.member.name), share])),
    activeHeirs,
  };
};

export const classifyMemberByDominicanLaw = (
  member: SiennaFamilyMember,
  members: SiennaFamilyMember[]
): Pick<SiennaFamilyMember, 'inheritance_status' | 'inheritance_reason'> => {
  const name = normalizeName(member.name);
  const plan = buildDominicanInheritancePlan(members);
  const share = plan.sharesById.get(member.id);

  if (name === normalizeName(caseCausanteName)) {
    return {
      inheritance_status: 'no_hereda',
      inheritance_reason: 'Es el causante del expediente; no se clasifica como heredero.',
    };
  }

  if (share) {
    return {
      inheritance_status: member.inheritance_status === 'confirmado' ? 'confirmado' : 'posible_heredero',
      inheritance_reason: share.reason,
    };
  }

  if (knownIntermediates.has(name)) {
    return {
      inheritance_status: 'no_hereda',
      inheritance_reason: knownIntermediates.get(name),
    };
  }

  if (isDeceased(member) && descendantsForRepresentation(member, members, byNameKey(members)).length) {
    return {
      inheritance_status: 'no_hereda',
      inheritance_reason: 'Nodo intermedio fallecido; su cuota se transmite por representación a sus descendientes vivos documentados.',
    };
  }

  return {
    inheritance_status: member.inheritance_status || 'requiere_revision',
    inheritance_reason: member.inheritance_reason || 'No hay suficiente información del expediente para clasificarlo automáticamente.',
  };
};

export const legalCriterionText =
  'Criterio sucesoral dominicano aplicado: primero heredan los descendientes directos del causante; si no existen, se evalúan las ramas colaterales documentadas y los descendientes ocupan el lugar de su ascendiente fallecido por representación. En este expediente, al no existir descendencia directa registrada de Alessandro, la distribución activa se calcula por las ramas Vincenzo/Vicente y Paolo/Paulino, dividiendo cada rama por estirpes y recalculando cuando se agregan nuevos descendientes.';
