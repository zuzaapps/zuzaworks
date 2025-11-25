-- ============================================================================
-- ADVANCED WORKFORCE MANAGEMENT FEATURES
-- ============================================================================

-- Shift Swap/Trade Requests
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  
  -- Original shift owner
  requesting_employee_id INTEGER NOT NULL,
  original_shift_id INTEGER NOT NULL,
  
  -- Target employee (if direct swap) or NULL for open to all
  target_employee_id INTEGER,
  
  -- Swap details
  swap_type TEXT CHECK(swap_type IN ('trade', 'give_away', 'partial')) NOT NULL,
  reason TEXT,
  notes TEXT,
  
  -- Approval workflow
  status TEXT CHECK(status IN ('pending', 'accepted', 'declined', 'cancelled', 'approved_by_manager', 'completed')) DEFAULT 'pending',
  accepted_by_employee_id INTEGER, -- Who accepted the swap
  approved_by_manager_id INTEGER,
  declined_reason TEXT,
  
  -- Timestamps
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  approved_at DATETIME,
  completed_at DATETIME,
  expires_at DATETIME, -- Request expires if not accepted
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (requesting_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (original_shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (target_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (accepted_by_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by_manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Team Messages/Communication
CREATE TABLE IF NOT EXISTS team_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  
  -- Message details
  sender_employee_id INTEGER NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  message_type TEXT CHECK(message_type IN ('announcement', 'direct', 'group', 'shift_related', 'urgent')) DEFAULT 'group',
  
  -- Targeting
  target_type TEXT CHECK(target_type IN ('all', 'department', 'location', 'specific_employees', 'shift')) NOT NULL,
  department_id INTEGER,
  location_id INTEGER,
  shift_id INTEGER,
  
  -- Priority
  is_urgent BOOLEAN DEFAULT 0,
  is_pinned BOOLEAN DEFAULT 0,
  
  -- Attachments
  has_attachments BOOLEAN DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

-- Message Recipients (for targeted messages)
CREATE TABLE IF NOT EXISTS message_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  
  is_read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  
  FOREIGN KEY (message_id) REFERENCES team_messages(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE(message_id, employee_id)
);

-- Document Management
CREATE TABLE IF NOT EXISTS employee_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  
  -- Document details
  document_type TEXT CHECK(document_type IN ('id_copy', 'contract', 'certificate', 'tax_form', 'bank_details', 'proof_of_address', 'medical_certificate', 'disciplinary', 'performance_review', 'other')) NOT NULL,
  document_name TEXT NOT NULL,
  description TEXT,
  
  -- File storage (in production, would use R2/S3)
  file_path TEXT NOT NULL, -- URL or path to file
  file_size INTEGER, -- bytes
  file_type TEXT, -- MIME type
  file_extension TEXT,
  
  -- Metadata
  uploaded_by INTEGER,
  is_confidential BOOLEAN DEFAULT 0,
  requires_signature BOOLEAN DEFAULT 0,
  is_signed BOOLEAN DEFAULT 0,
  signed_at DATETIME,
  
  -- Expiry tracking
  has_expiry BOOLEAN DEFAULT 0,
  expiry_date DATE,
  expiry_reminder_days INTEGER DEFAULT 30,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  replaces_document_id INTEGER, -- Previous version
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (replaces_document_id) REFERENCES employee_documents(id) ON DELETE SET NULL
);

-- Payroll Export Batches
CREATE TABLE IF NOT EXISTS payroll_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  
  batch_number TEXT UNIQUE NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  
  -- Status
  status TEXT CHECK(status IN ('draft', 'calculating', 'review', 'approved', 'exported', 'processed')) DEFAULT 'draft',
  
  -- Summary
  total_employees INTEGER,
  total_hours REAL,
  total_overtime_hours REAL,
  total_regular_pay REAL,
  total_overtime_pay REAL,
  total_deductions REAL,
  total_net_pay REAL,
  
  -- Processing
  calculated_at DATETIME,
  calculated_by INTEGER,
  approved_at DATETIME,
  approved_by INTEGER,
  exported_at DATETIME,
  exported_by INTEGER,
  export_file_path TEXT,
  
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (calculated_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (exported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Payroll Line Items
CREATE TABLE IF NOT EXISTS payroll_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payroll_batch_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  
  -- Hours
  regular_hours REAL DEFAULT 0,
  overtime_hours REAL DEFAULT 0,
  double_time_hours REAL DEFAULT 0,
  public_holiday_hours REAL DEFAULT 0,
  
  -- Pay
  regular_pay REAL DEFAULT 0,
  overtime_pay REAL DEFAULT 0,
  double_time_pay REAL DEFAULT 0,
  public_holiday_pay REAL DEFAULT 0,
  bonus_pay REAL DEFAULT 0,
  commission_pay REAL DEFAULT 0,
  
  -- Deductions
  tax_deduction REAL DEFAULT 0,
  pension_deduction REAL DEFAULT 0,
  medical_deduction REAL DEFAULT 0,
  other_deductions REAL DEFAULT 0,
  
  -- Totals
  gross_pay REAL DEFAULT 0,
  total_deductions REAL DEFAULT 0,
  net_pay REAL DEFAULT 0,
  
  -- Payment details
  payment_method TEXT CHECK(payment_method IN ('bank_transfer', 'cash', 'cheque')) DEFAULT 'bank_transfer',
  bank_account_number TEXT,
  bank_name TEXT,
  
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (payroll_batch_id) REFERENCES payroll_batches(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Labor Forecasting Models
CREATE TABLE IF NOT EXISTS labor_forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  location_id INTEGER,
  department_id INTEGER,
  
  -- Forecast period
  forecast_date DATE NOT NULL,
  day_of_week TEXT,
  is_weekend BOOLEAN DEFAULT 0,
  is_public_holiday BOOLEAN DEFAULT 0,
  
  -- Predicted demand
  predicted_customer_count INTEGER,
  predicted_transaction_count INTEGER,
  predicted_revenue REAL,
  
  -- Staffing recommendations
  recommended_staff_count INTEGER,
  recommended_skill_mix TEXT, -- JSON: {"cashiers": 3, "managers": 1}
  
  -- Actual vs predicted (for learning)
  actual_staff_count INTEGER,
  actual_customer_count INTEGER,
  actual_revenue REAL,
  accuracy_score REAL, -- 0-100%
  
  -- Model metadata
  model_version TEXT DEFAULT '1.0',
  confidence_level REAL, -- 0-1
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  UNIQUE(organization_id, location_id, department_id, forecast_date)
);

-- Attendance Rules Engine
CREATE TABLE IF NOT EXISTS attendance_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  
  rule_name TEXT NOT NULL,
  rule_type TEXT CHECK(rule_type IN ('late_arrival', 'early_departure', 'missed_clock_out', 'break_violation', 'overtime_threshold', 'consecutive_days')) NOT NULL,
  
  -- Rule parameters (JSON)
  rule_config TEXT NOT NULL, -- e.g., {"grace_period_minutes": 5, "penalty_points": 1}
  
  -- Actions
  auto_deduct_pay BOOLEAN DEFAULT 0,
  deduction_amount REAL,
  assign_penalty_points BOOLEAN DEFAULT 0,
  penalty_points INTEGER,
  send_notification BOOLEAN DEFAULT 1,
  requires_manager_approval BOOLEAN DEFAULT 0,
  
  -- Scope
  applies_to_all BOOLEAN DEFAULT 1,
  department_id INTEGER,
  location_id INTEGER,
  
  is_active BOOLEAN DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- Attendance Violations
CREATE TABLE IF NOT EXISTS attendance_violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  time_entry_id INTEGER,
  
  violation_type TEXT CHECK(violation_type IN ('late', 'early_departure', 'no_show', 'missed_clock_out', 'excessive_break', 'unauthorized_overtime')) NOT NULL,
  violation_date DATE NOT NULL,
  
  -- Details
  scheduled_time TIME,
  actual_time TIME,
  minutes_late INTEGER,
  minutes_early INTEGER,
  
  -- Rule applied
  attendance_rule_id INTEGER,
  penalty_points INTEGER DEFAULT 0,
  pay_deduction REAL DEFAULT 0,
  
  -- Status
  status TEXT CHECK(status IN ('pending', 'approved', 'contested', 'waived')) DEFAULT 'pending',
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  review_notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (time_entry_id) REFERENCES time_entries(id) ON DELETE SET NULL,
  FOREIGN KEY (attendance_rule_id) REFERENCES attendance_rules(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Budget Tracking
CREATE TABLE IF NOT EXISTS budget_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  department_id INTEGER,
  location_id INTEGER,
  
  period_name TEXT NOT NULL, -- e.g., "Q1 2025", "January 2025"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Budget allocations
  labor_budget REAL NOT NULL,
  overtime_budget REAL DEFAULT 0,
  training_budget REAL DEFAULT 0,
  recruitment_budget REAL DEFAULT 0,
  
  -- Actual spending
  actual_labor_cost REAL DEFAULT 0,
  actual_overtime_cost REAL DEFAULT 0,
  actual_training_cost REAL DEFAULT 0,
  actual_recruitment_cost REAL DEFAULT 0,
  
  -- Variance
  labor_variance REAL DEFAULT 0, -- Negative = over budget
  overtime_variance REAL DEFAULT 0,
  
  -- Alerts
  alert_threshold_percentage INTEGER DEFAULT 90, -- Alert at 90% of budget
  is_over_budget BOOLEAN DEFAULT 0,
  
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_shift_swaps_employee ON shift_swap_requests(requesting_employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_swaps_status ON shift_swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_team_messages_org ON team_messages(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_recipients_employee ON message_recipients(employee_id, is_read);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_expiry ON employee_documents(expiry_date) WHERE has_expiry = 1;
CREATE INDEX IF NOT EXISTS idx_payroll_batches_period ON payroll_batches(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_labor_forecasts_date ON labor_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_attendance_violations_employee ON attendance_violations(employee_id, violation_date);
CREATE INDEX IF NOT EXISTS idx_budget_periods_period ON budget_periods(period_start, period_end);
