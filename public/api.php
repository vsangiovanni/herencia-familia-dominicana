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

  $email = env_value('LOCAL_ADMIN_EMAIL');
  $password = env_value('LOCAL_ADMIN_PASSWORD');
  if ($email && $password) {
    $existing = query_one('SELECT id FROM profiles WHERE email = :email LIMIT 1', ['email' => $email]);
    if ($existing) {
      exec_sql("UPDATE profiles SET password_hash = :hash, role = 'admin', is_approved = TRUE WHERE email = :email", [
        'email' => $email,
        'hash' => password_hash($password, PASSWORD_BCRYPT),
      ]);
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
      'INSERT INTO confirmed_heirs (id, heir_name, relationship_summary, line_vincenzo, line_paolo, status, notes)
       VALUES (:id, :name, :summary, :vincenzo, :paolo, :status, :notes)
       ON DUPLICATE KEY UPDATE relationship_summary = VALUES(relationship_summary), line_vincenzo = VALUES(line_vincenzo), line_paolo = VALUES(line_paolo), status = VALUES(status), notes = VALUES(notes)',
      [
        'id' => uuid(),
        'name' => $data['heir_name'] ?? '',
        'summary' => $data['relationship_summary'] ?? null,
        'vincenzo' => bool_value($data['line_vincenzo'] ?? false),
        'paolo' => bool_value($data['line_paolo'] ?? false),
        'status' => $data['status'] ?? 'mencionado',
        'notes' => $data['notes'] ?? null,
      ]
    );
    json_response(['ok' => true]);
  }

  if (preg_match('#^/confirmed-heirs/([^/]+)$#', $path, $m) && $method === 'PUT') {
    require_user();
    $data = body();
    exec_sql(
      'UPDATE confirmed_heirs SET heir_name = :name, relationship_summary = :summary, line_vincenzo = :vincenzo, line_paolo = :paolo, status = :status, notes = :notes WHERE id = :id',
      [
        'id' => $m[1],
        'name' => $data['heir_name'] ?? '',
        'summary' => $data['relationship_summary'] ?? null,
        'vincenzo' => bool_value($data['line_vincenzo'] ?? false),
        'paolo' => bool_value($data['line_paolo'] ?? false),
        'status' => $data['status'] ?? 'mencionado',
        'notes' => $data['notes'] ?? null,
      ]
    );
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
