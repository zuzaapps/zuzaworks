-- ============================================================================
-- DEMO USERS WITH DIFFERENT ROLES AND SSO PROVIDERS
-- ============================================================================

-- Note: In production, passwords would be bcrypt hashed
-- For demo purposes, using plain text indicators

-- 1. Super Admin (Local Login)
INSERT OR IGNORE INTO users (id, organization_id, employee_id, email, username, password_hash, sso_provider, first_name, last_name, is_active, is_verified, email_verified_at, created_at) VALUES
  (1, 1, 1, 'thabo.motsepe@mzansi.co.za', 'thabom', 'DEMO_PASSWORD_HASH', 'local', 'Thabo', 'Motsepe', 1, 1, datetime('now'), datetime('now'));

-- Assign Super Admin role
INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at) VALUES
  (1, 1, datetime('now')); -- super_admin

-- 2. HR Manager (Google SSO)
INSERT OR IGNORE INTO users (id, organization_id, employee_id, email, sso_provider, sso_provider_id, first_name, last_name, profile_photo_url, is_active, is_verified, email_verified_at, created_at) VALUES
  (2, 1, 136, 'nosipho.madonsela@mzansi.co.za', 'google', 'google_12345_nosipho', 'Nosipho', 'Madonsela', 'https://ui-avatars.com/api/?name=Nosipho+Madonsela', 1, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at) VALUES
  (2, 2, datetime('now')); -- hr_manager

-- 3. Department Manager (Microsoft/Azure AD)
INSERT OR IGNORE INTO users (id, organization_id, employee_id, email, sso_provider, sso_provider_id, first_name, last_name, is_active, is_verified, email_verified_at, created_at) VALUES
  (3, 1, 20, 'johannes.mabuza@mzansi.co.za', 'microsoft', 'azure_ad_67890_johannes', 'Johannes', 'Mabuza', 1, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO user_roles (user_id, role_id, department_id, created_at) VALUES
  (3, 3, 11, datetime('now')); -- department_manager for Underground Operations

-- 4. Location Manager (LinkedIn SSO)
INSERT OR IGNORE INTO users (id, organization_id, employee_id, email, sso_provider, sso_provider_id, first_name, last_name, is_active, is_verified, email_verified_at, created_at) VALUES
  (4, 1, 40, 'andile.cele@mzansi.co.za', 'linkedin', 'linkedin_abc123_andile', 'Andile', 'Cele', 1, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO user_roles (user_id, role_id, location_id, created_at) VALUES
  (4, 4, 9, datetime('now')); -- location_manager for Umhlanga Ridge

-- 5. Standard Employee (Local Login)
INSERT OR IGNORE INTO users (id, organization_id, employee_id, email, username, password_hash, sso_provider, first_name, last_name, is_active, is_verified, email_verified_at, created_at) VALUES
  (5, 1, 78, 'alfred.mashego@mzansi.co.za', 'alfredm', 'DEMO_PASSWORD_HASH', 'local', 'Alfred', 'Mashego', 1, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at) VALUES
  (5, 5, datetime('now')); -- employee (standard)

-- 6. Compliance Officer (Google SSO)
INSERT OR IGNORE INTO users (id, organization_id, employee_id, email, sso_provider, sso_provider_id, first_name, last_name, is_active, is_verified, email_verified_at, created_at) VALUES
  (6, 1, 4, 'lindiwe.dlamini@mzansi.co.za', 'google', 'google_54321_lindiwe', 'Lindiwe', 'Dlamini', 1, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at) VALUES
  (6, 6, datetime('now')); -- compliance_officer

-- 7. Payroll Admin (Microsoft SSO)
INSERT OR IGNORE INTO users (id, organization_id, employee_id, email, sso_provider, sso_provider_id, first_name, last_name, is_active, is_verified, email_verified_at, created_at) VALUES
  (7, 1, 3, 'kagiso.mokoena@mzansi.co.za', 'microsoft', 'azure_ad_98765_kagiso', 'Kagiso', 'Mokoena', 1, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at) VALUES
  (7, 7, datetime('now')); -- payroll_admin

-- 8. Recruiter (LinkedIn SSO)
INSERT OR IGNORE INTO users (id, organization_id, employee_id, email, sso_provider, sso_provider_id, first_name, last_name, is_active, is_verified, email_verified_at, created_at) VALUES
  (8, 1, 137, 'andiswa.mngomezulu@mzansi.co.za', 'linkedin', 'linkedin_xyz789_andiswa', 'Andiswa', 'Mngomezulu', 1, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at) VALUES
  (8, 8, datetime('now')); -- recruiter

-- 9. Training Coordinator (Local Login)
INSERT OR IGNORE INTO users (id, organization_id, employee_id, email, username, password_hash, sso_provider, first_name, last_name, is_active, is_verified, email_verified_at, created_at) VALUES
  (9, 1, 58, 'ryan.smith@mzansi.co.za', 'ryans', 'DEMO_PASSWORD_HASH', 'local', 'Ryan', 'Smith', 1, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at) VALUES
  (9, 9, datetime('now')); -- training_coordinator

-- 10. Read-Only User (Google SSO)
INSERT OR IGNORE INTO users (id, organization_id, employee_id, email, sso_provider, sso_provider_id, first_name, last_name, is_active, is_verified, email_verified_at, created_at) VALUES
  (10, 1, NULL, 'external.auditor@example.com', 'google', 'google_audit_001', 'External', 'Auditor', 1, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at) VALUES
  (10, 10, datetime('now')); -- readonly

-- Update employees table to link to user accounts
UPDATE employees SET user_id = 1 WHERE id = 1; -- Thabo (Super Admin)
UPDATE employees SET user_id = 2 WHERE id = 136; -- Nosipho (HR Manager)
UPDATE employees SET user_id = 3 WHERE id = 20; -- Johannes (Dept Manager)
UPDATE employees SET user_id = 4 WHERE id = 40; -- Andile (Location Manager)
UPDATE employees SET user_id = 5 WHERE id = 78; -- Alfred (Standard Employee)
UPDATE employees SET user_id = 6 WHERE id = 4; -- Lindiwe (Compliance Officer)
UPDATE employees SET user_id = 7 WHERE id = 3; -- Kagiso (Payroll Admin)
UPDATE employees SET user_id = 8 WHERE id = 137; -- Andiswa (Recruiter)
UPDATE employees SET user_id = 9 WHERE id = 58; -- Ryan (Training Coordinator)
