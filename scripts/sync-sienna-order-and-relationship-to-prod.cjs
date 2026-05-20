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

function toConfig(env) {
  return {
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  };
}

async function main() {
  const localEnv = parseEnvFile(path.join(process.cwd(), '.env'));
  const prodEnv = parseEnvFile(path.join(process.cwd(), '.env.prod.working'));

  const localConn = await mysql.createConnection(toConfig(localEnv));
  const prodConn = await mysql.createConnection(toConfig(prodEnv));

  try {
    const [localRows] = await localConn.query(
      `SELECT id, parent_id, relationship_to_parent, sort_order
       FROM sienna_family_members`
    );

    await prodConn.beginTransaction();
    let updated = 0;
    for (const row of localRows) {
      const [result] = await prodConn.query(
        `UPDATE sienna_family_members
         SET parent_id = ?, relationship_to_parent = ?, sort_order = ?
         WHERE id = ?`,
        [row.parent_id || null, row.relationship_to_parent || null, Number(row.sort_order || 0), row.id]
      );
      updated += Number(result.affectedRows || 0);
    }
    await prodConn.commit();
    console.log(JSON.stringify({ syncedRows: localRows.length, affectedRows: updated }, null, 2));
  } catch (error) {
    await prodConn.rollback();
    throw error;
  } finally {
    await localConn.end();
    await prodConn.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

