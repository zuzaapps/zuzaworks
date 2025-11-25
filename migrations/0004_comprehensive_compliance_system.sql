-- =====================================================
-- Migration 0004: Comprehensive SA Labour Law Compliance System
-- =====================================================
-- Implements real-time compliance monitoring across 16 legislative categories
-- with 200+ automated checkpoints for proactive compliance management

-- =====================================================
-- 1. COMPLIANCE CATEGORIES & FRAMEWORK
-- =====================================================

-- Master table defining the 16 compliance categories
CREATE TABLE IF NOT EXISTS compliance_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  legislation_reference TEXT,
  risk_level TEXT CHECK(risk_level IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual compliance checkpoints (200+ checks)
CREATE TABLE IF NOT EXISTS compliance_checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  check_type TEXT CHECK(check_type IN ('document', 'policy', 'registration', 'report', 'payment', 'record', 'training', 'process')) NOT NULL,
  frequency TEXT CHECK(frequency IN ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'on_event')) NOT NULL,
  responsible_role TEXT, -- Which role is responsible
  days_before_alert INTEGER DEFAULT 30, -- Alert X days before due
  is_automated INTEGER DEFAULT 0, -- Can system check automatically?
  penalty_amount_min REAL, -- Minimum fine for non-compliance
  penalty_amount_max REAL, -- Maximum fine
  legislation_reference TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES compliance_categories(id)
);

-- Organization-level compliance status
CREATE TABLE IF NOT EXISTS organization_compliance_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checkpoint_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('compliant', 'non_compliant', 'pending', 'not_applicable', 'in_progress')) DEFAULT 'pending',
  compliance_date DATE, -- When compliance achieved
  expiry_date DATE, -- When renewal needed
  next_review_date DATE,
  evidence_document_path TEXT, -- Path to proof document
  notes TEXT,
  last_checked_at DATETIME,
  last_checked_by INTEGER, -- user_id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (checkpoint_id) REFERENCES compliance_checkpoints(id),
  FOREIGN KEY (last_checked_by) REFERENCES users(id)
);

-- Employee-specific compliance tracking
CREATE TABLE IF NOT EXISTS employee_compliance_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  checkpoint_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('compliant', 'non_compliant', 'pending', 'not_applicable', 'in_progress')) DEFAULT 'pending',
  compliance_date DATE,
  expiry_date DATE,
  next_review_date DATE,
  evidence_document_path TEXT,
  notes TEXT,
  last_checked_at DATETIME,
  last_checked_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (checkpoint_id) REFERENCES compliance_checkpoints(id),
  FOREIGN KEY (last_checked_by) REFERENCES users(id),
  UNIQUE(employee_id, checkpoint_id)
);

-- =====================================================
-- 2. REGISTRATION & LICENSING TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS business_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_type TEXT NOT NULL, -- 'CIPC', 'SARS', 'DOEL', 'TES', 'BARGAINING_COUNCIL', 'PSIRA', etc.
  registration_number TEXT,
  registration_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  certificate_path TEXT,
  status TEXT CHECK(status IN ('active', 'expired', 'pending_renewal', 'suspended')) DEFAULT 'active',
  renewal_cost REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Professional registrations for employees
CREATE TABLE IF NOT EXISTS employee_professional_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  registration_type TEXT NOT NULL, -- 'PSIRA', 'SANC', 'ECSA', 'SACPCMP', etc.
  registration_number TEXT,
  registration_date DATE,
  expiry_date DATE,
  issuing_body TEXT,
  certificate_path TEXT,
  status TEXT CHECK(status IN ('active', 'expired', 'pending_renewal', 'suspended')) DEFAULT 'active',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- =====================================================
-- 3. STATUTORY PAYMENT TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS statutory_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_type TEXT CHECK(payment_type IN ('UIF', 'SDL', 'COIDA', 'SETA', 'BARGAINING_COUNCIL', 'PAYE', 'VAT')) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  amount_due REAL NOT NULL,
  amount_paid REAL,
  payment_date DATE,
  payment_reference TEXT,
  status TEXT CHECK(status IN ('pending', 'paid', 'overdue', 'disputed')) DEFAULT 'pending',
  late_penalty REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. MANDATORY REPORTS & SUBMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS statutory_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type TEXT NOT NULL, -- 'EEA12', 'EEA13', 'WSP', 'ATR', 'W.As.2', 'IRP5', etc.
  reporting_period_start DATE,
  reporting_period_end DATE,
  submission_deadline DATE NOT NULL,
  submission_date DATE,
  submission_reference TEXT,
  status TEXT CHECK(status IN ('not_started', 'in_progress', 'submitted', 'overdue', 'approved', 'rejected')) DEFAULT 'not_started',
  submitted_by INTEGER, -- user_id
  report_document_path TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submitted_by) REFERENCES users(id)
);

-- =====================================================
-- 5. POLICY & DOCUMENTATION COMPLIANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS mandatory_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_type TEXT NOT NULL, -- 'HEALTH_SAFETY', 'EEA_PLAN', 'DISCIPLINARY_CODE', 'SEXUAL_HARASSMENT', etc.
  policy_name TEXT NOT NULL,
  policy_version TEXT,
  effective_date DATE,
  review_date DATE,
  next_review_date DATE,
  document_path TEXT,
  status TEXT CHECK(status IN ('draft', 'active', 'under_review', 'expired')) DEFAULT 'draft',
  approved_by INTEGER,
  approval_date DATE,
  is_published INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Employee acknowledgment of policies
CREATE TABLE IF NOT EXISTS policy_acknowledgments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  acknowledged_date DATE NOT NULL,
  signature_path TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (policy_id) REFERENCES mandatory_policies(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE(policy_id, employee_id)
);

-- =====================================================
-- 6. TRAINING & CERTIFICATION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS mandatory_training (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  training_type TEXT NOT NULL, -- 'INDUCTION', 'HEALTH_SAFETY', 'FIRST_AID', 'FIRE_SAFETY', 'OHS_REP', etc.
  training_name TEXT NOT NULL,
  description TEXT,
  frequency_months INTEGER, -- How often to repeat (NULL = once-off)
  duration_hours REAL,
  mandatory_for_roles TEXT, -- JSON array of roles
  legislation_reference TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Employee training records (enhanced from existing)
CREATE TABLE IF NOT EXISTS employee_training_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  training_id INTEGER,
  training_name TEXT NOT NULL,
  training_provider TEXT,
  training_date DATE NOT NULL,
  completion_date DATE,
  expiry_date DATE,
  certificate_number TEXT,
  certificate_path TEXT,
  status TEXT CHECK(status IN ('completed', 'in_progress', 'expired', 'failed')) DEFAULT 'completed',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (training_id) REFERENCES mandatory_training(id)
);

-- =====================================================
-- 7. HEALTH & SAFETY COMPLIANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS health_safety_representatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  appointment_date DATE NOT NULL,
  training_date DATE,
  training_certificate_path TEXT,
  coverage_area TEXT, -- Department/Location they cover
  status TEXT CHECK(status IN ('active', 'inactive', 'training_pending')) DEFAULT 'training_pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS health_safety_committee_meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_date DATE NOT NULL,
  location TEXT,
  attendees TEXT, -- JSON array of employee_ids
  agenda TEXT,
  minutes_document_path TEXT,
  action_items TEXT, -- JSON array of action items
  next_meeting_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Risk assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_type TEXT, -- 'HIRA', 'JOB_SPECIFIC', 'COVID', 'SITE_SPECIFIC'
  assessment_name TEXT NOT NULL,
  location_id INTEGER,
  department_id INTEGER,
  job_role TEXT,
  assessment_date DATE NOT NULL,
  next_review_date DATE,
  conducted_by INTEGER,
  hazards_identified TEXT, -- JSON array
  risk_rating TEXT CHECK(risk_rating IN ('low', 'medium', 'high', 'critical')),
  control_measures TEXT, -- JSON array
  residual_risk TEXT CHECK(residual_risk IN ('low', 'medium', 'high', 'critical')),
  document_path TEXT,
  status TEXT CHECK(status IN ('active', 'expired', 'under_review')) DEFAULT 'active',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (conducted_by) REFERENCES users(id)
);

-- =====================================================
-- 8. COIDA INCIDENT TRACKING (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS coida_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  incident_date DATETIME NOT NULL,
  incident_type TEXT CHECK(incident_type IN ('injury', 'disease', 'fatality', 'near_miss')) NOT NULL,
  severity TEXT CHECK(severity IN ('minor', 'moderate', 'serious', 'critical', 'fatal')) NOT NULL,
  location_id INTEGER,
  description TEXT NOT NULL,
  body_part_affected TEXT,
  time_lost_days INTEGER DEFAULT 0,
  medical_treatment_required INTEGER DEFAULT 0,
  hospitalization_required INTEGER DEFAULT 0,
  reported_to_commissioner INTEGER DEFAULT 0,
  report_date DATE,
  w_cl2_form_path TEXT,
  investigation_completed INTEGER DEFAULT 0,
  investigation_report_path TEXT,
  corrective_actions TEXT, -- JSON array
  status TEXT CHECK(status IN ('reported', 'under_investigation', 'claim_submitted', 'claim_approved', 'claim_rejected', 'closed')) DEFAULT 'reported',
  claim_reference TEXT,
  claim_amount REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- =====================================================
-- 9. CONTRACT COMPLIANCE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS employment_contract_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  contract_type TEXT CHECK(contract_type IN ('permanent', 'fixed_term', 'part_time', 'casual', 'tes_placement', 'learnership', 'internship')) NOT NULL,
  contract_document_path TEXT,
  contract_signed INTEGER DEFAULT 0,
  contract_sign_date DATE,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE, -- For fixed-term
  tes_placement_date DATE, -- Track 3-month rule
  deemed_permanent_date DATE, -- When employee becomes permanent (TES 3-month rule)
  probation_end_date DATE,
  notice_period_days INTEGER,
  status TEXT CHECK(status IN ('unsigned', 'active', 'expired', 'terminated', 'deemed_permanent')) DEFAULT 'unsigned',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE(employee_id)
);

-- =====================================================
-- 10. WORKING TIME COMPLIANCE MONITORING
-- =====================================================

CREATE TABLE IF NOT EXISTS working_time_violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  violation_date DATE NOT NULL,
  violation_type TEXT CHECK(violation_type IN (
    'exceed_45h_week',
    'exceed_9h_day',
    'exceed_overtime_limit',
    'insufficient_rest_daily',
    'insufficient_rest_weekly',
    'missing_meal_interval',
    'sunday_work_no_consent',
    'public_holiday_no_consent'
  )) NOT NULL,
  actual_hours REAL,
  limit_hours REAL,
  difference_hours REAL,
  severity TEXT CHECK(severity IN ('minor', 'moderate', 'serious', 'critical')) DEFAULT 'moderate',
  manager_notified INTEGER DEFAULT 0,
  corrective_action TEXT,
  resolved INTEGER DEFAULT 0,
  resolved_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- =====================================================
-- 11. LEAVE COMPLIANCE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS leave_balance_compliance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  leave_type TEXT NOT NULL,
  accrual_rate REAL, -- Days per month/period
  current_balance REAL,
  expected_balance REAL, -- What it should be based on BCEA
  variance REAL, -- Difference (negative = under-accrued = non-compliant)
  last_calculation_date DATE,
  is_compliant INTEGER DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE(employee_id, leave_type)
);

-- =====================================================
-- 12. WAGE COMPLIANCE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS wage_compliance_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  check_date DATE NOT NULL,
  check_type TEXT CHECK(check_type IN ('minimum_wage', 'equal_pay', 'overtime_premium', 'sunday_premium', 'public_holiday_premium')) NOT NULL,
  actual_rate REAL,
  required_rate REAL,
  variance REAL,
  is_compliant INTEGER DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- =====================================================
-- 13. COMPLIANCE ALERTS & NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT CHECK(alert_type IN ('expiring_document', 'missing_document', 'overdue_payment', 'overdue_report', 'policy_review_due', 'training_expiring', 'violation_detected', 'deadline_approaching')) NOT NULL,
  severity TEXT CHECK(severity IN ('info', 'warning', 'critical')) DEFAULT 'warning',
  category_id INTEGER,
  checkpoint_id INTEGER,
  employee_id INTEGER, -- If employee-specific
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  days_until_due INTEGER,
  responsible_role TEXT,
  assigned_to INTEGER, -- user_id
  status TEXT CHECK(status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'dismissed')) DEFAULT 'new',
  acknowledged_at DATETIME,
  acknowledged_by INTEGER,
  resolved_at DATETIME,
  resolved_by INTEGER,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES compliance_categories(id),
  FOREIGN KEY (checkpoint_id) REFERENCES compliance_checkpoints(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (acknowledged_by) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- =====================================================
-- 14. COMPLIANCE AUDIT TRAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type TEXT NOT NULL, -- 'check_performed', 'status_changed', 'document_uploaded', 'alert_generated', etc.
  category_id INTEGER,
  checkpoint_id INTEGER,
  employee_id INTEGER,
  old_status TEXT,
  new_status TEXT,
  performed_by INTEGER,
  description TEXT,
  evidence_document_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES compliance_categories(id),
  FOREIGN KEY (checkpoint_id) REFERENCES compliance_checkpoints(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- =====================================================
-- 15. AUTOMATED COMPLIANCE CHECKS SCHEDULE
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_check_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checkpoint_id INTEGER NOT NULL,
  check_frequency TEXT CHECK(check_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')) NOT NULL,
  last_run_at DATETIME,
  next_run_at DATETIME NOT NULL,
  is_enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (checkpoint_id) REFERENCES compliance_checkpoints(id),
  UNIQUE(checkpoint_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_org_compliance_status ON organization_compliance_status(status, expiry_date);
CREATE INDEX IF NOT EXISTS idx_emp_compliance_status ON employee_compliance_status(employee_id, status, expiry_date);
CREATE INDEX IF NOT EXISTS idx_emp_compliance_checkpoint ON employee_compliance_status(checkpoint_id, status);
CREATE INDEX IF NOT EXISTS idx_business_reg_status ON business_registrations(status, expiry_date);
CREATE INDEX IF NOT EXISTS idx_emp_prof_reg_status ON employee_professional_registrations(employee_id, status, expiry_date);
CREATE INDEX IF NOT EXISTS idx_statutory_payments_status ON statutory_payments(status, due_date);
CREATE INDEX IF NOT EXISTS idx_statutory_reports_status ON statutory_reports(status, submission_deadline);
CREATE INDEX IF NOT EXISTS idx_policies_status ON mandatory_policies(status, next_review_date);
CREATE INDEX IF NOT EXISTS idx_training_records_expiry ON employee_training_records(employee_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_coida_incidents_status ON coida_incidents(status, incident_date);
CREATE INDEX IF NOT EXISTS idx_working_time_violations ON working_time_violations(employee_id, resolved, violation_date);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON compliance_alerts(status, severity, due_date);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_assigned ON compliance_alerts(assigned_to, status);

-- =====================================================
-- SEED DATA: 16 COMPLIANCE CATEGORIES
-- =====================================================

INSERT OR IGNORE INTO compliance_categories (code, name, description, legislation_reference, risk_level) VALUES
('LEGISLATIVE_FRAMEWORK', 'Legislative Framework', 'Primary labour legislation compliance', 'LRA, BCEA, EEA, OHSA, SDA, UIA, COIDA, ESA, POPIA, NMW', 'critical'),
('REGISTRATION_LICENSING', 'Registration & Licensing', 'Business registrations and licenses', 'ESA, CIPC, SARS, DoEL', 'critical'),
('EMPLOYMENT_CONTRACTS', 'Employment Contracts & Documentation', 'Contract requirements and record-keeping', 'BCEA, LRA', 'high'),
('WAGES_REMUNERATION', 'Wages & Remuneration', 'Minimum wage and payment compliance', 'BCEA, NMW Act', 'critical'),
('WORKING_TIME', 'Working Time Regulations', 'Hours of work and rest periods', 'BCEA', 'high'),
('LEAVE_ENTITLEMENTS', 'Leave Entitlements', 'Annual, sick, maternity and other leave', 'BCEA, UIA', 'high'),
('HEALTH_SAFETY', 'Health & Safety', 'Workplace safety and OHS compliance', 'OHSA', 'critical'),
('INSURANCE_COMPENSATION', 'Insurance & Compensation', 'COIDA, UIF, SDL payments', 'COIDA, UIA, SDA', 'critical'),
('EMPLOYMENT_EQUITY', 'Employment Equity', 'EEA reporting and transformation', 'EEA', 'high'),
('SKILLS_DEVELOPMENT', 'Skills Development & Training', 'Training requirements and SETA compliance', 'SDA', 'medium'),
('DATA_PROTECTION', 'Data Protection & Privacy', 'POPIA compliance', 'POPIA', 'high'),
('LABOUR_RELATIONS', 'Labour Relations & Disputes', 'Union rights and dispute resolution', 'LRA', 'medium'),
('TERMINATION_EXIT', 'Termination & Exit Procedures', 'Notice periods and exit compliance', 'BCEA, LRA', 'high'),
('TES_COMPLIANCE', 'Temporary Employment Service', 'TES-specific compliance requirements', 'ESA, LRA', 'critical'),
('RECORD_KEEPING', 'Record-Keeping & Retention', 'Statutory records and retention', 'BCEA, EEA, OHSA', 'high'),
('AUDITS_INSPECTIONS', 'Audits & Inspections', 'DoEL and SARS audit readiness', 'All Acts', 'medium');

-- Success message
SELECT 'Migration 0004 completed successfully - Comprehensive SA Labour Law Compliance System created' AS message;
