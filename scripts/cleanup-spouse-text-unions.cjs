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

  const [legacyUnions] = await conn.query(
    `SELECT id, partner_a_member_id, migration_source, inconsistency_reason
     FROM family_unions
     WHERE migration_source = 'spouse_text_only'
        OR partner_b_member_id IS NULL
        OR TRIM(partner_b_member_id) = ''`
  );

  if (!legacyUnions.length) {
    console.log('No hay uniones solo-texto que limpiar.');
    await conn.end();
    return;
  }

  const unionIds = legacyUnions.map((row) => String(row.id));
  console.log(`Eliminando ${unionIds.length} union(es) informativas sin spouse_member_id...`);

  const placeholders = unionIds.map(() => '?').join(', ');
  const [clearedLinks] = await conn.query(
    `UPDATE member_parent_links SET union_id = NULL WHERE union_id IN (${placeholders})`,
    unionIds
  );
  await conn.query(`DELETE FROM family_unions WHERE id IN (${placeholders})`, unionIds);

  await conn.end();

  console.log(
    JSON.stringify(
      {
        removed_unions: unionIds.length,
        cleared_link_union_refs: clearedLinks.affectedRows ?? clearedLinks.changedRows ?? 0,
        sample: legacyUnions.slice(0, 5).map((row) => ({
          id: row.id,
          reason: row.inconsistency_reason || row.migration_source,
        })),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
