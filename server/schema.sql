CREATE DATABASE IF NOT EXISTS herencia_rd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE herencia_rd;

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

INSERT INTO pages (id, name, path, description)
VALUES
  (UUID(), 'Dashboard', '/dashboard', 'Panel principal'),
  (UUID(), 'Árbol Genealógico', '/arbol-genealogico', 'Vista del árbol genealógico'),
  (UUID(), 'Árbol Genealógico Clásico', '/arbol-genealogico-clasico', 'Vista clásica del árbol genealógico'),
  (UUID(), 'Líneas Familiares', '/lineas-familiares', 'Líneas familiares'),
  (UUID(), 'Determinación de Herederos', '/determinacion-herederos', 'Determinación legal de herederos'),
  (UUID(), 'Cálculo de Herencias', '/calculo-herencias', 'Calculadora y administración'),
  (UUID(), 'Administración de Usuarios', '/admin-users', 'Gestión de usuarios'),
  (UUID(), 'Hallazgos', '/hallazgos', 'Hallazgos e inconsistencias detectadas'),
  (UUID(), 'Cálculo por Filiación', '/calculo-filiacion', 'Distribución por líneas familiares'),
  (UUID(), 'Documentos Probatorios', '/documentos-probatorios', 'Expediente documental de actas y herederos')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO confirmed_heirs (
  id,
  heir_name,
  relationship_summary,
  line_vincenzo,
  line_paolo,
  status,
  notes
)
VALUES
  (UUID(), 'Víctor Manuel Martín Sangiovanni Rodríguez', 'Heredero por doble vocación sucesoral: línea Vincenzo/Vicente vía María Rosa y línea Paolo/Paulino vía Pedro Pablo.', TRUE, TRUE, 'mencionado', 'No requiere acta para figurar en el cálculo inicial; puede anexarse evidencia cuando se tenga.'),
  (UUID(), 'Perla Rosa Brea Sangiovanni', 'Heredera con doble línea familiar en la estructura analítica actual.', TRUE, TRUE, 'mencionado', 'No requiere acta para figurar en el cálculo inicial; puede anexarse evidencia cuando se tenga.'),
  (UUID(), 'Bernardo Martín Lizardo Sangiovanni', 'Heredero por la línea Vincenzo/Vicente, rama Domingo Ramón.', TRUE, FALSE, 'mencionado', 'No requiere acta para figurar en el cálculo inicial; puede anexarse evidencia cuando se tenga.'),
  (UUID(), 'Jocelyn del Jesús Sangiovanni Báez', 'Heredera por la línea Vincenzo/Vicente, rama Domingo Ramón / José Vicente.', TRUE, FALSE, 'mencionado', 'No requiere acta para figurar en el cálculo inicial; puede anexarse evidencia cuando se tenga.'),
  (UUID(), 'Mayra Josefina Sangiovanni Báez', 'Heredera por la línea Vincenzo/Vicente, rama Domingo Ramón / José Vicente.', TRUE, FALSE, 'mencionado', 'No requiere acta para figurar en el cálculo inicial; puede anexarse evidencia cuando se tenga.')
ON DUPLICATE KEY UPDATE
  relationship_summary = VALUES(relationship_summary),
  line_vincenzo = VALUES(line_vincenzo),
  line_paolo = VALUES(line_paolo),
  notes = VALUES(notes);
