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

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo || dt.getUTCDate() !== d) return null;
  return dt;
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

  const [members] = await conn.query(
    `SELECT id, parent_id, relationship_to_parent, name, birth, death, spouse_member_id, spouse, spouse_birth, sort_order
     FROM sienna_family_members
     ORDER BY name`
  );
  await conn.end();

  const byId = new Map(members.map((m) => [String(m.id), m]));
  const issues = [];
  const push = (type, severity, row, detail, fix) => {
    issues.push({
      type,
      severity,
      id: row?.id || null,
      name: row?.name || null,
      detail,
      fix,
    });
  };

  for (const m of members) {
    if (m.parent_id && !byId.has(String(m.parent_id))) {
      push('parent_missing', 'alta', m, `parent_id '${m.parent_id}' no existe`, 'Asignar parent_id válido o NULL.');
    }
    if (m.parent_id && String(m.parent_id) === String(m.id)) {
      push('parent_self', 'alta', m, 'parent_id apunta al mismo miembro', 'Corregir parent_id o poner NULL.');
    }
    if (!m.parent_id && m.relationship_to_parent) {
      push(
        'relationship_without_parent',
        'media',
        m,
        `relationship_to_parent='${m.relationship_to_parent}' sin parent_id`,
        'Si es nodo raíz, dejar relationship_to_parent en NULL.'
      );
    }
    if (m.parent_id && !m.relationship_to_parent) {
      push('relationship_missing', 'media', m, 'Tiene parent_id pero relationship_to_parent vacío', 'Definir parentesco.');
    }

    if (m.spouse_member_id && !byId.has(String(m.spouse_member_id))) {
      push(
        'spouse_missing',
        'alta',
        m,
        `spouse_member_id '${m.spouse_member_id}' no existe`,
        'Asignar spouse_member_id válido o NULL.'
      );
    }
    if (m.spouse_member_id && String(m.spouse_member_id) === String(m.id)) {
      push('spouse_self', 'alta', m, 'spouse_member_id apunta al mismo miembro', 'Corregir spouse_member_id o NULL.');
    }

    if (m.spouse_member_id && byId.has(String(m.spouse_member_id))) {
      const spouse = byId.get(String(m.spouse_member_id));
      if (m.spouse && normalize(m.spouse) !== normalize(spouse.name)) {
        push(
          'spouse_name_mismatch',
          'media',
          m,
          `spouse='${m.spouse}' no coincide con vinculado '${spouse.name}'`,
          'Actualizar spouse al nombre real o dejarlo NULL y usar spouse_member_id.'
        );
      }
      if (spouse.spouse_member_id && String(spouse.spouse_member_id) !== String(m.id)) {
        push(
          'spouse_not_mutual',
          'media',
          m,
          `Vínculo no recíproco: ${m.id} -> ${spouse.id}, pero ${spouse.id} -> ${spouse.spouse_member_id}`,
          'Corregir spouse_member_id del cónyuge para reciprocidad.'
        );
      }
      if (m.parent_id && String(m.parent_id) === String(spouse.id)) {
        push('spouse_is_parent', 'alta', m, `Cónyuge '${spouse.name}' también es su parent_id`, 'Revisar vínculo y jerarquía.');
      }
      if (spouse.parent_id && String(spouse.parent_id) === String(m.id)) {
        push('spouse_is_child', 'alta', m, `Cónyuge '${spouse.name}' cuelga como hijo/hija`, 'Revisar vínculo y jerarquía.');
      }
    }

    const b = parseDate(m.birth);
    const d = parseDate(m.death);
    if (m.birth && !b) push('birth_format', 'baja', m, `Nacimiento no estándar: '${m.birth}'`, 'Usar dd/mm/aaaa válido.');
    if (m.death && !d) push('death_format', 'baja', m, `Defunción no estándar: '${m.death}'`, 'Usar dd/mm/aaaa válido.');
    if (b && d && d < b) {
      push(
        'death_before_birth',
        'alta',
        m,
        `Defunción (${m.death}) anterior a nacimiento (${m.birth})`,
        'Corregir fechas.'
      );
    }
  }

  const colors = new Map(members.map((m) => [String(m.id), 0]));
  const stack = [];
  const dfs = (id) => {
    colors.set(id, 1);
    stack.push(id);
    const parentId = byId.get(id)?.parent_id ? String(byId.get(id).parent_id) : null;
    if (parentId && byId.has(parentId)) {
      if (colors.get(parentId) === 1) {
        const cycle = stack.slice(stack.indexOf(parentId)).concat([parentId]);
        issues.push({
          type: 'parent_cycle',
          severity: 'alta',
          id,
          name: byId.get(id)?.name || null,
          detail: `Ciclo detectado: ${cycle.join(' -> ')}`,
          fix: 'Romper ciclo corrigiendo parent_id en uno de esos nodos.',
        });
      } else if (colors.get(parentId) === 0) {
        dfs(parentId);
      }
    }
    stack.pop();
    colors.set(id, 2);
  };
  for (const m of members) {
    const id = String(m.id);
    if (colors.get(id) === 0) dfs(id);
  }

  const byName = new Map();
  for (const m of members) {
    const key = normalize(m.name);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(m);
  }
  for (const [key, list] of byName.entries()) {
    if (list.length > 1) {
      issues.push({
        type: 'duplicate_name',
        severity: 'media',
        id: list.map((x) => x.id).join(','),
        name: list.map((x) => x.name).join(' | '),
        detail: `Nombre duplicado normalizado '${key}' (${list.length} registros)`,
        fix: 'Agregar segundo apellido/nota operativa para evitar ambigüedad en búsquedas.',
      });
    }
  }

  const byParentAndOrder = new Map();
  for (const m of members) {
    const key = `${m.parent_id || '__root__'}::${Number(m.sort_order || 0)}`;
    if (!byParentAndOrder.has(key)) byParentAndOrder.set(key, []);
    byParentAndOrder.get(key).push(m);
  }
  for (const [key, list] of byParentAndOrder.entries()) {
    if (list.length > 1) {
      issues.push({
        type: 'sort_order_duplicate',
        severity: 'baja',
        id: list.map((x) => x.id).join(','),
        name: list.map((x) => x.name).join(' | '),
        detail: `sort_order duplicado en grupo ${key}`,
        fix: 'Asignar sort_order distinto para orden visual estable.',
      });
    }
  }

  const summary = issues.reduce(
    (acc, issue) => {
      acc.total += 1;
      acc.bySeverity[issue.severity] = (acc.bySeverity[issue.severity] || 0) + 1;
      acc.byType[issue.type] = (acc.byType[issue.type] || 0) + 1;
      return acc;
    },
    { total: 0, bySeverity: {}, byType: {} }
  );

  console.log(
    JSON.stringify(
      {
        scannedMembers: members.length,
        summary,
        issues,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

