-- =====================================================
-- Migration 0006: Comprehensive Interns Management System
-- =====================================================
-- Handles SETA Learners, YES Participants, NYS Participants, and Self-Funded Interns
-- Complete lifecycle: Recruitment → Onboarding → Training → Assessment → Graduation → Employment

-- =====================================================
-- 1. INTERN PROGRAMS & TYPES
-- =====================================================

CREATE TABLE IF NOT EXISTS intern_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_name TEXT NOT NULL,
  program_type TEXT CHECK(program_type IN ('seta_learnership', 'seta_internship', 'seta_apprenticeship', 'seta_skills_programme', 'yes_program', 'nys_program', 'self_funded_learner', 'self_funded_employee')) NOT NULL,
  
  -- Program details
  description TEXT,
  duration_months INTEGER,
  intake_capacity INTEGER, -- Max number of interns per intake
  current_intake_year INTEGER,
  
  -- SETA details (if applicable)
  seta_name TEXT, -- 'BANKSETA', 'MERSETA', 'SERVICES SETA', etc.
  qualification_title TEXT,
  qualification_nqf_level INTEGER, -- 1-8
  qualification_id TEXT, -- SAQA ID
  
  -- Funding
  funding_source TEXT CHECK(funding_source IN ('seta_grant', 'yes_funding', 'nys_funding', 'self_funded', 'mixed')),
  stipend_amount REAL,
  stipend_currency TEXT DEFAULT 'ZAR',
  
  -- Status
  is_active INTEGER DEFAULT 1,
  start_date DATE,
  end_date DATE,
  
  -- Responsible persons
  program_manager INTEGER, -- user_id
  training_coordinator INTEGER, -- user_id
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_manager) REFERENCES users(id),
  FOREIGN KEY (training_coordinator) REFERENCES users(id)
);

-- =====================================================
-- 2. INTERN REGISTRATION & PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS interns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Link to employee table (if intern is also treated as employee)
  employee_id INTEGER, -- NULL if pure learner status
  
  -- Personal details
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  id_number TEXT UNIQUE NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  race TEXT, -- For EEA reporting
  disability_status TEXT,
  
  -- Contact
  email TEXT,
  phone TEXT,
  physical_address TEXT,
  postal_address TEXT,
  
  -- Emergency contact
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  
  -- Program assignment
  program_id INTEGER NOT NULL,
  intake_cohort TEXT, -- e.g., '2024_Q1', '2024_Jan'
  
  -- Status
  intern_status TEXT CHECK(intern_status IN ('applicant', 'selected', 'registered', 'active', 'completed', 'terminated', 'withdrawn')) DEFAULT 'applicant',
  legal_status TEXT CHECK(legal_status IN ('learner', 'employee', 'participant')) NOT NULL, -- Key determination
  
  -- Dates
  application_date DATE,
  selection_date DATE,
  registration_date DATE,
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  
  -- Qualifications
  highest_qualification TEXT, -- 'Matric', 'Diploma', 'Degree', 'Postgraduate'
  qualification_institution TEXT,
  qualification_year INTEGER,
  qualification_certificate_path TEXT,
  
  -- Banking
  bank_name TEXT,
  account_number TEXT,
  account_type TEXT,
  branch_code TEXT,
  
  -- Tax
  tax_number TEXT,
  
  -- Documents
  id_copy_path TEXT,
  cv_path TEXT,
  proof_of_residence_path TEXT,
  matric_certificate_path TEXT,
  
  -- POPIA
  data_consent INTEGER DEFAULT 0,
  data_consent_date DATE,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES intern_programs(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- =====================================================
-- 3. SETA REGISTRATION & COMPLIANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS seta_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intern_id INTEGER NOT NULL,
  program_id INTEGER NOT NULL,
  
  -- SETA details
  seta_name TEXT NOT NULL,
  learnership_id TEXT, -- SETA-assigned ID
  registration_number TEXT UNIQUE,
  registration_date DATE NOT NULL,
  registration_status TEXT CHECK(registration_status IN ('pending', 'registered', 'rejected', 'expired')) DEFAULT 'pending',
  
  -- Agreement details (Form QCTO 3 or SETA-specific)
  agreement_number TEXT,
  agreement_signed_date DATE,
  agreement_document_path TEXT,
  
  -- Training provider (if external)
  training_provider_name TEXT,
  training_provider_accreditation TEXT,
  training_provider_contact TEXT,
  
  -- Workplace mentor
  mentor_employee_id INTEGER,
  mentor_name TEXT,
  mentor_qualification TEXT,
  
  -- Grant tracking
  commencement_grant_claimed INTEGER DEFAULT 0,
  commencement_grant_amount REAL,
  commencement_grant_date DATE,
  
  progress_grant_claimed INTEGER DEFAULT 0,
  progress_grant_amount REAL,
  progress_grant_date DATE,
  
  completion_grant_claimed INTEGER DEFAULT 0,
  completion_grant_amount REAL,
  completion_grant_date DATE,
  
  total_grant_received REAL DEFAULT 0,
  
  -- Reporting
  last_quarterly_report_date DATE,
  next_quarterly_report_due DATE,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intern_id) REFERENCES interns(id),
  FOREIGN KEY (program_id) REFERENCES intern_programs(id),
  FOREIGN KEY (mentor_employee_id) REFERENCES employees(id)
);

-- =====================================================
-- 4. YES PROGRAM REGISTRATION
-- =====================================================

CREATE TABLE IF NOT EXISTS yes_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intern_id INTEGER NOT NULL,
  
  -- YES details
  yes_participant_id TEXT UNIQUE, -- Assigned by YES
  registration_date DATE NOT NULL,
  registration_status TEXT CHECK(registration_status IN ('pending', 'verified', 'active', 'completed', 'withdrawn')) DEFAULT 'pending',
  
  -- Three-party agreement
  agreement_signed_date DATE,
  agreement_document_path TEXT,
  
  -- B-BBEE tracking
  b_bbee_points_claimed INTEGER DEFAULT 0, -- Up to 5 points
  b_bbee_certificate_path TEXT,
  b_bbee_verification_date DATE,
  
  -- Reporting
  last_monthly_report_date DATE,
  next_monthly_report_due DATE,
  
  -- Stipend tracking (for YES portal proof)
  stipend_proofs_submitted INTEGER DEFAULT 0, -- Count of months submitted
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intern_id) REFERENCES interns(id),
  UNIQUE(intern_id)
);

-- =====================================================
-- 5. NYS PROGRAM REGISTRATION
-- =====================================================

CREATE TABLE IF NOT EXISTS nys_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intern_id INTEGER NOT NULL,
  
  -- NYS details
  nys_participant_id TEXT UNIQUE,
  nys_program_type TEXT CHECK(nys_program_type IN ('cwp', 'epwp', 'nyda_programme')),
  registration_date DATE NOT NULL,
  registration_status TEXT CHECK(registration_status IN ('pending', 'active', 'completed', 'withdrawn')) DEFAULT 'pending',
  
  -- MOU details
  mou_reference TEXT,
  mou_signed_date DATE,
  mou_document_path TEXT,
  
  -- Funding (paid by NYDA/DPW, not employer)
  stipend_paid_by TEXT DEFAULT 'NYDA/DPW',
  employer_contribution TEXT, -- 'supervision', 'workplace', 'ppe', etc.
  
  -- Reporting
  last_monthly_report_date DATE,
  next_monthly_report_due DATE,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intern_id) REFERENCES interns(id),
  UNIQUE(intern_id)
);

-- =====================================================
-- 6. STIPEND & REMUNERATION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS intern_stipend_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intern_id INTEGER NOT NULL,
  
  -- Payment period
  payment_month INTEGER NOT NULL, -- 1-12
  payment_year INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  
  -- Amounts
  basic_stipend REAL NOT NULL,
  transport_allowance REAL DEFAULT 0,
  meal_allowance REAL DEFAULT 0,
  other_allowances REAL DEFAULT 0,
  gross_amount REAL NOT NULL,
  
  -- Deductions
  paye_deducted REAL DEFAULT 0,
  uif_deducted REAL DEFAULT 0,
  other_deductions REAL DEFAULT 0,
  total_deductions REAL DEFAULT 0,
  
  net_amount REAL NOT NULL,
  
  -- Payment method
  payment_method TEXT CHECK(payment_method IN ('eft', 'cash', 'cheque')) DEFAULT 'eft',
  payment_reference TEXT,
  
  -- Proof (for YES/SETA reporting)
  payslip_generated INTEGER DEFAULT 0,
  payslip_path TEXT,
  proof_of_payment_path TEXT, -- Bank statement showing payment
  
  -- Reporting status
  reported_to_seta INTEGER DEFAULT 0,
  reported_to_yes INTEGER DEFAULT 0,
  reported_to_nyda INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intern_id) REFERENCES interns(id),
  UNIQUE(intern_id, payment_month, payment_year)
);

-- =====================================================
-- 7. LEARNING PLANS & TRAINING
-- =====================================================

CREATE TABLE IF NOT EXISTS intern_learning_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intern_id INTEGER NOT NULL,
  
  -- Plan details
  plan_version INTEGER DEFAULT 1,
  created_date DATE NOT NULL,
  approved_date DATE,
  approved_by INTEGER, -- user_id
  
  -- Objectives
  learning_objectives TEXT NOT NULL, -- JSON array or structured text
  expected_outcomes TEXT,
  skills_to_develop TEXT, -- JSON array
  
  -- Training components
  on_job_training_plan TEXT,
  off_job_training_plan TEXT,
  rotation_plan TEXT, -- Departments/functions to rotate through
  
  -- Assessment
  assessment_methods TEXT,
  assessment_milestones TEXT, -- JSON array with dates
  
  -- Status
  status TEXT CHECK(status IN ('draft', 'active', 'completed', 'revised')) DEFAULT 'draft',
  
  -- Document
  plan_document_path TEXT,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intern_id) REFERENCES interns(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- =====================================================
-- 8. MENTORSHIP & SUPERVISION
-- =====================================================

CREATE TABLE IF NOT EXISTS intern_mentorship_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intern_id INTEGER NOT NULL,
  mentor_id INTEGER NOT NULL, -- employee_id
  
  -- Session details
  session_date DATE NOT NULL,
  session_duration_minutes INTEGER,
  session_type TEXT CHECK(session_type IN ('one_on_one', 'group', 'informal', 'formal_review')),
  
  -- Discussion points
  topics_discussed TEXT,
  challenges_raised TEXT,
  support_provided TEXT,
  action_items TEXT, -- JSON array
  
  -- Progress assessment
  progress_rating INTEGER, -- 1-5 scale
  progress_notes TEXT,
  
  -- Next session
  next_session_scheduled DATE,
  
  -- Documents
  session_notes_path TEXT,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intern_id) REFERENCES interns(id),
  FOREIGN KEY (mentor_id) REFERENCES employees(id)
);

-- =====================================================
-- 9. ASSESSMENTS & PERFORMANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS intern_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intern_id INTEGER NOT NULL,
  
  -- Assessment details
  assessment_type TEXT CHECK(assessment_type IN ('formative', 'summative', 'monthly_review', 'quarterly_review', 'final_assessment')),
  assessment_date DATE NOT NULL,
  assessed_by INTEGER, -- user_id
  
  -- Competencies assessed
  competencies_assessed TEXT, -- JSON array: [{skill, rating, evidence}]
  
  -- Ratings
  overall_rating INTEGER, -- 1-5 or percentage
  technical_skills_rating INTEGER,
  soft_skills_rating INTEGER,
  workplace_behavior_rating INTEGER,
  
  -- Feedback
  strengths TEXT,
  areas_for_improvement TEXT,
  recommendations TEXT,
  
  -- Outcome
  outcome TEXT CHECK(outcome IN ('competent', 'not_yet_competent', 'progressing_well', 'needs_intervention', 'completed')),
  
  -- Documents
  assessment_document_path TEXT,
  evidence_portfolio_path TEXT,
  
  -- For SETA
  seta_reported INTEGER DEFAULT 0,
  seta_report_date DATE,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intern_id) REFERENCES interns(id),
  FOREIGN KEY (assessed_by) REFERENCES users(id)
);

-- =====================================================
-- 10. ATTENDANCE & LEAVE
-- =====================================================

CREATE TABLE IF NOT EXISTS intern_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intern_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  
  -- Status
  status TEXT CHECK(status IN ('present', 'absent', 'late', 'on_leave', 'training', 'sick', 'excused')) NOT NULL,
  
  -- Times
  clock_in_time TIME,
  clock_out_time TIME,
  hours_worked REAL,
  
  -- Location
  location_id INTEGER,
  
  -- Notes
  absence_reason TEXT,
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intern_id) REFERENCES interns(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  UNIQUE(intern_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS intern_leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intern_id INTEGER NOT NULL,
  
  -- Leave details
  leave_type TEXT CHECK(leave_type IN ('annual', 'sick', 'study', 'family_responsibility', 'maternity', 'unpaid')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested REAL NOT NULL,
  
  -- Status
  status TEXT CHECK(status IN ('pending', 'approved', 'declined', 'cancelled')) DEFAULT 'pending',
  requested_date DATE NOT NULL,
  approved_by INTEGER, -- user_id
  approved_date DATE,
  decline_reason TEXT,
  
  -- Supporting documents
  medical_certificate_path TEXT, -- For sick leave
  supporting_document_path TEXT,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intern_id) REFERENCES interns(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- =====================================================
-- 11. COMPLETION & GRADUATION
-- =====================================================

CREATE TABLE IF NOT EXISTS intern_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intern_id INTEGER NOT NULL,
  
  -- Completion details
  completion_date DATE NOT NULL,
  completion_status TEXT CHECK(completion_status IN ('completed_successfully', 'withdrawn', 'terminated', 'failed')) NOT NULL,
  
  -- Outcomes
  qualification_achieved INTEGER DEFAULT 0,
  qualification_title TEXT,
  certificate_number TEXT,
  certificate_issue_date DATE,
  certificate_path TEXT,
  
  -- Skills acquired
  skills_acquired TEXT, -- JSON array
  competencies_achieved TEXT,
  
  -- Final assessment
  final_assessment_rating INTEGER, -- Percentage or 1-5
  final_assessment_notes TEXT,
  
  -- Employment outcome
  employment_status TEXT CHECK(employment_status IN ('employed_by_host', 'employed_elsewhere', 'unemployed', 'further_study', 'entrepreneurship')),
  employment_start_date DATE,
  job_title TEXT,
  
  -- References
  reference_provided INTEGER DEFAULT 0,
  reference_path TEXT,
  
  -- Reporting
  seta_completion_reported INTEGER DEFAULT 0,
  seta_completion_date DATE,
  yes_completion_reported INTEGER DEFAULT 0,
  yes_completion_date DATE,
  nys_completion_reported INTEGER DEFAULT 0,
  nys_completion_date DATE,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (intern_id) REFERENCES interns(id),
  UNIQUE(intern_id)
);

-- =====================================================
-- 12. REPORTING & COMPLIANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS intern_compliance_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Report details
  report_type TEXT CHECK(report_type IN ('seta_quarterly', 'yes_monthly', 'nys_monthly', 'internal_monthly', 'internal_quarterly', 'internal_annual')) NOT NULL,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  
  -- Submission
  submission_deadline DATE,
  submission_date DATE,
  submitted_by INTEGER, -- user_id
  submission_status TEXT CHECK(submission_status IN ('not_started', 'in_progress', 'submitted', 'approved', 'rejected', 'overdue')) DEFAULT 'not_started',
  
  -- Report data
  number_of_interns INTEGER,
  interns_list TEXT, -- JSON array of intern_ids
  report_summary TEXT,
  challenges TEXT,
  achievements TEXT,
  
  -- Documents
  report_document_path TEXT,
  supporting_documents_path TEXT, -- JSON array
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submitted_by) REFERENCES users(id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_interns_status ON interns(intern_status, program_id);
CREATE INDEX IF NOT EXISTS idx_interns_program ON interns(program_id, intake_cohort);
CREATE INDEX IF NOT EXISTS idx_seta_reg_status ON seta_registrations(registration_status, registration_date);
CREATE INDEX IF NOT EXISTS idx_yes_reg_status ON yes_registrations(registration_status, registration_date);
CREATE INDEX IF NOT EXISTS idx_stipend_payments_period ON intern_stipend_payments(payment_year, payment_month, intern_id);
CREATE INDEX IF NOT EXISTS idx_assessments_intern ON intern_assessments(intern_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_attendance_intern_date ON intern_attendance(intern_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_completions_status ON intern_completions(completion_status, completion_date);

-- Success message
SELECT 'Migration 0006 completed successfully - Comprehensive Interns Management System created' AS message;
