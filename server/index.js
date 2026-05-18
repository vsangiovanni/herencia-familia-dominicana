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
const port = Number(process.env.API_PORT || 3001);
const jwtSecret = process.env.JWT_SECRET || 'herencia-rd-local-dev-secret';
const cookieName = 'herencia_session';

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
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const bootstrap = await mysql.createConnection({
    ...dbConfig,
    database: undefined,
  });
  await bootstrap.query(schema);
  await bootstrap.end();
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
            h.status, h.notes, h.created_at, h.updated_at,
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
  } = req.body || {};

  await query(
    `UPDATE confirmed_heirs
     SET relationship_summary = :relationshipSummary,
         line_vincenzo = :lineVincenzo,
         line_paolo = :linePaolo,
         status = :status,
         notes = :notes
     WHERE id = :id`,
    {
      id: req.params.id,
      relationshipSummary: relationship_summary || null,
      lineVincenzo: Boolean(line_vincenzo),
      linePaolo: Boolean(line_paolo),
      status: ['mencionado', 'confirmado', 'pendiente'].includes(status) ? status : 'mencionado',
      notes: notes || null,
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
  } = req.body || {};

  if (!heir_name) return res.status(400).json({ message: 'El nombre del heredero es requerido' });

  await query(
    `INSERT INTO confirmed_heirs (
       id, heir_name, relationship_summary, line_vincenzo, line_paolo, status, notes
     )
     VALUES (
       :id, :heirName, :relationshipSummary, :lineVincenzo, :linePaolo, :status, :notes
     )
     ON DUPLICATE KEY UPDATE
       relationship_summary = VALUES(relationship_summary),
       line_vincenzo = VALUES(line_vincenzo),
       line_paolo = VALUES(line_paolo),
       status = VALUES(status),
       notes = VALUES(notes)`,
    {
      id: randomUUID(),
      heirName: heir_name,
      relationshipSummary: relationship_summary || null,
      lineVincenzo: Boolean(line_vincenzo),
      linePaolo: Boolean(line_paolo),
      status: ['mencionado', 'confirmado', 'pendiente'].includes(status) ? status : 'mencionado',
      notes: notes || null,
    }
  );

  res.status(201).json({ ok: true });
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

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Error interno del servidor' });
});

ensureDatabase()
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
