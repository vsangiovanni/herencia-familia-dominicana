import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { enrichSiennaMembersWithEffectiveInheritance } from './siennaMemberInheritance.js';

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 3001);
const jwtSecret = process.env.JWT_SECRET || 'herencia-rd-local-dev-secret';
const cookieName = 'herencia_session';
const distPath = path.join(process.cwd(), 'dist');

app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'herencia_rd',
  namedPlaceholders: true,
  multipleStatements: true,
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
});

const publicProfile = (profile) => profile && ({
  id: profile.id,
  email: profile.email,
  full_name: profile.full_name,
  phone: profile.phone,
  role: profile.role,
  is_approved: Boolean(profile.is_approved),
  created_at: profile.created_at,
  updated_at: profile.updated_at,
});

const signToken = (profile) => jwt.sign(
  { sub: profile.id, email: profile.email, role: profile.role },
  jwtSecret,
  { expiresIn: '7d' }
);

const setSessionCookie = (res, token) => {
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

const normalizedMemberId = (value) => String(value || '').trim();

const buildUnionId = (partnerA, partnerB) => {
  const ids = [normalizedMemberId(partnerA), normalizedMemberId(partnerB)].filter(Boolean).sort();
  return ids.length === 2 ? `union-${ids[0]}-${ids[1]}` : `union-${ids[0] || 'solo'}`;
};

const buildParentLinkId = (childId, parentId, unionId = null) => {
  const base = `link-${normalizedMemberId(childId)}-${normalizedMemberId(parentId)}`;
  return unionId ? `${base}-${normalizedMemberId(unionId)}` : base;
};

const mapUnionRow = (row) => ({
  ...row,
  is_inconsistent: Boolean(row.is_inconsistent),
});

const mapParentLinkRow = (row) => ({
  ...row,
  is_primary_line: Boolean(row.is_primary_line),
  is_inconsistent: Boolean(row.is_inconsistent),
});

async function loadGenealogyBundle() {
  const unions = await query('SELECT * FROM family_unions ORDER BY partner_a_member_id, partner_b_member_id');
  const parentLinks = await query('SELECT * FROM member_parent_links ORDER BY child_member_id, parent_member_id');
  return {
    unions: unions.map(mapUnionRow),
    parent_links: parentLinks.map(mapParentLinkRow),
  };
}

const siennaInheritanceDeps = () => ({
  normalizeSiennaName,
  buildApiInheritancePlan,
  getDescendantsForRepresentation,
  isDeceasedMember,
});

async function loadSiennaFamilyBundle() {
  const members = await query(
    `SELECT sfm.id, sfm.parent_id, sfm.relationship_to_parent, sfm.name, sfm.birth, sfm.death, sfm.spouse_member_id, sfm.spouse, sfm.spouse_birth,
            sfm.inheritance_status, sfm.inheritance_reason, sfm.is_highlighted_ancestor, sfm.sort_order,
            sfm.created_by, sfm.updated_by, sfm.created_at, sfm.updated_at,
            creator.email AS created_by_email, creator.full_name AS created_by_name,
            updater.email AS updated_by_email, updater.full_name AS updated_by_name
     FROM sienna_family_members sfm
     LEFT JOIN profiles creator ON creator.id = sfm.created_by
     LEFT JOIN profiles updater ON updater.id = sfm.updated_by
     ORDER BY COALESCE(parent_id, ''), sort_order, name`
  );
  const genealogy = await loadGenealogyBundle();
  const normalizedMembers = members.map((member) => ({
    ...member,
    is_highlighted_ancestor: Boolean(member.is_highlighted_ancestor),
    sort_order: Number(member.sort_order || 0),
  }));
  const settings = await loadAppSettings();
  const enrichedMembers = enrichSiennaMembersWithEffectiveInheritance(
    normalizedMembers,
    genealogy,
    settings,
    siennaInheritanceDeps()
  );

  return {
    members: enrichedMembers,
    ...genealogy,
  };
}

async function loadAppSettings() {
  const rows = await query('SELECT setting_key, setting_value FROM app_settings');
  return rows.reduce((acc, row) => {
    if (row.setting_key === 'sienna_case_config' && row.setting_value) {
      try {
        acc[row.setting_key] = JSON.parse(row.setting_value);
      } catch {
        acc[row.setting_key] = null;
      }
    } else {
      acc[row.setting_key] = row.setting_value;
    }
    return acc;
  }, {});
}

async function loadConfirmedHeirs(includeMedia = false) {
  const photoSelect = includeMedia
    ? 'h.photo_data'
    : '(CASE WHEN h.photo_data IS NOT NULL AND CHAR_LENGTH(h.photo_data) > 0 THEN 1 ELSE 0 END) AS has_photo';
  const heirs = await query(
    `SELECT h.id, h.sienna_member_id, h.heir_name, h.relationship_summary, h.line_vincenzo, h.line_paolo,
            h.status, h.notes, h.photo_file_name, h.photo_file_type,
            h.inheritance_amount, h.created_by, h.updated_by, h.created_at, h.updated_at,
            ${photoSelect},
            creator.email AS created_by_email, creator.full_name AS created_by_name,
            updater.email AS updated_by_email, updater.full_name AS updated_by_name,
            COUNT(ed.id) AS evidence_count
     FROM confirmed_heirs h
     LEFT JOIN evidence_documents ed ON ed.related_heir_name = h.heir_name OR ed.related_member_id = h.sienna_member_id
     LEFT JOIN profiles creator ON creator.id = h.created_by
     LEFT JOIN profiles updater ON updater.id = h.updated_by
     GROUP BY h.id
     ORDER BY h.heir_name`
  );

  return heirs.map((heir) => ({
    ...heir,
    line_vincenzo: Boolean(heir.line_vincenzo),
    line_paolo: Boolean(heir.line_paolo),
    has_photo: includeMedia ? undefined : Boolean(heir.has_photo),
    inheritance_amount: Number(heir.inheritance_amount || 0),
    evidence_count: Number(heir.evidence_count || 0),
  }));
}

async function loadConfirmedHeirById(id, includeMedia = false) {
  const photoSelect = includeMedia
    ? 'h.photo_data'
    : '(CASE WHEN h.photo_data IS NOT NULL AND CHAR_LENGTH(h.photo_data) > 0 THEN 1 ELSE 0 END) AS has_photo';
  const rows = await query(
    `SELECT h.id, h.sienna_member_id, h.heir_name, h.relationship_summary, h.line_vincenzo, h.line_paolo,
            h.status, h.notes, h.photo_file_name, h.photo_file_type,
            h.inheritance_amount, h.created_by, h.updated_by, h.created_at, h.updated_at,
            ${photoSelect},
            creator.email AS created_by_email, creator.full_name AS created_by_name,
            updater.email AS updated_by_email, updater.full_name AS updated_by_name,
            COUNT(ed.id) AS evidence_count
     FROM confirmed_heirs h
     LEFT JOIN evidence_documents ed ON ed.related_heir_name = h.heir_name OR ed.related_member_id = h.sienna_member_id
     LEFT JOIN profiles creator ON creator.id = h.created_by
     LEFT JOIN profiles updater ON updater.id = h.updated_by
     WHERE h.id = :id
     GROUP BY h.id
     LIMIT 1`,
    { id }
  );
  const heir = rows[0];
  if (!heir) return null;
  return {
    ...heir,
    line_vincenzo: Boolean(heir.line_vincenzo),
    line_paolo: Boolean(heir.line_paolo),
    has_photo: includeMedia ? undefined : Boolean(heir.has_photo),
    inheritance_amount: Number(heir.inheritance_amount || 0),
    evidence_count: Number(heir.evidence_count || 0),
  };
}

async function loadEvidenceDocuments(includeMedia = false) {
  const select = includeMedia
    ? `SELECT *`
    : `SELECT id, title, document_type, primary_member_id, primary_person, event_date, event_place,
              father_member_id, father_name, mother_member_id, mother_name, spouse_member_id, spouse_name,
              related_member_id, related_heir_name, confirms_heir, people_involved, notes, file_name, file_type,
              created_by, updated_by, created_at, updated_at,
              (CASE WHEN file_data IS NOT NULL AND CHAR_LENGTH(file_data) > 0 THEN 1 ELSE 0 END) AS has_file,
              (CASE WHEN extracted_text IS NOT NULL AND CHAR_LENGTH(extracted_text) > 0 THEN 1 ELSE 0 END) AS has_extracted_text`;
  const documents = await query(`${select} FROM evidence_documents ORDER BY created_at DESC`);

  return documents.map((document) => ({
    ...document,
    confirms_heir: Boolean(document.confirms_heir),
    people_involved: (() => {
      if (!document.people_involved) return [];
      try {
        const parsed = JSON.parse(document.people_involved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
    has_file: includeMedia ? undefined : Boolean(document.has_file),
    has_extracted_text: includeMedia ? undefined : Boolean(document.has_extracted_text),
  }));
}

async function loadEvidenceDocumentById(id) {
  const documents = await query('SELECT * FROM evidence_documents WHERE id = :id LIMIT 1', { id });
  if (!documents[0]) return null;

  const document = documents[0];
  return {
    ...document,
    confirms_heir: Boolean(document.confirms_heir),
    people_involved: (() => {
      if (!document.people_involved) return [];
      try {
        const parsed = JSON.parse(document.people_involved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
  };
}

const normalizeSiennaName = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const resolveEstateAmounts = (grossInput, lawyerFeeInput) => {
  const grossAmount = Math.max(0, Number(grossInput || 0));
  const lawyerFeePercentage = Math.min(100, Math.max(0, Number(lawyerFeeInput || 0)));
  const lawyerFeeAmount = grossAmount > 0 ? roundMoney(grossAmount * (lawyerFeePercentage / 100)) : 0;
  const distributableAmount = grossAmount > 0 ? roundMoney(Math.max(0, grossAmount - lawyerFeeAmount)) : 0;
  return { grossAmount, lawyerFeePercentage, lawyerFeeAmount, distributableAmount };
};

const isChildRelationship = (member) =>
  member.relationship_to_parent === 'hijo' ||
  member.relationship_to_parent === 'hija' ||
  member.relationship_to_parent === 'otro' ||
  !member.relationship_to_parent;
const isDeceasedMember = (member) => Boolean(String(member.death || '').trim());

const uniqueMembers = (members) => {
  const seen = new Set();
  return members.filter((member) => {
    if (seen.has(member.id)) return false;
    seen.add(member.id);
    return true;
  });
};

const getParentLinksForChild = (childId, links) =>
  links.filter((link) => normalizedMemberId(link.child_member_id) === normalizedMemberId(childId));
const getParentLinksForParent = (parentId, links) =>
  links.filter((link) => normalizedMemberId(link.parent_member_id) === normalizedMemberId(parentId));
const getChildIdsFromLinks = (parentId, links) =>
  Array.from(new Set(getParentLinksForParent(parentId, links).map((link) => normalizedMemberId(link.child_member_id)).filter(Boolean)));

const findUnionBetween = (memberAId, memberBId, unions) => {
  const a = normalizedMemberId(memberAId);
  const b = normalizedMemberId(memberBId);
  if (!a || !b) return null;
  return unions.find((union) => {
    const pa = normalizedMemberId(union.partner_a_member_id);
    const pb = normalizedMemberId(union.partner_b_member_id);
    return (pa === a && pb === b) || (pa === b && pb === a);
  }) || null;
};

const resolveSpousePartnerForCalculation = (member, members, unions) => {
  const membersById = new Map(members.map((item) => [item.id, item]));
  const memberId = normalizedMemberId(member.id);
  if (member.spouse_member_id && membersById.has(normalizedMemberId(member.spouse_member_id))) {
    return membersById.get(normalizedMemberId(member.spouse_member_id));
  }
  for (const union of unions) {
    const partnerA = normalizedMemberId(union.partner_a_member_id);
    const partnerB = normalizedMemberId(union.partner_b_member_id);
    if (partnerA === memberId && partnerB && membersById.has(partnerB)) return membersById.get(partnerB);
    if (partnerB === memberId && partnerA && membersById.has(partnerA)) return membersById.get(partnerA);
  }
  return members.find((candidate) => candidate.id !== member.id && normalizedMemberId(candidate.spouse_member_id) === memberId) || null;
};

const getChildrenByUnionId = (unionId, members, links) => {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const childIds = Array.from(new Set(
    links
      .filter((link) => normalizedMemberId(link.union_id) === normalizedMemberId(unionId))
      .map((link) => normalizedMemberId(link.child_member_id))
      .filter(Boolean)
  ));
  return childIds.map((id) => membersById.get(id)).filter((member) => member && isChildRelationship(member));
};

const getDirectChildrenOfMember = (parentId, members, genealogy) => {
  const childMap = new Map();
  const pid = normalizedMemberId(parentId);
  members
    .filter((item) => normalizedMemberId(item.parent_id) === pid && isChildRelationship(item))
    .forEach((child) => childMap.set(child.id, child));
  if (genealogy?.parent_links?.length) {
    getChildIdsFromLinks(pid, genealogy.parent_links).forEach((childId) => {
      const child = members.find((item) => item.id === childId);
      if (child && isChildRelationship(child)) childMap.set(child.id, child);
    });
  }
  return Array.from(childMap.values());
};

const getDescendantsForRepresentation = (member, members, genealogy) => {
  const membersById = new Map(members.map((item) => [item.id, item]));
  const spousePartner = resolveSpousePartnerForCalculation(member, members, genealogy.unions || []);
  const union = spousePartner ? findUnionBetween(member.id, spousePartner.id, genealogy.unions || []) : null;
  const links = genealogy.parent_links || [];

  if (links.length > 0) {
    const childMap = new Map();
    if (union) getChildrenByUnionId(union.id, members, links).forEach((child) => childMap.set(child.id, child));

    getChildIdsFromLinks(member.id, links).forEach((childId) => {
      const child = membersById.get(childId);
      if (!child || !isChildRelationship(child)) return;
      const unionIds = getParentLinksForChild(childId, links)
        .filter((link) => normalizedMemberId(link.parent_member_id) === normalizedMemberId(member.id))
        .map((link) => link.union_id)
        .filter(Boolean);
      if (union && unionIds.includes(union.id)) return;
      if (!unionIds.length) childMap.set(child.id, child);
    });

    members.filter((item) => normalizedMemberId(item.parent_id) === normalizedMemberId(member.id) && isChildRelationship(item))
      .forEach((child) => childMap.set(child.id, child));
    if (childMap.size > 0) return uniqueMembers(Array.from(childMap.values()));
  }

  const ownChildren = members.filter((item) => normalizedMemberId(item.parent_id) === normalizedMemberId(member.id) && isChildRelationship(item));
  const spouseChildren = spousePartner
    ? members.filter((item) => normalizedMemberId(item.parent_id) === normalizedMemberId(spousePartner.id) && isChildRelationship(item))
    : [];
  return uniqueMembers([...ownChildren, ...spouseChildren]);
};

const hasRepresentableHeirs = (member, members, genealogy, visited = new Set()) => {
  if (!isDeceasedMember(member)) return true;
  if (visited.has(member.id)) return false;
  visited.add(member.id);
  return getDescendantsForRepresentation(member, members, genealogy).some((descendant) =>
    hasRepresentableHeirs(descendant, members, genealogy, new Set(visited))
  );
};

const formatPercentForCalculation = (value) =>
  `${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value)}%`;

const addCalculationShare = (shares, member, share, source, route) => {
  const roundedShare = Math.round(share * 1000000) / 1000000;
  const existing = shares.get(member.id);
  const sourceBreakdown = new Map((existing?.sourceBreakdown || []).map((item) => [item.source, { ...item }]));
  const currentSource = sourceBreakdown.get(source);
  sourceBreakdown.set(source, {
    source,
    share: Math.round(((currentSource?.share || 0) + roundedShare) * 1000000) / 1000000,
    routes: Array.from(new Set([...(currentSource?.routes || []), route])),
  });
  const sources = existing ? Array.from(new Set([...existing.sources, source])) : [source];
  const nextShare = Math.round(((existing?.share || 0) + roundedShare) * 1000000) / 1000000;
  const sourceText = sources.join(' y ');
  shares.set(member.id, {
    member,
    share: nextShare,
    sources,
    role: 'Heredero final',
    reason: sources.length > 1
      ? `Heredero por representación con vocación acumulada en las ramas ${sourceText}.`
      : `Heredero por representación dentro de la rama ${sourceText}.`,
    route: existing?.route ? `${existing.route} | ${route}` : route,
    paymentBasis: sources.length > 1
      ? `Acumula ${formatPercentForCalculation(nextShare)} por concurrencia de ramas sucesorales calculadas conforme al árbol.`
      : `Recibe ${formatPercentForCalculation(nextShare)} por la rama ${sourceText}.`,
    sourceBreakdown: Array.from(sourceBreakdown.values()).sort((left, right) => left.source.localeCompare(right.source, 'es')),
  });
};

const distributeByRepresentation = (member, members, genealogy, shares, share, source, route, visited = new Set()) => {
  const visitKey = `${source}:${member.id}`;
  if (visited.has(visitKey)) return;
  visited.add(visitKey);
  if (!isDeceasedMember(member)) {
    addCalculationShare(shares, member, share, source, route);
    return;
  }
  const eligibleDescendants = getDescendantsForRepresentation(member, members, genealogy)
    .filter((descendant) => hasRepresentableHeirs(descendant, members, genealogy));
  if (!eligibleDescendants.length) return;
  const childShare = share / eligibleDescendants.length;
  eligibleDescendants.forEach((child) =>
    distributeByRepresentation(child, members, genealogy, shares, childShare, source, `${route} -> ${child.name}`, new Set(visited))
  );
};

const buildApiInheritancePlan = (members, genealogy, settings) => {
  const membersByName = new Map(members.map((member) => [normalizeSiennaName(member.name), member]));
  const causanteName = settings?.sienna_case_config?.causante_name || 'Alessandro de Paola Sangiovanni';
  const activeRoots = settings?.sienna_case_config?.active_collateral_roots || [
    { name: 'Vincenzo (Vicente) Sangiovanni', label: 'Vincenzo/Vicente' },
    { name: 'Paolo (Paulino) Sangiovanni', label: 'Paolo/Paulino' },
  ];
  const causante = membersByName.get(normalizeSiennaName(causanteName));
  const shares = new Map();

  if (causante) {
    const directDescendants = getDirectChildrenOfMember(causante.id, members, genealogy)
      .filter((descendant) => hasRepresentableHeirs(descendant, members, genealogy));
    if (directDescendants.length) {
      const share = 100 / directDescendants.length;
      directDescendants.forEach((child) =>
        distributeByRepresentation(child, members, genealogy, shares, share, 'Descendencia directa', `${causante.name} -> ${child.name}`)
      );
    }
  }

  if (!shares.size) {
    const roots = activeRoots
      .map((root) => ({ ...root, member: membersByName.get(normalizeSiennaName(root.name)) }))
      .filter((root) => root.member);
    const rootShare = roots.length ? 100 / roots.length : 0;
    roots.forEach((root) =>
      distributeByRepresentation(root.member, members, genealogy, shares, rootShare, root.label, root.member.name)
    );
  }

  const activeHeirs = Array.from(shares.values()).sort((a, b) => b.share - a.share || a.member.name.localeCompare(b.member.name, 'es'));
  return { activeHeirs, totalShare: Math.round(activeHeirs.reduce((sum, item) => sum + item.share, 0) * 1000000) / 1000000 };
};

const buildCalculationRows = (activeHeirs, distributableAmount) => {
  const rows = activeHeirs.map((share) => ({
    member_id: share.member.id,
    heir_name: share.member.name,
    share_percent: share.share,
    amount: roundMoney(distributableAmount * (share.share / 100)),
    route: share.route,
    payment_basis: share.paymentBasis,
    reason: share.reason,
    sources: share.sources,
    source_breakdown: share.sourceBreakdown,
  }));
  const total = roundMoney(rows.reduce((sum, row) => sum + row.amount, 0));
  const delta = roundMoney(distributableAmount - total);
  if (rows.length && Math.abs(delta) >= 0.01) {
    const targetIndex = rows.reduce((best, row, index) => (row.amount > rows[best].amount ? index : best), 0);
    rows[targetIndex].amount = roundMoney(rows[targetIndex].amount + delta);
  }
  return rows;
};

async function buildSiennaRealtimeCalculation({ estateAmount, lawyerFeePercentage } = {}) {
  const family = await loadSiennaFamilyBundle();
  const settings = await loadAppSettings();
  const grossInput = estateAmount ?? settings.estate_amount ?? 0;
  const feeInput = lawyerFeePercentage ?? settings.lawyer_fee_percentage ?? 0;
  const estate = resolveEstateAmounts(grossInput, feeInput);
  const plan = buildApiInheritancePlan(family.members, { unions: family.unions, parent_links: family.parent_links }, settings);
  const rows = buildCalculationRows(plan.activeHeirs, estate.distributableAmount);
  return {
    estate,
    causante_name: settings?.sienna_case_config?.causante_name || 'Alessandro de Paola Sangiovanni',
    total_share: plan.totalShare,
    active_heirs: rows,
    active_heir_count: rows.length,
    generated_at: new Date().toISOString(),
  };
}

const parseSiennaYear = (value) => {
  const match = String(value || '').match(/(\d{4})/);
  return match ? Number(match[1]) : null;
};

const getParentIdsForAnalysis = (member, membersById, links) => {
  const ids = new Set();
  if (member.parent_id && membersById.has(normalizedMemberId(member.parent_id))) {
    ids.add(normalizedMemberId(member.parent_id));
  }
  getParentLinksForChild(member.id, links).forEach((link) => {
    const parentId = normalizedMemberId(link.parent_member_id);
    if (parentId && membersById.has(parentId)) ids.add(parentId);
  });
  return Array.from(ids);
};

const enumerateAncestorRoutes = (memberId, membersById, links, path = [], depth = 0) => {
  const member = membersById.get(memberId);
  if (!member || depth > 16) return [];
  if (path.includes(memberId)) {
    return [[...path, memberId].map((id) => membersById.get(id)).filter(Boolean)];
  }
  const nextPath = [...path, memberId];
  const parentIds = getParentIdsForAnalysis(member, membersById, links);
  if (!parentIds.length) return [nextPath.map((id) => membersById.get(id)).filter(Boolean)];
  return parentIds.flatMap((parentId) => enumerateAncestorRoutes(parentId, membersById, links, nextPath, depth + 1));
};

const routeLabel = (route) => route.map((member) => member.name).reverse().join(' -> ');

const isInformativeOnlyUnion = (union) => {
  if ((union.migration_source || '').trim() === 'spouse_text_only') return true;
  return !normalizedMemberId(union.partner_b_member_id);
};

const isUnionAuditRelevant = (union) => !isInformativeOnlyUnion(union);

const buildSiennaDualLineageAnalysis = async () => {
  const family = await loadSiennaFamilyBundle();
  const settings = await loadAppSettings();
  const calculation = await buildSiennaRealtimeCalculation();
  const members = family.members;
  const membersById = new Map(members.map((member) => [member.id, member]));
  const genealogy = { unions: family.unions, parent_links: family.parent_links };
  const activeRoots = settings?.sienna_case_config?.active_collateral_roots || [
    { name: 'Vincenzo (Vicente) Sangiovanni', label: 'Vincenzo/Vicente' },
    { name: 'Paolo (Paulino) Sangiovanni', label: 'Paolo/Paulino' },
  ];
  const rootIdsByLabel = new Map();
  activeRoots.forEach((root) => {
    const found = members.find((member) => normalizeSiennaName(member.name) === normalizeSiennaName(root.name));
    if (found) rootIdsByLabel.set(root.label || root.name, found.id);
  });

  const duplicateNames = Array.from(
    members.reduce((map, member) => {
      const key = normalizeSiennaName(member.name);
      if (!key) return map;
      map.set(key, [...(map.get(key) || []), member]);
      return map;
    }, new Map()).values()
  ).filter((items) => items.length > 1);

  const suspicious = [];
  const addIssue = (type, severity, title, detail, memberId = null, actionHref = null) => {
    suspicious.push({ id: `${type}-${suspicious.length + 1}`, type, severity, title, detail, member_id: memberId, action_href: actionHref });
  };

  duplicateNames.forEach((items) => {
    addIssue(
      'duplicate_name',
      'warning',
      'Nombre duplicado',
      `${items[0].name} aparece ${items.length} veces y puede crear rutas ambiguas.`,
      items[0].id,
      `/sienna/miembros-arbol?edit=${encodeURIComponent(items[0].id)}`
    );
  });

  family.parent_links.forEach((link) => {
    if (!membersById.has(link.child_member_id) || !membersById.has(link.parent_member_id)) {
      addIssue('invalid_link', 'critical', 'Vínculo con miembro inexistente', `Link ${link.id} referencia child/parent no disponible.`, link.child_member_id);
    }
    if (link.is_inconsistent || link.confidence === 'baja') {
      addIssue('doubtful_link', 'warning', 'Relación dudosa', link.inconsistency_reason || 'Vínculo marcado con baja confianza.', link.child_member_id, `/sienna/miembros-arbol?edit=${encodeURIComponent(link.child_member_id)}`);
    }
  });

  family.unions.forEach((union) => {
    if (!isUnionAuditRelevant(union)) return;
    if (union.is_inconsistent || union.confidence === 'baja') {
      addIssue('doubtful_union', 'warning', 'Unión por validar', union.inconsistency_reason || 'Unión marcada como inconsistente o de baja confianza.', union.partner_a_member_id, `/sienna/miembros-arbol?edit=${encodeURIComponent(union.partner_a_member_id)}`);
    }
  });

  members.forEach((member) => {
    const birthYear = parseSiennaYear(member.birth);
    const deathYear = parseSiennaYear(member.death);
    if (birthYear && deathYear && deathYear < birthYear) {
      addIssue('date_conflict', 'critical', 'Fecha incoherente', `${member.name} tiene defunción anterior al nacimiento.`, member.id, `/sienna/miembros-arbol?edit=${encodeURIComponent(member.id)}`);
    }
    getParentIdsForAnalysis(member, membersById, family.parent_links).forEach((parentId) => {
      const parent = membersById.get(parentId);
      const parentBirth = parseSiennaYear(parent?.birth);
      if (birthYear && parentBirth && birthYear - parentBirth < 12) {
        addIssue('impossible_parent_age', 'warning', 'Edad parental sospechosa', `${parent.name} tendría menos de 12 años al nacer ${member.name}.`, member.id, `/sienna/miembros-arbol?edit=${encodeURIComponent(member.id)}`);
      }
    });
  });

  const dualCases = members.map((member) => {
    const routes = enumerateAncestorRoutes(member.id, membersById, family.parent_links);
    const routesByRoot = Array.from(rootIdsByLabel.entries()).flatMap(([label, rootId]) =>
      routes
        .filter((route) => route.some((item) => item.id === rootId))
        .map((route) => ({
          source: label,
          root_id: rootId,
          path: route.slice().reverse().map((item) => ({
            id: item.id,
            name: item.name,
            birth: item.birth,
            death: item.death,
            is_deceased: isDeceasedMember(item),
          })),
          label: routeLabel(route),
          depth: Math.max(0, route.length - 1),
        }))
    );
    const sources = Array.from(new Set(routesByRoot.map((route) => route.source)));
    const ancestorCounts = new Map();
    routesByRoot.forEach((route) => route.path.forEach((node) => {
      if (node.id !== member.id) ancestorCounts.set(node.id, (ancestorCounts.get(node.id) || 0) + 1);
    }));
    const sharedAncestors = Array.from(ancestorCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([id, count]) => ({ ...membersById.get(id), route_count: count }))
      .filter(Boolean);
    const calculationRow = calculation.active_heirs.find((row) => row.member_id === member.id);
    const isDualByCalculation = (calculationRow?.sources || []).length > 1;
    if (sources.length < 2 && !isDualByCalculation && sharedAncestors.length < 2) return null;
    const distributableAmount = calculation.estate.distributableAmount;
    const sourceAmounts = (calculationRow?.source_breakdown || []).map((segment) => ({
      source: segment.source,
      share_percent: segment.share,
      amount: roundMoney(distributableAmount * (segment.share / 100)),
      routes: segment.routes || [],
    }));
    const complexityScore = Math.min(100, sources.length * 26 + routesByRoot.length * 8 + sharedAncestors.length * 6 + suspicious.filter((issue) => issue.member_id === member.id).length * 10);
    return {
      member: {
        id: member.id,
        name: member.name,
        birth: member.birth,
        death: member.death,
        is_deceased: isDeceasedMember(member),
        inheritance_status: member.inheritance_status,
      },
      sources: sources.length ? sources : calculationRow?.sources || [],
      route_count: routesByRoot.length || (calculationRow?.source_breakdown || []).reduce((sum, item) => sum + item.routes.length, 0),
      generation_depth: routesByRoot.length ? Math.max(...routesByRoot.map((route) => route.depth)) : 0,
      complexity_score: complexityScore,
      complexity_level: complexityScore >= 70 ? 'alta' : complexityScore >= 42 ? 'media' : 'baja',
      convergence_point: sharedAncestors[0] ? { id: sharedAncestors[0].id, name: sharedAncestors[0].name } : null,
      shared_ancestors: sharedAncestors.slice(0, 8).map((ancestor) => ({
        id: ancestor.id,
        name: ancestor.name,
        birth: ancestor.birth,
        death: ancestor.death,
        route_count: ancestor.route_count,
        is_deceased: isDeceasedMember(ancestor),
      })),
      routes: routesByRoot,
      calculation_routes: calculationRow?.source_breakdown || [],
      source_amounts: sourceAmounts,
      inherits: Boolean(calculationRow),
      inheritance_share: calculationRow?.share_percent ?? null,
      inheritance_amount: calculationRow?.amount ?? null,
      issues: suspicious.filter((issue) => issue.member_id === member.id),
      explanation: `${member.name} presenta doble linaje porque conecta con ${(sources.length ? sources : calculationRow?.sources || []).join(' y ')} por rutas familiares distintas. Revise cada ruta para validar el punto de convergencia y los nodos intermedios.`,
      tree_href: `/sienna/arbol-genealogico?member=${encodeURIComponent(member.id)}`,
      edit_href: `/sienna/miembros-arbol?edit=${encodeURIComponent(member.id)}`,
    };
  }).filter(Boolean).sort((a, b) => (b.inheritance_amount || 0) - (a.inheritance_amount || 0) || b.complexity_score - a.complexity_score || a.member.name.localeCompare(b.member.name, 'es'));

  const ancestorCrossCounts = new Map();
  dualCases.forEach((item) => item.shared_ancestors.forEach((ancestor) => {
    ancestorCrossCounts.set(ancestor.id, {
      id: ancestor.id,
      name: ancestor.name,
      count: (ancestorCrossCounts.get(ancestor.id)?.count || 0) + 1,
    });
  }));

  return {
    generated_at: new Date().toISOString(),
    summary: {
      members_total: members.length,
      dual_lineage_total: dualCases.length,
      convergence_total: dualCases.filter((item) => item.convergence_point).length,
      suspicious_total: suspicious.length,
      critical_total: suspicious.filter((item) => item.severity === 'critical').length,
      pending_validation_total: suspicious.filter((item) => item.severity !== 'info').length,
    },
    root_labels: Array.from(rootIdsByLabel.keys()),
    dual_cases: dualCases,
    top_ancestors: Array.from(ancestorCrossCounts.values()).sort((a, b) => b.count - a.count).slice(0, 10),
    inconsistencies: suspicious,
    audit_policy: {
      mode: 'controlled',
      message:
        'Esta consola no modifica relaciones automáticamente. El cónyuge en texto es solo referencia documental; las uniones formales dependen de spouse_member_id. Las correcciones se ejecutan desde Miembros del Árbol.',
    },
  };
};

const getUnionsForMember = (memberId, unions) => {
  const id = normalizedMemberId(memberId);
  return unions.filter((union) =>
    normalizedMemberId(union.partner_a_member_id) === id ||
    normalizedMemberId(union.partner_b_member_id) === id
  );
};

const formatUnionLabelForApi = (union, membersById) => {
  const a = membersById.get(normalizedMemberId(union.partner_a_member_id))?.name || '—';
  const b = union.partner_b_member_id
    ? membersById.get(normalizedMemberId(union.partner_b_member_id))?.name || '—'
    : 'sin segunda persona';
  const type = union.union_type === 'matrimonio'
    ? 'Matrimonio'
    : union.union_type === 'union_libre'
      ? 'Unión libre'
      : 'Unión';
  return `${type}: ${a} y ${b}`;
};

const buildUnionOptionsForParent = (parentId, unions, membersById) =>
  getUnionsForMember(parentId, unions)
    .map((union) => ({
      id: union.id,
      label: `${formatUnionLabelForApi(union, membersById)}${union.is_inconsistent ? ' (inconsistente)' : ''}`,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, 'es', { sensitivity: 'base' }));

const buildSecondParentOptions = (parentId, unionId, members, unions) => {
  if (!unionId) return [];
  const membersById = new Map(members.map((member) => [member.id, member]));
  const union = unions.find((item) => item.id === unionId);
  if (!union || !membersById.has(parentId)) return [];
  const otherId = union.partner_a_member_id === parentId ? union.partner_b_member_id : union.partner_a_member_id;
  return otherId && membersById.has(otherId) ? [{ id: otherId, name: membersById.get(otherId).name }] : [];
};

const isFindingChildMember = (member) => {
  const relationship = member.relationship_to_parent;
  return relationship === 'hijo' || relationship === 'hija' || relationship == null || relationship === '';
};

const buildSiennaMemberIssueRows = async () => {
  const family = await loadSiennaFamilyBundle();
  const calculation = await buildSiennaRealtimeCalculation();
  const members = family.members;
  const unions = family.unions;
  const parentLinks = family.parent_links;
  const genealogy = { unions, parent_links: parentLinks };
  const membersById = new Map(members.map((member) => [member.id, member]));
  const rows = [];

  members.forEach((child) => {
    if (!isFindingChildMember(child) || !child.parent_id) return;
    if (getParentLinksForChild(child.id, parentLinks).length > 0) return;
    const parent = membersById.get(child.parent_id);
    rows.push({
      id: `sync-link-${child.id}`,
      memberId: child.id,
      memberName: child.name,
      kind: 'sync_parent_link',
      severity: 'Alta prioridad',
      problem: 'Es hijo/hija en el árbol visual pero no tiene vínculo formal de filiación en la base de datos.',
      solution: 'Guarde para crear el vínculo por parent_id. La unión matrimonial es opcional si proviene de otra relación.',
      context: parent ? `Superior en árbol: ${parent.name}` : undefined,
      defaults: { spouseMemberId: '', filiationUnionId: '', secondParentId: '' },
      spouseOptions: [],
      unionOptions: parent ? buildUnionOptionsForParent(parent.id, unions, membersById) : [],
      secondParentOptions: [],
    });
  });

  members.forEach((child) => {
    if (!isFindingChildMember(child) || !child.parent_id) return;
    const links = getParentLinksForChild(child.id, parentLinks);
    if (!links.length) return;
    const parent = membersById.get(child.parent_id);
    if (!parent) return;
    const unionOptions = buildUnionOptionsForParent(parent.id, unions, membersById).filter((option) => !option.label.includes('inconsistente'));
    const inconsistentUnion = links
      .map((link) => unions.find((union) => union.id === link.union_id))
      .find((union) => Boolean(union?.is_inconsistent));
    if (!inconsistentUnion) return;
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
      context: inconsistentUnion.inconsistency_reason || `Unión actual: ${formatUnionLabelForApi(inconsistentUnion, membersById)}`,
      defaults: { spouseMemberId: '', filiationUnionId: defaultUnion, secondParentId: secondParentOptions[0]?.id || '' },
      spouseOptions: [],
      unionOptions,
      secondParentOptions,
    });
  });

  members.forEach((member) => {
    if (!isDeceasedMember(member)) return;
    if (getDescendantsForRepresentation(member, members, genealogy).length > 0) return;
    const referencedAsParent =
      members.some((candidate) => normalizedMemberId(candidate.parent_id) === member.id) ||
      parentLinks.some((link) => normalizedMemberId(link.parent_member_id) === member.id);
    if (!referencedAsParent) return;
    rows.push({
      id: `dead-branch-${member.id}`,
      memberId: member.id,
      memberName: member.name,
      kind: 'dead_branch',
      severity: 'Media prioridad',
      problem: 'Está fallecido, aparece como progenitor en el árbol, pero no tiene descendientes registrados.',
      solution: 'Agregue hijos faltantes en Miembros del árbol o corrija el parentesco. Sin descendencia, la cuota sucesoral de esta rama no se reparte.',
      context: member.death ? `Fallecido: ${member.death}` : undefined,
      defaults: { spouseMemberId: '', filiationUnionId: '', secondParentId: '' },
      spouseOptions: [],
      unionOptions: [],
      secondParentOptions: [],
    });
  });

  const severityRank = (value) => value === 'Alta prioridad' ? 0 : value === 'Media prioridad' ? 1 : 2;
  rows.sort((left, right) =>
    severityRank(left.severity) - severityRank(right.severity) ||
    left.memberName.localeCompare(right.memberName, 'es') ||
    left.kind.localeCompare(right.kind)
  );
  const byKind = rows.reduce((acc, row) => {
    acc[row.kind] += 1;
    return acc;
  }, { sync_parent_link: 0, complete_filiation: 0, dead_branch: 0 });
  const distributedPercent = Number(calculation.total_share || 0);
  return {
    rows,
    summary: {
      undistributedPercent: Math.max(0, 100 - distributedPercent),
      distributedPercent,
      totalIssues: rows.length,
      membersAffected: new Set(rows.map((row) => row.memberId)).size,
      byKind,
    },
    generated_at: new Date().toISOString(),
    source: 'api',
  };
};

const buildSiennaAnalysisSummary = async () => {
  const family = await loadSiennaFamilyBundle();
  const calculation = await buildSiennaRealtimeCalculation();
  const dual = await buildSiennaDualLineageAnalysis();
  const findings = await buildSiennaMemberIssueRows();
  return {
    generated_at: new Date().toISOString(),
    members_total: family.members.length,
    active_heir_count: calculation.active_heir_count,
    total_share: calculation.total_share,
    estate: calculation.estate,
    dual_lineage_total: dual.summary.dual_lineage_total,
    pending_findings_total: findings.summary.totalIssues,
    pending_validation_total: dual.summary.pending_validation_total,
    backend_contract: {
      source: 'api',
      message: 'Las pantallas Sienna deben consumir este API como fuente única; el frontend no debe recalcular reglas sucesorales.',
    },
  };
};

async function syncMemberFiliation({
  memberId,
  parentId,
  relationshipToParent,
  filiation,
}) {
  const isChild =
    relationshipToParent === 'hijo' ||
    relationshipToParent === 'hija' ||
    !relationshipToParent;

  if (!isChild || !parentId) {
    await query('DELETE FROM member_parent_links WHERE child_member_id = :childId', { childId: memberId });
    return;
  }

  const unionId = filiation?.union_id ? normalizedMemberId(filiation.union_id) : null;
  const secondParentId = filiation?.second_parent_id ? normalizedMemberId(filiation.second_parent_id) : null;
  const secondParentRole = ['padre', 'madre', 'progenitor'].includes(filiation?.second_parent_role)
    ? filiation.second_parent_role
    : 'progenitor';

  const primaryRole =
    relationshipToParent === 'hija' ? 'madre' : relationshipToParent === 'hijo' ? 'padre' : 'progenitor';

  await query('DELETE FROM member_parent_links WHERE child_member_id = :childId', { childId: memberId });

  await query(
    `INSERT INTO member_parent_links (
       id, child_member_id, parent_member_id, parent_role, union_id, link_type,
       is_primary_line, migration_source, confidence, is_inconsistent, inconsistency_reason
     )
     VALUES (
       :id, :childId, :parentId, :parentRole, :unionId, 'biologico',
       TRUE, 'form_sync', 'alta', FALSE, NULL
     )
     ON DUPLICATE KEY UPDATE
       parent_role = VALUES(parent_role),
       union_id = VALUES(union_id),
       is_primary_line = VALUES(is_primary_line),
       migration_source = VALUES(migration_source),
       confidence = VALUES(confidence),
       updated_at = CURRENT_TIMESTAMP`,
    {
      id: buildParentLinkId(memberId, parentId, unionId),
      childId: memberId,
      parentId,
      parentRole: primaryRole,
      unionId,
    }
  );

  if (secondParentId && secondParentId !== parentId) {
    await query(
      `INSERT INTO member_parent_links (
         id, child_member_id, parent_member_id, parent_role, union_id, link_type,
         is_primary_line, migration_source, confidence, is_inconsistent, inconsistency_reason
       )
       VALUES (
         :id, :childId, :parentId, :parentRole, :unionId, 'biologico',
         FALSE, 'form_sync', 'alta', FALSE, NULL
       )
       ON DUPLICATE KEY UPDATE
         parent_role = VALUES(parent_role),
         union_id = VALUES(union_id),
         migration_source = VALUES(migration_source),
         confidence = VALUES(confidence),
         updated_at = CURRENT_TIMESTAMP`,
      {
        id: buildParentLinkId(memberId, secondParentId, unionId),
        childId: memberId,
        parentId: secondParentId,
        parentRole: secondParentRole,
        unionId,
      }
    );
  }
}

async function getProfileById(id) {
  const rows = await query('SELECT * FROM profiles WHERE id = :id LIMIT 1', { id });
  return rows[0] || null;
}

async function requireAuth(req, res, next) {
  try {
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies[cookieName] || headerToken;
    if (!token) return res.status(401).json({ message: 'No autenticado' });

    const payload = jwt.verify(token, jwtSecret);
    const profile = await getProfileById(payload.sub);
    if (!profile) return res.status(401).json({ message: 'Sesión inválida' });
    const allowUnapprovedPaths = new Set([
      '/api/auth/session',
      '/api/auth/password',
      '/api/profiles/me',
    ]);
    const isApproved = Boolean(profile.is_approved);
    const isAdmin = profile.role === 'admin';
    if (!isAdmin && !isApproved && !allowUnapprovedPaths.has(req.path)) {
      return res.status(403).json({ message: 'Tu cuenta aún no ha sido aprobada por un administrador.' });
    }

    req.user = publicProfile(profile);
    next();
  } catch {
    res.status(401).json({ message: 'Sesión inválida' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso no autorizado' });
  }
  next();
}

async function ensureDatabase() {
  const schemaPath = path.join(process.cwd(), 'server', 'schema.sql');
  const schema = fs
    .readFileSync(schemaPath, 'utf8')
    .replace(/^CREATE DATABASE IF NOT EXISTS\s+[^;]+;\s*/i, '')
    .replace(/^USE\s+[^;]+;\s*/i, '');
  const bootstrap = await mysql.createConnection({
    ...dbConfig,
    database: undefined,
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await bootstrap.end();

  const schemaConnection = await mysql.createConnection(dbConfig);
  await schemaConnection.query(schema);
  await schemaConnection.end();
}

async function syncRegularUserPageAccess(pagePath) {
  const pageRows = await query('SELECT id FROM pages WHERE path = :path LIMIT 1', { path: pagePath });
  const page = pageRows[0];
  if (!page) return;

  const users = await query("SELECT id FROM profiles WHERE role <> 'admin' AND is_approved = 1");
  for (const userRow of users) {
    await query(
      `INSERT IGNORE INTO user_page_permissions (id, user_id, page_id, created_by)
       VALUES (:id, :userId, :pageId, :createdBy)`,
      { id: randomUUID(), userId: userRow.id, pageId: page.id, createdBy: userRow.id }
    );
  }
}

async function ensureSchemaMigrations() {
  const columns = await query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = :databaseName AND TABLE_NAME = 'confirmed_heirs'`,
    { databaseName: dbConfig.database }
  );
  const existing = new Set(columns.map((column) => column.COLUMN_NAME));
  const migrations = [
    ['sienna_member_id', 'ALTER TABLE confirmed_heirs ADD COLUMN sienna_member_id VARCHAR(120) NULL UNIQUE AFTER id'],
    ['photo_file_name', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_file_name VARCHAR(255) NULL AFTER notes'],
    ['photo_file_type', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_file_type VARCHAR(120) NULL AFTER photo_file_name'],
    ['photo_data', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_data LONGTEXT NULL AFTER photo_file_type'],
    ['inheritance_amount', 'ALTER TABLE confirmed_heirs ADD COLUMN inheritance_amount DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER photo_data'],
    ['created_by', 'ALTER TABLE confirmed_heirs ADD COLUMN created_by CHAR(36) NULL AFTER inheritance_amount'],
    ['updated_by', 'ALTER TABLE confirmed_heirs ADD COLUMN updated_by CHAR(36) NULL AFTER created_by'],
  ];

  for (const [columnName, sql] of migrations) {
    if (!existing.has(columnName)) await query(sql);
  }

  const evidenceColumns = await query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = :databaseName AND TABLE_NAME = 'evidence_documents'`,
    { databaseName: dbConfig.database }
  );
  const existingEvidenceColumns = new Set(evidenceColumns.map((column) => column.COLUMN_NAME));
  if (!existingEvidenceColumns.has('primary_member_id')) {
    await query('ALTER TABLE evidence_documents ADD COLUMN primary_member_id VARCHAR(120) NULL AFTER document_type');
  }
  if (!existingEvidenceColumns.has('father_member_id')) {
    await query('ALTER TABLE evidence_documents ADD COLUMN father_member_id VARCHAR(120) NULL AFTER event_place');
  }
  if (!existingEvidenceColumns.has('mother_member_id')) {
    await query('ALTER TABLE evidence_documents ADD COLUMN mother_member_id VARCHAR(120) NULL AFTER father_name');
  }
  if (!existingEvidenceColumns.has('spouse_member_id')) {
    await query('ALTER TABLE evidence_documents ADD COLUMN spouse_member_id VARCHAR(120) NULL AFTER mother_name');
  }
  if (!existingEvidenceColumns.has('related_member_id')) {
    await query('ALTER TABLE evidence_documents ADD COLUMN related_member_id VARCHAR(120) NULL AFTER spouse_name');
  }
  if (!existingEvidenceColumns.has('updated_by')) {
    await query('ALTER TABLE evidence_documents ADD COLUMN updated_by CHAR(36) NULL AFTER created_by');
  }

  await query(
    `CREATE TABLE IF NOT EXISTS app_settings (
       setting_key VARCHAR(120) PRIMARY KEY,
       setting_value TEXT NULL,
       updated_by CHAR(36) NULL,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     )`
  );

  await query(
    `INSERT INTO pages (id, name, path, description)
     VALUES (:id, 'Settings', '/admin/settings', 'Configuración global del sistema')
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
    { id: randomUUID() }
  );
  await query(
    `INSERT INTO pages (id, name, path, description)
     VALUES (:id, 'Árbol Sienna', '/sienna/arbol-genealogico', 'Árbol genealógico con foto y monto heredado')
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
    { id: randomUUID() }
  );
  await query(
    `INSERT INTO pages (id, name, path, description)
     VALUES (:id, 'Miembros del Árbol Sienna', '/sienna/miembros-arbol', 'CRUD de miembros del árbol genealógico Sienna')
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
    { id: randomUUID() }
  );
  await query(
    `INSERT INTO pages (id, name, path, description)
     VALUES (:id, 'Explicación de Herederos Sienna', '/sienna/explicacion-herederos', 'Explicación, simulación y auditoría de herederos Sienna')
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
    { id: randomUUID() }
  );
  await query(
    `INSERT INTO pages (id, name, path, description)
     VALUES (:id, 'Análisis de Dobles Linajes', '/sienna/dobles-linajes', 'Consola visual de auditoría y validación de dobles linajes')
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
    { id: randomUUID() }
  );
  await syncRegularUserPageAccess('/sienna/dobles-linajes');
  await query(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES ('lawyer_fee_percentage', '0')
     ON DUPLICATE KEY UPDATE setting_key = setting_key`
  );
  await query(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES ('estate_amount', '0')
     ON DUPLICATE KEY UPDATE setting_key = setting_key`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS sienna_family_members (
       id VARCHAR(120) PRIMARY KEY,
       parent_id VARCHAR(120) NULL,
       relationship_to_parent ENUM('hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro') NULL,
       name VARCHAR(255) NOT NULL,
       birth VARCHAR(50) NULL,
       death VARCHAR(50) NULL,
       spouse_member_id VARCHAR(120) NULL,
       spouse VARCHAR(255) NULL,
       spouse_birth VARCHAR(50) NULL,
       inheritance_status ENUM('posible_heredero', 'no_hereda', 'requiere_revision', 'confirmado') NOT NULL DEFAULT 'requiere_revision',
       inheritance_reason TEXT NULL,
       is_highlighted_ancestor BOOLEAN NOT NULL DEFAULT FALSE,
       sort_order INT NOT NULL DEFAULT 0,
       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX idx_sienna_family_parent (parent_id)
     )`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS sienna_calculation_snapshots (
       id CHAR(36) PRIMARY KEY,
       estate_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
       lawyer_fee_percentage DECIMAL(6,2) NOT NULL DEFAULT 0,
       distributable_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
       members_hash TEXT NULL,
       payload_json LONGTEXT NULL,
       created_by CHAR(36) NULL,
       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`
  );

  const memberColumns = await query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = :databaseName AND TABLE_NAME = 'sienna_family_members'`,
    { databaseName: dbConfig.database }
  );
  const existingMemberColumns = new Set(memberColumns.map((column) => column.COLUMN_NAME));
  const memberMigrations = [
    ['relationship_to_parent', "ALTER TABLE sienna_family_members ADD COLUMN relationship_to_parent ENUM('hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro') NULL AFTER parent_id"],
    ['spouse_member_id', 'ALTER TABLE sienna_family_members ADD COLUMN spouse_member_id VARCHAR(120) NULL AFTER death'],
    ['inheritance_status', "ALTER TABLE sienna_family_members ADD COLUMN inheritance_status ENUM('posible_heredero', 'no_hereda', 'requiere_revision', 'confirmado') NOT NULL DEFAULT 'requiere_revision' AFTER spouse_birth"],
    ['inheritance_reason', 'ALTER TABLE sienna_family_members ADD COLUMN inheritance_reason TEXT NULL AFTER inheritance_status'],
    ['created_by', 'ALTER TABLE sienna_family_members ADD COLUMN created_by CHAR(36) NULL AFTER sort_order'],
    ['updated_by', 'ALTER TABLE sienna_family_members ADD COLUMN updated_by CHAR(36) NULL AFTER created_by'],
  ];
  for (const [columnName, sql] of memberMigrations) {
    if (!existingMemberColumns.has(columnName)) await query(sql);
  }

  await query(
    `CREATE TABLE IF NOT EXISTS family_unions (
       id VARCHAR(160) PRIMARY KEY,
       partner_a_member_id VARCHAR(120) NOT NULL,
       partner_b_member_id VARCHAR(120) NULL,
       union_type ENUM('matrimonio', 'union_libre', 'otra') NOT NULL DEFAULT 'matrimonio',
       start_date VARCHAR(50) NULL,
       end_date VARCHAR(50) NULL,
       notes TEXT NULL,
       migration_source VARCHAR(80) NULL,
       confidence ENUM('alta', 'media', 'baja') NOT NULL DEFAULT 'media',
       is_inconsistent BOOLEAN NOT NULL DEFAULT FALSE,
       inconsistency_reason TEXT NULL,
       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX idx_family_unions_partner_a (partner_a_member_id),
       INDEX idx_family_unions_partner_b (partner_b_member_id)
     )`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS member_parent_links (
       id VARCHAR(200) PRIMARY KEY,
       child_member_id VARCHAR(120) NOT NULL,
       parent_member_id VARCHAR(120) NOT NULL,
       parent_role ENUM('padre', 'madre', 'progenitor') NOT NULL DEFAULT 'progenitor',
       union_id VARCHAR(160) NULL,
       link_type ENUM('biologico', 'adoptivo', 'legal') NOT NULL DEFAULT 'biologico',
       is_primary_line BOOLEAN NOT NULL DEFAULT FALSE,
       migration_source VARCHAR(80) NULL,
       confidence ENUM('alta', 'media', 'baja') NOT NULL DEFAULT 'media',
       is_inconsistent BOOLEAN NOT NULL DEFAULT FALSE,
       inconsistency_reason TEXT NULL,
       source_document_id VARCHAR(120) NULL,
       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX idx_parent_links_child (child_member_id),
       INDEX idx_parent_links_parent (parent_member_id),
       INDEX idx_parent_links_union (union_id),
       UNIQUE KEY uq_parent_link_child_parent_union (child_member_id, parent_member_id, union_id)
     )`
  );

  await query(
    `UPDATE confirmed_heirs ch
     JOIN sienna_family_members sfm ON LOWER(TRIM(ch.heir_name)) = LOWER(TRIM(sfm.name))
     SET ch.sienna_member_id = sfm.id
     WHERE ch.sienna_member_id IS NULL`
  );

  await query(
    `UPDATE evidence_documents ed
     JOIN sienna_family_members sfm ON LOWER(TRIM(ed.related_heir_name)) = LOWER(TRIM(sfm.name))
     SET ed.related_member_id = sfm.id
     WHERE ed.related_member_id IS NULL AND ed.related_heir_name IS NOT NULL`
  );

  const existingMembers = await query('SELECT COUNT(*) AS count FROM sienna_family_members');
  const existingHeirs = await query('SELECT COUNT(*) AS count FROM confirmed_heirs');
  const seedCaseData = String(process.env.SEED_CASE_DATA || '').toLowerCase() === 'force-empty-case-seed';
  if (seedCaseData && Number(existingMembers[0]?.count || 0) === 0 && Number(existingHeirs[0]?.count || 0) === 0) {
    const members = [
      ['domenico', null, 'Domenico (Domingo) Sangiovanni', '17/12/1845', null, null, 'María Rosa Grisolia', '18/07/1852', false, 10],
      ['maria-magdalena', 'domenico', 'María Magdalena Sangiovanni', '27/04/1874', '07/05/1935', null, 'Vincenzo de Paola', null, false, 10],
      ['vincenzo', 'domenico', 'Vincenzo (Vicente) Sangiovanni', '13/08/1880', '07/02/1958', null, 'María Balbina Pérez Álvarez', null, false, 20],
      ['paolo', 'domenico', 'Paolo (Paulino) Sangiovanni', '17/01/1885', '31/03/1936', null, 'Simona Simo', null, false, 30],
      ['alessandro', 'maria-magdalena', 'Alessandro de Paola Sangiovanni', '18/10/1911', '14/01/1998', null, null, null, true, 10],
      ['maria-rosa', 'vincenzo', 'María Rosa Sangiovanni Pérez', '18/02/1906', '07/08/1981', 'pedro-pablo', 'Pedro Pablo Sangiovanni Simo', null, false, 10],
      ['domingo-ramon', 'vincenzo', 'Domingo Ramón Sangiovanni Pérez', '11/07/1907', '03/09/1981', null, 'María Francisca Gesualdo', null, false, 20],
      ['pedro-pablo', 'paolo', 'Pedro Pablo Sangiovanni Simo', '29/10/1906', '04/10/1986', 'maria-rosa', null, null, false, 10],
      ['victor-manuel', 'maria-rosa', 'Víctor Manuel Sangiovanni Sangiovanni', '29/10/1932', '21/10/2007', null, 'Ana Julia Rodríguez', null, false, 10],
      ['maria-amparo', 'domingo-ramon', 'María Amparo Sangiovanni Gesualdo', '30/10/1929', '15/01/2004', null, 'Bernardo Edmundo Lizardo Fernández', null, false, 10],
      ['jose-vicente', 'domingo-ramon', 'José Vicente Sangiovanni Gesualdo', '19/04/1932', '24/04/1976', null, 'Ozema Báez', null, false, 20],
      ['rosa-julia', 'victor-manuel', 'Rosa Julia Sangiovanni Rodríguez', '15/04/1963', '04/10/2024', null, 'Francisco Brea', null, false, 10],
      ['victor-manuel-martin', 'victor-manuel', 'Víctor Manuel Martín Sangiovanni Rodríguez', '08/11/1966', null, null, null, null, false, 20],
      ['bernardo-martin', 'maria-amparo', 'Bernardo Martín Lizardo Sangiovanni', '28/10/1966', null, null, null, null, false, 10],
      ['jocelyn', 'jose-vicente', 'Jocelyn del Jesús Sangiovanni Báez', '06/10/1963', null, null, null, null, false, 10],
      ['mayra', 'jose-vicente', 'Mayra Josefina Sangiovanni Báez', '20/11/1965', null, null, null, null, false, 20],
      ['perla-rosa', 'rosa-julia', 'Perla Rosa Brea Sangiovanni', '30/04/1989', null, null, null, null, false, 10],
    ];

    for (const member of members) {
      await query(
        `INSERT INTO sienna_family_members
         (id, parent_id, name, birth, death, spouse_member_id, spouse, spouse_birth, is_highlighted_ancestor, sort_order)
         VALUES (:id, :parentId, :name, :birth, :death, :spouseMemberId, :spouse, :spouseBirth, :highlighted, :sortOrder)`,
        {
          id: member[0],
          parentId: member[1],
          name: member[2],
          birth: member[3],
          death: member[4],
          spouseMemberId: member[5],
          spouse: member[6],
          spouseBirth: member[7],
          highlighted: Boolean(member[8]),
          sortOrder: member[9],
        }
      );
    }
  }
}

async function ensureAdminUser() {
  const email = process.env.LOCAL_ADMIN_EMAIL;
  const password = process.env.LOCAL_ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await query('SELECT id FROM profiles WHERE email = :email LIMIT 1', { email });
  if (existing.length > 0) {
    await query(
      "UPDATE profiles SET role = 'admin', is_approved = TRUE WHERE email = :email",
      { email }
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO profiles (id, email, password_hash, full_name, role, is_approved)
     VALUES (:id, :email, :passwordHash, :fullName, 'admin', TRUE)`,
    {
      id: randomUUID(),
      email,
      passwordHash,
      fullName: process.env.LOCAL_ADMIN_NAME || 'Administrador',
    }
  );
}

app.get('/api/health', async (_req, res) => {
  await query('SELECT 1');
  res.json({ ok: true, storage: 'mysql' });
});

app.post('/api/auth/signup', async (req, res) => {
  res.status(403).json({ message: 'El auto-registro está deshabilitado. Solicita tus credenciales al administrador.' });
});

app.post('/api/auth/signin', async (req, res) => {
  const { password } = req.body || {};
  const email = String(req.body?.email || '').trim().toLowerCase();
  const rows = await query('SELECT * FROM profiles WHERE email = :email LIMIT 1', { email });
  const profile = rows[0];
  if (!profile || !(await bcrypt.compare(password || '', profile.password_hash))) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = signToken(profile);
  setSessionCookie(res, token);
  const user = publicProfile(profile);
  res.json({ user, profile: user });
});

app.post('/api/auth/signout', (_req, res) => {
  res.clearCookie(cookieName);
  res.json({ ok: true });
});

app.get('/api/auth/session', requireAuth, async (req, res) => {
  res.json({ user: req.user, profile: req.user });
});

app.patch('/api/auth/password', requireAuth, async (req, res) => {
  const { password } = req.body || {};
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await query('UPDATE profiles SET password_hash = :passwordHash WHERE id = :id', {
    id: req.user.id,
    passwordHash,
  });
  res.json({ ok: true });
});

app.get('/api/pages', requireAuth, requireAdmin, async (_req, res) => {
  const pages = await query('SELECT id, name, path, description, created_at FROM pages ORDER BY name');
  res.json({ pages });
});

app.get('/api/me/pages', requireAuth, async (req, res) => {
  if (req.user?.role === 'admin') {
    const pages = await query('SELECT id, name, path, description, created_at FROM pages ORDER BY name');
    return res.json({ pages });
  }
  const pages = await query(
    `SELECT p.id, p.name, p.path, p.description, p.created_at
     FROM pages p
     INNER JOIN user_page_permissions up ON up.page_id = p.id
     WHERE up.user_id = :userId
     ORDER BY p.name`,
    { userId: req.user.id }
  );
  res.json({ pages });
});

app.get('/api/settings', requireAuth, async (_req, res) => {
  res.json({ settings: await loadAppSettings() });
});

app.put('/api/settings', requireAuth, requireAdmin, async (req, res) => {
  const resultSettings = {};
  if ('estate_amount' in (req.body || {})) {
    const rawAmount = Number(req.body?.estate_amount || 0);
    const estateAmount = Math.max(0, rawAmount);
    await query(
      `INSERT INTO app_settings (setting_key, setting_value, updated_by)
       VALUES ('estate_amount', :value, :updatedBy)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
      { value: String(estateAmount), updatedBy: req.user.id }
    );
    resultSettings.estate_amount = estateAmount;
  }
  if ('lawyer_fee_percentage' in (req.body || {})) {
    const rawFee = Number(req.body?.lawyer_fee_percentage || 0);
    const lawyerFeePercentage = Math.min(100, Math.max(0, rawFee));
    await query(
      `INSERT INTO app_settings (setting_key, setting_value, updated_by)
       VALUES ('lawyer_fee_percentage', :value, :updatedBy)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
      { value: String(lawyerFeePercentage), updatedBy: req.user.id }
    );
    resultSettings.lawyer_fee_percentage = lawyerFeePercentage;
  }
  if ('sienna_case_config' in (req.body || {})) {
    if (!req.body.sienna_case_config || typeof req.body.sienna_case_config !== 'object' || Array.isArray(req.body.sienna_case_config)) {
      return res.status(400).json({ message: 'sienna_case_config debe ser un objeto JSON válido' });
    }
    await query(
      `INSERT INTO app_settings (setting_key, setting_value, updated_by)
       VALUES ('sienna_case_config', :value, :updatedBy)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
      { value: JSON.stringify(req.body.sienna_case_config), updatedBy: req.user.id }
    );
    resultSettings.sienna_case_config = req.body.sienna_case_config;
  }
  res.json({
    ok: true,
    settings: resultSettings,
  });
});

app.get('/api/profiles/me', requireAuth, async (req, res) => {
  res.json({ profile: req.user });
});

app.patch('/api/profiles/me', requireAuth, async (req, res) => {
  const { full_name, phone } = req.body || {};
  await query('UPDATE profiles SET full_name = :fullName, phone = :phone WHERE id = :id', {
    id: req.user.id,
    fullName: full_name || null,
    phone: phone || null,
  });
  res.json({ profile: publicProfile(await getProfileById(req.user.id)) });
});

app.get('/api/users', requireAuth, requireAdmin, async (_req, res) => {
  const users = await query(
    `SELECT id, email, full_name, phone, role, is_approved, created_at, updated_at
     FROM profiles ORDER BY created_at DESC`
  );
  const permissions = await query('SELECT user_id, page_id FROM user_page_permissions');
  const usersWithPermissions = users.map((user) => ({
    ...publicProfile(user),
    permissions: permissions
      .filter((permission) => permission.user_id === user.id)
      .map((permission) => ({ page_id: permission.page_id })),
  }));
  res.json({ users: usersWithPermissions });
});

app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
  const { email, password, full_name, role = 'regular', is_approved = true } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  if (String(password).length < 6) return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });

  const existing = await query('SELECT id FROM profiles WHERE email = :email LIMIT 1', { email });
  if (existing.length) return res.status(409).json({ message: 'Ese correo ya existe' });

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO profiles (id, email, password_hash, full_name, role, is_approved)
     VALUES (:id, :email, :passwordHash, :fullName, :role, :isApproved)`,
    {
      id,
      email,
      passwordHash,
      fullName: full_name || null,
      role: ['admin', 'regular'].includes(role) ? role : 'regular',
      isApproved: Boolean(is_approved),
    }
  );

  res.status(201).json({ profile: publicProfile(await getProfileById(id)) });
});

app.patch('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const allowed = {};
  if ('is_approved' in req.body) allowed.isApproved = Boolean(req.body.is_approved);
  if ('role' in req.body && ['admin', 'regular'].includes(req.body.role)) allowed.role = req.body.role;

  if ('isApproved' in allowed) {
    await query('UPDATE profiles SET is_approved = :isApproved WHERE id = :id', {
      id: req.params.id,
      isApproved: allowed.isApproved,
    });
  }
  if (allowed.role) {
    await query('UPDATE profiles SET role = :role WHERE id = :id', {
      id: req.params.id,
      role: allowed.role,
    });
  }
  res.json({ profile: publicProfile(await getProfileById(req.params.id)) });
});

app.delete('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
  await query('DELETE FROM profiles WHERE id = :id', { id: req.params.id });
  res.json({ ok: true });
});

app.put('/api/users/:id/permissions', requireAuth, requireAdmin, async (req, res) => {
  const pageIds = Array.isArray(req.body?.page_ids) ? req.body.page_ids : [];
  await query('DELETE FROM user_page_permissions WHERE user_id = :userId', { userId: req.params.id });
  for (const pageId of pageIds) {
    await query(
      `INSERT INTO user_page_permissions (id, user_id, page_id, created_by)
       VALUES (:id, :userId, :pageId, :createdBy)`,
      { id: randomUUID(), userId: req.params.id, pageId, createdBy: req.user.id }
    );
  }
  res.json({ ok: true });
});

app.post('/api/page-visits', requireAuth, async (req, res) => {
  const { page_path, page_name, user_agent } = req.body || {};
  if (!page_path) return res.status(400).json({ message: 'page_path es requerido' });
  await query(
    `INSERT INTO page_visits (id, user_id, page_path, page_name, user_agent, ip_address)
     VALUES (:id, :userId, :pagePath, :pageName, :userAgent, :ipAddress)`,
    {
      id: randomUUID(),
      userId: req.user.id,
      pagePath: page_path,
      pageName: page_name || null,
      userAgent: user_agent || null,
      ipAddress: req.ip,
    }
  );
  res.status(201).json({ ok: true });
});

app.get('/api/page-visits', requireAuth, requireAdmin, async (_req, res) => {
  const visits = await query(
    `SELECT pv.id, pv.user_id, pv.page_path, pv.page_name, pv.user_agent, pv.ip_address, pv.visited_at,
            p.email AS user_email, p.full_name AS user_full_name
     FROM page_visits pv
     LEFT JOIN profiles p ON p.id = pv.user_id
     ORDER BY pv.visited_at DESC
     LIMIT 100`
  );
  res.json({ visits });
});

app.get('/api/confirmed-heirs', requireAuth, async (req, res) => {
  res.json({ heirs: await loadConfirmedHeirs(req.query.includeMedia === '1') });
});

app.get('/api/confirmed-heirs/:id', requireAuth, async (req, res) => {
  const heir = await loadConfirmedHeirById(req.params.id, req.query.includeMedia === '1');
  if (!heir) return res.status(404).json({ message: 'Heredero no encontrado' });
  res.json({ heir });
});

app.post('/api/confirmed-heirs/bulk-amounts', requireAuth, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item.id || '').trim();
    if (!id) continue;
    await query(
      'UPDATE confirmed_heirs SET inheritance_amount = :amount, updated_by = :updatedBy WHERE id = :id',
      {
        id,
        amount: Number(item.inheritance_amount || 0),
        updatedBy: req.user.id,
      }
    );
  }
  res.json({ ok: true });
});

app.put('/api/confirmed-heirs/:id', requireAuth, async (req, res) => {
  const {
    sienna_member_id,
    heir_name,
    relationship_summary,
    line_vincenzo,
    line_paolo,
    status,
    notes,
    photo_file_name,
    photo_file_type,
    photo_data,
    inheritance_amount,
  } = req.body || {};

  if (!heir_name || !String(heir_name).trim()) {
    return res.status(400).json({ message: 'El nombre del heredero es requerido' });
  }

  await query(
    `UPDATE confirmed_heirs
     SET sienna_member_id = :siennaMemberId,
         heir_name = :heirName,
         relationship_summary = :relationshipSummary,
         line_vincenzo = :lineVincenzo,
         line_paolo = :linePaolo,
         status = :status,
         notes = :notes,
         photo_file_name = :photoFileName,
         photo_file_type = :photoFileType,
         photo_data = :photoData,
         inheritance_amount = :inheritanceAmount,
         updated_by = :updatedBy
     WHERE id = :id`,
    {
      id: req.params.id,
      siennaMemberId: sienna_member_id || null,
      heirName: String(heir_name).trim(),
      relationshipSummary: relationship_summary || null,
      lineVincenzo: Boolean(line_vincenzo),
      linePaolo: Boolean(line_paolo),
      status: ['mencionado', 'confirmado', 'pendiente'].includes(status) ? status : 'mencionado',
      notes: notes || null,
      photoFileName: photo_file_name || null,
      photoFileType: photo_file_type || null,
      photoData: photo_data || null,
      inheritanceAmount: Number(inheritance_amount || 0),
      updatedBy: req.user.id,
    }
  );

  res.json({ ok: true });
});

app.post('/api/confirmed-heirs', requireAuth, async (req, res) => {
  const {
    sienna_member_id,
    heir_name,
    relationship_summary,
    line_vincenzo,
    line_paolo,
    status,
    notes,
    photo_file_name,
    photo_file_type,
    photo_data,
    inheritance_amount,
  } = req.body || {};

  if (!heir_name) return res.status(400).json({ message: 'El nombre del heredero es requerido' });

  await query(
    `INSERT INTO confirmed_heirs (
       id, sienna_member_id, heir_name, relationship_summary, line_vincenzo, line_paolo, status, notes,
       photo_file_name, photo_file_type, photo_data, inheritance_amount, created_by, updated_by
     )
     VALUES (
       :id, :siennaMemberId, :heirName, :relationshipSummary, :lineVincenzo, :linePaolo, :status, :notes,
       :photoFileName, :photoFileType, :photoData, :inheritanceAmount, :createdBy, :updatedBy
     )
     ON DUPLICATE KEY UPDATE
       sienna_member_id = VALUES(sienna_member_id),
       relationship_summary = VALUES(relationship_summary),
       line_vincenzo = VALUES(line_vincenzo),
       line_paolo = VALUES(line_paolo),
       status = VALUES(status),
       notes = VALUES(notes),
       photo_file_name = VALUES(photo_file_name),
       photo_file_type = VALUES(photo_file_type),
       photo_data = VALUES(photo_data),
       inheritance_amount = VALUES(inheritance_amount),
       updated_by = VALUES(updated_by)`,
    {
      id: randomUUID(),
      siennaMemberId: sienna_member_id || null,
      heirName: heir_name,
      relationshipSummary: relationship_summary || null,
      lineVincenzo: Boolean(line_vincenzo),
      linePaolo: Boolean(line_paolo),
      status: ['mencionado', 'confirmado', 'pendiente'].includes(status) ? status : 'mencionado',
      notes: notes || null,
      photoFileName: photo_file_name || null,
      photoFileType: photo_file_type || null,
      photoData: photo_data || null,
      inheritanceAmount: Number(inheritance_amount || 0),
      createdBy: req.user.id,
      updatedBy: req.user.id,
    }
  );

  res.status(201).json({ ok: true });
});

app.get('/api/sienna-workspace', requireAuth, async (req, res) => {
  const includeMedia = req.query.includeMedia === '1';
  const family = await loadSiennaFamilyBundle();
  const snapshotRows = await query(
    `SELECT id, estate_amount, lawyer_fee_percentage, distributable_amount, members_hash, payload_json, created_by, created_at
     FROM sienna_calculation_snapshots
     ORDER BY created_at DESC
     LIMIT 1`
  );

  res.json({
    ...family,
    heirs: await loadConfirmedHeirs(includeMedia),
    documents: await loadEvidenceDocuments(includeMedia),
    settings: await loadAppSettings(),
    snapshot: snapshotRows[0] || null,
  });
});

app.get('/api/sienna-calculation', requireAuth, async (req, res) => {
  res.json({
    calculation: await buildSiennaRealtimeCalculation({
      estateAmount: req.query.estate_amount,
      lawyerFeePercentage: req.query.lawyer_fee_percentage,
    }),
  });
});

app.get('/api/sienna-dual-lineage-analysis', requireAuth, async (_req, res) => {
  res.json({ analysis: await buildSiennaDualLineageAnalysis() });
});

app.get('/api/sienna-analysis-summary', requireAuth, async (_req, res) => {
  res.json({ summary: await buildSiennaAnalysisSummary() });
});

app.get('/api/sienna-findings', requireAuth, async (_req, res) => {
  res.json({ findings: await buildSiennaMemberIssueRows() });
});

app.get('/api/sienna-family-members', requireAuth, async (_req, res) => {
  res.json(await loadSiennaFamilyBundle());
});

app.post('/api/sienna-family-members', requireAuth, async (req, res) => {
  const {
    id,
    parent_id,
    relationship_to_parent,
    name,
    birth,
    death,
    spouse_member_id,
    spouse,
    spouse_birth,
    inheritance_status,
    inheritance_reason,
    is_highlighted_ancestor,
    sort_order,
    filiation,
  } = req.body || {};

  if (!name) return res.status(400).json({ message: 'El nombre del miembro es requerido' });

  const memberId = id || randomUUID();
  let sanitizedSpouseMemberId = spouse_member_id || null;
  if (sanitizedSpouseMemberId === memberId) sanitizedSpouseMemberId = null;
  if (sanitizedSpouseMemberId) {
    const spouseRows = await query('SELECT id FROM sienna_family_members WHERE id = :id LIMIT 1', {
      id: sanitizedSpouseMemberId,
    });
    if (!spouseRows.length) sanitizedSpouseMemberId = null;
  }
  await query(
    `INSERT INTO sienna_family_members (
       id, parent_id, relationship_to_parent, name, birth, death, spouse_member_id, spouse, spouse_birth,
       inheritance_status, inheritance_reason, is_highlighted_ancestor, sort_order, created_by, updated_by
     )
     VALUES (
       :id, :parentId, :relationshipToParent, :name, :birth, :death, :spouseMemberId, :spouse, :spouseBirth,
       :inheritanceStatus, :inheritanceReason, :highlighted, :sortOrder, :createdBy, :updatedBy
     )
     ON DUPLICATE KEY UPDATE
       parent_id = VALUES(parent_id),
       relationship_to_parent = VALUES(relationship_to_parent),
       name = VALUES(name),
       birth = VALUES(birth),
       death = VALUES(death),
      spouse_member_id = VALUES(spouse_member_id),
       spouse = VALUES(spouse),
       spouse_birth = VALUES(spouse_birth),
       inheritance_status = VALUES(inheritance_status),
       inheritance_reason = VALUES(inheritance_reason),
       is_highlighted_ancestor = VALUES(is_highlighted_ancestor),
       sort_order = VALUES(sort_order),
       updated_by = VALUES(updated_by)`,
    {
      id: memberId,
      parentId: parent_id || null,
      relationshipToParent: ['hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro'].includes(relationship_to_parent) ? relationship_to_parent : null,
      name,
      birth: birth || null,
      death: death || null,
      spouseMemberId: sanitizedSpouseMemberId,
      spouse: spouse || null,
      spouseBirth: spouse_birth || null,
      inheritanceStatus: ['posible_heredero', 'no_hereda', 'requiere_revision', 'confirmado'].includes(inheritance_status) ? inheritance_status : 'requiere_revision',
      inheritanceReason: inheritance_reason || null,
      highlighted: Boolean(is_highlighted_ancestor),
      sortOrder: Number(sort_order || 0),
      createdBy: req.user.id,
      updatedBy: req.user.id,
    }
  );

  await syncMemberFiliation({
    memberId,
    parentId: parent_id || null,
    relationshipToParent: ['hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro'].includes(relationship_to_parent)
      ? relationship_to_parent
      : null,
    filiation,
  });

  if (sanitizedSpouseMemberId) {
    const unionId = buildUnionId(memberId, sanitizedSpouseMemberId);
    await query(
      `INSERT INTO family_unions (
         id, partner_a_member_id, partner_b_member_id, union_type, migration_source, confidence, is_inconsistent
       )
       VALUES (:id, :partnerA, :partnerB, 'matrimonio', 'spouse_member_id', 'alta', FALSE)
       ON DUPLICATE KEY UPDATE
         partner_a_member_id = VALUES(partner_a_member_id),
         partner_b_member_id = VALUES(partner_b_member_id),
         updated_at = CURRENT_TIMESTAMP`,
      {
        id: unionId,
        partnerA: [memberId, sanitizedSpouseMemberId].sort()[0],
        partnerB: [memberId, sanitizedSpouseMemberId].sort()[1],
      }
    );
  }

  const bundle = await loadSiennaFamilyBundle();
  const savedMember = bundle.members.find((member) => member.id === memberId) || null;
  res.status(201).json({ ok: true, member: savedMember, unions: bundle.unions, parent_links: bundle.parent_links });
});

app.delete('/api/sienna-family-members/:id', requireAuth, requireAdmin, async (req, res) => {
  const memberId = req.params.id;
  await query('DELETE FROM member_parent_links WHERE child_member_id = :id OR parent_member_id = :id', { id: memberId });
  await query(
    'DELETE FROM family_unions WHERE partner_a_member_id = :id OR partner_b_member_id = :id',
    { id: memberId }
  );
  await query('UPDATE sienna_family_members SET parent_id = NULL WHERE parent_id = :id', { id: memberId });
  await query('UPDATE sienna_family_members SET spouse_member_id = NULL WHERE spouse_member_id = :id', { id: memberId });
  await query('DELETE FROM sienna_family_members WHERE id = :id', { id: memberId });
  res.json({ ok: true });
});

app.get('/api/evidence-documents', requireAuth, async (req, res) => {
  res.json({ documents: await loadEvidenceDocuments(req.query.includeMedia === '1') });
});

app.get('/api/evidence-documents/:id', requireAuth, async (req, res) => {
  const document = await loadEvidenceDocumentById(req.params.id);
  if (!document) {
    return res.status(404).json({ message: 'Documento no encontrado' });
  }
  res.json({ document });
});

app.post('/api/evidence-documents', requireAuth, async (req, res) => {
  const {
    title,
    document_type,
    primary_member_id,
    primary_person,
    event_date,
    event_place,
    father_member_id,
    father_name,
    mother_member_id,
    mother_name,
    spouse_member_id,
    spouse_name,
    related_member_id,
    related_heir_name,
    confirms_heir,
    people_involved,
    extracted_text,
    notes,
    file_name,
    file_type,
    file_data,
  } = req.body || {};

  if (!title || !document_type) {
    return res.status(400).json({ message: 'Título y tipo de documento son requeridos' });
  }

  await query(
    `INSERT INTO evidence_documents (
       id, title, document_type, primary_member_id, primary_person, event_date, event_place,
       father_member_id, father_name, mother_member_id, mother_name, spouse_member_id, spouse_name, related_member_id, related_heir_name, confirms_heir,
       people_involved, extracted_text, notes, file_name, file_type, file_data, created_by, updated_by
     )
     VALUES (
       :id, :title, :documentType, :primaryMemberId, :primaryPerson, :eventDate, :eventPlace,
       :fatherMemberId, :fatherName, :motherMemberId, :motherName, :spouseMemberId, :spouseName, :relatedMemberId, :relatedHeirName, :confirmsHeir,
       :peopleInvolved, :extractedText, :notes, :fileName, :fileType, :fileData, :createdBy, :updatedBy
     )`,
    {
      id: randomUUID(),
      title,
      documentType: document_type,
      primaryMemberId: primary_member_id || null,
      primaryPerson: primary_person || null,
      eventDate: event_date || null,
      eventPlace: event_place || null,
      fatherMemberId: father_member_id || null,
      fatherName: father_name || null,
      motherMemberId: mother_member_id || null,
      motherName: mother_name || null,
      spouseMemberId: spouse_member_id || null,
      spouseName: spouse_name || null,
      relatedMemberId: related_member_id || null,
      relatedHeirName: related_heir_name || null,
      confirmsHeir: Boolean(confirms_heir),
      peopleInvolved: JSON.stringify(Array.isArray(people_involved) ? people_involved : []),
      extractedText: extracted_text || null,
      notes: notes || null,
      fileName: file_name || null,
      fileType: file_type || null,
      fileData: file_data || null,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    }
  );

  if ((related_heir_name || related_member_id) && confirms_heir) {
    await query(
      `UPDATE confirmed_heirs
       SET status = 'confirmado', updated_by = :updatedBy
       WHERE heir_name = :heirName OR sienna_member_id = :memberId`,
      { heirName: related_heir_name || '', memberId: related_member_id || '', updatedBy: req.user.id }
    );
  }

  res.status(201).json({ ok: true });
});

app.delete('/api/evidence-documents/:id', requireAuth, async (req, res) => {
  await query('DELETE FROM evidence_documents WHERE id = :id', { id: req.params.id });
  res.json({ ok: true });
});

app.get('/api/sienna-calculation-snapshots', requireAuth, async (_req, res) => {
  const snapshots = await query(
    `SELECT id, estate_amount, lawyer_fee_percentage, distributable_amount, members_hash, payload_json, created_by, created_at
     FROM sienna_calculation_snapshots
     ORDER BY created_at DESC
     LIMIT 50`
  );
  res.json({ snapshots });
});

app.get('/api/sienna-calculation-snapshots/latest', requireAuth, async (_req, res) => {
  const rows = await query(
    `SELECT id, estate_amount, lawyer_fee_percentage, distributable_amount, members_hash, payload_json, created_by, created_at
     FROM sienna_calculation_snapshots
     ORDER BY created_at DESC
     LIMIT 1`
  );
  res.json({ snapshot: rows[0] || null });
});

app.post('/api/sienna-calculation-snapshots', requireAuth, async (req, res) => {
  const { estate_amount, lawyer_fee_percentage, distributable_amount, members_hash, payload_json } = req.body || {};
  const snapshotId = randomUUID();
  await query(
    `INSERT INTO sienna_calculation_snapshots (
       id, estate_amount, lawyer_fee_percentage, distributable_amount, members_hash, payload_json, created_by, created_at
     )
     VALUES (
       :id, :estateAmount, :lawyerFeePercentage, :distributableAmount, :membersHash, :payloadJson, :createdBy, UTC_TIMESTAMP()
     )`,
    {
      id: snapshotId,
      estateAmount: Number(estate_amount || 0),
      lawyerFeePercentage: Number(lawyer_fee_percentage || 0),
      distributableAmount: Number(distributable_amount || 0),
      membersHash: members_hash || null,
      payloadJson: payload_json || null,
      createdBy: req.user.id,
    }
  );
  res.status(201).json({ ok: true, snapshot_id: snapshotId });
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.type('html').send(fs.readFileSync(path.join(distPath, 'index.html'), 'utf8'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Error interno del servidor' });
});

ensureDatabase()
  .then(ensureSchemaMigrations)
  .then(ensureAdminUser)
  .then(() => {
    app.listen(port, () => {
      console.log(`HerenciaRD API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo iniciar la API local:', error.message);
    process.exit(1);
  });
