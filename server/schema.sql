CREATE DATABASE IF NOT EXISTS herencia_rd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE herencia_rd;

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  sienna_member_id VARCHAR(120) NULL,
  role ENUM('admin', 'regular') NOT NULL DEFAULT 'regular',
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
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
  phone VARCHAR(80) NULL,
  email VARCHAR(255) NULL,
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
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_family_unions_partner_a (partner_a_member_id),
  INDEX idx_family_unions_partner_b (partner_b_member_id)
);

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
  INDEX idx_parent_links_child (child_member_id),
  INDEX idx_parent_links_parent (parent_member_id),
  INDEX idx_parent_links_union (union_id),
  UNIQUE KEY uq_parent_link_child_parent_union (child_member_id, parent_member_id, union_id)
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
  (UUID(), 'Árbol del caso Alessandro', '/sienna/arbol-genealogico', 'Árbol genealógico con foto y monto heredado'),
  (UUID(), 'Miembros del Árbol de Alessandro', '/sienna/miembros-arbol', 'CRUD de miembros del árbol genealógico del caso'),
  (UUID(), 'Explicación de Herederos', '/sienna/explicacion-herederos', 'Explicación, simulación y auditoría de herederos')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO app_settings (setting_key, setting_value)
VALUES ('lawyer_fee_percentage', '0')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

INSERT INTO app_settings (setting_key, setting_value)
VALUES ('management_fee_percentage', '0')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

INSERT INTO app_settings (setting_key, setting_value)
VALUES ('estate_amount', '0')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
