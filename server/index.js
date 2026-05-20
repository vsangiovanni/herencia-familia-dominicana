import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';

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
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES ('lawyer_fee_percentage', '0')
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
  const seedCaseData = ['1', 'true', 'yes', 'on'].includes(String(process.env.SEED_CASE_DATA || 'false').toLowerCase());
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

app.get('/api/pages', requireAuth, async (_req, res) => {
  const pages = await query('SELECT id, name, path, description, created_at FROM pages ORDER BY name');
  res.json({ pages });
});

app.get('/api/settings', requireAuth, async (_req, res) => {
  const rows = await query('SELECT setting_key, setting_value FROM app_settings');
  res.json({
    settings: rows.reduce((acc, row) => {
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
    }, {}),
  });
});

app.put('/api/settings', requireAuth, requireAdmin, async (req, res) => {
  const resultSettings = {};
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

app.get('/api/confirmed-heirs', requireAuth, async (_req, res) => {
  const heirs = await query(
    `SELECT h.id, h.sienna_member_id, h.heir_name, h.relationship_summary, h.line_vincenzo, h.line_paolo,
            h.status, h.notes, h.photo_file_name, h.photo_file_type, h.photo_data,
            h.inheritance_amount, h.created_by, h.updated_by, h.created_at, h.updated_at,
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

  res.json({
    heirs: heirs.map((heir) => ({
      ...heir,
      line_vincenzo: Boolean(heir.line_vincenzo),
      line_paolo: Boolean(heir.line_paolo),
      inheritance_amount: Number(heir.inheritance_amount || 0),
      evidence_count: Number(heir.evidence_count || 0),
    })),
  });
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

app.get('/api/sienna-family-members', requireAuth, async (_req, res) => {
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

  res.json({
    members: members.map((member) => ({
      ...member,
      is_highlighted_ancestor: Boolean(member.is_highlighted_ancestor),
      sort_order: Number(member.sort_order || 0),
    })),
    unions: genealogy.unions,
    parent_links: genealogy.parent_links,
  });
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

  const rows = await query('SELECT * FROM sienna_family_members WHERE id = :id LIMIT 1', { id: memberId });
  const genealogy = await loadGenealogyBundle();
  res.status(201).json({ ok: true, member: rows[0] || null, ...genealogy });
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

app.get('/api/evidence-documents', requireAuth, async (_req, res) => {
  const documents = await query(
    `SELECT id, title, document_type, primary_member_id, primary_person, event_date, event_place,
            father_member_id, father_name, mother_member_id, mother_name, spouse_member_id, spouse_name,
            related_member_id, related_heir_name, confirms_heir,
            people_involved, extracted_text, notes, file_name, file_type, file_data,
            created_by, created_at, updated_at
     FROM evidence_documents
     ORDER BY created_at DESC`
  );

  res.json({
    documents: documents.map((document) => ({
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
    })),
  });
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
       id, estate_amount, lawyer_fee_percentage, distributable_amount, members_hash, payload_json, created_by
     )
     VALUES (
       :id, :estateAmount, :lawyerFeePercentage, :distributableAmount, :membersHash, :payloadJson, :createdBy
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
