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
  const env = parseEnvFile(path.join(process.cwd(), '.env'));
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  });

  try {
    const [rows] = await conn.query(
      `SELECT id, parent_id, name, sort_order
       FROM sienna_family_members`
    );

    const groups = new Map();
    for (const row of rows) {
      const groupKey = row.parent_id ? String(row.parent_id) : '__root__';
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(row);
    }

    const updates = [];
    for (const members of groups.values()) {
      members.sort((a, b) => {
        const sa = Number(a.sort_order || 0);
        const sb = Number(b.sort_order || 0);
        if (sa !== sb) return sa - sb;
        const na = String(a.name || '').localeCompare(String(b.name || ''), 'es');
        if (na !== 0) return na;
        return String(a.id).localeCompare(String(b.id));
      });

      members.forEach((member, index) => {
        const targetOrder = (index + 1) * 10;
        const currentOrder = Number(member.sort_order || 0);
        if (currentOrder !== targetOrder) {
          updates.push({
            id: member.id,
            name: member.name,
            parent_id: member.parent_id || null,
            from: currentOrder,
            to: targetOrder,
          });
        }
      });
    }

    await conn.beginTransaction();
    for (const change of updates) {
      await conn.query(
        'UPDATE sienna_family_members SET sort_order = ? WHERE id = ?',
        [change.to, change.id]
      );
    }
    await conn.commit();

    console.log(
      JSON.stringify(
        {
          updated: updates.length,
          sample: updates.slice(0, 25),
        },
        null,
        2
      )
    );
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

