-- =====================================================
-- Migration 0005: Comprehensive COIDA (Compensation for Occupational Injuries and Diseases) Module
-- =====================================================
-- Implements complete COIDA compliance tracking including:
-- - Registration and classification
-- - Annual returns (W.As.2) and assessments
-- - Injury/disease reporting (W.Cl.2, W.Cl.4, W.Cl.6)
-- - Claims management (W.Cl.3, W.Cl.22)
-- - Letter of Good Standing tracking
-- - Advance payment tracking
-- - Medical treatment authorization

-- =====================================================
-- 1. COIDA REGISTRATION & CLASSIFICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS coida_registration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_number TEXT UNIQUE, -- U-number format
  registration_date DATE NOT NULL,
  business_activity_description TEXT,
  primary_tariff_code TEXT NOT NULL,
  primary_tariff_description TEXT,
  primary_tariff_rate REAL NOT NULL, -- Percentage (e.g., 0.22 for 0.22%)
  risk_class TEXT CHECK(risk_class IN ('Class 1', 'Class 2', 'Class 3', 'Class 4')),
  registration_certificate_path TEXT,
  status TEXT CHECK(status IN ('active', 'suspended', 'cancelled')) DEFAULT 'active',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Multiple tariff codes support (for businesses with diverse activities)
CREATE TABLE IF NOT EXISTS coida_tariff_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL,
  tariff_code TEXT NOT NULL,
  tariff_description TEXT NOT NULL,
  tariff_rate REAL NOT NULL, -- Percentage
  risk_class TEXT,
  estimated_annual_earnings REAL,
  is_primary INTEGER DEFAULT 0, -- 1 if primary activity
  effective_date DATE,
  end_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES coida_registration(id)
);

-- =====================================================
-- 2. ANNUAL RETURNS & ASSESSMENTS (Form W.As.2)
-- =====================================================

CREATE TABLE IF NOT EXISTS coida_annual_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_year INTEGER NOT NULL, -- Year being reported (e.g., 2024)
  submission_deadline DATE NOT NULL, -- March 31 of following year
  submission_date DATE,
  submission_reference TEXT,
  status TEXT CHECK(status IN ('not_started', 'in_progress', 'submitted', 'overdue', 'accepted', 'rejected')) DEFAULT 'not_started',
  
  -- Earnings declaration
  total_earnings_declared REAL NOT NULL,
  number_of_employees INTEGER,
  
  -- Assessment calculation
  assessment_amount REAL, -- Calculated by Compensation Fund
  assessment_notice_date DATE,
  assessment_due_date DATE,
  assessment_paid_date DATE,
  assessment_payment_reference TEXT,
  
  -- Penalties
  late_submission_penalty REAL DEFAULT 0, -- 10% if late
  interest_charged REAL DEFAULT 0,
  total_amount_due REAL,
  
  -- Document paths
  w_as2_form_path TEXT, -- Submitted form
  assessment_notice_path TEXT,
  payment_proof_path TEXT,
  
  submitted_by INTEGER, -- user_id
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submitted_by) REFERENCES users(id),
  UNIQUE(return_year)
);

-- Earnings breakdown by tariff code (for W.As.2 Section B)
CREATE TABLE IF NOT EXISTS coida_earnings_by_tariff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  annual_return_id INTEGER NOT NULL,
  tariff_code TEXT NOT NULL,
  tariff_description TEXT,
  tariff_rate REAL NOT NULL,
  total_earnings REAL NOT NULL,
  number_of_employees INTEGER,
  assessment_amount REAL, -- Earnings × Rate
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (annual_return_id) REFERENCES coida_annual_returns(id)
);

-- =====================================================
-- 3. ADVANCE PAYMENTS (Provisional Assessments)
-- =====================================================

CREATE TABLE IF NOT EXISTS coida_advance_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_year INTEGER NOT NULL,
  payment_period TEXT CHECK(payment_period IN ('first_half', 'second_half')) NOT NULL, -- July or January
  due_date DATE NOT NULL, -- July 31 or January 31
  amount_due REAL NOT NULL, -- 50% of previous year's assessment
  payment_date DATE,
  amount_paid REAL,
  payment_reference TEXT,
  payment_proof_path TEXT,
  status TEXT CHECK(status IN ('pending', 'paid', 'overdue', 'waived')) DEFAULT 'pending',
  late_interest REAL DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(payment_year, payment_period)
);

-- =====================================================
-- 4. INJURY/DISEASE REPORTING (Form W.Cl.2)
-- =====================================================

-- Enhanced coida_incidents table (already exists from migration 0004, but adding more fields)
-- This adds to the existing table structure

CREATE TABLE IF NOT EXISTS coida_incident_reporting (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coida_incident_id INTEGER NOT NULL, -- Links to coida_incidents table
  
  -- Form W.Cl.2 details
  w_cl2_form_number TEXT UNIQUE,
  reported_date DATE NOT NULL, -- Must be within 7 days
  reported_by INTEGER, -- user_id
  reporting_method TEXT CHECK(reporting_method IN ('online', 'post', 'hand_delivery', 'email')),
  is_late INTEGER DEFAULT 0, -- 1 if reported after 7 days
  late_reason TEXT,
  
  -- Incident classification
  injury_category TEXT CHECK(injury_category IN (
    'fracture', 'laceration', 'burn', 'amputation', 'concussion', 
    'sprain_strain', 'contusion', 'occupational_disease', 'fatality', 'other'
  )),
  severity_level TEXT CHECK(severity_level IN ('minor', 'moderate', 'serious', 'critical', 'fatal')) NOT NULL,
  
  -- Work stoppage
  employee_stopped_work INTEGER DEFAULT 0, -- 1 if yes
  work_stopped_date DATE,
  expected_return_date DATE,
  actual_return_date DATE,
  
  -- Witnesses
  witness_names TEXT, -- JSON array or comma-separated
  witness_statements TEXT,
  
  -- Scene details
  accident_scene_photos TEXT, -- JSON array of photo paths
  accident_scene_secured INTEGER DEFAULT 0,
  
  -- Compensation Fund response
  cf_acknowledgment_date DATE,
  cf_reference_number TEXT,
  cf_investigation_required INTEGER DEFAULT 0,
  
  -- Document paths
  w_cl2_document_path TEXT,
  police_report_path TEXT, -- For serious incidents
  witness_statement_paths TEXT, -- JSON array
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coida_incident_id) REFERENCES coida_incidents(id),
  FOREIGN KEY (reported_by) REFERENCES users(id)
);

-- =====================================================
-- 5. MEDICAL TREATMENT AUTHORIZATION (Form W.Cl.4)
-- =====================================================

CREATE TABLE IF NOT EXISTS coida_medical_authorization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coida_incident_id INTEGER NOT NULL,
  
  -- Form W.Cl.4 details
  w_cl4_form_number TEXT UNIQUE,
  authorization_date DATE NOT NULL,
  authorized_by INTEGER, -- user_id
  
  -- Medical provider
  medical_provider_name TEXT,
  medical_provider_type TEXT CHECK(medical_provider_type IN ('GP', 'specialist', 'hospital', 'physiotherapist', 'other')),
  medical_provider_contact TEXT,
  medical_provider_address TEXT,
  
  -- Treatment details (Part B - completed by doctor)
  diagnosis TEXT,
  treatment_plan TEXT,
  estimated_treatment_duration INTEGER, -- Days
  follow_up_required INTEGER DEFAULT 0,
  next_appointment_date DATE,
  
  -- Medical expenses
  estimated_cost REAL,
  actual_cost REAL,
  cf_payment_date DATE,
  cf_payment_reference TEXT,
  
  -- Document paths
  w_cl4_document_path TEXT,
  medical_reports_path TEXT, -- JSON array
  invoices_path TEXT, -- JSON array
  
  status TEXT CHECK(status IN ('pending', 'approved', 'paid', 'rejected')) DEFAULT 'pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coida_incident_id) REFERENCES coida_incidents(id),
  FOREIGN KEY (authorized_by) REFERENCES users(id)
);

-- =====================================================
-- 6. FATALITY REPORTING (Form W.Cl.6)
-- =====================================================

CREATE TABLE IF NOT EXISTS coida_fatality_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coida_incident_id INTEGER NOT NULL,
  
  -- Form W.Cl.6 details
  w_cl6_form_number TEXT UNIQUE,
  reported_date DATE NOT NULL, -- Immediate reporting required
  reported_by INTEGER, -- user_id
  
  -- Deceased details
  deceased_id_number TEXT,
  date_of_death DATE NOT NULL,
  time_of_death TIME,
  place_of_death TEXT,
  cause_of_death TEXT,
  
  -- Investigation
  police_case_number TEXT,
  police_station TEXT,
  police_officer_name TEXT,
  police_officer_contact TEXT,
  
  inquest_required INTEGER DEFAULT 0,
  inquest_reference TEXT,
  inquest_date DATE,
  
  ohs_inspector_notified INTEGER DEFAULT 0,
  ohs_inspector_name TEXT,
  ohs_investigation_reference TEXT,
  
  -- Scene preservation
  scene_preserved INTEGER DEFAULT 1, -- Must preserve scene
  scene_photos TEXT, -- JSON array
  scene_sketch_path TEXT,
  
  -- Dependants information
  dependants_notified INTEGER DEFAULT 0,
  dependants_claim_assisted INTEGER DEFAULT 0,
  
  -- Document paths
  w_cl6_document_path TEXT,
  death_certificate_path TEXT,
  police_report_path TEXT,
  ohs_report_path TEXT,
  autopsy_report_path TEXT,
  
  status TEXT CHECK(status IN ('reported', 'under_investigation', 'investigation_complete', 'claim_processed')) DEFAULT 'reported',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coida_incident_id) REFERENCES coida_incidents(id),
  FOREIGN KEY (reported_by) REFERENCES users(id)
);

-- =====================================================
-- 7. EMPLOYEE CLAIMS (Form W.Cl.3)
-- =====================================================

CREATE TABLE IF NOT EXISTS coida_employee_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coida_incident_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  
  -- Form W.Cl.3 details
  w_cl3_form_number TEXT UNIQUE,
  claim_date DATE NOT NULL,
  claim_type TEXT CHECK(claim_type IN (
    'medical_expenses',
    'temporary_total_disablement',
    'temporary_partial_disablement',
    'permanent_disablement',
    'death_benefit'
  )) NOT NULL,
  
  -- Claim period
  disablement_start_date DATE,
  disablement_end_date DATE,
  
  -- Earnings information (from W.Cl.22)
  average_monthly_earnings REAL,
  earnings_certificate_received INTEGER DEFAULT 0,
  earnings_certificate_date DATE,
  
  -- Benefit calculation
  benefit_percentage REAL, -- 75% for TTD/TPD
  monthly_benefit_amount REAL,
  lump_sum_amount REAL, -- For permanent disablement
  total_benefit_paid REAL DEFAULT 0,
  
  -- Degree of disablement (for permanent disablement)
  disablement_percentage INTEGER, -- 0-100%
  medical_board_assessment_date DATE,
  medical_board_reference TEXT,
  
  -- Payment tracking
  first_payment_date DATE,
  last_payment_date DATE,
  number_of_payments_made INTEGER DEFAULT 0,
  
  -- Claim status
  status TEXT CHECK(status IN (
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'payment_in_progress',
    'completed',
    'appealed'
  )) DEFAULT 'submitted',
  
  cf_reference_number TEXT,
  rejection_reason TEXT,
  appeal_date DATE,
  appeal_outcome TEXT,
  
  -- Document paths
  w_cl3_document_path TEXT,
  medical_certificates_path TEXT, -- JSON array
  supporting_documents_path TEXT, -- JSON array
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coida_incident_id) REFERENCES coida_incidents(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- =====================================================
-- 8. EARNINGS CERTIFICATE (Form W.Cl.22)
-- =====================================================

CREATE TABLE IF NOT EXISTS coida_earnings_certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  
  -- Form W.Cl.22 details
  w_cl22_form_number TEXT UNIQUE,
  certificate_date DATE NOT NULL,
  completed_by INTEGER, -- user_id
  
  -- Employment period
  employment_start_date DATE NOT NULL,
  employment_end_date DATE, -- NULL if still employed
  
  -- Earnings breakdown (last 12 months)
  total_earnings_12_months REAL NOT NULL,
  basic_salary REAL,
  overtime_earnings REAL,
  commissions REAL,
  bonuses REAL,
  allowances REAL,
  other_earnings REAL,
  
  -- Calculation
  average_monthly_earnings REAL NOT NULL,
  number_of_months_worked INTEGER DEFAULT 12,
  
  -- Submission
  submitted_to_cf INTEGER DEFAULT 0,
  submission_date DATE,
  cf_receipt_date DATE,
  cf_accepted INTEGER DEFAULT 0,
  
  -- Document path
  w_cl22_document_path TEXT,
  payslips_path TEXT, -- JSON array of last 12 months
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES coida_employee_claims(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (completed_by) REFERENCES users(id)
);

-- =====================================================
-- 9. LETTER OF GOOD STANDING (LOGS)
-- =====================================================

CREATE TABLE IF NOT EXISTS coida_letters_of_good_standing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Application details
  application_date DATE NOT NULL,
  application_reference TEXT,
  applied_by INTEGER, -- user_id
  application_purpose TEXT, -- 'tendering', 'licensing', 'tes_license', 'bbbee', 'other'
  
  -- Issue details
  issue_date DATE,
  expiry_date DATE, -- Valid for 3 months
  certificate_number TEXT UNIQUE,
  certificate_path TEXT,
  
  -- Status
  status TEXT CHECK(status IN ('applied', 'issued', 'expired', 'rejected')) DEFAULT 'applied',
  rejection_reason TEXT,
  
  -- Compliance verification (checked before issuing)
  registration_current INTEGER DEFAULT 0,
  returns_submitted INTEGER DEFAULT 0,
  assessments_paid INTEGER DEFAULT 0,
  no_outstanding_claims INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applied_by) REFERENCES users(id)
);

-- =====================================================
-- 10. RETURN-TO-WORK PROGRAMS
-- =====================================================

CREATE TABLE IF NOT EXISTS coida_return_to_work (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coida_incident_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  
  -- Light duty assignment
  light_duty_start_date DATE,
  light_duty_end_date DATE,
  light_duty_description TEXT,
  light_duty_restrictions TEXT, -- JSON array: 'no_lifting', 'sitting_only', etc.
  
  -- Medical clearance
  medical_clearance_required INTEGER DEFAULT 1,
  medical_clearance_date DATE,
  medical_clearance_path TEXT,
  
  -- Work capacity
  work_capacity_percentage INTEGER, -- 0-100%
  hours_per_day_limit INTEGER,
  days_per_week_limit INTEGER,
  
  -- Monitoring
  progress_review_date DATE,
  full_duty_date DATE, -- When returned to 100% capacity
  
  -- Accommodation provided
  accommodation_type TEXT, -- 'modified_duties', 'reduced_hours', 'assistive_devices', 'workstation_adjustment'
  accommodation_cost REAL,
  
  status TEXT CHECK(status IN ('light_duty', 'gradual_return', 'full_duty', 'unable_to_return')) DEFAULT 'light_duty',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coida_incident_id) REFERENCES coida_incidents(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- =====================================================
-- 11. COIDA COMPLIANCE ALERTS
-- =====================================================

-- Add COIDA-specific alert types to existing compliance_alerts table
-- (No new table needed, just document the alert types)

-- COIDA alert types:
-- - 'coida_w_as2_due': Annual return due March 31
-- - 'coida_advance_payment_due': Advance payment due July 31 or January 31
-- - 'coida_logs_expiring': Letter of Good Standing expiring (3 months validity)
-- - 'coida_injury_report_overdue': Injury not reported within 7 days
-- - 'coida_w_cl22_requested': Earnings certificate requested by CF
-- - 'coida_assessment_overdue': Assessment payment overdue
-- - 'coida_claim_pending': Employee claim requiring action

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_coida_annual_returns_year ON coida_annual_returns(return_year, status);
CREATE INDEX IF NOT EXISTS idx_coida_advance_payments_due ON coida_advance_payments(due_date, status);
CREATE INDEX IF NOT EXISTS idx_coida_incident_reporting_date ON coida_incident_reporting(reported_date, is_late);
CREATE INDEX IF NOT EXISTS idx_coida_medical_auth_status ON coida_medical_authorization(status, authorization_date);
CREATE INDEX IF NOT EXISTS idx_coida_claims_status ON coida_employee_claims(status, claim_date);
CREATE INDEX IF NOT EXISTS idx_coida_logs_expiry ON coida_letters_of_good_standing(expiry_date, status);
CREATE INDEX IF NOT EXISTS idx_coida_earnings_cert_employee ON coida_earnings_certificates(employee_id, certificate_date);

-- =====================================================
-- SEED DATA: COIDA Registration (Example)
-- =====================================================

-- Insert example registration (will be replaced with actual data)
INSERT OR IGNORE INTO coida_registration (
  registration_number, 
  registration_date, 
  business_activity_description,
  primary_tariff_code,
  primary_tariff_description,
  primary_tariff_rate,
  risk_class,
  status
) VALUES (
  'U123456789',
  DATE('2024-01-15'),
  'Temporary Employment Services - Administrative Placement',
  '11101',
  'Office Administration',
  0.22,
  'Class 1',
  'active'
);

-- Success message
SELECT 'Migration 0005 completed successfully - Comprehensive COIDA module created' AS message;
