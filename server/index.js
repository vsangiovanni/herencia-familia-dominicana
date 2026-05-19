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
    ['photo_file_name', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_file_name VARCHAR(255) NULL AFTER notes'],
    ['photo_file_type', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_file_type VARCHAR(120) NULL AFTER photo_file_name'],
    ['photo_data', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_data LONGTEXT NULL AFTER photo_file_type'],
    ['inheritance_amount', 'ALTER TABLE confirmed_heirs ADD COLUMN inheritance_amount DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER photo_data'],
  ];

  for (const [columnName, sql] of migrations) {
    if (!existing.has(columnName)) await query(sql);
  }

  await query(
    `INSERT INTO pages (id, name, path, description)
     VALUES (:id, 'Árbol Sienna', '/sienna/arbol-genealogico', 'Árbol genealógico con foto y monto heredado')
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
    { id: randomUUID() }
  );

  await query(
    `CREATE TABLE IF NOT EXISTS sienna_family_members (
       id VARCHAR(120) PRIMARY KEY,
       parent_id VARCHAR(120) NULL,
       relationship_to_parent ENUM('hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro') NULL,
       name VARCHAR(255) NOT NULL,
       birth VARCHAR(50) NULL,
       death VARCHAR(50) NULL,
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

  const memberColumns = await query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = :databaseName AND TABLE_NAME = 'sienna_family_members'`,
    { databaseName: dbConfig.database }
  );
  const existingMemberColumns = new Set(memberColumns.map((column) => column.COLUMN_NAME));
  const memberMigrations = [
    ['relationship_to_parent', "ALTER TABLE sienna_family_members ADD COLUMN relationship_to_parent ENUM('hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro') NULL AFTER parent_id"],
    ['inheritance_status', "ALTER TABLE sienna_family_members ADD COLUMN inheritance_status ENUM('posible_heredero', 'no_hereda', 'requiere_revision', 'confirmado') NOT NULL DEFAULT 'requiere_revision' AFTER spouse_birth"],
    ['inheritance_reason', 'ALTER TABLE sienna_family_members ADD COLUMN inheritance_reason TEXT NULL AFTER inheritance_status'],
  ];
  for (const [columnName, sql] of memberMigrations) {
    if (!existingMemberColumns.has(columnName)) await query(sql);
  }

  await query(
    `UPDATE sienna_family_members
     SET inheritance_status = 'posible_heredero',
         inheritance_reason = 'Descendiente vivo registrado en una o más líneas sucesorales activas.'
     WHERE id IN ('victor-manuel-martin', 'perla-rosa', 'bernardo-martin', 'jocelyn', 'mayra')
       AND inheritance_status = 'requiere_revision'`
  );

  const caseStatuses = [
    ['alessandro', 'no_hereda', 'Es el causante del expediente; no se clasifica como heredero.'],
    ['domenico', 'no_hereda', 'Tronco familiar común; sirve para ubicar ramas, no como heredero final.'],
    ['maria-magdalena', 'no_hereda', 'Madre del causante Alessandro; rama del causante, no heredera final en este análisis.'],
    ['vincenzo', 'no_hereda', 'Hermano de la madre del causante; abre una rama sucesoral activa por sus descendientes.'],
    ['paolo', 'no_hereda', 'Hermano de la madre del causante; abre una rama sucesoral activa por sus descendientes.'],
    ['maria-rosa', 'no_hereda', 'Intermedia fallecida en rama Vincenzo/Vicente y vínculo hacia la doble filiación.'],
    ['pedro-pablo', 'no_hereda', 'Intermedio fallecido en rama Paolo/Paulino y vínculo hacia la doble filiación.'],
    ['domingo-ramon', 'no_hereda', 'Intermedio fallecido en rama Vincenzo/Vicente; transmite representación a sus descendientes.'],
    ['victor-manuel', 'no_hereda', 'Intermedio fallecido; conecta a Víctor Manuel Martín y a Rosa Julia/Perla.'],
    ['rosa-julia', 'no_hereda', 'Intermedia fallecida; Perla Rosa entra por representación en su rama.'],
    ['maria-amparo', 'no_hereda', 'Intermedia fallecida; Bernardo Martín entra por representación en su rama.'],
    ['jose-vicente', 'no_hereda', 'Intermedio fallecido; Jocelyn y Mayra entran por representación en su rama.'],
    ['victor-manuel-martin', 'posible_heredero', 'Heredero determinado por doble vocación sucesoral: línea Vincenzo/Vicente vía María Rosa y línea Paolo/Paulino vía Pedro Pablo.'],
    ['perla-rosa', 'posible_heredero', 'Heredera determinada por representación en la rama de Rosa Julia, con doble línea familiar Vincenzo/Vicente y Paolo/Paulino.'],
    ['bernardo-martin', 'posible_heredero', 'Heredero determinado por la rama Domingo Ramón -> María Amparo dentro de la línea Vincenzo/Vicente.'],
    ['jocelyn', 'posible_heredero', 'Heredera determinada por la rama Domingo Ramón -> José Vicente dentro de la línea Vincenzo/Vicente.'],
    ['mayra', 'posible_heredero', 'Heredera determinada por la rama Domingo Ramón -> José Vicente dentro de la línea Vincenzo/Vicente.'],
  ];

  for (const [id, status, reason] of caseStatuses) {
    await query(
      `UPDATE sienna_family_members
       SET inheritance_status = :status, inheritance_reason = :reason
       WHERE id = :id`,
      { id, status, reason }
    );
  }

  const existingMembers = await query('SELECT COUNT(*) AS count FROM sienna_family_members');
  if (Number(existingMembers[0]?.count || 0) === 0) {
    const members = [
      ['domenico', null, 'Domenico (Domingo) Sangiovanni', '17/12/1845', null, 'María Rosa Grisolia', '18/07/1852', false, 10],
      ['maria-magdalena', 'domenico', 'María Magdalena Sangiovanni', '27/04/1874', '07/05/1935', 'Vincenzo de Paola', null, false, 10],
      ['vincenzo', 'domenico', 'Vincenzo (Vicente) Sangiovanni', '13/08/1880', '07/02/1958', 'María Balbina Pérez Álvarez', null, false, 20],
      ['paolo', 'domenico', 'Paolo (Paulino) Sangiovanni', '17/01/1885', '31/03/1936', 'Simona Simo', null, false, 30],
      ['alessandro', 'maria-magdalena', 'Alessandro de Paola Sangiovanni', '18/10/1911', '14/01/1998', null, null, true, 10],
      ['maria-rosa', 'vincenzo', 'María Rosa Sangiovanni Pérez', '18/02/1906', '07/08/1981', 'Pedro Pablo Sangiovanni Simo', null, false, 10],
      ['domingo-ramon', 'vincenzo', 'Domingo Ramón Sangiovanni Pérez', '11/07/1907', '03/09/1981', 'María Francisca Gesualdo', null, false, 20],
      ['pedro-pablo', 'paolo', 'Pedro Pablo Sangiovanni Simo', '29/10/1906', '04/10/1986', null, null, false, 10],
      ['victor-manuel', 'maria-rosa', 'Víctor Manuel Sangiovanni Sangiovanni', '29/10/1932', '21/10/2007', 'Ana Julia Rodríguez', null, false, 10],
      ['maria-amparo', 'domingo-ramon', 'María Amparo Sangiovanni Gesualdo', '30/10/1929', '15/01/2004', 'Bernardo Edmundo Lizardo Fernández', null, false, 10],
      ['jose-vicente', 'domingo-ramon', 'José Vicente Sangiovanni Gesualdo', '19/04/1932', '24/04/1976', 'Ozema Báez', null, false, 20],
      ['rosa-julia', 'victor-manuel', 'Rosa Julia Sangiovanni Rodríguez', '15/04/1963', '04/10/2024', 'Francisco Brea', null, false, 10],
      ['victor-manuel-martin', 'victor-manuel', 'Víctor Manuel Martín Sangiovanni Rodríguez', '08/11/1966', null, null, null, false, 20],
      ['bernardo-martin', 'maria-amparo', 'Bernardo Martín Lizardo Sangiovanni', '28/10/1966', null, null, null, false, 10],
      ['jocelyn', 'jose-vicente', 'Jocelyn del Jesús Sangiovanni Báez', '06/10/1963', null, null, null, false, 10],
      ['mayra', 'jose-vicente', 'Mayra Josefina Sangiovanni Báez', '20/11/1965', null, null, null, false, 20],
      ['perla-rosa', 'rosa-julia', 'Perla Rosa Brea Sangiovanni', '30/04/1989', null, null, null, false, 10],
    ];

    for (const member of members) {
      await query(
        `INSERT INTO sienna_family_members
         (id, parent_id, name, birth, death, spouse, spouse_birth, is_highlighted_ancestor, sort_order)
         VALUES (:id, :parentId, :name, :birth, :death, :spouse, :spouseBirth, :highlighted, :sortOrder)`,
        {
          id: member[0],
          parentId: member[1],
          name: member[2],
          birth: member[3],
          death: member[4],
          spouse: member[5],
          spouseBirth: member[6],
          highlighted: Boolean(member[7]),
          sortOrder: member[8],
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
  const { email, password } = req.body || {};
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Email y contraseña válida son requeridos' });
  }

  const existing = await query('SELECT id FROM profiles WHERE email = :email LIMIT 1', { email });
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO profiles (id, email, password_hash, role, is_approved)
     VALUES (:id, :email, :passwordHash, 'regular', FALSE)`,
    { id: randomUUID(), email, passwordHash }
  );

  res.status(201).json({ ok: true });
});

app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body || {};
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
    `SELECT h.id, h.heir_name, h.relationship_summary, h.line_vincenzo, h.line_paolo,
            h.status, h.notes, h.photo_file_name, h.photo_file_type, h.photo_data,
            h.inheritance_amount, h.created_at, h.updated_at,
            COUNT(ed.id) AS evidence_count
     FROM confirmed_heirs h
     LEFT JOIN evidence_documents ed ON ed.related_heir_name = h.heir_name
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

  await query(
    `UPDATE confirmed_heirs
     SET relationship_summary = :relationshipSummary,
         line_vincenzo = :lineVincenzo,
         line_paolo = :linePaolo,
         status = :status,
         notes = :notes,
         photo_file_name = :photoFileName,
         photo_file_type = :photoFileType,
         photo_data = :photoData,
         inheritance_amount = :inheritanceAmount
     WHERE id = :id`,
    {
      id: req.params.id,
      relationshipSummary: relationship_summary || null,
      lineVincenzo: Boolean(line_vincenzo),
      linePaolo: Boolean(line_paolo),
      status: ['mencionado', 'confirmado', 'pendiente'].includes(status) ? status : 'mencionado',
      notes: notes || null,
      photoFileName: photo_file_name || null,
      photoFileType: photo_file_type || null,
      photoData: photo_data || null,
      inheritanceAmount: Number(inheritance_amount || 0),
    }
  );

  res.json({ ok: true });
});

app.post('/api/confirmed-heirs', requireAuth, async (req, res) => {
  const {
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
       id, heir_name, relationship_summary, line_vincenzo, line_paolo, status, notes,
       photo_file_name, photo_file_type, photo_data, inheritance_amount
     )
     VALUES (
       :id, :heirName, :relationshipSummary, :lineVincenzo, :linePaolo, :status, :notes,
       :photoFileName, :photoFileType, :photoData, :inheritanceAmount
     )
     ON DUPLICATE KEY UPDATE
       relationship_summary = VALUES(relationship_summary),
       line_vincenzo = VALUES(line_vincenzo),
       line_paolo = VALUES(line_paolo),
       status = VALUES(status),
       notes = VALUES(notes),
       photo_file_name = VALUES(photo_file_name),
       photo_file_type = VALUES(photo_file_type),
       photo_data = VALUES(photo_data),
       inheritance_amount = VALUES(inheritance_amount)`,
    {
      id: randomUUID(),
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
    }
  );

  res.status(201).json({ ok: true });
});

app.get('/api/sienna-family-members', requireAuth, async (_req, res) => {
  const members = await query(
    `SELECT id, parent_id, relationship_to_parent, name, birth, death, spouse, spouse_birth,
            inheritance_status, inheritance_reason, is_highlighted_ancestor, sort_order, created_at, updated_at
     FROM sienna_family_members
     ORDER BY COALESCE(parent_id, ''), sort_order, name`
  );

  res.json({
    members: members.map((member) => ({
      ...member,
      is_highlighted_ancestor: Boolean(member.is_highlighted_ancestor),
      sort_order: Number(member.sort_order || 0),
    })),
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
    spouse,
    spouse_birth,
    inheritance_status,
    inheritance_reason,
    is_highlighted_ancestor,
    sort_order,
  } = req.body || {};

  if (!name) return res.status(400).json({ message: 'El nombre del miembro es requerido' });

  const memberId = id || randomUUID();
  await query(
    `INSERT INTO sienna_family_members (
       id, parent_id, relationship_to_parent, name, birth, death, spouse, spouse_birth,
       inheritance_status, inheritance_reason, is_highlighted_ancestor, sort_order
     )
     VALUES (
       :id, :parentId, :relationshipToParent, :name, :birth, :death, :spouse, :spouseBirth,
       :inheritanceStatus, :inheritanceReason, :highlighted, :sortOrder
     )
     ON DUPLICATE KEY UPDATE
       parent_id = VALUES(parent_id),
       relationship_to_parent = VALUES(relationship_to_parent),
       name = VALUES(name),
       birth = VALUES(birth),
       death = VALUES(death),
       spouse = VALUES(spouse),
       spouse_birth = VALUES(spouse_birth),
       inheritance_status = VALUES(inheritance_status),
       inheritance_reason = VALUES(inheritance_reason),
       is_highlighted_ancestor = VALUES(is_highlighted_ancestor),
       sort_order = VALUES(sort_order)`,
    {
      id: memberId,
      parentId: parent_id || null,
      relationshipToParent: ['hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro'].includes(relationship_to_parent) ? relationship_to_parent : null,
      name,
      birth: birth || null,
      death: death || null,
      spouse: spouse || null,
      spouseBirth: spouse_birth || null,
      inheritanceStatus: ['posible_heredero', 'no_hereda', 'requiere_revision', 'confirmado'].includes(inheritance_status) ? inheritance_status : 'requiere_revision',
      inheritanceReason: inheritance_reason || null,
      highlighted: Boolean(is_highlighted_ancestor),
      sortOrder: Number(sort_order || 0),
    }
  );

  res.status(201).json({ ok: true, member: { id: memberId, ...req.body } });
});

app.delete('/api/sienna-family-members/:id', requireAuth, async (req, res) => {
  await query('UPDATE sienna_family_members SET parent_id = NULL WHERE parent_id = :id', { id: req.params.id });
  await query('DELETE FROM sienna_family_members WHERE id = :id', { id: req.params.id });
  res.json({ ok: true });
});

app.get('/api/evidence-documents', requireAuth, async (_req, res) => {
  const documents = await query(
    `SELECT id, title, document_type, primary_person, event_date, event_place,
            father_name, mother_name, spouse_name, related_heir_name, confirms_heir,
            people_involved, extracted_text, notes, file_name, file_type, file_data,
            created_by, created_at, updated_at
     FROM evidence_documents
     ORDER BY created_at DESC`
  );

  res.json({
    documents: documents.map((document) => ({
      ...document,
      confirms_heir: Boolean(document.confirms_heir),
    })),
  });
});

app.post('/api/evidence-documents', requireAuth, async (req, res) => {
  const {
    title,
    document_type,
    primary_person,
    event_date,
    event_place,
    father_name,
    mother_name,
    spouse_name,
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
       id, title, document_type, primary_person, event_date, event_place,
       father_name, mother_name, spouse_name, related_heir_name, confirms_heir,
       people_involved, extracted_text, notes, file_name, file_type, file_data, created_by
     )
     VALUES (
       :id, :title, :documentType, :primaryPerson, :eventDate, :eventPlace,
       :fatherName, :motherName, :spouseName, :relatedHeirName, :confirmsHeir,
       :peopleInvolved, :extractedText, :notes, :fileName, :fileType, :fileData, :createdBy
     )`,
    {
      id: randomUUID(),
      title,
      documentType: document_type,
      primaryPerson: primary_person || null,
      eventDate: event_date || null,
      eventPlace: event_place || null,
      fatherName: father_name || null,
      motherName: mother_name || null,
      spouseName: spouse_name || null,
      relatedHeirName: related_heir_name || null,
      confirmsHeir: Boolean(confirms_heir),
      peopleInvolved: JSON.stringify(Array.isArray(people_involved) ? people_involved : []),
      extractedText: extracted_text || null,
      notes: notes || null,
      fileName: file_name || null,
      fileType: file_type || null,
      fileData: file_data || null,
      createdBy: req.user.id,
    }
  );

  if (related_heir_name && confirms_heir) {
    await query(
      `UPDATE confirmed_heirs
       SET status = 'confirmado'
       WHERE heir_name = :heirName`,
      { heirName: related_heir_name }
    );
  }

  res.status(201).json({ ok: true });
});

app.delete('/api/evidence-documents/:id', requireAuth, async (req, res) => {
  await query('DELETE FROM evidence_documents WHERE id = :id', { id: req.params.id });
  res.json({ ok: true });
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
