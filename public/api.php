<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');

function json_response($data, int $status = 200): void {
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function read_env_file(): array {
  $env = [];
  $path = __DIR__ . '/.env';
  if (!is_file($path)) return $env;
  foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
    [$key, $value] = explode('=', $line, 2);
    $env[trim($key)] = trim($value, " \t\n\r\0\x0B\"'");
  }
  return $env;
}

$env = read_env_file();

function env_value(string $key, ?string $default = null): ?string {
  global $env;
  $value = getenv($key);
  if ($value !== false && $value !== '') return $value;
  return $env[$key] ?? $default;
}

function db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;

  $host = env_value('DB_HOST', '127.0.0.1');
  $port = env_value('DB_PORT', '3306');
  $name = env_value('DB_NAME', 'herencia_rd');
  $user = env_value('DB_USER', 'root');
  $pass = env_value('DB_PASSWORD', '');

  $pdo = new PDO(
    "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4",
    $user,
    $pass,
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]
  );

  return $pdo;
}

function uuid(): string {
  $data = random_bytes(16);
  $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
  $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function exec_sql(string $sql, array $params = []): PDOStatement {
  $stmt = db()->prepare($sql);
  foreach ($params as $key => $value) {
    $stmt->bindValue(is_int($key) ? $key + 1 : ':' . $key, $value);
  }
  $stmt->execute();
  return $stmt;
}

function query_all(string $sql, array $params = []): array {
  return exec_sql($sql, $params)->fetchAll();
}

function query_one(string $sql, array $params = []): ?array {
  $row = exec_sql($sql, $params)->fetch();
  return $row ?: null;
}

function column_exists(string $table, string $column): bool {
  $row = query_one(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tableName AND COLUMN_NAME = :columnName LIMIT 1',
    ['tableName' => $table, 'columnName' => $column]
  );
  return (bool)$row;
}

function normalize_enum($value, array $allowed, $fallback = null) {
  if ($value === null) return $fallback;
  return in_array($value, $allowed, true) ? $value : $fallback;
}

function can_seed_case_data(): bool {
  $flag = strtolower((string)env_value('SEED_CASE_DATA', 'false'));
  if (!in_array($flag, ['1', 'true', 'yes', 'on'], true)) return false;

  $memberCount = query_one('SELECT COUNT(*) AS count FROM sienna_family_members');
  $heirCount = query_one('SELECT COUNT(*) AS count FROM confirmed_heirs');
  return (int)($memberCount['count'] ?? 0) === 0 && (int)($heirCount['count'] ?? 0) === 0;
}

function ensure_schema(): void {
  db()->exec("
    CREATE TABLE IF NOT EXISTS profiles (
      id CHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NULL,
      phone VARCHAR(50) NULL,
      role ENUM('admin', 'regular') NOT NULL DEFAULT 'regular',
      is_approved BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pages (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      path VARCHAR(255) NOT NULL UNIQUE,
      description TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_page_permissions (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      page_id CHAR(36) NOT NULL,
      created_by CHAR(36) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_page (user_id, page_id),
      CONSTRAINT fk_permissions_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      CONSTRAINT fk_permissions_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
      CONSTRAINT fk_permissions_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS page_visits (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      page_path VARCHAR(255) NOT NULL,
      page_name VARCHAR(255) NULL,
      user_agent TEXT NULL,
      ip_address VARCHAR(64) NULL,
      visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_page_visits_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key VARCHAR(120) PRIMARY KEY,
      setting_value TEXT NULL,
      updated_by CHAR(36) NULL,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS confirmed_heirs (
      id CHAR(36) PRIMARY KEY,
      sienna_member_id VARCHAR(120) NULL UNIQUE,
      heir_name VARCHAR(255) NOT NULL UNIQUE,
      relationship_summary TEXT NULL,
      line_vincenzo BOOLEAN NOT NULL DEFAULT FALSE,
      line_paolo BOOLEAN NOT NULL DEFAULT FALSE,
      status ENUM('mencionado', 'confirmado', 'pendiente') NOT NULL DEFAULT 'mencionado',
      notes TEXT NULL,
      photo_file_name VARCHAR(255) NULL,
      photo_file_type VARCHAR(120) NULL,
      photo_data LONGTEXT NULL,
      inheritance_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
      created_by CHAR(36) NULL,
      updated_by CHAR(36) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evidence_documents (
      id CHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      document_type VARCHAR(120) NOT NULL,
      primary_member_id VARCHAR(120) NULL,
      primary_person VARCHAR(255) NULL,
      event_date VARCHAR(50) NULL,
      event_place VARCHAR(255) NULL,
      father_member_id VARCHAR(120) NULL,
      father_name VARCHAR(255) NULL,
      mother_member_id VARCHAR(120) NULL,
      mother_name VARCHAR(255) NULL,
      spouse_member_id VARCHAR(120) NULL,
      spouse_name VARCHAR(255) NULL,
      related_member_id VARCHAR(120) NULL,
      related_heir_name VARCHAR(255) NULL,
      confirms_heir BOOLEAN NOT NULL DEFAULT FALSE,
      people_involved JSON NULL,
      extracted_text LONGTEXT NULL,
      notes TEXT NULL,
      file_name VARCHAR(255) NULL,
      file_type VARCHAR(120) NULL,
      file_data LONGTEXT NULL,
      created_by CHAR(36) NULL,
      updated_by CHAR(36) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_evidence_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sienna_family_members (
      id VARCHAR(120) PRIMARY KEY,
      parent_id VARCHAR(120) NULL,
      relationship_to_parent ENUM('hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro') NULL,
      name VARCHAR(255) NOT NULL,
      birth VARCHAR(50) NULL,
      death VARCHAR(50) NULL,
      spouse_member_id VARCHAR(120) NULL,
      spouse VARCHAR(255) NULL,
      spouse_birth VARCHAR(50) NULL,
      inheritance_status ENUM('posible_heredero', 'no_hereda', 'requiere_revision', 'confirmado') NOT NULL DEFAULT 'requiere_revision',
      inheritance_reason TEXT NULL,
      is_highlighted_ancestor BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INT NOT NULL DEFAULT 0,
      created_by CHAR(36) NULL,
      updated_by CHAR(36) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sienna_family_parent (parent_id)
    );

    CREATE TABLE IF NOT EXISTS sienna_calculation_snapshots (
      id CHAR(36) PRIMARY KEY,
      estate_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
      lawyer_fee_percentage DECIMAL(6,2) NOT NULL DEFAULT 0,
      distributable_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
      members_hash TEXT NULL,
      payload_json LONGTEXT NULL,
      created_by CHAR(36) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  ");

  $pages = [
    ['Dashboard', '/dashboard', 'Panel principal'],
    ['Árbol Genealógico', '/arbol-genealogico', 'Vista del árbol genealógico'],
    ['Árbol Genealógico Clásico', '/arbol-genealogico-clasico', 'Vista clásica del árbol genealógico'],
    ['Líneas Familiares', '/lineas-familiares', 'Líneas familiares'],
    ['Determinación de Herederos', '/determinacion-herederos', 'Determinación legal de herederos'],
    ['Cálculo de Herencias', '/calculo-herencias', 'Calculadora y administración'],
    ['Administración de Usuarios', '/admin-users', 'Gestión de usuarios'],
    ['Hallazgos', '/hallazgos', 'Hallazgos e inconsistencias detectadas'],
    ['Cálculo por Filiación', '/calculo-filiacion', 'Distribución por líneas familiares'],
    ['Settings', '/admin/settings', 'Configuración global del sistema'],
    ['Documentos Probatorios', '/documentos-probatorios', 'Expediente documental de actas y herederos'],
    ['Árbol Sienna', '/sienna/arbol-genealogico', 'Árbol genealógico con foto y monto heredado'],
    ['Miembros del Árbol Sienna', '/sienna/miembros-arbol', 'CRUD de miembros del árbol genealógico Sienna'],
    ['Explicación de Herederos Sienna', '/sienna/explicacion-herederos', 'Explicación, simulación y auditoría de herederos Sienna'],
  ];

  foreach ($pages as [$name, $path, $description]) {
    exec_sql(
      "INSERT INTO pages (id, name, path, description)
       VALUES (:id, :name, :path, :description)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)",
      ['id' => uuid(), 'name' => $name, 'path' => $path, 'description' => $description]
    );
  }

  $migrations = [
    ['sienna_member_id', 'ALTER TABLE confirmed_heirs ADD COLUMN sienna_member_id VARCHAR(120) NULL UNIQUE AFTER id'],
    ['photo_file_name', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_file_name VARCHAR(255) NULL AFTER notes'],
    ['photo_file_type', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_file_type VARCHAR(120) NULL AFTER photo_file_name'],
    ['photo_data', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_data LONGTEXT NULL AFTER photo_file_type'],
    ['inheritance_amount', 'ALTER TABLE confirmed_heirs ADD COLUMN inheritance_amount DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER photo_data'],
    ['created_by', 'ALTER TABLE confirmed_heirs ADD COLUMN created_by CHAR(36) NULL AFTER inheritance_amount'],
    ['updated_by', 'ALTER TABLE confirmed_heirs ADD COLUMN updated_by CHAR(36) NULL AFTER created_by'],
  ];

  foreach ($migrations as [$column, $sql]) {
    if (!column_exists('confirmed_heirs', $column)) {
      db()->exec($sql);
    }
  }

  if (!column_exists('evidence_documents', 'primary_member_id')) {
    db()->exec('ALTER TABLE evidence_documents ADD COLUMN primary_member_id VARCHAR(120) NULL AFTER document_type');
  }
  if (!column_exists('evidence_documents', 'father_member_id')) {
    db()->exec('ALTER TABLE evidence_documents ADD COLUMN father_member_id VARCHAR(120) NULL AFTER event_place');
  }
  if (!column_exists('evidence_documents', 'mother_member_id')) {
    db()->exec('ALTER TABLE evidence_documents ADD COLUMN mother_member_id VARCHAR(120) NULL AFTER father_name');
  }
  if (!column_exists('evidence_documents', 'spouse_member_id')) {
    db()->exec('ALTER TABLE evidence_documents ADD COLUMN spouse_member_id VARCHAR(120) NULL AFTER mother_name');
  }
  if (!column_exists('evidence_documents', 'related_member_id')) {
    db()->exec('ALTER TABLE evidence_documents ADD COLUMN related_member_id VARCHAR(120) NULL AFTER spouse_name');
  }

  if (!column_exists('evidence_documents', 'updated_by')) {
    db()->exec('ALTER TABLE evidence_documents ADD COLUMN updated_by CHAR(36) NULL AFTER created_by');
  }

  $memberMigrations = [
    ['relationship_to_parent', "ALTER TABLE sienna_family_members ADD COLUMN relationship_to_parent ENUM('hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro') NULL AFTER parent_id"],
    ['spouse_member_id', 'ALTER TABLE sienna_family_members ADD COLUMN spouse_member_id VARCHAR(120) NULL AFTER death'],
    ['inheritance_status', "ALTER TABLE sienna_family_members ADD COLUMN inheritance_status ENUM('posible_heredero', 'no_hereda', 'requiere_revision', 'confirmado') NOT NULL DEFAULT 'requiere_revision' AFTER spouse_birth"],
    ['inheritance_reason', 'ALTER TABLE sienna_family_members ADD COLUMN inheritance_reason TEXT NULL AFTER inheritance_status'],
    ['created_by', 'ALTER TABLE sienna_family_members ADD COLUMN created_by CHAR(36) NULL AFTER sort_order'],
    ['updated_by', 'ALTER TABLE sienna_family_members ADD COLUMN updated_by CHAR(36) NULL AFTER created_by'],
  ];

  foreach ($memberMigrations as [$column, $sql]) {
    if (!column_exists('sienna_family_members', $column)) {
      db()->exec($sql);
    }
  }

  db()->exec("
    CREATE TABLE IF NOT EXISTS family_unions (
      id VARCHAR(160) PRIMARY KEY,
      partner_a_member_id VARCHAR(120) NOT NULL,
      partner_b_member_id VARCHAR(120) NULL,
      union_type ENUM('matrimonio', 'union_libre', 'otra') NOT NULL DEFAULT 'matrimonio',
      start_date VARCHAR(50) NULL,
      end_date VARCHAR(50) NULL,
      notes TEXT NULL,
      migration_source VARCHAR(80) NULL,
      confidence ENUM('alta', 'media', 'baja') NOT NULL DEFAULT 'media',
      is_inconsistent BOOLEAN NOT NULL DEFAULT FALSE,
      inconsistency_reason TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  ");

  db()->exec("
    CREATE TABLE IF NOT EXISTS member_parent_links (
      id VARCHAR(200) PRIMARY KEY,
      child_member_id VARCHAR(120) NOT NULL,
      parent_member_id VARCHAR(120) NOT NULL,
      parent_role ENUM('padre', 'madre', 'progenitor') NOT NULL DEFAULT 'progenitor',
      union_id VARCHAR(160) NULL,
      link_type ENUM('biologico', 'adoptivo', 'legal') NOT NULL DEFAULT 'biologico',
      is_primary_line BOOLEAN NOT NULL DEFAULT FALSE,
      migration_source VARCHAR(80) NULL,
      confidence ENUM('alta', 'media', 'baja') NOT NULL DEFAULT 'media',
      is_inconsistent BOOLEAN NOT NULL DEFAULT FALSE,
      inconsistency_reason TEXT NULL,
      source_document_id VARCHAR(120) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_parent_link_child_parent_union (child_member_id, parent_member_id, union_id)
    )
  ");

  exec_sql(
    "UPDATE confirmed_heirs ch
     JOIN sienna_family_members sfm ON LOWER(TRIM(ch.heir_name)) = LOWER(TRIM(sfm.name))
     SET ch.sienna_member_id = sfm.id
     WHERE ch.sienna_member_id IS NULL"
  );

  exec_sql(
    "UPDATE evidence_documents ed
     JOIN sienna_family_members sfm ON LOWER(TRIM(ed.related_heir_name)) = LOWER(TRIM(sfm.name))
     SET ed.related_member_id = sfm.id
     WHERE ed.related_member_id IS NULL AND ed.related_heir_name IS NOT NULL"
  );

  exec_sql(
    "INSERT INTO app_settings (setting_key, setting_value)
     VALUES ('lawyer_fee_percentage', '0')
     ON DUPLICATE KEY UPDATE setting_key = setting_key"
  );

  if (can_seed_case_data()) {
    $heirs = [
      ['Víctor Manuel Martín Sangiovanni Rodríguez', 'Heredero por doble vocación sucesoral: línea Vincenzo/Vicente vía María Rosa y línea Paolo/Paulino vía Pedro Pablo.', 1, 1],
      ['Perla Rosa Brea Sangiovanni', 'Heredera con doble línea familiar en la estructura analítica actual.', 1, 1],
      ['Bernardo Martín Lizardo Sangiovanni', 'Heredero por la línea Vincenzo/Vicente, rama Domingo Ramón.', 1, 0],
      ['Jocelyn del Jesús Sangiovanni Báez', 'Heredera por la línea Vincenzo/Vicente, rama Domingo Ramón / José Vicente.', 1, 0],
      ['Mayra Josefina Sangiovanni Báez', 'Heredera por la línea Vincenzo/Vicente, rama Domingo Ramón / José Vicente.', 1, 0],
    ];

    foreach ($heirs as [$name, $summary, $vincenzo, $paolo]) {
      exec_sql(
        "INSERT INTO confirmed_heirs (id, heir_name, relationship_summary, line_vincenzo, line_paolo, status, notes)
         VALUES (:id, :name, :summary, :vincenzo, :paolo, 'mencionado', 'No requiere acta para figurar en el cálculo inicial; puede anexarse evidencia cuando se tenga.')",
        ['id' => uuid(), 'name' => $name, 'summary' => $summary, 'vincenzo' => $vincenzo, 'paolo' => $paolo]
      );
    }

    $members = [
      ['domenico', null, 'Domenico (Domingo) Sangiovanni', '17/12/1845', null, null, 'María Rosa Grisolia', '18/07/1852', 0, 10],
      ['maria-magdalena', 'domenico', 'María Magdalena Sangiovanni', '27/04/1874', '07/05/1935', null, 'Vincenzo de Paola', null, 0, 10],
      ['vincenzo', 'domenico', 'Vincenzo (Vicente) Sangiovanni', '13/08/1880', '07/02/1958', null, 'María Balbina Pérez Álvarez', null, 0, 20],
      ['paolo', 'domenico', 'Paolo (Paulino) Sangiovanni', '17/01/1885', '31/03/1936', null, 'Simona Simo', null, 0, 30],
      ['alessandro', 'maria-magdalena', 'Alessandro de Paola Sangiovanni', '18/10/1911', '14/01/1998', null, null, null, 1, 10],
      ['maria-rosa', 'vincenzo', 'María Rosa Sangiovanni Pérez', '18/02/1906', '07/08/1981', 'pedro-pablo', 'Pedro Pablo Sangiovanni Simo', null, 0, 10],
      ['domingo-ramon', 'vincenzo', 'Domingo Ramón Sangiovanni Pérez', '11/07/1907', '03/09/1981', null, 'María Francisca Gesualdo', null, 0, 20],
      ['pedro-pablo', 'paolo', 'Pedro Pablo Sangiovanni Simo', '29/10/1906', '04/10/1986', 'maria-rosa', null, null, 0, 10],
      ['victor-manuel', 'maria-rosa', 'Víctor Manuel Sangiovanni Sangiovanni', '29/10/1932', '21/10/2007', null, 'Ana Julia Rodríguez', null, 0, 10],
      ['maria-amparo', 'domingo-ramon', 'María Amparo Sangiovanni Gesualdo', '30/10/1929', '15/01/2004', null, 'Bernardo Edmundo Lizardo Fernández', null, 0, 10],
      ['jose-vicente', 'domingo-ramon', 'José Vicente Sangiovanni Gesualdo', '19/04/1932', '24/04/1976', null, 'Ozema Báez', null, 0, 20],
      ['rosa-julia', 'victor-manuel', 'Rosa Julia Sangiovanni Rodríguez', '15/04/1963', '04/10/2024', null, 'Francisco Brea', null, 0, 10],
      ['victor-manuel-martin', 'victor-manuel', 'Víctor Manuel Martín Sangiovanni Rodríguez', '08/11/1966', null, null, null, null, 0, 20],
      ['bernardo-martin', 'maria-amparo', 'Bernardo Martín Lizardo Sangiovanni', '28/10/1966', null, null, null, null, 0, 10],
      ['jocelyn', 'jose-vicente', 'Jocelyn del Jesús Sangiovanni Báez', '06/10/1963', null, null, null, null, 0, 10],
      ['mayra', 'jose-vicente', 'Mayra Josefina Sangiovanni Báez', '20/11/1965', null, null, null, null, 0, 20],
      ['perla-rosa', 'rosa-julia', 'Perla Rosa Brea Sangiovanni', '30/04/1989', null, null, null, null, 0, 10],
    ];

    foreach ($members as [$id, $parentId, $name, $birth, $death, $spouseMemberId, $spouse, $spouseBirth, $highlighted, $sortOrder]) {
      exec_sql(
        'INSERT INTO sienna_family_members (id, parent_id, name, birth, death, spouse_member_id, spouse, spouse_birth, is_highlighted_ancestor, sort_order)
         VALUES (:id, :parentId, :name, :birth, :death, :spouseMemberId, :spouse, :spouseBirth, :highlighted, :sortOrder)',
        [
          'id' => $id,
          'parentId' => $parentId,
          'name' => $name,
          'birth' => $birth,
          'death' => $death,
          'spouseMemberId' => $spouseMemberId,
          'spouse' => $spouse,
          'spouseBirth' => $spouseBirth,
          'highlighted' => $highlighted,
          'sortOrder' => $sortOrder,
        ]
      );
    }

    exec_sql(
      "UPDATE confirmed_heirs ch
       JOIN sienna_family_members sfm ON LOWER(TRIM(ch.heir_name)) = LOWER(TRIM(sfm.name))
       SET ch.sienna_member_id = sfm.id
       WHERE ch.sienna_member_id IS NULL"
    );

    exec_sql(
      "UPDATE evidence_documents ed
       JOIN sienna_family_members sfm ON LOWER(TRIM(ed.related_heir_name)) = LOWER(TRIM(sfm.name))
       SET ed.related_member_id = sfm.id
       WHERE ed.related_member_id IS NULL AND ed.related_heir_name IS NOT NULL"
    );
  }

  $email = env_value('LOCAL_ADMIN_EMAIL');
  $password = env_value('LOCAL_ADMIN_PASSWORD');
  if ($email && $password) {
    $existing = query_one('SELECT id FROM profiles WHERE email = :email LIMIT 1', ['email' => $email]);
    if ($existing) {
      exec_sql("UPDATE profiles SET role = 'admin', is_approved = TRUE WHERE email = :email", ['email' => $email]);
    } else {
      exec_sql(
        "INSERT INTO profiles (id, email, password_hash, full_name, role, is_approved)
         VALUES (:id, :email, :hash, :name, 'admin', TRUE)",
        [
          'id' => uuid(),
          'email' => $email,
          'hash' => password_hash($password, PASSWORD_BCRYPT),
          'name' => env_value('LOCAL_ADMIN_NAME', 'Administrador'),
        ]
      );
    }
  }
}

function public_profile(?array $profile): ?array {
  if (!$profile) return null;
  return [
    'id' => $profile['id'],
    'email' => $profile['email'],
    'full_name' => $profile['full_name'],
    'phone' => $profile['phone'],
    'role' => $profile['role'],
    'is_approved' => (bool)$profile['is_approved'],
    'created_at' => $profile['created_at'],
    'updated_at' => $profile['updated_at'],
  ];
}

function sign_token(array $profile): string {
  $payload = base64_encode(json_encode([
    'sub' => $profile['id'],
    'email' => $profile['email'],
    'role' => $profile['role'],
    'exp' => time() + (7 * 24 * 60 * 60),
  ]));
  $sig = hash_hmac('sha256', $payload, env_value('JWT_SECRET', 'herencia-rd-local-dev-secret'));
  return $payload . '.' . $sig;
}

function verify_token(?string $token): ?array {
  if (!$token || !str_contains($token, '.')) return null;
  [$payload, $sig] = explode('.', $token, 2);
  $expected = hash_hmac('sha256', $payload, env_value('JWT_SECRET', 'herencia-rd-local-dev-secret'));
  if (!hash_equals($expected, $sig)) return null;
  $data = json_decode(base64_decode($payload), true);
  if (!$data || ($data['exp'] ?? 0) < time()) return null;
  return $data;
}

function set_session_cookie(string $token): void {
  setcookie('herencia_session', $token, [
    'expires' => time() + (7 * 24 * 60 * 60),
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
}

function clear_session_cookie(): void {
  setcookie('herencia_session', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
}

function current_user(): ?array {
  $token = $_COOKIE['herencia_session'] ?? null;
  if (!$token) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($auth, 'Bearer ')) $token = substr($auth, 7);
  }
  $payload = verify_token($token);
  if (!$payload) return null;
  return query_one('SELECT * FROM profiles WHERE id = :id LIMIT 1', ['id' => $payload['sub']]);
}

function require_user(bool $requireApproved = true): array {
  $user = current_user();
  if (!$user) json_response(['message' => 'No autenticado'], 401);
  if (
    $requireApproved &&
    ($user['role'] ?? '') !== 'admin' &&
    !filter_var($user['is_approved'] ?? false, FILTER_VALIDATE_BOOLEAN)
  ) {
    json_response(['message' => 'Tu cuenta aún no ha sido aprobada por un administrador.'], 403);
  }
  return $user;
}

function require_admin(array $user): void {
  if (($user['role'] ?? '') !== 'admin') json_response(['message' => 'Acceso no autorizado'], 403);
}

function body(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw ?: '{}', true);
  return is_array($data) ? $data : [];
}

function bool_value($value): int {
  return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
}

function request_path(): string {
  $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
  return preg_replace('#^/api#', '', $path) ?: '/';
}

function respond_health(): void {
  $envPath = __DIR__ . '/.env';
  if (!is_file($envPath)) {
    json_response([
      'ok' => false,
      'storage' => 'mysql',
      'runtime' => 'php',
      'message' => 'Falta el archivo .env en el servidor. Copie las credenciales MySQL de Hostinger a public_html/herenciard/.env',
    ], 503);
  }

  db()->query('SELECT 1');
  json_response(['ok' => true, 'storage' => 'mysql', 'runtime' => 'php']);
}

try {
  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
  $path = request_path();

  if ($method === 'GET' && $path === '/health') {
    respond_health();
  }

  ensure_schema();

  if ($method === 'POST' && $path === '/auth/signup') {
    json_response(['message' => 'El auto-registro está deshabilitado. Solicita tus credenciales al administrador.'], 403);
  }

  if ($method === 'POST' && $path === '/auth/signin') {
    $data = body();
    $email = strtolower(trim($data['email'] ?? ''));
    $profile = query_one('SELECT * FROM profiles WHERE email = :email LIMIT 1', ['email' => $email]);
    if (!$profile || !password_verify((string)($data['password'] ?? ''), $profile['password_hash'])) {
      json_response(['message' => 'Credenciales inválidas'], 401);
    }
    $token = sign_token($profile);
    set_session_cookie($token);
    $public = public_profile($profile);
    json_response(['user' => $public, 'profile' => $public]);
  }

  if ($method === 'POST' && $path === '/auth/signout') {
    clear_session_cookie();
    json_response(['ok' => true]);
  }

  if ($method === 'GET' && $path === '/auth/session') {
    $public = public_profile(require_user(false));
    json_response(['user' => $public, 'profile' => $public]);
  }

  if ($method === 'PATCH' && $path === '/auth/password') {
    $user = require_user(false);
    $password = (string)(body()['password'] ?? '');
    if (strlen($password) < 6) json_response(['message' => 'La contraseña debe tener al menos 6 caracteres'], 400);
    exec_sql('UPDATE profiles SET password_hash = :hash WHERE id = :id', ['hash' => password_hash($password, PASSWORD_BCRYPT), 'id' => $user['id']]);
    json_response(['ok' => true]);
  }

  if ($method === 'GET' && $path === '/pages') {
    require_user();
    json_response(['pages' => query_all('SELECT id, name, path, description, created_at FROM pages ORDER BY name')]);
  }

  if ($method === 'GET' && $path === '/settings') {
    require_user();
    $settings = [];
    foreach (query_all('SELECT setting_key, setting_value FROM app_settings') as $row) {
      if ($row['setting_key'] === 'sienna_case_config' && $row['setting_value']) {
        $decoded = json_decode((string)$row['setting_value'], true);
        $settings[$row['setting_key']] = is_array($decoded) ? $decoded : null;
      } else {
        $settings[$row['setting_key']] = $row['setting_value'];
      }
    }
    json_response(['settings' => $settings]);
  }

  if ($method === 'PUT' && $path === '/settings') {
    $user = require_user();
    require_admin($user);
    $request = body();
    $resultSettings = [];

    if (array_key_exists('lawyer_fee_percentage', $request)) {
      $rawFee = (float)($request['lawyer_fee_percentage'] ?? 0);
      $fee = min(100, max(0, $rawFee));
      exec_sql(
        "INSERT INTO app_settings (setting_key, setting_value, updated_by)
         VALUES ('lawyer_fee_percentage', :value, :updatedBy)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)",
        ['value' => (string)$fee, 'updatedBy' => $user['id']]
      );
      $resultSettings['lawyer_fee_percentage'] = $fee;
    }

    if (array_key_exists('sienna_case_config', $request)) {
      $caseConfig = $request['sienna_case_config'];
      if (!is_array($caseConfig)) {
        json_response(['message' => 'sienna_case_config debe ser un objeto JSON válido'], 400);
      }
      exec_sql(
        "INSERT INTO app_settings (setting_key, setting_value, updated_by)
         VALUES ('sienna_case_config', :value, :updatedBy)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)",
        ['value' => json_encode($caseConfig, JSON_UNESCAPED_UNICODE), 'updatedBy' => $user['id']]
      );
      $resultSettings['sienna_case_config'] = $caseConfig;
    }
    json_response(['ok' => true, 'settings' => $resultSettings]);
  }

  if ($method === 'GET' && $path === '/profiles/me') {
    json_response(['profile' => public_profile(require_user(false))]);
  }

  if ($method === 'PATCH' && $path === '/profiles/me') {
    $user = require_user(false);
    $data = body();
    exec_sql('UPDATE profiles SET full_name = :name, phone = :phone WHERE id = :id', [
      'name' => $data['full_name'] ?? null,
      'phone' => $data['phone'] ?? null,
      'id' => $user['id'],
    ]);
    json_response(['profile' => public_profile(query_one('SELECT * FROM profiles WHERE id = :id', ['id' => $user['id']]))]);
  }

  if ($method === 'GET' && $path === '/users') {
    $user = require_user();
    require_admin($user);
    $users = query_all('SELECT id, email, full_name, phone, role, is_approved, created_at, updated_at FROM profiles ORDER BY created_at DESC');
    $permissions = query_all('SELECT user_id, page_id FROM user_page_permissions');
    foreach ($users as &$row) {
      $row = public_profile($row);
      $row['permissions'] = array_values(array_map(
        fn($p) => ['page_id' => $p['page_id']],
        array_filter($permissions, fn($p) => $p['user_id'] === $row['id'])
      ));
    }
    json_response(['users' => $users]);
  }

  if ($method === 'POST' && $path === '/users') {
    $user = require_user();
    require_admin($user);
    $data = body();
    $email = trim((string)($data['email'] ?? ''));
    $password = (string)($data['password'] ?? '');
    if ($email === '' || $password === '') {
      json_response(['message' => 'Correo y contraseña son requeridos'], 400);
    }
    if (strlen($password) < 6) {
      json_response(['message' => 'La contraseña debe tener al menos 6 caracteres'], 400);
    }
    if (query_one('SELECT id FROM profiles WHERE email = :email LIMIT 1', ['email' => $email])) {
      json_response(['message' => 'Ese correo ya existe'], 409);
    }
    $id = uuid();
    $role = in_array(($data['role'] ?? 'regular'), ['admin', 'regular'], true) ? $data['role'] : 'regular';
    exec_sql(
      'INSERT INTO profiles (id, email, password_hash, full_name, role, is_approved)
       VALUES (:id, :email, :hash, :fullName, :role, :approved)',
      [
        'id' => $id,
        'email' => $email,
        'hash' => password_hash($password, PASSWORD_BCRYPT),
        'fullName' => $data['full_name'] ?? null,
        'role' => $role,
        'approved' => bool_value($data['is_approved'] ?? true),
      ]
    );
    json_response(['profile' => public_profile(query_one('SELECT * FROM profiles WHERE id = :id', ['id' => $id]))], 201);
  }

  if (preg_match('#^/users/([^/]+)$#', $path, $m) && $method === 'PATCH') {
    $user = require_user();
    require_admin($user);
    $data = body();
    if (array_key_exists('is_approved', $data)) {
      exec_sql('UPDATE profiles SET is_approved = :approved WHERE id = :id', ['approved' => bool_value($data['is_approved']), 'id' => $m[1]]);
    }
    if (isset($data['role']) && in_array($data['role'], ['admin', 'regular'], true)) {
      exec_sql('UPDATE profiles SET role = :role WHERE id = :id', ['role' => $data['role'], 'id' => $m[1]]);
    }
    json_response(['profile' => public_profile(query_one('SELECT * FROM profiles WHERE id = :id', ['id' => $m[1]]))]);
  }

  if (preg_match('#^/users/([^/]+)$#', $path, $m) && $method === 'DELETE') {
    $user = require_user();
    require_admin($user);
    exec_sql('DELETE FROM profiles WHERE id = :id', ['id' => $m[1]]);
    json_response(['ok' => true]);
  }

  if (preg_match('#^/users/([^/]+)/permissions$#', $path, $m) && $method === 'PUT') {
    $user = require_user();
    require_admin($user);
    exec_sql('DELETE FROM user_page_permissions WHERE user_id = :userId', ['userId' => $m[1]]);
    foreach ((body()['page_ids'] ?? []) as $pageId) {
      exec_sql(
        'INSERT IGNORE INTO user_page_permissions (id, user_id, page_id, created_by) VALUES (:id, :userId, :pageId, :createdBy)',
        ['id' => uuid(), 'userId' => $m[1], 'pageId' => $pageId, 'createdBy' => $user['id']]
      );
    }
    json_response(['ok' => true]);
  }

  if ($method === 'POST' && $path === '/page-visits') {
    $user = require_user();
    $data = body();
    exec_sql(
      'INSERT INTO page_visits (id, user_id, page_path, page_name, user_agent, ip_address) VALUES (:id, :userId, :path, :name, :agent, :ip)',
      [
        'id' => uuid(),
        'userId' => $user['id'],
        'path' => $data['page_path'] ?? '/',
        'name' => $data['page_name'] ?? null,
        'agent' => $data['user_agent'] ?? ($_SERVER['HTTP_USER_AGENT'] ?? null),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
      ]
    );
    json_response(['ok' => true]);
  }

  if ($method === 'GET' && $path === '/page-visits') {
    $user = require_user();
    require_admin($user);
    json_response(['visits' => query_all('SELECT * FROM page_visits ORDER BY visited_at DESC LIMIT 500')]);
  }

  if ($method === 'GET' && $path === '/confirmed-heirs') {
    require_user();
    json_response(['heirs' => query_all(
      'SELECT h.*, creator.email AS created_by_email, creator.full_name AS created_by_name,
              updater.email AS updated_by_email, updater.full_name AS updated_by_name,
              COUNT(d.id) AS evidence_count
       FROM confirmed_heirs h
       LEFT JOIN evidence_documents d ON d.related_heir_name = h.heir_name OR d.related_member_id = h.sienna_member_id
       LEFT JOIN profiles creator ON creator.id = h.created_by
       LEFT JOIN profiles updater ON updater.id = h.updated_by
       GROUP BY h.id
       ORDER BY h.heir_name'
    )]);
  }

  if ($method === 'POST' && $path === '/confirmed-heirs') {
    $user = require_user();
    $data = body();
    $heirName = trim((string)($data['heir_name'] ?? ''));
    if ($heirName === '') {
      json_response(['message' => 'El nombre del heredero es requerido'], 400);
    }
    $status = normalize_enum($data['status'] ?? null, ['mencionado', 'confirmado', 'pendiente'], 'mencionado');
    exec_sql(
      'INSERT INTO confirmed_heirs (id, sienna_member_id, heir_name, relationship_summary, line_vincenzo, line_paolo, status, notes, photo_file_name, photo_file_type, photo_data, inheritance_amount, created_by, updated_by)
       VALUES (:id, :siennaMemberId, :name, :summary, :vincenzo, :paolo, :status, :notes, :photoFileName, :photoFileType, :photoData, :inheritanceAmount, :createdBy, :updatedBy)
       ON DUPLICATE KEY UPDATE sienna_member_id = VALUES(sienna_member_id), relationship_summary = VALUES(relationship_summary), line_vincenzo = VALUES(line_vincenzo), line_paolo = VALUES(line_paolo), status = VALUES(status), notes = VALUES(notes), photo_file_name = VALUES(photo_file_name), photo_file_type = VALUES(photo_file_type), photo_data = VALUES(photo_data), inheritance_amount = VALUES(inheritance_amount), updated_by = VALUES(updated_by)',
      [
        'id' => uuid(),
        'siennaMemberId' => $data['sienna_member_id'] ?? null,
        'name' => $heirName,
        'summary' => $data['relationship_summary'] ?? null,
        'vincenzo' => bool_value($data['line_vincenzo'] ?? false),
        'paolo' => bool_value($data['line_paolo'] ?? false),
        'status' => $status,
        'notes' => $data['notes'] ?? null,
        'photoFileName' => $data['photo_file_name'] ?? null,
        'photoFileType' => $data['photo_file_type'] ?? null,
        'photoData' => $data['photo_data'] ?? null,
        'inheritanceAmount' => (float)($data['inheritance_amount'] ?? 0),
        'createdBy' => $user['id'],
        'updatedBy' => $user['id'],
      ]
    );
    json_response(['ok' => true]);
  }

  if (preg_match('#^/confirmed-heirs/([^/]+)$#', $path, $m) && $method === 'PUT') {
    $user = require_user();
    $data = body();
    $heirName = trim((string)($data['heir_name'] ?? ''));
    if ($heirName === '') {
      json_response(['message' => 'El nombre del heredero es requerido'], 400);
    }
    $status = normalize_enum($data['status'] ?? null, ['mencionado', 'confirmado', 'pendiente'], 'mencionado');
    exec_sql(
      'UPDATE confirmed_heirs SET sienna_member_id = :siennaMemberId, heir_name = :name, relationship_summary = :summary, line_vincenzo = :vincenzo, line_paolo = :paolo, status = :status, notes = :notes, photo_file_name = :photoFileName, photo_file_type = :photoFileType, photo_data = :photoData, inheritance_amount = :inheritanceAmount, updated_by = :updatedBy WHERE id = :id',
      [
        'id' => $m[1],
        'siennaMemberId' => $data['sienna_member_id'] ?? null,
        'name' => $heirName,
        'summary' => $data['relationship_summary'] ?? null,
        'vincenzo' => bool_value($data['line_vincenzo'] ?? false),
        'paolo' => bool_value($data['line_paolo'] ?? false),
        'status' => $status,
        'notes' => $data['notes'] ?? null,
        'photoFileName' => $data['photo_file_name'] ?? null,
        'photoFileType' => $data['photo_file_type'] ?? null,
        'photoData' => $data['photo_data'] ?? null,
        'inheritanceAmount' => (float)($data['inheritance_amount'] ?? 0),
        'updatedBy' => $user['id'],
      ]
    );
    json_response(['ok' => true]);
  }

  if ($method === 'GET' && $path === '/sienna-family-members') {
    require_user();
    $members = query_all(
      'SELECT sfm.id, sfm.parent_id, sfm.relationship_to_parent, sfm.name, sfm.birth, sfm.death, sfm.spouse_member_id, sfm.spouse, sfm.spouse_birth,
              sfm.inheritance_status, sfm.inheritance_reason, sfm.is_highlighted_ancestor, sfm.sort_order,
              sfm.created_by, sfm.updated_by, sfm.created_at, sfm.updated_at,
              creator.email AS created_by_email, creator.full_name AS created_by_name,
              updater.email AS updated_by_email, updater.full_name AS updated_by_name
       FROM sienna_family_members sfm
       LEFT JOIN profiles creator ON creator.id = sfm.created_by
       LEFT JOIN profiles updater ON updater.id = sfm.updated_by
       ORDER BY COALESCE(sfm.parent_id, \'\'), sfm.sort_order, sfm.name'
    );
    foreach ($members as &$member) {
      $member['is_highlighted_ancestor'] = (bool)$member['is_highlighted_ancestor'];
      $member['sort_order'] = (int)$member['sort_order'];
    }
    $unions = query_all('SELECT * FROM family_unions ORDER BY partner_a_member_id, partner_b_member_id');
    $parentLinks = query_all('SELECT * FROM member_parent_links ORDER BY child_member_id, parent_member_id');
    foreach ($unions as &$union) {
      $union['is_inconsistent'] = (bool)$union['is_inconsistent'];
    }
    foreach ($parentLinks as &$link) {
      $link['is_primary_line'] = (bool)$link['is_primary_line'];
      $link['is_inconsistent'] = (bool)$link['is_inconsistent'];
    }
    json_response(['members' => $members, 'unions' => $unions, 'parent_links' => $parentLinks]);
  }

  if ($method === 'POST' && $path === '/sienna-family-members') {
    $user = require_user();
    $data = body();
    if (empty($data['name'])) {
      json_response(['message' => 'El nombre del miembro es requerido'], 400);
    }

    $id = $data['id'] ?? uuid();
    $relationshipToParent = normalize_enum(
      $data['relationship_to_parent'] ?? null,
      ['hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro'],
      null
    );
    $inheritanceStatus = normalize_enum(
      $data['inheritance_status'] ?? null,
      ['posible_heredero', 'no_hereda', 'requiere_revision', 'confirmado'],
      'requiere_revision'
    );
    $spouseMemberId = $data['spouse_member_id'] ?? null;
    if ($spouseMemberId === $id) {
      $spouseMemberId = null;
    }
    if (!empty($spouseMemberId)) {
      $spouseExists = query_one('SELECT id FROM sienna_family_members WHERE id = :id LIMIT 1', ['id' => $spouseMemberId]);
      if (!$spouseExists) {
        $spouseMemberId = null;
      }
    }
    exec_sql(
      'INSERT INTO sienna_family_members (id, parent_id, relationship_to_parent, name, birth, death, spouse_member_id, spouse, spouse_birth, inheritance_status, inheritance_reason, is_highlighted_ancestor, sort_order, created_by, updated_by)
       VALUES (:id, :parentId, :relationshipToParent, :name, :birth, :death, :spouseMemberId, :spouse, :spouseBirth, :inheritanceStatus, :inheritanceReason, :highlighted, :sortOrder, :createdBy, :updatedBy)
       ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id), relationship_to_parent = VALUES(relationship_to_parent), name = VALUES(name), birth = VALUES(birth), death = VALUES(death), spouse_member_id = VALUES(spouse_member_id), spouse = VALUES(spouse), spouse_birth = VALUES(spouse_birth), inheritance_status = VALUES(inheritance_status), inheritance_reason = VALUES(inheritance_reason), is_highlighted_ancestor = VALUES(is_highlighted_ancestor), sort_order = VALUES(sort_order), updated_by = VALUES(updated_by)',
      [
        'id' => $id,
        'parentId' => $data['parent_id'] ?? null,
        'relationshipToParent' => $relationshipToParent,
        'name' => $data['name'],
        'birth' => $data['birth'] ?? null,
        'death' => $data['death'] ?? null,
        'spouseMemberId' => $spouseMemberId,
        'spouse' => $data['spouse'] ?? null,
        'spouseBirth' => $data['spouse_birth'] ?? null,
        'inheritanceStatus' => $inheritanceStatus,
        'inheritanceReason' => $data['inheritance_reason'] ?? null,
        'highlighted' => bool_value($data['is_highlighted_ancestor'] ?? false),
        'sortOrder' => (int)($data['sort_order'] ?? 0),
        'createdBy' => $user['id'],
        'updatedBy' => $user['id'],
      ]
    );
    $parentId = $data['parent_id'] ?? null;
    $isChild = in_array($relationshipToParent, ['hijo', 'hija'], true) || $relationshipToParent === null;
    if ($isChild && $parentId) {
      exec_sql('DELETE FROM member_parent_links WHERE child_member_id = :childId', ['childId' => $id]);
      $filiation = is_array($data['filiation'] ?? null) ? $data['filiation'] : [];
      $unionId = !empty($filiation['union_id']) ? $filiation['union_id'] : null;
      $primaryRole = $relationshipToParent === 'hija' ? 'madre' : ($relationshipToParent === 'hijo' ? 'padre' : 'progenitor');
      $primaryLinkId = 'link-' . $id . '-' . $parentId . ($unionId ? '-' . $unionId : '');
      exec_sql(
        'INSERT INTO member_parent_links (id, child_member_id, parent_member_id, parent_role, union_id, link_type, is_primary_line, migration_source, confidence, is_inconsistent)
         VALUES (:id, :childId, :parentId, :parentRole, :unionId, \'biologico\', TRUE, \'form_sync\', \'alta\', FALSE)
         ON DUPLICATE KEY UPDATE parent_role = VALUES(parent_role), union_id = VALUES(union_id), updated_at = CURRENT_TIMESTAMP',
        ['id' => $primaryLinkId, 'childId' => $id, 'parentId' => $parentId, 'parentRole' => $primaryRole, 'unionId' => $unionId]
      );
      $secondParentId = $filiation['second_parent_id'] ?? null;
      if (!empty($secondParentId) && $secondParentId !== $parentId) {
        $secondLinkId = 'link-' . $id . '-' . $secondParentId . ($unionId ? '-' . $unionId : '');
        exec_sql(
          'INSERT INTO member_parent_links (id, child_member_id, parent_member_id, parent_role, union_id, link_type, is_primary_line, migration_source, confidence, is_inconsistent)
           VALUES (:id, :childId, :parentId, \'progenitor\', :unionId, \'biologico\', FALSE, \'form_sync\', \'alta\', FALSE)
           ON DUPLICATE KEY UPDATE union_id = VALUES(union_id), updated_at = CURRENT_TIMESTAMP',
          ['id' => $secondLinkId, 'childId' => $id, 'parentId' => $secondParentId, 'unionId' => $unionId]
        );
      }
    } else {
      exec_sql('DELETE FROM member_parent_links WHERE child_member_id = :childId', ['childId' => $id]);
    }

    if (!empty($spouseMemberId)) {
      $sorted = [$id, $spouseMemberId];
      sort($sorted);
      $unionId = 'union-' . $sorted[0] . '-' . $sorted[1];
      exec_sql(
        'INSERT INTO family_unions (id, partner_a_member_id, partner_b_member_id, union_type, migration_source, confidence, is_inconsistent)
         VALUES (:id, :partnerA, :partnerB, \'matrimonio\', \'spouse_member_id\', \'alta\', FALSE)
         ON DUPLICATE KEY UPDATE partner_b_member_id = VALUES(partner_b_member_id), updated_at = CURRENT_TIMESTAMP',
        ['id' => $unionId, 'partnerA' => $sorted[0], 'partnerB' => $sorted[1]]
      );
    }

    $unions = query_all('SELECT * FROM family_unions ORDER BY partner_a_member_id, partner_b_member_id');
    $parentLinks = query_all('SELECT * FROM member_parent_links ORDER BY child_member_id, parent_member_id');
    json_response([
      'ok' => true,
      'member' => query_one('SELECT * FROM sienna_family_members WHERE id = :id LIMIT 1', ['id' => $id]),
      'unions' => $unions,
      'parent_links' => $parentLinks,
    ], 201);
  }

  if (preg_match('#^/sienna-family-members/([^/]+)$#', $path, $m) && $method === 'DELETE') {
    $user = require_user();
    require_admin($user);
    exec_sql('DELETE FROM member_parent_links WHERE child_member_id = :id OR parent_member_id = :id', ['id' => $m[1]]);
    exec_sql('DELETE FROM family_unions WHERE partner_a_member_id = :id OR partner_b_member_id = :id', ['id' => $m[1]]);
    exec_sql('UPDATE sienna_family_members SET parent_id = NULL WHERE parent_id = :id', ['id' => $m[1]]);
    exec_sql('UPDATE sienna_family_members SET spouse_member_id = NULL WHERE spouse_member_id = :id', ['id' => $m[1]]);
    exec_sql('DELETE FROM sienna_family_members WHERE id = :id', ['id' => $m[1]]);
    json_response(['ok' => true]);
  }

  if ($method === 'GET' && $path === '/evidence-documents') {
    require_user();
    $docs = query_all('SELECT * FROM evidence_documents ORDER BY created_at DESC');
    foreach ($docs as &$doc) {
      $doc['confirms_heir'] = (bool)$doc['confirms_heir'];
      $doc['people_involved'] = $doc['people_involved'] ? json_decode($doc['people_involved'], true) : [];
    }
    json_response(['documents' => $docs]);
  }

  if ($method === 'POST' && $path === '/evidence-documents') {
    $user = require_user();
    $data = body();
    $title = trim((string)($data['title'] ?? ''));
    $documentType = trim((string)($data['document_type'] ?? ''));
    if ($title === '' || $documentType === '') {
      json_response(['message' => 'Título y tipo de documento son requeridos'], 400);
    }
    $peopleInvolved = is_array($data['people_involved'] ?? null) ? $data['people_involved'] : [];
    exec_sql(
      'INSERT INTO evidence_documents
       (id, title, document_type, primary_member_id, primary_person, event_date, event_place, father_member_id, father_name, mother_member_id, mother_name, spouse_member_id, spouse_name, related_member_id, related_heir_name, confirms_heir, people_involved, extracted_text, notes, file_name, file_type, file_data, created_by, updated_by)
       VALUES
       (:id, :title, :type, :primaryMemberId, :primaryPerson, :eventDate, :eventPlace, :fatherMemberId, :father, :motherMemberId, :mother, :spouseMemberId, :spouse, :memberId, :heir, :confirms, :people, :text, :notes, :fileName, :fileType, :fileData, :createdBy, :updatedBy)',
      [
        'id' => uuid(),
        'title' => $title,
        'type' => $documentType,
        'primaryMemberId' => $data['primary_member_id'] ?? null,
        'primaryPerson' => $data['primary_person'] ?? null,
        'eventDate' => $data['event_date'] ?? null,
        'eventPlace' => $data['event_place'] ?? null,
        'fatherMemberId' => $data['father_member_id'] ?? null,
        'father' => $data['father_name'] ?? null,
        'motherMemberId' => $data['mother_member_id'] ?? null,
        'mother' => $data['mother_name'] ?? null,
        'spouseMemberId' => $data['spouse_member_id'] ?? null,
        'spouse' => $data['spouse_name'] ?? null,
        'memberId' => $data['related_member_id'] ?? null,
        'heir' => $data['related_heir_name'] ?? null,
        'confirms' => bool_value($data['confirms_heir'] ?? false),
        'people' => json_encode($peopleInvolved, JSON_UNESCAPED_UNICODE),
        'text' => $data['extracted_text'] ?? null,
        'notes' => $data['notes'] ?? null,
        'fileName' => $data['file_name'] ?? null,
        'fileType' => $data['file_type'] ?? null,
        'fileData' => $data['file_data'] ?? null,
        'createdBy' => $user['id'],
        'updatedBy' => $user['id'],
      ]
    );
    if ((!empty($data['related_heir_name']) || !empty($data['related_member_id'])) && !empty($data['confirms_heir'])) {
      exec_sql(
        "UPDATE confirmed_heirs SET status = 'confirmado', updated_by = :updatedBy WHERE heir_name = :name OR sienna_member_id = :memberId",
        ['name' => $data['related_heir_name'] ?? '', 'memberId' => $data['related_member_id'] ?? '', 'updatedBy' => $user['id']]
      );
    }
    json_response(['ok' => true], 201);
  }

  if (preg_match('#^/evidence-documents/([^/]+)$#', $path, $m) && $method === 'DELETE') {
    require_user();
    exec_sql('DELETE FROM evidence_documents WHERE id = :id', ['id' => $m[1]]);
    json_response(['ok' => true]);
  }

  if ($method === 'GET' && $path === '/sienna-calculation-snapshots') {
    require_user();
    json_response(['snapshots' => query_all(
      'SELECT id, estate_amount, lawyer_fee_percentage, distributable_amount, members_hash, payload_json, created_by, created_at
       FROM sienna_calculation_snapshots
       ORDER BY created_at DESC
       LIMIT 50'
    )]);
  }

  if ($method === 'GET' && $path === '/sienna-calculation-snapshots/latest') {
    require_user();
    json_response(['snapshot' => query_one(
      'SELECT id, estate_amount, lawyer_fee_percentage, distributable_amount, members_hash, payload_json, created_by, created_at
       FROM sienna_calculation_snapshots
       ORDER BY created_at DESC
       LIMIT 1'
    )]);
  }

  if ($method === 'POST' && $path === '/sienna-calculation-snapshots') {
    $user = require_user();
    $data = body();
    $id = uuid();
    exec_sql(
      'INSERT INTO sienna_calculation_snapshots
       (id, estate_amount, lawyer_fee_percentage, distributable_amount, members_hash, payload_json, created_by)
       VALUES
       (:id, :estateAmount, :lawyerFeePercentage, :distributableAmount, :membersHash, :payloadJson, :createdBy)',
      [
        'id' => $id,
        'estateAmount' => (float)($data['estate_amount'] ?? 0),
        'lawyerFeePercentage' => (float)($data['lawyer_fee_percentage'] ?? 0),
        'distributableAmount' => (float)($data['distributable_amount'] ?? 0),
        'membersHash' => $data['members_hash'] ?? null,
        'payloadJson' => $data['payload_json'] ?? null,
        'createdBy' => $user['id'],
      ]
    );
    json_response(['ok' => true, 'snapshot_id' => $id], 201);
  }

  json_response(['message' => 'Ruta no encontrada'], 404);
} catch (Throwable $e) {
  error_log($e->getMessage());
  json_response(['message' => 'Error interno del servidor'], 500);
}
