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

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(120) PRIMARY KEY,
  setting_value TEXT NULL,
  updated_by CHAR(36) NULL,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_settings_updated_by FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL
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
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_confirmed_heirs_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_confirmed_heirs_updated_by FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL
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
  CONSTRAINT fk_evidence_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_evidence_updated_by FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sienna_calculation_snapshots (
  id CHAR(36) PRIMARY KEY,
  estate_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  lawyer_fee_percentage DECIMAL(6,2) NOT NULL DEFAULT 0,
  distributable_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  members_hash TEXT NULL,
  payload_json LONGTEXT NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sienna_snapshot_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
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
  INDEX idx_sienna_family_parent (parent_id),
  CONSTRAINT fk_sienna_family_parent FOREIGN KEY (parent_id) REFERENCES sienna_family_members(id) ON DELETE SET NULL,
  CONSTRAINT fk_sienna_family_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_sienna_family_updated_by FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL
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
  (UUID(), 'Settings', '/admin/settings', 'Configuración global del sistema'),
  (UUID(), 'Documentos Probatorios', '/documentos-probatorios', 'Expediente documental de actas y herederos'),
  (UUID(), 'Árbol Sienna', '/sienna/arbol-genealogico', 'Árbol genealógico con foto y monto heredado'),
  (UUID(), 'Miembros del Árbol Sienna', '/sienna/miembros-arbol', 'CRUD de miembros del árbol genealógico Sienna'),
  (UUID(), 'Explicación de Herederos Sienna', '/sienna/explicacion-herederos', 'Explicación, simulación y auditoría de herederos Sienna')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO app_settings (setting_key, setting_value)
VALUES ('lawyer_fee_percentage', '0')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

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
  heir_name = heir_name;

INSERT INTO sienna_family_members (
  id, parent_id, name, birth, death, spouse_member_id, spouse, spouse_birth, is_highlighted_ancestor, sort_order
)
VALUES
  ('domenico', NULL, 'Domenico (Domingo) Sangiovanni', '17/12/1845', NULL, NULL, 'María Rosa Grisolia', '18/07/1852', FALSE, 10),
  ('maria-magdalena', 'domenico', 'María Magdalena Sangiovanni', '27/04/1874', '07/05/1935', NULL, 'Vincenzo de Paola', NULL, FALSE, 10),
  ('vincenzo', 'domenico', 'Vincenzo (Vicente) Sangiovanni', '13/08/1880', '07/02/1958', NULL, 'María Balbina Pérez Álvarez', NULL, FALSE, 20),
  ('paolo', 'domenico', 'Paolo (Paulino) Sangiovanni', '17/01/1885', '31/03/1936', NULL, 'Simona Simo', NULL, FALSE, 30),
  ('alessandro', 'maria-magdalena', 'Alessandro de Paola Sangiovanni', '18/10/1911', '14/01/1998', NULL, NULL, NULL, TRUE, 10),
  ('maria-rosa', 'vincenzo', 'María Rosa Sangiovanni Pérez', '18/02/1906', '07/08/1981', 'pedro-pablo', 'Pedro Pablo Sangiovanni Simo', NULL, FALSE, 10),
  ('domingo-ramon', 'vincenzo', 'Domingo Ramón Sangiovanni Pérez', '11/07/1907', '03/09/1981', NULL, 'María Francisca Gesualdo', NULL, FALSE, 20),
  ('pedro-pablo', 'paolo', 'Pedro Pablo Sangiovanni Simo', '29/10/1906', '04/10/1986', 'maria-rosa', NULL, NULL, FALSE, 10),
  ('victor-manuel', 'maria-rosa', 'Víctor Manuel Sangiovanni Sangiovanni', '29/10/1932', '21/10/2007', NULL, 'Ana Julia Rodríguez', NULL, FALSE, 10),
  ('maria-amparo', 'domingo-ramon', 'María Amparo Sangiovanni Gesualdo', '30/10/1929', '15/01/2004', NULL, 'Bernardo Edmundo Lizardo Fernández', NULL, FALSE, 10),
  ('jose-vicente', 'domingo-ramon', 'José Vicente Sangiovanni Gesualdo', '19/04/1932', '24/04/1976', NULL, 'Ozema Báez', NULL, FALSE, 20),
  ('rosa-julia', 'victor-manuel', 'Rosa Julia Sangiovanni Rodríguez', '15/04/1963', '04/10/2024', NULL, 'Francisco Brea', NULL, FALSE, 10),
  ('victor-manuel-martin', 'victor-manuel', 'Víctor Manuel Martín Sangiovanni Rodríguez', '08/11/1966', NULL, NULL, NULL, NULL, FALSE, 20),
  ('bernardo-martin', 'maria-amparo', 'Bernardo Martín Lizardo Sangiovanni', '28/10/1966', NULL, NULL, NULL, NULL, FALSE, 10),
  ('jocelyn', 'jose-vicente', 'Jocelyn del Jesús Sangiovanni Báez', '06/10/1963', NULL, NULL, NULL, NULL, FALSE, 10),
  ('mayra', 'jose-vicente', 'Mayra Josefina Sangiovanni Báez', '20/11/1965', NULL, NULL, NULL, NULL, FALSE, 20),
  ('perla-rosa', 'rosa-julia', 'Perla Rosa Brea Sangiovanni', '30/04/1989', NULL, NULL, NULL, NULL, FALSE, 10)
ON DUPLICATE KEY UPDATE
  id = id;
