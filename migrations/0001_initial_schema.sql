-- ZuZaWorksOS Initial Database Schema
-- Comprehensive workforce operating system for South African businesses

-- ============================================================================
-- CORE PEOPLE & TALENT MANAGEMENT
-- ============================================================================

-- Organizations (multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bbee_level TEXT CHECK(bbee_level IN ('1', '2', '3', '4', '5', '6', '7', '8', 'Non-Compliant')),
  tax_number TEXT,
  company_registration TEXT,
  industry TEXT,
  employee_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Locations (multi-site management)
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  province TEXT CHECK(province IN ('Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape')),
  city TEXT,
  address TEXT,
  postal_code TEXT,
  latitude REAL,
  longitude REAL,
  timezone TEXT DEFAULT 'Africa/Johannesburg',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  location_id INTEGER,
  name TEXT NOT NULL,
  code TEXT,
  manager_id INTEGER,
  budget_annual REAL,
  headcount_target INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- Employees (comprehensive profile)
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  employee_number TEXT UNIQUE NOT NULL,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  id_number TEXT UNIQUE,
  passport_number TEXT,
  date_of_birth DATE,
  gender TEXT CHECK(gender IN ('Male', 'Female', 'Non-Binary', 'Prefer not to say')),
  nationality TEXT DEFAULT 'South African',
  race TEXT CHECK(race IN ('African', 'Coloured', 'Indian', 'White', 'Other')), -- For EE Act compliance
  disability_status BOOLEAN DEFAULT 0,
  
  -- Contact Information
  email TEXT UNIQUE NOT NULL,
  phone_mobile TEXT,
  phone_home TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Employment Details
  employment_type TEXT CHECK(employment_type IN ('Full-Time', 'Part-Time', 'Contract', 'Intern', 'Seasonal', 'Temporary')) NOT NULL,
  employment_status TEXT CHECK(employment_status IN ('Active', 'On Leave', 'Suspended', 'Terminated', 'Resigned')) DEFAULT 'Active',
  department_id INTEGER,
  location_id INTEGER,
  job_title TEXT NOT NULL,
  job_level TEXT CHECK(job_level IN ('Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive')),
  manager_id INTEGER,
  
  -- Dates
  hire_date DATE NOT NULL,
  probation_end_date DATE,
  contract_start_date DATE,
  contract_end_date DATE,
  termination_date DATE,
  
  -- Compensation
  salary_amount REAL,
  salary_currency TEXT DEFAULT 'ZAR',
  salary_frequency TEXT CHECK(salary_frequency IN ('Hourly', 'Daily', 'Weekly', 'Monthly', 'Annual')) DEFAULT 'Monthly',
  
  -- Working Hours
  contracted_hours_per_week REAL DEFAULT 40,
  shift_pattern TEXT, -- e.g., "5/2" for 5 days on, 2 days off
  
  -- Leave Balances (in days)
  leave_annual_balance REAL DEFAULT 15,
  leave_annual_accrued REAL DEFAULT 0,
  leave_sick_balance REAL DEFAULT 30,
  leave_family_balance REAL DEFAULT 3,
  
  -- System Fields
  user_id INTEGER, -- Link to authentication system
  profile_photo_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============================================================================
-- SKILLS & KNOWLEDGE MANAGEMENT
-- ============================================================================

-- Skills Master List
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK(category IN ('Technical', 'Soft', 'Compliance', 'Leadership', 'Industry-Specific', 'Safety')),
  description TEXT,
  seta_code TEXT, -- Skills Education and Training Authority code
  requires_certification BOOLEAN DEFAULT 0,
  certification_validity_months INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Employee Skills (with proficiency tracking)
CREATE TABLE IF NOT EXISTS employee_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  proficiency_level TEXT CHECK(proficiency_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')) DEFAULT 'Beginner',
  proficiency_score INTEGER CHECK(proficiency_score >= 0 AND proficiency_score <= 100),
  acquired_date DATE,
  last_assessed_date DATE,
  certification_number TEXT,
  certification_expiry_date DATE,
  verified_by INTEGER, -- Manager or trainer who verified
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(employee_id, skill_id)
);

-- Training Courses
CREATE TABLE IF NOT EXISTS training_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  duration_hours REAL,
  cost_per_person REAL,
  max_participants INTEGER,
  seta_accredited BOOLEAN DEFAULT 0,
  seta_code TEXT,
  skills_developed TEXT, -- JSON array of skill IDs
  certificate_issued BOOLEAN DEFAULT 0,
  certificate_validity_months INTEGER,
  is_mandatory BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Training Enrollments
CREATE TABLE IF NOT EXISTS training_enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  enrollment_date DATE NOT NULL,
  scheduled_start_date DATE,
  scheduled_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  status TEXT CHECK(status IN ('Enrolled', 'In Progress', 'Completed', 'Failed', 'Cancelled')) DEFAULT 'Enrolled',
  completion_percentage REAL DEFAULT 0,
  score REAL,
  certificate_url TEXT,
  cost_actual REAL,
  funded_by TEXT, -- 'Company', 'SETA', 'Employee', 'External'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE
);

-- ============================================================================
-- SCHEDULING & SHIFT MANAGEMENT
-- ============================================================================

-- Shift Templates
CREATE TABLE IF NOT EXISTS shift_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  location_id INTEGER,
  department_id INTEGER,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours REAL NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  required_headcount INTEGER DEFAULT 1,
  required_skills TEXT, -- JSON array of skill IDs
  pay_multiplier REAL DEFAULT 1.0, -- 1.5 for overtime, 2.0 for Sundays/public holidays
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Scheduled Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  shift_template_id INTEGER,
  employee_id INTEGER,
  location_id INTEGER NOT NULL,
  department_id INTEGER,
  
  -- Shift Details
  shift_date DATE NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_hours REAL NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  
  -- Shift Type
  shift_type TEXT CHECK(shift_type IN ('Regular', 'Overtime', 'Public Holiday', 'Sunday', 'Night Shift')) DEFAULT 'Regular',
  pay_multiplier REAL DEFAULT 1.0,
  
  -- Status
  status TEXT CHECK(status IN ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show', 'Swap Requested')) DEFAULT 'Scheduled',
  
  -- Required Skills
  required_skills TEXT, -- JSON array
  
  -- Assignment
  assigned_by INTEGER,
  assigned_at DATETIME,
  
  -- Swap Management
  swap_requested_by INTEGER,
  swap_requested_at DATETIME,
  swap_approved_by INTEGER,
  swap_approved_at DATETIME,
  
  -- Notes
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_template_id) REFERENCES shift_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ============================================================================
-- TIME & ATTENDANCE
-- ============================================================================

-- Time Entries (Clock In/Out)
CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  shift_id INTEGER,
  location_id INTEGER,
  
  -- Clock In
  clock_in_time DATETIME NOT NULL,
  clock_in_latitude REAL,
  clock_in_longitude REAL,
  clock_in_method TEXT CHECK(clock_in_method IN ('Mobile', 'Kiosk', 'Biometric', 'Manual')) DEFAULT 'Mobile',
  clock_in_photo_url TEXT,
  clock_in_verified BOOLEAN DEFAULT 0,
  
  -- Clock Out
  clock_out_time DATETIME,
  clock_out_latitude REAL,
  clock_out_longitude REAL,
  clock_out_method TEXT CHECK(clock_out_method IN ('Mobile', 'Kiosk', 'Biometric', 'Manual')),
  clock_out_photo_url TEXT,
  clock_out_verified BOOLEAN DEFAULT 0,
  
  -- Duration Tracking
  break_duration_minutes INTEGER DEFAULT 0,
  total_hours REAL,
  regular_hours REAL,
  overtime_hours REAL,
  
  -- Validation
  is_approved BOOLEAN DEFAULT 0,
  approved_by INTEGER,
  approved_at DATETIME,
  
  -- Flags
  is_late BOOLEAN DEFAULT 0,
  is_early_departure BOOLEAN DEFAULT 0,
  has_location_mismatch BOOLEAN DEFAULT 0,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- ============================================================================
-- LEAVE MANAGEMENT
-- ============================================================================

-- Leave Types (BCEA Compliant)
CREATE TABLE IF NOT EXISTS leave_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT CHECK(category IN ('Annual', 'Sick', 'Family Responsibility', 'Maternity', 'Paternity', 'Study', 'Unpaid', 'Compassionate', 'Other')) NOT NULL,
  is_paid BOOLEAN DEFAULT 1,
  requires_approval BOOLEAN DEFAULT 1,
  requires_documentation BOOLEAN DEFAULT 0,
  max_days_per_year REAL,
  accrual_rate REAL, -- Days per month
  carry_over_allowed BOOLEAN DEFAULT 0,
  max_carry_over_days REAL,
  min_notice_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  leave_type_id INTEGER NOT NULL,
  
  -- Request Details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days REAL NOT NULL,
  reason TEXT,
  
  -- Documentation
  supporting_document_url TEXT,
  document_type TEXT, -- 'Medical Certificate', 'Death Certificate', etc.
  
  -- Approval Workflow
  status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Withdrawn')) DEFAULT 'Pending',
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  review_notes TEXT,
  
  -- Balance Impact
  balance_before REAL,
  balance_after REAL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============================================================================
-- PERFORMANCE & KPI MANAGEMENT
-- ============================================================================

-- KPI Definitions
CREATE TABLE IF NOT EXISTS kpis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK(category IN ('Productivity', 'Quality', 'Attendance', 'Safety', 'Customer Satisfaction', 'Financial', 'Compliance', 'Other')),
  measurement_unit TEXT, -- 'Percentage', 'Hours', 'Count', 'Currency', etc.
  target_value REAL,
  weight REAL DEFAULT 1.0, -- For weighted scoring
  calculation_method TEXT, -- 'Manual', 'Automated', 'Formula'
  calculation_formula TEXT,
  frequency TEXT CHECK(frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual')) DEFAULT 'Monthly',
  applicable_to TEXT CHECK(applicable_to IN ('Individual', 'Team', 'Department', 'Organization')) DEFAULT 'Individual',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- KPI Results
CREATE TABLE IF NOT EXISTS kpi_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kpi_id INTEGER NOT NULL,
  employee_id INTEGER,
  department_id INTEGER,
  
  -- Measurement Period
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Values
  actual_value REAL NOT NULL,
  target_value REAL NOT NULL,
  percentage_achieved REAL,
  score REAL,
  
  -- Status
  status TEXT CHECK(status IN ('Below Target', 'On Target', 'Above Target', 'Outstanding')) DEFAULT 'On Target',
  
  -- Notes
  notes TEXT,
  recorded_by INTEGER,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  reviewer_id INTEGER NOT NULL,
  review_type TEXT CHECK(review_type IN ('Probation', 'Annual', 'Mid-Year', '360-Degree', 'Project-Based', 'PIP')) NOT NULL,
  
  -- Review Period
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  review_date DATE NOT NULL,
  
  -- Ratings
  overall_rating REAL CHECK(overall_rating >= 1 AND overall_rating <= 5),
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_set TEXT,
  
  -- Competency Ratings
  technical_skills_rating REAL,
  soft_skills_rating REAL,
  leadership_rating REAL,
  teamwork_rating REAL,
  
  -- Status
  status TEXT CHECK(status IN ('Draft', 'Pending Employee Signature', 'Completed', 'Disputed')) DEFAULT 'Draft',
  
  -- Signatures
  employee_acknowledged BOOLEAN DEFAULT 0,
  employee_signature_date DATE,
  reviewer_signature_date DATE,
  
  -- Next Steps
  recommended_action TEXT, -- 'Promotion', 'Salary Increase', 'Training', 'PIP', 'No Action'
  recommended_salary_increase_percentage REAL,
  
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================================================
-- INCIDENT & SAFETY MANAGEMENT
-- ============================================================================

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  incident_number TEXT UNIQUE NOT NULL,
  
  -- Incident Details
  incident_type TEXT CHECK(incident_type IN ('Safety', 'Security', 'Compliance', 'Customer Complaint', 'Quality Issue', 'Equipment Failure', 'Near Miss', 'Other')) NOT NULL,
  severity TEXT CHECK(severity IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
  incident_date DATETIME NOT NULL,
  location_id INTEGER,
  department_id INTEGER,
  
  -- Description
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  immediate_action_taken TEXT,
  
  -- People Involved
  reported_by INTEGER NOT NULL,
  employees_involved TEXT, -- JSON array of employee IDs
  witnesses TEXT, -- JSON array of employee IDs
  
  -- Investigation
  investigation_required BOOLEAN DEFAULT 0,
  investigated_by INTEGER,
  investigation_date DATE,
  root_cause_analysis TEXT,
  contributing_factors TEXT,
  
  -- Corrective Actions
  corrective_actions TEXT,
  preventive_actions TEXT,
  action_owner INTEGER,
  action_due_date DATE,
  action_completed_date DATE,
  
  -- Status
  status TEXT CHECK(status IN ('Reported', 'Under Investigation', 'Actions in Progress', 'Closed', 'Reopened')) DEFAULT 'Reported',
  
  -- Cost Impact
  estimated_cost REAL,
  actual_cost REAL,
  
  -- External Reporting
  requires_external_reporting BOOLEAN DEFAULT 0, -- COIDA, DoL, etc.
  external_report_submitted BOOLEAN DEFAULT 0,
  external_report_date DATE,
  external_reference_number TEXT,
  
  -- Attachments
  attachments TEXT, -- JSON array of file URLs
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (investigated_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============================================================================
-- COMPLIANCE MANAGEMENT
-- ============================================================================

-- Compliance Checks
CREATE TABLE IF NOT EXISTS compliance_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  
  -- Check Details
  check_type TEXT CHECK(check_type IN ('BCEA', 'Skills Development', 'Employment Equity', 'BBEE', 'COIDA', 'UIF', 'POPIA', 'Other')) NOT NULL,
  check_name TEXT NOT NULL,
  description TEXT,
  
  -- Frequency
  frequency TEXT CHECK(frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual')) NOT NULL,
  last_check_date DATE,
  next_check_date DATE,
  
  -- Results
  status TEXT CHECK(status IN ('Compliant', 'Minor Issues', 'Major Issues', 'Critical', 'Not Checked')) DEFAULT 'Not Checked',
  score REAL,
  
  -- Issues Found
  issues_found TEXT,
  remediation_required TEXT,
  remediation_due_date DATE,
  remediation_completed_date DATE,
  
  -- Responsible Party
  responsible_party INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (responsible_party) REFERENCES employees(id) ON DELETE SET NULL
);

-- BCEA Violations
CREATE TABLE IF NOT EXISTS bcea_violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  
  -- Violation Details
  violation_type TEXT CHECK(violation_type IN ('Maximum Hours', 'Rest Period', 'Overtime', 'Public Holiday', 'Sunday Work', 'Meal Interval', 'Night Work', 'Other')) NOT NULL,
  violation_date DATE NOT NULL,
  description TEXT NOT NULL,
  
  -- Severity
  severity TEXT CHECK(severity IN ('Warning', 'Minor', 'Major', 'Critical')) DEFAULT 'Warning',
  
  -- Resolution
  status TEXT CHECK(status IN ('Detected', 'Under Review', 'Resolved', 'Exception Granted')) DEFAULT 'Detected',
  resolution_notes TEXT,
  resolved_by INTEGER,
  resolved_at DATETIME,
  
  -- Prevention
  is_recurring BOOLEAN DEFAULT 0,
  preventive_action TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============================================================================
-- SOCIAL COLLABORATION PLATFORM
-- ============================================================================

-- Social Feed Posts
CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  
  -- Post Content
  post_type TEXT CHECK(post_type IN ('Status', 'Achievement', 'Question', 'Announcement', 'Knowledge Share', 'Complaint', 'Suggestion')) NOT NULL,
  content TEXT NOT NULL,
  
  -- Media
  media_urls TEXT, -- JSON array of image/video URLs
  
  -- Targeting
  visibility TEXT CHECK(visibility IN ('Public', 'Department', 'Location', 'Team', 'Private')) DEFAULT 'Public',
  target_department_id INTEGER,
  target_location_id INTEGER,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT 0,
  is_flagged BOOLEAN DEFAULT 0,
  flagged_reason TEXT,
  is_approved BOOLEAN DEFAULT 1,
  moderated_by INTEGER,
  moderated_at DATETIME,
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (target_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (target_location_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- Social Comments
CREATE TABLE IF NOT EXISTS social_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  parent_comment_id INTEGER, -- For nested replies
  
  content TEXT NOT NULL,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT 0,
  is_approved BOOLEAN DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES social_comments(id) ON DELETE CASCADE
);

-- Social Reactions
CREATE TABLE IF NOT EXISTS social_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  target_type TEXT CHECK(target_type IN ('post', 'comment')) NOT NULL,
  target_id INTEGER NOT NULL,
  reaction_type TEXT CHECK(reaction_type IN ('like', 'love', 'celebrate', 'support', 'insightful')) DEFAULT 'like',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE(employee_id, target_type, target_id)
);

-- ============================================================================
-- AI DIGITAL TWIN SYSTEM
-- ============================================================================

-- Digital Twins (AI-powered employee assistants)
CREATE TABLE IF NOT EXISTS digital_twins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER UNIQUE NOT NULL,
  
  -- Twin Configuration
  twin_name TEXT,
  personality_profile TEXT, -- JSON: communication style, preferences
  
  -- Learning Data
  work_patterns TEXT, -- JSON: preferred hours, productivity peaks
  skill_preferences TEXT, -- JSON: preferred tasks, learning interests
  career_aspirations TEXT,
  
  -- AI Model State
  model_version TEXT,
  training_data_summary TEXT,
  last_training_date DATETIME,
  
  -- Usage Stats
  interactions_count INTEGER DEFAULT 0,
  suggestions_accepted INTEGER DEFAULT 0,
  suggestions_rejected INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- AI Chat Messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  digital_twin_id INTEGER,
  
  -- Message Content
  role TEXT CHECK(role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  
  -- Context
  conversation_id TEXT, -- Group messages in conversations
  context_type TEXT, -- 'General', 'Performance', 'Learning', 'Compliance', 'Task'
  
  -- Feedback
  was_helpful BOOLEAN,
  feedback_notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (digital_twin_id) REFERENCES digital_twins(id) ON DELETE SET NULL
);

-- AI Suggestions
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  digital_twin_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  
  -- Suggestion Details
  suggestion_type TEXT CHECK(suggestion_type IN ('Schedule', 'Training', 'Task', 'Communication', 'Performance', 'Career')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Reasoning
  reasoning TEXT,
  confidence_score REAL CHECK(confidence_score >= 0 AND confidence_score <= 1),
  
  -- Priority
  priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
  
  -- Action
  status TEXT CHECK(status IN ('Pending', 'Accepted', 'Rejected', 'Implemented', 'Expired')) DEFAULT 'Pending',
  action_taken_at DATETIME,
  
  -- Expiry
  expires_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (digital_twin_id) REFERENCES digital_twins(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================================================
-- NOTIFICATIONS & ALERTS
-- ============================================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  
  -- Notification Details
  type TEXT CHECK(type IN ('Info', 'Success', 'Warning', 'Error', 'Alert')) DEFAULT 'Info',
  category TEXT CHECK(category IN ('Shift', 'Leave', 'Performance', 'Compliance', 'Training', 'Social', 'System', 'Other')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Action
  action_url TEXT,
  action_label TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  
  -- Delivery
  sent_via TEXT, -- 'In-App', 'Email', 'SMS', 'WhatsApp', 'Push'
  sent_at DATETIME,
  delivered BOOLEAN DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================================================
-- SYSTEM AUDIT & ACTIVITY LOG
-- ============================================================================

-- Activity Logs (for audit trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  employee_id INTEGER,
  
  -- Activity Details
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT'
  entity_type TEXT NOT NULL, -- 'Employee', 'Shift', 'Leave', etc.
  entity_id INTEGER,
  
  -- Changes
  changes_made TEXT, -- JSON: before/after values
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_organization ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(location_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(employment_type);

-- Skills
CREATE INDEX IF NOT EXISTS idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_skill ON employee_skills(skill_id);

-- Shifts
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_location ON shifts(location_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);

-- Time Entries
CREATE INDEX IF NOT EXISTS idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_shift ON time_entries(shift_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in ON time_entries(clock_in_time);

-- Leave Requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Social
CREATE INDEX IF NOT EXISTS idx_social_posts_author ON social_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_org ON social_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments(post_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_employee ON activity_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
