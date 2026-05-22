#!/usr/bin/env node
/**
 * Audita CalculoFiliacion vs plan Sienna con genealogía (prod/local).
 * Uso: ENV_FILE=.env.prod.working node scripts/audit-calculo-filiacion.cjs
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function parseEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  raw.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i <= 0) return;
    env[t.slice(0, i)] = t.slice(i + 1);
  });
  return env;
}

const normalizeName = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizedId = (v) => String(v || '').trim();
const isChildRelationship = (m) =>
  m.relationship_to_parent === 'hijo' || m.relationship_to_parent === 'hija' || !m.relationship_to_parent;
const isDescendantRelationship = (m) =>
  m.relationship_to_parent === 'hijo' ||
  m.relationship_to_parent === 'hija' ||
  m.relationship_to_parent === 'otro' ||
  !m.relationship_to_parent;
const isDeceased = (m) => Boolean(String(m.death || '').trim());

const caseCausanteName = 'Alessandro de Paola Sangiovanni';
const activeCollateralRoots = [
  { name: 'Vincenzo (Vicente) Sangiovanni', label: 'Vincenzo/Vicente' },
  { name: 'Paolo (Paulino) Sangiovanni', label: 'Paolo/Paulino' },
];

const byNameKey = (members) => new Map(members.map((m) => [normalizeName(m.name), m]));
const byIdKey = (members) => new Map(members.map((m) => [normalizedId(m.id), m]));

const directChildrenOf = (members, parentId) =>
  members.filter(
    (m) => normalizedId(m.parent_id) === normalizedId(parentId) && isDescendantRelationship(m)
  );

const findSpousePartner = (member, membersByName, membersById) => {
  const memberNameKey = normalizeName(member.name);
  if (member.spouse_member_id) {
    const s = membersById.get(normalizedId(member.spouse_member_id));
    if (s) return s;
  }
  if (member.spouse) {
    const s = membersByName.get(normalizeName(member.spouse));
    if (s) return s;
  }
  for (const candidate of membersById.values()) {
    if (normalizeName(candidate.name) === memberNameKey) continue;
    if (normalizedId(candidate.spouse_member_id) === normalizedId(member.id)) return candidate;
    if (candidate.spouse && normalizeName(candidate.spouse) === memberNameKey) return candidate;
  }
  return null;
};

const findUnionBetween = (a, b, unions) => {
  const idA = normalizedId(a);
  const idB = normalizedId(b);
  return (
    unions.find((u) => {
      const pa = normalizedId(u.partner_a_member_id);
      const pb = normalizedId(u.partner_b_member_id);
      return (pa === idA && pb === idB) || (pa === idB && pb === idA);
    }) || null
  );
};

const getParentLinksForChild = (childId, links) =>
  links.filter((l) => normalizedId(l.child_member_id) === normalizedId(childId));
const getParentLinksForParent = (parentId, links) =>
  links.filter((l) => normalizedId(l.parent_member_id) === normalizedId(parentId));
const getChildIdsFromLinks = (parentId, links) =>
  Array.from(new Set(getParentLinksForParent(parentId, links).map((l) => normalizedId(l.child_member_id)).filter(Boolean)));

const getChildrenByUnionId = (unionId, members, links) => {
  const byId = new Map(members.map((m) => [m.id, m]));
  const childIds = Array.from(
    new Set(
      links
        .filter((l) => normalizedId(l.union_id) === normalizedId(unionId))
        .map((l) => normalizedId(l.child_member_id))
        .filter(Boolean)
    )
  );
  return childIds.map((id) => byId.get(id)).filter((m) => m && isChildRelationship(m));
};

const getDescendantsForRepresentation = (member, members, bundle) => {
  const membersById = byIdKey(members);
  const membersByName = byNameKey(members);
  const spousePartner = findSpousePartner(member, membersByName, membersById);
  const union = spousePartner ? findUnionBetween(member.id, spousePartner.id, bundle.unions) : null;

  if (bundle.parent_links.length > 0) {
    const childMap = new Map();
    if (union) {
      getChildrenByUnionId(union.id, members, bundle.parent_links).forEach((c) => childMap.set(c.id, c));
    }
    getChildIdsFromLinks(member.id, bundle.parent_links).forEach((childId) => {
      const child = membersById.get(childId);
      if (!child || !isChildRelationship(child)) return;
      const unionIds = getParentLinksForChild(childId, bundle.parent_links)
        .filter((l) => normalizedId(l.parent_member_id) === normalizedId(member.id))
        .map((l) => l.union_id)
        .filter(Boolean);
      if (union && unionIds.includes(union.id)) return;
      if (!unionIds.length) childMap.set(child.id, child);
    });
    members
      .filter((m) => normalizedId(m.parent_id) === normalizedId(member.id) && isChildRelationship(m))
      .forEach((child) => childMap.set(child.id, child));

    if (childMap.size > 0) return Array.from(childMap.values());
  }

  const ownChildren = members.filter(
    (m) => normalizedId(m.parent_id) === normalizedId(member.id) && isChildRelationship(m)
  );
  const spouseChildren = spousePartner
    ? members.filter(
        (m) => normalizedId(m.parent_id) === normalizedId(spousePartner.id) && isChildRelationship(m)
      )
    : [];
  const seen = new Set();
  return [...ownChildren, ...spouseChildren].filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
};

const uniqueMembers = (list) => {
  const seen = new Set();
  return list.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
};

const compactShare = (v) => Math.round(v * 1000000) / 1000000;

const addShare = (shares, member, share, source, route) => {
  const roundedShare = compactShare(share);
  const existing = shares.get(member.id);
  const sources = existing ? Array.from(new Set([...existing.sources, source])) : [source];
  const nextShare = compactShare((existing?.share || 0) + roundedShare);
  const currentBreakdown = new Map((existing?.sourceBreakdown || []).map((i) => [i.source, { ...i }]));
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
    sourceBreakdown: Array.from(currentBreakdown.values()),
  });
};

const descendantsForRepresentation = (member, members, membersByName, membersById, genealogy) => {
  if (genealogy && (genealogy.parent_links.length > 0 || genealogy.unions.length > 0)) {
    return uniqueMembers(getDescendantsForRepresentation(member, members, genealogy));
  }
  const ownChildren = directChildrenOf(members, member.id);
  const spousePartner = findSpousePartner(member, membersByName, membersById);
  const spouseChildren = spousePartner ? directChildrenOf(members, spousePartner.id) : [];
  return uniqueMembers([...ownChildren, ...spouseChildren]);
};

const hasRepresentableHeirs = (member, members, membersByName, membersById, genealogy, visited = new Set()) => {
  if (!isDeceased(member)) return true;
  if (visited.has(member.id)) return false;
  visited.add(member.id);

  return descendantsForRepresentation(member, members, membersByName, membersById, genealogy).some((descendant) =>
    hasRepresentableHeirs(descendant, members, membersByName, membersById, genealogy, new Set(visited))
  );
};

const distributeByRepresentation = (
  member,
  members,
  membersByName,
  membersById,
  shares,
  share,
  source,
  route,
  visited,
  genealogy
) => {
  const visitKey = `${source}:${member.id}`;
  if (visited.has(visitKey)) return;
  visited.add(visitKey);
  if (!isDeceased(member)) {
    addShare(shares, member, share, source, route);
    return;
  }
  const descendants = descendantsForRepresentation(member, members, membersByName, membersById, genealogy);
  const eligibleDescendants = descendants.filter((descendant) =>
    hasRepresentableHeirs(descendant, members, membersByName, membersById, genealogy)
  );
  if (!eligibleDescendants.length) return;
  const childShare = share / eligibleDescendants.length;
  eligibleDescendants.forEach((child) => {
    distributeByRepresentation(
      child,
      members,
      membersByName,
      membersById,
      shares,
      childShare,
      source,
      `${route} -> ${child.name}`,
      new Set(visited),
      genealogy
    );
  });
};

const buildPlan = (members, genealogy) => {
  const membersByName = byNameKey(members);
  const membersById = byIdKey(members);
  const causante = membersByName.get(normalizeName(caseCausanteName));
  const sharesById = new Map();

  if (causante) {
    const directDescendants = directChildrenOf(members, causante.id);
    const eligibleDirectDescendants = directDescendants.filter((descendant) =>
      hasRepresentableHeirs(descendant, members, membersByName, membersById, genealogy)
    );
    if (eligibleDirectDescendants.length) {
      const share = 100 / eligibleDirectDescendants.length;
      eligibleDirectDescendants.forEach((child) => {
        distributeByRepresentation(
          child,
          members,
          membersByName,
          membersById,
          sharesById,
          share,
          'Descendencia directa',
          `${causante.name} -> ${child.name}`,
          new Set(),
          genealogy
        );
      });
      return Array.from(sharesById.values()).sort((a, b) => b.share - a.share);
    }
  }

  const roots = activeCollateralRoots
    .map((root) => ({ ...root, member: membersByName.get(normalizeName(root.name)) }))
    .filter((r) => r.member);

  const rootShare = roots.length ? 100 / roots.length : 0;
  roots.forEach((root) => {
    distributeByRepresentation(
      root.member,
      members,
      membersByName,
      membersById,
      sharesById,
      rootShare,
      root.label,
      root.member.name,
      new Set(),
      genealogy
    );
  });

  return Array.from(sharesById.values()).sort((a, b) => b.share - a.share);
};

async function main() {
  const envFile = process.env.ENV_FILE || path.join(process.cwd(), '.env');
  const env = parseEnvFile(envFile);
  console.log(`Auditoría cálculo filiación — ${envFile}\n`);

  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  });

  const [members] = await conn.query(
    'SELECT id,name,parent_id,relationship_to_parent,spouse,spouse_member_id,death,inheritance_status FROM sienna_family_members'
  );
  const [unions] = await conn.query(
    'SELECT id,partner_a_member_id,partner_b_member_id,is_inconsistent,inconsistency_reason FROM family_unions'
  );
  const [parent_links] = await conn.query(
    'SELECT id,child_member_id,parent_member_id,union_id,is_inconsistent,inconsistency_reason FROM member_parent_links'
  );
  await conn.end();

  const genealogy = { unions, parent_links };
  const legacyPlan = buildPlan(members, null);
  const genealogyPlan = buildPlan(members, genealogy);

  const toMap = (plan) => new Map(plan.map((s) => [s.member.id, s]));
  const legacyMap = toMap(legacyPlan);
  const geneMap = toMap(genealogyPlan);

  const diffs = [];
  const allIds = new Set([...legacyMap.keys(), ...geneMap.keys()]);
  for (const id of allIds) {
    const a = legacyMap.get(id);
    const b = geneMap.get(id);
    const shareA = a?.share || 0;
    const shareB = b?.share || 0;
    if (Math.abs(shareA - shareB) > 0.0001) {
      diffs.push({
        name: (b || a).member.name,
        legacy: shareA,
        genealogy: shareB,
        delta: compactShare(shareB - shareA),
      });
    }
  }

  const totalLegacy = compactShare(legacyPlan.reduce((s, i) => s + i.share, 0));
  const totalGene = compactShare(genealogyPlan.reduce((s, i) => s + i.share, 0));

  const inconsistentUnions = unions.filter((u) => u.is_inconsistent);
  const inconsistentLinks = parent_links.filter((l) => l.is_inconsistent);

  const childrenWithoutLinks = members.filter(
    (m) =>
      isChildRelationship(m) &&
      !parent_links.some((l) => normalizedId(l.child_member_id) === normalizedId(m.id))
  );

  const deceasedWithChildrenLegacyOnly = [];
  for (const m of members) {
    if (!isDeceased(m)) continue;
    const legacyKids = descendantsForRepresentation(m, members, byNameKey(members), byIdKey(members), null);
    const geneKids = descendantsForRepresentation(m, members, byNameKey(members), byIdKey(members), genealogy);
    if (legacyKids.length !== geneKids.length) {
      deceasedWithChildrenLegacyOnly.push({
        name: m.name,
        legacyCount: legacyKids.length,
        genealogyCount: geneKids.length,
        legacyKids: legacyKids.map((c) => c.name),
        genealogyKids: geneKids.map((c) => c.name),
      });
    }
  }

  console.log('=== Datos ===');
  console.log(`Miembros: ${members.length}`);
  console.log(`Uniones: ${unions.length} (inconsistentes: ${inconsistentUnions.length})`);
  console.log(`Vínculos filiación: ${parent_links.length} (inconsistentes: ${inconsistentLinks.length})`);
  console.log(`Hijos sin member_parent_links: ${childrenWithoutLinks.length}`);

  console.log('\n=== Totales reparto ===');
  console.log(`Legacy (como CalculoFiliacion hoy): ${totalLegacy}%`);
  console.log(`Con genealogía (como Explicación Sienna): ${totalGene}%`);

  console.log('\n=== Herederos activos (con genealogía) ===');
  genealogyPlan.forEach((s) => {
    console.log(`  ${s.member.name}: ${s.share}% [${s.sourceBreakdown.map((b) => `${b.source} ${b.share}%`).join('; ')}]`);
  });

  if (diffs.length) {
    console.log('\n=== ANOMALÍA: diferencias legacy vs genealogía ===');
    diffs
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .forEach((d) => console.log(`  ${d.name}: legacy ${d.legacy}% → genealogía ${d.genealogy}% (Δ ${d.delta}%)`));
  } else {
    console.log('\n=== Porcentajes idénticos entre legacy y genealogía ===');
  }

  if (deceasedWithChildrenLegacyOnly.length) {
    console.log('\n=== ANOMALÍA: descendientes distintos por nodo fallecido ===');
    deceasedWithChildrenLegacyOnly.slice(0, 15).forEach((row) => {
      console.log(`  ${row.name}: legacy ${row.legacyCount} hijos vs genealogía ${row.genealogyCount}`);
      if (row.legacyCount !== row.genealogyCount) {
        console.log(`    legacy: ${row.legacyKids.join(', ') || '—'}`);
        console.log(`    genealogía: ${row.genealogyKids.join(', ') || '—'}`);
      }
    });
  }

  if (inconsistentUnions.length) {
    console.log('\n=== Uniones inconsistentes (datos) ===');
    inconsistentUnions.slice(0, 10).forEach((u) =>
      console.log(`  ${u.id}: ${u.inconsistency_reason || 'sin motivo'}`)
    );
  }

  if (Math.abs(totalGene - 100) > 0.01) {
    console.log(`\n=== ANOMALÍA: total no suma 100% (${totalGene}%) ===`);
    console.log(`Porcentaje sin asignar: ${compactShare(100 - totalGene)}%`);
  }

  if (childrenWithoutLinks.length) {
    console.log('\n=== Hijos sin vínculo de filiación ===');
    childrenWithoutLinks.forEach((c) =>
      console.log(`  ${c.name} (parent_id: ${c.parent_id || '—'})`)
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
