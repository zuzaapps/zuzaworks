-- ============================================================================
-- AUTHENTICATION & USER MANAGEMENT SYSTEM
-- ============================================================================

-- Users table (authentication accounts - separate from employees)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  employee_id INTEGER, -- Link to employee record (can be NULL for system admins)
  
  -- Authentication
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT, -- For local accounts (bcrypt)
  
  -- SSO Integration
  sso_provider TEXT CHECK(sso_provider IN ('local', 'google', 'microsoft', 'linkedin', 'azure_ad')),
  sso_provider_id TEXT, -- User ID from SSO provider
  sso_access_token TEXT,
  sso_refresh_token TEXT,
  sso_token_expires_at DATETIME,
  
  -- Profile
  first_name TEXT,
  last_name TEXT,
  profile_photo_url TEXT,
  phone TEXT,
  
  -- Account Status
  is_active BOOLEAN DEFAULT 1,
  is_verified BOOLEAN DEFAULT 0,
  email_verified_at DATETIME,
  must_change_password BOOLEAN DEFAULT 0,
  password_changed_at DATETIME,
  
  -- Security
  two_factor_enabled BOOLEAN DEFAULT 0,
  two_factor_secret TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME,
  last_login_at DATETIME,
  last_login_ip TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Roles (predefined system roles)
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER, -- NULL for system-wide roles
  
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Role Type
  is_system_role BOOLEAN DEFAULT 0, -- Cannot be deleted
  is_custom_role BOOLEAN DEFAULT 0,
  
  -- Hierarchy
  level INTEGER DEFAULT 0, -- 0=Employee, 1=Manager, 2=Director, 3=Executive, 4=Admin
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(organization_id, name)
);

-- Permissions (granular access controls)
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  name TEXT UNIQUE NOT NULL, -- e.g., 'employees.view', 'employees.create', 'compliance.manage'
  display_name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL, -- Module grouping: employees, shifts, compliance, etc.
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- User-Role mapping (users can have multiple roles)
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  
  -- Scope (for location/department-specific roles)
  location_id INTEGER,
  department_id INTEGER,
  
  -- Validity period
  valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER, -- User who assigned the role
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id, location_id, department_id)
);

-- Sessions (JWT token tracking for invalidation)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  token_hash TEXT UNIQUE NOT NULL, -- SHA256 hash of JWT
  refresh_token_hash TEXT UNIQUE,
  
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'web', 'mobile', 'tablet'
  
  expires_at DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit Log (track all permission-sensitive actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  
  user_id INTEGER,
  employee_id INTEGER,
  
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'export'
  resource_type TEXT NOT NULL, -- 'employee', 'shift', 'compliance_report'
  resource_id INTEGER,
  
  changes TEXT, -- JSON of what changed
  metadata TEXT, -- JSON of additional context
  
  ip_address TEXT,
  user_agent TEXT,
  
  success BOOLEAN DEFAULT 1,
  error_message TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_sso ON users(sso_provider, sso_provider_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- SEED DEFAULT ROLES
-- ============================================================================

INSERT OR IGNORE INTO roles (id, name, display_name, description, is_system_role, level) VALUES
  (1, 'super_admin', 'Super Administrator', 'Full system access - can manage everything including users and permissions', 1, 4),
  (2, 'hr_manager', 'HR Manager', 'Full HR access - employees, compliance, reporting, leave management', 1, 3),
  (3, 'department_manager', 'Department Manager', 'Manage team members, shifts, performance within assigned department', 1, 2),
  (4, 'location_manager', 'Location Manager', 'Manage operations at specific location(s)', 1, 2),
  (5, 'employee', 'Employee (Standard)', 'Self-service access - view own info, request leave, clock in/out', 1, 0),
  (6, 'compliance_officer', 'Compliance Officer', 'Manage compliance monitoring, reports, and audits', 1, 2),
  (7, 'payroll_admin', 'Payroll Administrator', 'Access to time sheets, leave, and payroll-related data', 1, 2),
  (8, 'recruiter', 'Recruiter', 'Manage job postings, candidates, and onboarding workflows', 1, 1),
  (9, 'training_coordinator', 'Training Coordinator', 'Manage training courses, enrollments, and skills development', 1, 1),
  (10, 'readonly', 'Read-Only User', 'View-only access for reports and dashboards', 1, 0);

-- ============================================================================
-- SEED PERMISSIONS (15+ GRANULAR PERMISSIONS)
-- ============================================================================

INSERT OR IGNORE INTO permissions (name, display_name, description, module) VALUES
  -- Employee Management
  ('employees.view', 'View Employees', 'View employee profiles and basic information', 'employees'),
  ('employees.view_sensitive', 'View Sensitive Employee Data', 'View salary, ID numbers, and confidential info', 'employees'),
  ('employees.create', 'Create Employees', 'Add new employees to the system', 'employees'),
  ('employees.update', 'Update Employees', 'Edit employee information', 'employees'),
  ('employees.delete', 'Delete Employees', 'Remove employees from system', 'employees'),
  ('employees.export', 'Export Employee Data', 'Download employee reports and data exports', 'employees'),
  
  -- Scheduling
  ('shifts.view', 'View Shifts', 'View shift schedules', 'scheduling'),
  ('shifts.create', 'Create Shifts', 'Create and assign shifts', 'scheduling'),
  ('shifts.update', 'Update Shifts', 'Edit existing shifts', 'scheduling'),
  ('shifts.delete', 'Delete Shifts', 'Remove shifts from schedule', 'scheduling'),
  ('shifts.assign', 'Assign Employees to Shifts', 'Assign/unassign employees', 'scheduling'),
  
  -- Time Tracking
  ('time.view', 'View Time Entries', 'View clock-in/out records', 'time_tracking'),
  ('time.create', 'Clock In/Out', 'Record own attendance', 'time_tracking'),
  ('time.update', 'Edit Time Entries', 'Modify time records (for corrections)', 'time_tracking'),
  ('time.approve', 'Approve Time Sheets', 'Approve weekly time sheets', 'time_tracking'),
  
  -- Leave Management
  ('leave.view', 'View Leave Requests', 'View leave requests and balances', 'leave'),
  ('leave.request', 'Request Leave', 'Submit own leave requests', 'leave'),
  ('leave.approve', 'Approve Leave', 'Approve/reject leave requests', 'leave'),
  ('leave.manage_balances', 'Manage Leave Balances', 'Adjust leave balances', 'leave'),
  
  -- Compliance
  ('compliance.view', 'View Compliance Data', 'View compliance dashboards and reports', 'compliance'),
  ('compliance.manage', 'Manage Compliance', 'Configure compliance rules and monitoring', 'compliance'),
  ('compliance.export', 'Export Compliance Reports', 'Download BCEA/EEA/COIDA reports', 'compliance'),
  
  -- Training & Development
  ('training.view', 'View Training', 'View training courses and enrollments', 'training'),
  ('training.enroll', 'Enroll in Training', 'Self-enroll in available courses', 'training'),
  ('training.manage', 'Manage Training', 'Create courses and manage enrollments', 'training'),
  
  -- Payroll
  ('payroll.view', 'View Payroll Data', 'View payroll reports and salary info', 'payroll'),
  ('payroll.process', 'Process Payroll', 'Run payroll calculations and exports', 'payroll'),
  
  -- Analytics & Reporting
  ('analytics.view', 'View Analytics', 'Access dashboards and reports', 'analytics'),
  ('analytics.export', 'Export Reports', 'Download analytics and BI reports', 'analytics'),
  
  -- System Administration
  ('users.view', 'View Users', 'View user accounts', 'administration'),
  ('users.manage', 'Manage Users', 'Create/edit/delete user accounts', 'administration'),
  ('roles.view', 'View Roles', 'View role definitions', 'administration'),
  ('roles.manage', 'Manage Roles', 'Create/edit roles and assign permissions', 'administration'),
  ('permissions.manage', 'Manage Permissions', 'Assign/revoke permissions', 'administration'),
  ('audit.view', 'View Audit Logs', 'Access system audit trails', 'administration'),
  ('settings.manage', 'Manage System Settings', 'Configure system-wide settings', 'administration');

-- ============================================================================
-- MAP PERMISSIONS TO DEFAULT ROLES
-- ============================================================================

-- Super Admin gets ALL permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- HR Manager permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE module IN ('employees', 'leave', 'compliance', 'training', 'analytics') OR name LIKE 'time.%';

-- Department Manager permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN (
  'employees.view', 'employees.update',
  'shifts.view', 'shifts.create', 'shifts.update', 'shifts.assign',
  'time.view', 'time.approve',
  'leave.view', 'leave.approve',
  'training.view', 'training.enroll',
  'analytics.view'
);

-- Location Manager permissions (similar to department manager)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE name IN (
  'employees.view', 'employees.update',
  'shifts.view', 'shifts.create', 'shifts.update', 'shifts.assign',
  'time.view', 'time.approve',
  'leave.view', 'leave.approve',
  'analytics.view'
);

-- Employee (Standard) permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE name IN (
  'employees.view', -- Only own profile
  'time.create', -- Clock in/out
  'time.view', -- View own time
  'leave.view', -- View own leave
  'leave.request', -- Request leave
  'training.view',
  'training.enroll'
);

-- Compliance Officer permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 6, id FROM permissions WHERE module IN ('compliance', 'analytics') OR name IN ('employees.view', 'time.view', 'audit.view');

-- Payroll Admin permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 7, id FROM permissions WHERE module IN ('payroll', 'time_tracking', 'leave') OR name IN ('employees.view', 'employees.view_sensitive');

-- Recruiter permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 8, id FROM permissions WHERE name IN (
  'employees.view', 'employees.create', 'employees.update',
  'training.view'
);

-- Training Coordinator permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 9, id FROM permissions WHERE module = 'training' OR name IN ('employees.view', 'analytics.view');

-- Read-Only User permissions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 10, id FROM permissions WHERE name LIKE '%.view' AND name NOT LIKE '%.view_sensitive';
