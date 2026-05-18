import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

const source = process.argv[2] || 'backup_supabase/db_cluster-20-08-2025@04-18-40.backup.gz';
const output = process.argv[3] || '_migration_work/herencia_mysql_import.sql';

function readBackup(filePath) {
  const buffer = fs.readFileSync(filePath);
  return filePath.endsWith('.gz') ? zlib.gunzipSync(buffer).toString('utf8') : buffer.toString('utf8');
}

function parseCopyBlocks(sql) {
  const lines = sql.split(/\r?\n/);
  const blocks = new Map();

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^COPY\s+([^\s]+)\s+\((.*)\)\s+FROM stdin;$/);
    if (!match) continue;

    const table = match[1];
    const columns = match[2].split(',').map((column) => column.trim());
    const rows = [];
    index += 1;
    while (index < lines.length && lines[index] !== '\\.') {
      if (lines[index]) rows.push(lines[index].split('\t'));
      index += 1;
    }
    blocks.set(table, { columns, rows });
  }

  return blocks;
}

function rowObjects(block) {
  if (!block) return [];
  return block.rows.map((row) => Object.fromEntries(block.columns.map((column, index) => {
    const value = row[index];
    return [column, value === '\\N' ? null : value];
  })));
}

function sqlValue(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function dateValue(value) {
  if (!value) return null;
  return value.replace(/\.\d+(\+00)?$/, '').replace(/\+00$/, '');
}

function boolValue(value) {
  return value === true || value === 't' || value === 'true' ? 1 : 0;
}

function insertMany(table, columns, rows) {
  if (rows.length === 0) return `-- No rows for ${table}\n`;
  const values = rows.map((row) => `  (${columns.map((column) => sqlValue(row[column])).join(', ')})`);
  return `INSERT INTO ${table} (\n  ${columns.join(', ')}\n) VALUES\n${values.join(',\n')};\n`;
}

const backup = readBackup(source);
const blocks = parseCopyBlocks(backup);

const authUsers = rowObjects(blocks.get('auth.users'));
const profiles = rowObjects(blocks.get('public.profiles'));
const pages = rowObjects(blocks.get('public.pages'));
const permissions = rowObjects(blocks.get('public.user_page_permissions'));
const visits = rowObjects(blocks.get('public.page_visits'));
const authById = new Map(authUsers.map((user) => [user.id, user]));

const mysqlProfiles = profiles.map((profile) => {
  const auth = authById.get(profile.id);
  return {
    id: profile.id,
    email: profile.email,
    password_hash: auth?.encrypted_password || '',
    full_name: profile.full_name,
    phone: profile.phone,
    role: profile.role || 'regular',
    is_approved: boolValue(profile.is_approved),
    created_at: dateValue(profile.created_at),
    updated_at: dateValue(profile.updated_at),
  };
});

const mysqlPages = pages.map((page) => ({
  id: page.id,
  name: page.name,
  path: page.path,
  description: page.description,
  created_at: dateValue(page.created_at),
}));

const mysqlPermissions = permissions.map((permission) => ({
  id: permission.id,
  user_id: permission.user_id,
  page_id: permission.page_id,
  created_by: permission.created_by,
  created_at: dateValue(permission.created_at),
}));

const mysqlVisits = visits.map((visit) => ({
  id: visit.id,
  user_id: visit.user_id,
  page_path: visit.page_path,
  page_name: visit.page_name,
  user_agent: visit.user_agent,
  ip_address: visit.ip_address,
  visited_at: dateValue(visit.visited_at),
}));

const outputSql = [
  '-- Generated from Supabase backup. Keep original backup files unchanged.',
  'USE herencia_rd;',
  'SET FOREIGN_KEY_CHECKS = 0;',
  'DELETE FROM user_page_permissions;',
  'DELETE FROM page_visits;',
  'DELETE FROM pages;',
  'DELETE FROM profiles;',
  'SET FOREIGN_KEY_CHECKS = 1;',
  insertMany('profiles', ['id', 'email', 'password_hash', 'full_name', 'phone', 'role', 'is_approved', 'created_at', 'updated_at'], mysqlProfiles),
  insertMany('pages', ['id', 'name', 'path', 'description', 'created_at'], mysqlPages),
  insertMany('user_page_permissions', ['id', 'user_id', 'page_id', 'created_by', 'created_at'], mysqlPermissions),
  insertMany('page_visits', ['id', 'user_id', 'page_path', 'page_name', 'user_agent', 'ip_address', 'visited_at'], mysqlVisits),
  '',
].join('\n');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, outputSql);

console.log(JSON.stringify({
  source,
  output,
  counts: {
    authUsers: authUsers.length,
    profiles: mysqlProfiles.length,
    pages: mysqlPages.length,
    userPagePermissions: mysqlPermissions.length,
    pageVisits: mysqlVisits.length,
    storageObjects: rowObjects(blocks.get('storage.objects')).length,
  },
}, null, 2));
