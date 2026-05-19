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

    CREATE TABLE IF NOT EXISTS confirmed_heirs (
      id CHAR(36) PRIMARY KEY,
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
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evidence_documents (
      id CHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      document_type VARCHAR(120) NOT NULL,
      primary_person VARCHAR(255) NULL,
      event_date VARCHAR(50) NULL,
      event_place VARCHAR(255) NULL,
      father_name VARCHAR(255) NULL,
      mother_name VARCHAR(255) NULL,
      spouse_name VARCHAR(255) NULL,
      related_heir_name VARCHAR(255) NULL,
      confirms_heir BOOLEAN NOT NULL DEFAULT FALSE,
      people_involved JSON NULL,
      extracted_text LONGTEXT NULL,
      notes TEXT NULL,
      file_name VARCHAR(255) NULL,
      file_type VARCHAR(120) NULL,
      file_data LONGTEXT NULL,
      created_by CHAR(36) NULL,
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
      spouse VARCHAR(255) NULL,
      spouse_birth VARCHAR(50) NULL,
      inheritance_status ENUM('posible_heredero', 'no_hereda', 'requiere_revision', 'confirmado') NOT NULL DEFAULT 'requiere_revision',
      inheritance_reason TEXT NULL,
      is_highlighted_ancestor BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sienna_family_parent (parent_id)
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
    ['Documentos Probatorios', '/documentos-probatorios', 'Expediente documental de actas y herederos'],
    ['Árbol Sienna', '/sienna/arbol-genealogico', 'Árbol genealógico con foto y monto heredado'],
  ];

  foreach ($pages as [$name, $path, $description]) {
    exec_sql(
      "INSERT INTO pages (id, name, path, description)
       VALUES (:id, :name, :path, :description)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)",
      ['id' => uuid(), 'name' => $name, 'path' => $path, 'description' => $description]
    );
  }

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
       VALUES (:id, :name, :summary, :vincenzo, :paolo, 'mencionado', 'No requiere acta para figurar en el cálculo inicial; puede anexarse evidencia cuando se tenga.')
       ON DUPLICATE KEY UPDATE relationship_summary = VALUES(relationship_summary), line_vincenzo = VALUES(line_vincenzo), line_paolo = VALUES(line_paolo), notes = VALUES(notes)",
      ['id' => uuid(), 'name' => $name, 'summary' => $summary, 'vincenzo' => $vincenzo, 'paolo' => $paolo]
    );
  }

  $migrations = [
    ['photo_file_name', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_file_name VARCHAR(255) NULL AFTER notes'],
    ['photo_file_type', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_file_type VARCHAR(120) NULL AFTER photo_file_name'],
    ['photo_data', 'ALTER TABLE confirmed_heirs ADD COLUMN photo_data LONGTEXT NULL AFTER photo_file_type'],
    ['inheritance_amount', 'ALTER TABLE confirmed_heirs ADD COLUMN inheritance_amount DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER photo_data'],
  ];

  foreach ($migrations as [$column, $sql]) {
    if (!column_exists('confirmed_heirs', $column)) {
      db()->exec($sql);
    }
  }

  $memberMigrations = [
    ['relationship_to_parent', "ALTER TABLE sienna_family_members ADD COLUMN relationship_to_parent ENUM('hijo', 'hija', 'conyuge', 'padre', 'madre', 'otro') NULL AFTER parent_id"],
    ['inheritance_status', "ALTER TABLE sienna_family_members ADD COLUMN inheritance_status ENUM('posible_heredero', 'no_hereda', 'requiere_revision', 'confirmado') NOT NULL DEFAULT 'requiere_revision' AFTER spouse_birth"],
    ['inheritance_reason', 'ALTER TABLE sienna_family_members ADD COLUMN inheritance_reason TEXT NULL AFTER inheritance_status'],
  ];

  foreach ($memberMigrations as [$column, $sql]) {
    if (!column_exists('sienna_family_members', $column)) {
      db()->exec($sql);
    }
  }

  exec_sql(
    "UPDATE sienna_family_members
     SET inheritance_status = 'posible_heredero',
         inheritance_reason = 'Descendiente vivo registrado en una o más líneas sucesorales activas.'
     WHERE id IN ('victor-manuel-martin', 'perla-rosa', 'bernardo-martin', 'jocelyn', 'mayra')
       AND inheritance_status = 'requiere_revision'"
  );

  $caseStatuses = [
    ['alessandro', 'no_hereda', 'Es el causante del expediente; no se clasifica como heredero.'],
    ['domenico', 'no_hereda', 'Tronco familiar común; sirve para ubicar ramas, no como heredero final.'],
    ['maria-magdalena', 'no_hereda', 'Madre del causante Alessandro; rama del causante, no heredera final en este análisis.'],
    ['vincenzo', 'no_hereda', 'Hermano de la madre del causante; abre una rama sucesoral activa por sus descendientes.'],
    ['paolo', 'no_hereda', 'Hermano de la madre del causante; abre una rama sucesoral activa por sus descendientes.'],
    ['maria-rosa', 'no_hereda', 'Intermedia fallecida en rama Vincenzo/Vicente y vínculo hacia la doble filiación.'],
    ['pedro-pablo', 'no_hereda', 'Intermedio fallecido en rama Paolo/Paulino y vínculo hacia la doble filiación.'],
    ['domingo-ramon', 'no_hereda', 'Intermedio fallecido en rama Vincenzo/Vicente; transmite representación a sus descendientes.'],
    ['victor-manuel', 'no_hereda', 'Intermedio fallecido; conecta a Víctor Manuel Martín y a Rosa Julia/Perla.'],
    ['rosa-julia', 'no_hereda', 'Intermedia fallecida; Perla Rosa entra por representación en su rama.'],
    ['maria-amparo', 'no_hereda', 'Intermedia fallecida; Bernardo Martín entra por representación en su rama.'],
    ['jose-vicente', 'no_hereda', 'Intermedio fallecido; Jocelyn y Mayra entran por representación en su rama.'],
    ['victor-manuel-martin', 'posible_heredero', 'Heredero determinado por doble vocación sucesoral: línea Vincenzo/Vicente vía María Rosa y línea Paolo/Paulino vía Pedro Pablo.'],
    ['perla-rosa', 'posible_heredero', 'Heredera determinada por representación en la rama de Rosa Julia, con doble línea familiar Vincenzo/Vicente y Paolo/Paulino.'],
    ['bernardo-martin', 'posible_heredero', 'Heredero determinado por la rama Domingo Ramón -> María Amparo dentro de la línea Vincenzo/Vicente.'],
    ['jocelyn', 'posible_heredero', 'Heredera determinada por la rama Domingo Ramón -> José Vicente dentro de la línea Vincenzo/Vicente.'],
    ['mayra', 'posible_heredero', 'Heredera determinada por la rama Domingo Ramón -> José Vicente dentro de la línea Vincenzo/Vicente.'],
  ];

  foreach ($caseStatuses as [$id, $status, $reason]) {
    exec_sql(
      'UPDATE sienna_family_members SET inheritance_status = :status, inheritance_reason = :reason WHERE id = :id',
      ['id' => $id, 'status' => $status, 'reason' => $reason]
    );
  }

  $memberCount = query_one('SELECT COUNT(*) AS count FROM sienna_family_members');
  if ((int)($memberCount['count'] ?? 0) === 0) {
    $members = [
      ['domenico', null, 'Domenico (Domingo) Sangiovanni', '17/12/1845', null, 'María Rosa Grisolia', '18/07/1852', 0, 10],
      ['maria-magdalena', 'domenico', 'María Magdalena Sangiovanni', '27/04/1874', '07/05/1935', 'Vincenzo de Paola', null, 0, 10],
      ['vincenzo', 'domenico', 'Vincenzo (Vicente) Sangiovanni', '13/08/1880', '07/02/1958', 'María Balbina Pérez Álvarez', null, 0, 20],
      ['paolo', 'domenico', 'Paolo (Paulino) Sangiovanni', '17/01/1885', '31/03/1936', 'Simona Simo', null, 0, 30],
      ['alessandro', 'maria-magdalena', 'Alessandro de Paola Sangiovanni', '18/10/1911', '14/01/1998', null, null, 1, 10],
      ['maria-rosa', 'vincenzo', 'María Rosa Sangiovanni Pérez', '18/02/1906', '07/08/1981', 'Pedro Pablo Sangiovanni Simo', null, 0, 10],
      ['domingo-ramon', 'vincenzo', 'Domingo Ramón Sangiovanni Pérez', '11/07/1907', '03/09/1981', 'María Francisca Gesualdo', null, 0, 20],
      ['pedro-pablo', 'paolo', 'Pedro Pablo Sangiovanni Simo', '29/10/1906', '04/10/1986', null, null, 0, 10],
      ['victor-manuel', 'maria-rosa', 'Víctor Manuel Sangiovanni Sangiovanni', '29/10/1932', '21/10/2007', 'Ana Julia Rodríguez', null, 0, 10],
      ['maria-amparo', 'domingo-ramon', 'María Amparo Sangiovanni Gesualdo', '30/10/1929', '15/01/2004', 'Bernardo Edmundo Lizardo Fernández', null, 0, 10],
      ['jose-vicente', 'domingo-ramon', 'José Vicente Sangiovanni Gesualdo', '19/04/1932', '24/04/1976', 'Ozema Báez', null, 0, 20],
      ['rosa-julia', 'victor-manuel', 'Rosa Julia Sangiovanni Rodríguez', '15/04/1963', '04/10/2024', 'Francisco Brea', null, 0, 10],
      ['victor-manuel-martin', 'victor-manuel', 'Víctor Manuel Martín Sangiovanni Rodríguez', '08/11/1966', null, null, null, 0, 20],
      ['bernardo-martin', 'maria-amparo', 'Bernardo Martín Lizardo Sangiovanni', '28/10/1966', null, null, null, 0, 10],
      ['jocelyn', 'jose-vicente', 'Jocelyn del Jesús Sangiovanni Báez', '06/10/1963', null, null, null, 0, 10],
      ['mayra', 'jose-vicente', 'Mayra Josefina Sangiovanni Báez', '20/11/1965', null, null, null, 0, 20],
      ['perla-rosa', 'rosa-julia', 'Perla Rosa Brea Sangiovanni', '30/04/1989', null, null, null, 0, 10],
    ];

    foreach ($members as [$id, $parentId, $name, $birth, $death, $spouse, $spouseBirth, $highlighted, $sortOrder]) {
      exec_sql(
        'INSERT INTO sienna_family_members (id, parent_id, name, birth, death, spouse, spouse_birth, is_highlighted_ancestor, sort_order)
         VALUES (:id, :parentId, :name, :birth, :death, :spouse, :spouseBirth, :highlighted, :sortOrder)',
        [
          'id' => $id,
          'parentId' => $parentId,
          'name' => $name,
          'birth' => $birth,
          'death' => $death,
          'spouse' => $spouse,
          'spouseBirth' => $spouseBirth,
          'highlighted' => $highlighted,
          'sortOrder' => $sortOrder,
        ]
      );
    }
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

function require_user(): array {
  $user = current_user();
  if (!$user) json_response(['message' => 'No autenticado'], 401);
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

try {
  ensure_schema();

  $method = $_SERVER['REQUEST_METHOD'];
  $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
  $path = preg_replace('#^/api#', '', $path) ?: '/';

  if ($method === 'GET' && $path === '/health') {
    db()->query('SELECT 1');
    json_response(['ok' => true, 'storage' => 'mysql', 'runtime' => 'php']);
  }

  if ($method === 'POST' && $path === '/auth/signup') {
    $data = body();
    $email = strtolower(trim($data['email'] ?? ''));
    $password = (string)($data['password'] ?? '');
    if (!$email || strlen($password) < 6) json_response(['message' => 'Email y contraseña válida son requeridos'], 400);
    if (query_one('SELECT id FROM profiles WHERE email = :email LIMIT 1', ['email' => $email])) {
      json_response(['message' => 'Ya existe un usuario con ese email'], 409);
    }
    exec_sql(
      "INSERT INTO profiles (id, email, password_hash, role, is_approved) VALUES (:id, :email, :hash, 'regular', FALSE)",
      ['id' => uuid(), 'email' => $email, 'hash' => password_hash($password, PASSWORD_BCRYPT)]
    );
    json_response(['ok' => true], 201);
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
    $public = public_profile(require_user());
    json_response(['user' => $public, 'profile' => $public]);
  }

  if ($method === 'PATCH' && $path === '/auth/password') {
    $user = require_user();
    $password = (string)(body()['password'] ?? '');
    if (strlen($password) < 6) json_response(['message' => 'La contraseña debe tener al menos 6 caracteres'], 400);
    exec_sql('UPDATE profiles SET password_hash = :hash WHERE id = :id', ['hash' => password_hash($password, PASSWORD_BCRYPT), 'id' => $user['id']]);
    json_response(['ok' => true]);
  }

  if ($method === 'GET' && $path === '/pages') {
    require_user();
    json_response(['pages' => query_all('SELECT id, name, path, description, created_at FROM pages ORDER BY name')]);
  }

  if ($method === 'GET' && $path === '/profiles/me') {
    json_response(['profile' => public_profile(require_user())]);
  }

  if ($method === 'PATCH' && $path === '/profiles/me') {
    $user = require_user();
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
      'SELECT h.*, COUNT(d.id) AS evidence_count FROM confirmed_heirs h LEFT JOIN evidence_documents d ON d.related_heir_name = h.heir_name GROUP BY h.id ORDER BY h.heir_name'
    )]);
  }

  if ($method === 'POST' && $path === '/confirmed-heirs') {
    require_user();
    $data = body();
    exec_sql(
      'INSERT INTO confirmed_heirs (id, heir_name, relationship_summary, line_vincenzo, line_paolo, status, notes, photo_file_name, photo_file_type, photo_data, inheritance_amount)
       VALUES (:id, :name, :summary, :vincenzo, :paolo, :status, :notes, :photoFileName, :photoFileType, :photoData, :inheritanceAmount)
       ON DUPLICATE KEY UPDATE relationship_summary = VALUES(relationship_summary), line_vincenzo = VALUES(line_vincenzo), line_paolo = VALUES(line_paolo), status = VALUES(status), notes = VALUES(notes), photo_file_name = VALUES(photo_file_name), photo_file_type = VALUES(photo_file_type), photo_data = VALUES(photo_data), inheritance_amount = VALUES(inheritance_amount)',
      [
        'id' => uuid(),
        'name' => $data['heir_name'] ?? '',
        'summary' => $data['relationship_summary'] ?? null,
        'vincenzo' => bool_value($data['line_vincenzo'] ?? false),
        'paolo' => bool_value($data['line_paolo'] ?? false),
        'status' => $data['status'] ?? 'mencionado',
        'notes' => $data['notes'] ?? null,
        'photoFileName' => $data['photo_file_name'] ?? null,
        'photoFileType' => $data['photo_file_type'] ?? null,
        'photoData' => $data['photo_data'] ?? null,
        'inheritanceAmount' => (float)($data['inheritance_amount'] ?? 0),
      ]
    );
    json_response(['ok' => true]);
  }

  if (preg_match('#^/confirmed-heirs/([^/]+)$#', $path, $m) && $method === 'PUT') {
    require_user();
    $data = body();
    exec_sql(
      'UPDATE confirmed_heirs SET heir_name = :name, relationship_summary = :summary, line_vincenzo = :vincenzo, line_paolo = :paolo, status = :status, notes = :notes, photo_file_name = :photoFileName, photo_file_type = :photoFileType, photo_data = :photoData, inheritance_amount = :inheritanceAmount WHERE id = :id',
      [
        'id' => $m[1],
        'name' => $data['heir_name'] ?? '',
        'summary' => $data['relationship_summary'] ?? null,
        'vincenzo' => bool_value($data['line_vincenzo'] ?? false),
        'paolo' => bool_value($data['line_paolo'] ?? false),
        'status' => $data['status'] ?? 'mencionado',
        'notes' => $data['notes'] ?? null,
        'photoFileName' => $data['photo_file_name'] ?? null,
        'photoFileType' => $data['photo_file_type'] ?? null,
        'photoData' => $data['photo_data'] ?? null,
        'inheritanceAmount' => (float)($data['inheritance_amount'] ?? 0),
      ]
    );
    json_response(['ok' => true]);
  }

  if ($method === 'GET' && $path === '/sienna-family-members') {
    require_user();
    $members = query_all(
      'SELECT id, parent_id, relationship_to_parent, name, birth, death, spouse, spouse_birth, inheritance_status, inheritance_reason, is_highlighted_ancestor, sort_order, created_at, updated_at
       FROM sienna_family_members
       ORDER BY COALESCE(parent_id, \'\'), sort_order, name'
    );
    foreach ($members as &$member) {
      $member['is_highlighted_ancestor'] = (bool)$member['is_highlighted_ancestor'];
      $member['sort_order'] = (int)$member['sort_order'];
    }
    json_response(['members' => $members]);
  }

  if ($method === 'POST' && $path === '/sienna-family-members') {
    require_user();
    $data = body();
    if (empty($data['name'])) {
      json_response(['message' => 'El nombre del miembro es requerido'], 400);
    }

    $id = $data['id'] ?? uuid();
    exec_sql(
      'INSERT INTO sienna_family_members (id, parent_id, relationship_to_parent, name, birth, death, spouse, spouse_birth, inheritance_status, inheritance_reason, is_highlighted_ancestor, sort_order)
       VALUES (:id, :parentId, :relationshipToParent, :name, :birth, :death, :spouse, :spouseBirth, :inheritanceStatus, :inheritanceReason, :highlighted, :sortOrder)
       ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id), relationship_to_parent = VALUES(relationship_to_parent), name = VALUES(name), birth = VALUES(birth), death = VALUES(death), spouse = VALUES(spouse), spouse_birth = VALUES(spouse_birth), inheritance_status = VALUES(inheritance_status), inheritance_reason = VALUES(inheritance_reason), is_highlighted_ancestor = VALUES(is_highlighted_ancestor), sort_order = VALUES(sort_order)',
      [
        'id' => $id,
        'parentId' => $data['parent_id'] ?? null,
        'relationshipToParent' => $data['relationship_to_parent'] ?? null,
        'name' => $data['name'],
        'birth' => $data['birth'] ?? null,
        'death' => $data['death'] ?? null,
        'spouse' => $data['spouse'] ?? null,
        'spouseBirth' => $data['spouse_birth'] ?? null,
        'inheritanceStatus' => $data['inheritance_status'] ?? 'requiere_revision',
        'inheritanceReason' => $data['inheritance_reason'] ?? null,
        'highlighted' => bool_value($data['is_highlighted_ancestor'] ?? false),
        'sortOrder' => (int)($data['sort_order'] ?? 0),
      ]
    );
    json_response(['ok' => true, 'member' => array_merge($data, ['id' => $id])], 201);
  }

  if (preg_match('#^/sienna-family-members/([^/]+)$#', $path, $m) && $method === 'DELETE') {
    require_user();
    exec_sql('UPDATE sienna_family_members SET parent_id = NULL WHERE parent_id = :id', ['id' => $m[1]]);
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
    exec_sql(
      'INSERT INTO evidence_documents
       (id, title, document_type, primary_person, event_date, event_place, father_name, mother_name, spouse_name, related_heir_name, confirms_heir, people_involved, extracted_text, notes, file_name, file_type, file_data, created_by)
       VALUES
       (:id, :title, :type, :primaryPerson, :eventDate, :eventPlace, :father, :mother, :spouse, :heir, :confirms, :people, :text, :notes, :fileName, :fileType, :fileData, :createdBy)',
      [
        'id' => uuid(),
        'title' => $data['title'] ?? 'Documento sin título',
        'type' => $data['document_type'] ?? 'Documento',
        'primaryPerson' => $data['primary_person'] ?? null,
        'eventDate' => $data['event_date'] ?? null,
        'eventPlace' => $data['event_place'] ?? null,
        'father' => $data['father_name'] ?? null,
        'mother' => $data['mother_name'] ?? null,
        'spouse' => $data['spouse_name'] ?? null,
        'heir' => $data['related_heir_name'] ?? null,
        'confirms' => bool_value($data['confirms_heir'] ?? false),
        'people' => json_encode($data['people_involved'] ?? [], JSON_UNESCAPED_UNICODE),
        'text' => $data['extracted_text'] ?? null,
        'notes' => $data['notes'] ?? null,
        'fileName' => $data['file_name'] ?? null,
        'fileType' => $data['file_type'] ?? null,
        'fileData' => $data['file_data'] ?? null,
        'createdBy' => $user['id'],
      ]
    );
    if (!empty($data['related_heir_name']) && !empty($data['confirms_heir'])) {
      exec_sql("UPDATE confirmed_heirs SET status = 'confirmado' WHERE heir_name = :name", ['name' => $data['related_heir_name']]);
    }
    json_response(['ok' => true], 201);
  }

  if (preg_match('#^/evidence-documents/([^/]+)$#', $path, $m) && $method === 'DELETE') {
    require_user();
    exec_sql('DELETE FROM evidence_documents WHERE id = :id', ['id' => $m[1]]);
    json_response(['ok' => true]);
  }

  json_response(['message' => 'Ruta no encontrada'], 404);
} catch (Throwable $e) {
  error_log($e->getMessage());
  json_response(['message' => 'Error interno del servidor'], 500);
}
