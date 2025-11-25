-- ZuZaWorksOS - Complete Database Schema
-- This creates all tables needed for full menu functionality

-- ============================================================================
-- SHIFTS & SCHEDULING
-- ============================================================================

CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_id INTEGER,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS shift_swaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requesting_employee_id INTEGER NOT NULL,
  target_employee_id INTEGER NOT NULL,
  shift_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  FOREIGN KEY (requesting_employee_id) REFERENCES employees(id),
  FOREIGN KEY (target_employee_id) REFERENCES employees(id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

-- ============================================================================
-- TIME TRACKING & ATTENDANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  clock_in DATETIME NOT NULL,
  clock_out DATETIME,
  break_minutes INTEGER DEFAULT 0,
  location_id INTEGER,
  notes TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS attendance_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  threshold_value REAL,
  action TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  rule_id INTEGER NOT NULL,
  violation_date DATE NOT NULL,
  severity TEXT DEFAULT 'minor',
  resolved INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (rule_id) REFERENCES attendance_rules(id)
);

-- ============================================================================
-- LEAVE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS leave_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  annual_days INTEGER DEFAULT 15,
  requires_approval INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  leave_type_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  approved_by INTEGER,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ============================================================================
-- COMPLIANCE & COIDA
-- ============================================================================

CREATE TABLE IF NOT EXISTS coida_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  incident_date DATE NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT DEFAULT 'minor',
  description TEXT NOT NULL,
  location_id INTEGER,
  witnesses TEXT,
  medical_attention INTEGER DEFAULT 0,
  days_lost INTEGER DEFAULT 0,
  reported_to_wcf INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS safety_training (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  training_type TEXT NOT NULL,
  training_date DATE NOT NULL,
  expiry_date DATE,
  trainer_name TEXT,
  certificate_url TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ============================================================================
-- ONBOARDING
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  task_name TEXT NOT NULL,
  task_category TEXT,
  is_completed INTEGER DEFAULT 0,
  completed_date DATE,
  assigned_to INTEGER,
  due_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- ============================================================================
-- DOCUMENTS & FILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  document_name TEXT NOT NULL,
  document_type TEXT,
  file_url TEXT,
  file_size INTEGER,
  uploaded_by INTEGER NOT NULL,
  is_confidential INTEGER DEFAULT 0,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ============================================================================
-- MESSAGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER,
  subject TEXT,
  message_text TEXT NOT NULL,
  is_broadcast INTEGER DEFAULT 0,
  is_read INTEGER DEFAULT 0,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);

-- ============================================================================
-- PAYROLL
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  employee_count INTEGER,
  total_amount REAL,
  status TEXT DEFAULT 'draft',
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payroll_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  base_salary REAL NOT NULL,
  overtime_amount REAL DEFAULT 0,
  bonus_amount REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  payment_date DATE,
  payment_method TEXT DEFAULT 'bank_transfer',
  FOREIGN KEY (batch_id) REFERENCES payroll_batches(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ============================================================================
-- BUDGETS & FORECASTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER NOT NULL,
  budget_year INTEGER NOT NULL,
  budget_month INTEGER,
  category TEXT NOT NULL,
  allocated_amount REAL NOT NULL,
  spent_amount REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER,
  forecast_type TEXT NOT NULL,
  forecast_period TEXT NOT NULL,
  predicted_value REAL,
  confidence_level TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ============================================================================
-- GAMIFICATION & ENGAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  awarded_date DATE NOT NULL,
  icon TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  rank_position INTEGER,
  streak_days INTEGER DEFAULT 0,
  last_activity DATETIME,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS engagement_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_type TEXT NOT NULL,
  employee_id INTEGER NOT NULL,
  activity_description TEXT,
  points_earned INTEGER DEFAULT 0,
  activity_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Leave types
INSERT OR IGNORE INTO leave_types (id, name, description, annual_days) VALUES
  (1, 'Annual Leave', 'Paid annual vacation leave', 15),
  (2, 'Sick Leave', 'Medical sick leave', 30),
  (3, 'Family Responsibility', 'Family responsibility leave', 3),
  (4, 'Maternity Leave', 'Maternity leave', 120),
  (5, 'Study Leave', 'Educational/study leave', 5);

-- Attendance rules
INSERT OR IGNORE INTO attendance_rules (id, name, rule_type, threshold_value, action) VALUES
  (1, 'Late Arrival', 'tardiness', 15.0, 'warning'),
  (2, 'Excessive Absenteeism', 'absence', 3.0, 'disciplinary'),
  (3, 'Missing Punch', 'clock_error', 1.0, 'notification');

-- Create some sample shifts for existing employee
INSERT OR IGNORE INTO shifts (employee_id, shift_date, start_time, end_time, location_id, status) VALUES
  (1, date('now'), '08:00', '17:00', 1, 'scheduled'),
  (1, date('now', '+1 day'), '08:00', '17:00', 1, 'scheduled'),
  (1, date('now', '+2 days'), '08:00', '17:00', 1, 'scheduled');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_coida_employee ON coida_incidents(employee_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(employee_id);
