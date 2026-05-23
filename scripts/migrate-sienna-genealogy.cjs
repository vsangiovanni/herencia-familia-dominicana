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

const normalizedId = (value) => String(value || '').trim();

const buildUnionId = (partnerA, partnerB) => {
  const ids = [normalizedId(partnerA), normalizedId(partnerB)].filter(Boolean).sort();
  return ids.length === 2 ? `union-${ids[0]}-${ids[1]}` : `union-${ids[0] || 'solo'}`;
};

const buildParentLinkId = (childId, parentId, unionId = null) => {
  const base = `link-${normalizedId(childId)}-${normalizedId(parentId)}`;
  return unionId ? `${base}-${normalizedId(unionId)}` : base;
};

const isChildRelationship = (member) =>
  member.relationship_to_parent === 'hijo' ||
  member.relationship_to_parent === 'hija' ||
  !member.relationship_to_parent;

async function main() {
  const envFile = process.env.ENV_FILE || path.join(process.cwd(), '.env');
  const env = parseEnvFile(envFile);
  console.log(`Usando variables de: ${envFile}`);
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS family_unions (
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
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS member_parent_links (
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
      UNIQUE KEY uq_parent_link_child_parent_union (child_member_id, parent_member_id, union_id)
    )
  `);

  const [members] = await conn.query(
    `SELECT id, parent_id, relationship_to_parent, name, spouse_member_id, spouse
     FROM sienna_family_members`
  );

  const byId = new Map(members.map((member) => [String(member.id), member]));
  const unionRows = new Map();
  const linkRows = new Map();
  const stats = {
    unions: 0,
    links: 0,
    inconsistentUnions: 0,
    inconsistentLinks: 0,
  };

  const upsertUnion = (row) => unionRows.set(row.id, row);
  const upsertLink = (row) => linkRows.set(row.id, row);

  for (const member of members) {
    const memberId = normalizedId(member.id);
    const spouseId = normalizedId(member.spouse_member_id);

    if (spouseId) {
      const spouse = byId.get(spouseId);
      const unionId = buildUnionId(memberId, spouseId);
      const partnerIds = [memberId, spouseId].sort();
      const inconsistent = !spouse;
      upsertUnion({
        id: unionId,
        partner_a_member_id: partnerIds[0],
        partner_b_member_id: partnerIds[1],
        union_type: 'matrimonio',
        migration_source: 'spouse_member_id',
        confidence: spouse ? 'alta' : 'baja',
        is_inconsistent: inconsistent,
        inconsistency_reason: inconsistent
          ? `spouse_member_id '${spouseId}' no existe en sienna_family_members`
          : null,
      });
      if (inconsistent) stats.inconsistentUnions += 1;
    }
  }

  for (const member of members) {
    if (!isChildRelationship(member)) continue;
    const childId = normalizedId(member.id);
    const parentId = normalizedId(member.parent_id);
    if (!parentId) continue;

    const parent = byId.get(parentId);
    const parentSpouseId = parent ? normalizedId(parent.spouse_member_id) : '';
    const unionId =
      parent && parentSpouseId && byId.has(parentSpouseId)
        ? buildUnionId(parentId, parentSpouseId)
        : null;

    const parentMissing = !parent;
    const role =
      member.relationship_to_parent === 'hija'
        ? 'madre'
        : member.relationship_to_parent === 'hijo'
          ? 'padre'
          : 'progenitor';

    upsertLink({
      id: buildParentLinkId(childId, parentId, unionId),
      child_member_id: childId,
      parent_member_id: parentId,
      parent_role: role,
      union_id: unionId,
      link_type: 'biologico',
      is_primary_line: true,
      migration_source: 'parent_id',
      confidence: parentMissing ? 'baja' : unionId ? 'alta' : 'media',
      is_inconsistent: parentMissing,
      inconsistency_reason: parentMissing ? `parent_id '${parentId}' no existe` : null,
    });
    if (parentMissing) stats.inconsistentLinks += 1;

    if (parent && parentSpouseId && byId.has(parentSpouseId) && parentSpouseId !== parentId) {
      const inferredUnionId = buildUnionId(parentId, parentSpouseId);
      upsertLink({
        id: buildParentLinkId(childId, parentSpouseId, inferredUnionId),
        child_member_id: childId,
        parent_member_id: parentSpouseId,
        parent_role: 'progenitor',
        union_id: inferredUnionId,
        link_type: 'biologico',
        is_primary_line: false,
        migration_source: 'spouse_of_declared_parent',
        confidence: 'media',
        is_inconsistent: false,
        inconsistency_reason: null,
      });
    }

    const childAlsoUnderSpouse = members.some(
      (candidate) =>
        normalizedId(candidate.id) === childId &&
        normalizedId(candidate.parent_id) === parentSpouseId &&
        parentSpouseId
    );
    if (childAlsoUnderSpouse && parentSpouseId) {
      const existing = linkRows.get(buildParentLinkId(childId, parentId, unionId));
      if (existing) {
        existing.is_inconsistent = true;
        existing.inconsistency_reason =
          'El hijo aparece colgado bajo ambos progenitores (parent_id distintos). Revisar filiación manual.';
        existing.confidence = 'baja';
        stats.inconsistentLinks += 1;
      }
    }
  }

  await conn.query('DELETE FROM member_parent_links WHERE migration_source IS NOT NULL');
  await conn.query('DELETE FROM family_unions WHERE migration_source IS NOT NULL');

  for (const union of unionRows.values()) {
    await conn.query(
      `INSERT INTO family_unions (
         id, partner_a_member_id, partner_b_member_id, union_type, migration_source,
         confidence, is_inconsistent, inconsistency_reason
       ) VALUES (?, ?, ?, 'matrimonio', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         partner_a_member_id = VALUES(partner_a_member_id),
         partner_b_member_id = VALUES(partner_b_member_id),
         migration_source = VALUES(migration_source),
         confidence = VALUES(confidence),
         is_inconsistent = VALUES(is_inconsistent),
         inconsistency_reason = VALUES(inconsistency_reason),
         updated_at = CURRENT_TIMESTAMP`,
      [
        union.id,
        union.partner_a_member_id,
        union.partner_b_member_id,
        union.migration_source,
        union.confidence,
        union.is_inconsistent,
        union.inconsistency_reason,
      ]
    );
    stats.unions += 1;
  }

  for (const link of linkRows.values()) {
    await conn.query(
      `INSERT INTO member_parent_links (
         id, child_member_id, parent_member_id, parent_role, union_id, link_type,
         is_primary_line, migration_source, confidence, is_inconsistent, inconsistency_reason
       ) VALUES (?, ?, ?, ?, ?, 'biologico', ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         parent_role = VALUES(parent_role),
         union_id = VALUES(union_id),
         is_primary_line = VALUES(is_primary_line),
         migration_source = VALUES(migration_source),
         confidence = VALUES(confidence),
         is_inconsistent = VALUES(is_inconsistent),
         inconsistency_reason = VALUES(inconsistency_reason),
         updated_at = CURRENT_TIMESTAMP`,
      [
        link.id,
        link.child_member_id,
        link.parent_member_id,
        link.parent_role,
        link.union_id,
        link.is_primary_line,
        link.migration_source,
        link.confidence,
        link.is_inconsistent,
        link.inconsistency_reason,
      ]
    );
    stats.links += 1;
    if (link.is_inconsistent) stats.inconsistentLinks += 1;
  }

  await conn.end();

  console.log('Migracion de genealogia Sienna completada.');
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
