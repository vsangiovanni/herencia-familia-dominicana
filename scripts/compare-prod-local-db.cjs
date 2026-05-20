const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const ROOT = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const map = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    map[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return map;
}

function cfg(env) {
  return {
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  };
}

async function readMetrics(conn, db) {
  const [[tables]] = await conn.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ?`,
    [db]
  );
  const [[docs]] = await conn.query(
    `SELECT
      COUNT(*) AS total_docs,
      SUM(CASE WHEN file_data IS NOT NULL AND file_data <> '' THEN 1 ELSE 0 END) AS docs_with_file_data,
      SUM(CASE WHEN file_type LIKE 'image/%' THEN 1 ELSE 0 END) AS image_docs,
      SUM(CASE WHEN file_type = 'application/pdf' THEN 1 ELSE 0 END) AS pdf_docs
     FROM \`${db}\`.evidence_documents`
  );
  const [[members]] = await conn.query(`SELECT COUNT(*) AS total_members FROM \`${db}\`.sienna_family_members`);
  const [[heirs]] = await conn.query(`SELECT COUNT(*) AS total_heirs FROM \`${db}\`.confirmed_heirs`);
  const [[visits]] = await conn.query(`SELECT COUNT(*) AS total_visits FROM \`${db}\`.page_visits`);

  return {
    total_tables: Number(tables.total || 0),
    total_docs: Number(docs.total_docs || 0),
    docs_with_file_data: Number(docs.docs_with_file_data || 0),
    image_docs: Number(docs.image_docs || 0),
    pdf_docs: Number(docs.pdf_docs || 0),
    total_members: Number(members.total_members || 0),
    total_heirs: Number(heirs.total_heirs || 0),
    total_visits: Number(visits.total_visits || 0),
  };
}

async function main() {
  const localEnv = parseEnvFile(path.join(ROOT, '.env'));
  const prodEnv = parseEnvFile(path.join(ROOT, '.env.prod.working'));

  const local = await mysql.createConnection(cfg(localEnv));
  const prod = await mysql.createConnection(cfg(prodEnv));

  try {
    const localMetrics = await readMetrics(local, localEnv.DB_NAME);
    const prodMetrics = await readMetrics(prod, prodEnv.DB_NAME);

    const keys = Object.keys(prodMetrics);
    const mismatches = keys.filter((key) => prodMetrics[key] !== localMetrics[key]);
    console.log(JSON.stringify({ prod: prodMetrics, local: localMetrics, mismatches }, null, 2));
    if (mismatches.length) process.exitCode = 2;
  } finally {
    await local.end();
    await prod.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

