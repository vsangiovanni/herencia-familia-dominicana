const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const ROOT = path.resolve(__dirname, '..');
const LOCAL_ENV_PATH = path.join(ROOT, '.env');
const PROD_ENV_PATH = path.join(ROOT, '.env.prod.working');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el archivo de entorno: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const map = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    map[key] = value;
  }
  return map;
}

function getDbConfig(envMap) {
  return {
    host: envMap.DB_HOST,
    port: Number(envMap.DB_PORT || 3306),
    user: envMap.DB_USER,
    password: envMap.DB_PASSWORD,
    database: envMap.DB_NAME,
    charset: 'utf8mb4',
    multipleStatements: true,
  };
}

function tsTag() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function listTables(connection, dbName) {
  const [rows] = await connection.execute(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME`,
    [dbName]
  );
  return rows.map((r) => r.TABLE_NAME);
}

async function getCreateTableSql(connection, dbName, tableName) {
  const [rows] = await connection.query(`SHOW CREATE TABLE \`${dbName}\`.\`${tableName}\``);
  const row = rows[0];
  return row['Create Table'];
}

function createTableWithDatabase(createTableSql, dbName, tableName) {
  const marker = `CREATE TABLE \`${tableName}\``;
  if (!createTableSql.startsWith(marker)) {
    return createTableSql.replace(/CREATE TABLE\s+`[^`]+`/, `CREATE TABLE \`${dbName}\`.\`${tableName}\``);
  }
  return createTableSql.replace(marker, `CREATE TABLE \`${dbName}\`.\`${tableName}\``);
}

async function backupLocalDatabase(localConn, localDbName) {
  const backupDbName = `${localDbName}_backup_${tsTag()}`;
  console.log(`\n[1/4] Creando backup local: ${backupDbName}`);
  await localConn.query(`CREATE DATABASE \`${backupDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  const localTables = await listTables(localConn, localDbName);
  await localConn.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const tableName of localTables) {
    const createSql = await getCreateTableSql(localConn, localDbName, tableName);
    const createInBackup = createTableWithDatabase(createSql, backupDbName, tableName);
    await localConn.query(createInBackup);
    await localConn.query(
      `INSERT INTO \`${backupDbName}\`.\`${tableName}\` SELECT * FROM \`${localDbName}\`.\`${tableName}\``
    );
  }
  await localConn.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log(`Backup completado: ${backupDbName}`);
  return backupDbName;
}

async function recreateLocalSchemaFromRemote(localConn, remoteConn, localDbName, remoteDbName) {
  console.log('\n[2/4] Recreando esquema local desde producción');
  const localTables = await listTables(localConn, localDbName);
  await localConn.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const tableName of localTables) {
    await localConn.query(`DROP TABLE IF EXISTS \`${localDbName}\`.\`${tableName}\``);
  }

  const remoteTables = await listTables(remoteConn, remoteDbName);
  for (const tableName of remoteTables) {
    const createSql = await getCreateTableSql(remoteConn, remoteDbName, tableName);
    const createInLocal = createTableWithDatabase(createSql, localDbName, tableName);
    await localConn.query(createInLocal);
  }
  await localConn.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log(`Esquema recreado con ${remoteTables.length} tablas.`);
  return remoteTables;
}

async function copyTableData(localConn, remoteConn, localDbName, remoteDbName, tableName) {
  const [[remoteCountRow]] = await remoteConn.query(
    `SELECT COUNT(*) AS count FROM \`${remoteDbName}\`.\`${tableName}\``
  );
  const remoteCount = Number(remoteCountRow.count || 0);
  if (!remoteCount) return { tableName, remoteCount, localCount: 0 };

  const pageSize = 10;
  let offset = 0;
  while (offset < remoteCount) {
    const [rows] = await remoteConn.query(
      `SELECT * FROM \`${remoteDbName}\`.\`${tableName}\` LIMIT ${pageSize} OFFSET ${offset}`
    );
    if (!rows.length) break;

    const columns = Object.keys(rows[0]);
    const columnSql = columns.map((c) => `\`${c}\``).join(', ');
    const placeholders = rows
      .map(() => `(${columns.map(() => '?').join(', ')})`)
      .join(', ');
    const values = [];
    for (const row of rows) {
      for (const col of columns) values.push(row[col]);
    }

    await localConn.query(
      `INSERT INTO \`${localDbName}\`.\`${tableName}\` (${columnSql}) VALUES ${placeholders}`,
      values
    );
    offset += rows.length;
  }

  const [[localCountRow]] = await localConn.query(
    `SELECT COUNT(*) AS count FROM \`${localDbName}\`.\`${tableName}\``
  );
  return {
    tableName,
    remoteCount,
    localCount: Number(localCountRow.count || 0),
  };
}

async function main() {
  const localEnv = parseEnvFile(LOCAL_ENV_PATH);
  const prodEnv = parseEnvFile(PROD_ENV_PATH);
  const localCfg = getDbConfig(localEnv);
  const prodCfg = getDbConfig(prodEnv);

  const localConn = await mysql.createConnection(localCfg);
  const remoteConn = await mysql.createConnection(prodCfg);

  try {
    console.log('[0/4] Conexiones OK (local y producción)');
    const backupDbName = await backupLocalDatabase(localConn, localCfg.database);
    const tables = await recreateLocalSchemaFromRemote(localConn, remoteConn, localCfg.database, prodCfg.database);

    console.log('\n[3/4] Copiando datos de producción a local');
    await localConn.query('SET FOREIGN_KEY_CHECKS = 0');
    const results = [];
    for (const tableName of tables) {
      const r = await copyTableData(localConn, remoteConn, localCfg.database, prodCfg.database, tableName);
      results.push(r);
      console.log(`- ${tableName}: remoto=${r.remoteCount}, local=${r.localCount}`);
    }
    await localConn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n[4/4] Verificación final');
    const mismatches = results.filter((r) => r.remoteCount !== r.localCount);
    if (mismatches.length) {
      console.error('Hay diferencias de conteo:', mismatches);
      process.exitCode = 2;
      return;
    }

    console.log(`Sincronización completada. Backup local disponible en: ${backupDbName}`);
  } finally {
    await remoteConn.end();
    await localConn.end();
  }
}

main().catch((error) => {
  console.error('Error sincronizando producción -> local:', error.message);
  process.exit(1);
});

