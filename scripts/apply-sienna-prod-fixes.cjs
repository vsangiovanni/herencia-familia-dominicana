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
  const env = parseEnvFile(path.join(process.cwd(), '.env.prod.working'));
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  });

  try {
    await conn.beginTransaction();

    await conn.query(
      "UPDATE sienna_family_members SET relationship_to_parent = 'hijo' WHERE id = 'vincenzo' AND (relationship_to_parent IS NULL OR relationship_to_parent = '')"
    );
    await conn.query(
      "UPDATE sienna_family_members SET sort_order = 40 WHERE id = 'pablo-lester-sangiovanni-1779296312184'"
    );

    await conn.commit();
    console.log('ok');
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

