-- ZuZaWorksOS Seed Data
-- Sample data for development and testing

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

INSERT OR IGNORE INTO organizations (id, name, bbee_level, industry, employee_count, created_at, updated_at)
VALUES 
  (1, 'ZuZaWorks Demo Company', '1', 'Technology & Services', 50, datetime('now'), datetime('now'));

-- ============================================================================
-- LOCATIONS
-- ============================================================================

INSERT OR IGNORE INTO locations (id, organization_id, name, province, city, address, is_active, created_at)
VALUES 
  (1, 1, 'Sandton Head Office', 'Gauteng', 'Johannesburg', 'Sandton City', 1, datetime('now')),
  (2, 1, 'Cape Town Office', 'Western Cape', 'Cape Town', 'V&A Waterfront', 1, datetime('now')),
  (3, 1, 'Durban Branch', 'KwaZulu-Natal', 'Durban', 'Gateway Shopping Centre', 1, datetime('now'));

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================

INSERT OR IGNORE INTO departments (id, organization_id, location_id, name, code, budget_annual, created_at)
VALUES 
  (1, 1, 1, 'Operations', 'OPS', 2000000, datetime('now')),
  (2, 1, 1, 'Human Resources', 'HR', 800000, datetime('now')),
  (3, 1, 1, 'Sales & Marketing', 'SALES', 1500000, datetime('now')),
  (4, 1, 2, 'Customer Support', 'SUPPORT', 600000, datetime('now')),
  (5, 1, 1, 'IT & Technology', 'IT', 1200000, datetime('now'));

-- ============================================================================
-- EMPLOYEES
-- ============================================================================

INSERT OR IGNORE INTO employees (
  id, organization_id, employee_number, first_name, last_name, email, 
  employment_type, employment_status, department_id, location_id, 
  job_title, job_level, hire_date, phone_mobile, gender, nationality, race,
  contracted_hours_per_week, salary_amount, salary_currency, salary_frequency,
  leave_annual_balance, leave_sick_balance, leave_family_balance,
  is_active, created_at, updated_at
) VALUES 
  -- Management
  (1, 1, 'EMP1-001', 'Thabo', 'Molefe', 'thabo.molefe@zuzaworks.demo', 'Full-Time', 'Active', 1, 1, 'Operations Manager', 'Manager', '2022-01-15', '0821234567', 'Male', 'South African', 'African', 45, 65000, 'ZAR', 'Monthly', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (2, 1, 'EMP1-002', 'Nomsa', 'Ndlovu', 'nomsa.ndlovu@zuzaworks.demo', 'Full-Time', 'Active', 2, 1, 'HR Manager', 'Manager', '2022-03-01', '0827654321', 'Female', 'South African', 'African', 45, 60000, 'ZAR', 'Monthly', 20, 30, 3, 1, datetime('now'), datetime('now')),
  (3, 1, 'EMP1-003', 'Sarah', 'van der Merwe', 'sarah.vdm@zuzaworks.demo', 'Full-Time', 'Active', 5, 1, 'IT Manager', 'Manager', '2021-11-10', '0834567890', 'Female', 'South African', 'White', 45, 70000, 'ZAR', 'Monthly', 15, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Staff
  (4, 1, 'EMP1-004', 'Lerato', 'Khumalo', 'lerato.k@zuzaworks.demo', 'Full-Time', 'Active', 3, 1, 'Sales Executive', 'Mid', '2023-02-20', '0823456789', 'Female', 'South African', 'African', 45, 35000, 'ZAR', 'Monthly', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (5, 1, 'EMP1-005', 'Bongani', 'Nkosi', 'bongani.n@zuzaworks.demo', 'Full-Time', 'Active', 4, 2, 'Support Specialist', 'Mid', '2023-04-01', '0815678901', 'Male', 'South African', 'African', 45, 28000, 'ZAR', 'Monthly', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (6, 1, 'EMP1-006', 'Fatima', 'Mohammed', 'fatima.m@zuzaworks.demo', 'Part-Time', 'Active', 4, 3, 'Support Agent', 'Junior', '2024-01-10', '0826789012', 'Female', 'South African', 'Indian', 25, 18000, 'ZAR', 'Monthly', 8, 15, 2, 1, datetime('now'), datetime('now')),
  (7, 1, 'EMP1-007', 'Sipho', 'Dlamini', 'sipho.d@zuzaworks.demo', 'Intern', 'Active', 5, 1, 'IT Intern', 'Entry', '2024-09-01', '0817890123', 'Male', 'South African', 'African', 40, 8000, 'ZAR', 'Monthly', 5, 10, 1, 1, datetime('now'), datetime('now')),
  (8, 1, 'EMP1-008', 'Zanele', 'Mthembu', 'zanele.m@zuzaworks.demo', 'Full-Time', 'Active', 1, 1, 'Operations Coordinator', 'Mid', '2023-06-15', '0828901234', 'Female', 'South African', 'African', 45, 32000, 'ZAR', 'Monthly', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (9, 1, 'EMP1-009', 'David', 'Pillay', 'david.p@zuzaworks.demo', 'Contract', 'Active', 3, 2, 'Marketing Specialist', 'Mid', '2024-03-01', '0839012345', 'Male', 'South African', 'Indian', 40, 30000, 'ZAR', 'Monthly', 10, 20, 2, 1, datetime('now'), datetime('now')),
  (10, 1, 'EMP1-010', 'Thandiwe', 'Zulu', 'thandiwe.z@zuzaworks.demo', 'Seasonal', 'Active', 3, 3, 'Sales Associate', 'Junior', '2024-11-01', '0810123456', 'Female', 'South African', 'African', 35, 15000, 'ZAR', 'Monthly', 7, 15, 2, 1, datetime('now'), datetime('now'));

-- Update managers
UPDATE departments SET manager_id = 1 WHERE id = 1;
UPDATE departments SET manager_id = 2 WHERE id = 2;
UPDATE departments SET manager_id = 3 WHERE id = 5;

UPDATE employees SET manager_id = 1 WHERE id IN (4, 8);
UPDATE employees SET manager_id = 2 WHERE id = 7;
UPDATE employees SET manager_id = 3 WHERE id = 5;

-- ============================================================================
-- SKILLS
-- ============================================================================

INSERT OR IGNORE INTO skills (id, organization_id, name, category, description, requires_certification, created_at)
VALUES 
  (1, 1, 'Customer Service', 'Soft', 'Professional customer interaction and support', 0, datetime('now')),
  (2, 1, 'Sales Techniques', 'Technical', 'Proven sales methodologies and closing techniques', 0, datetime('now')),
  (3, 1, 'BCEA Compliance', 'Compliance', 'South African labour law compliance knowledge', 1, datetime('now')),
  (4, 1, 'First Aid', 'Safety', 'Workplace first aid and emergency response', 1, datetime('now')),
  (5, 1, 'Microsoft Office', 'Technical', 'Proficiency in Word, Excel, PowerPoint', 0, datetime('now')),
  (6, 1, 'Leadership', 'Leadership', 'Team leadership and people management', 0, datetime('now')),
  (7, 1, 'Project Management', 'Leadership', 'Planning and executing projects', 1, datetime('now')),
  (8, 1, 'Python Programming', 'Technical', 'Python software development', 0, datetime('now')),
  (9, 1, 'Data Analysis', 'Technical', 'Data analysis and visualization', 0, datetime('now')),
  (10, 1, 'Communication', 'Soft', 'Effective written and verbal communication', 0, datetime('now'));

-- ============================================================================
-- EMPLOYEE SKILLS
-- ============================================================================

INSERT OR IGNORE INTO employee_skills (employee_id, skill_id, proficiency_level, proficiency_score, acquired_date)
VALUES 
  -- Thabo (Manager)
  (1, 3, 'Expert', 95, '2022-01-15'),
  (1, 6, 'Advanced', 88, '2022-06-01'),
  (1, 7, 'Advanced', 85, '2022-09-15'),
  (1, 10, 'Expert', 92, '2022-01-15'),
  
  -- Nomsa (HR Manager)
  (2, 3, 'Expert', 98, '2022-03-01'),
  (2, 6, 'Advanced', 90, '2022-08-01'),
  (2, 10, 'Advanced', 87, '2022-03-01'),
  
  -- Sarah (IT Manager)
  (3, 8, 'Expert', 95, '2021-11-10'),
  (3, 9, 'Advanced', 88, '2022-02-20'),
  (3, 7, 'Advanced', 85, '2022-05-10'),
  
  -- Lerato (Sales)
  (4, 1, 'Advanced', 82, '2023-02-20'),
  (4, 2, 'Advanced', 85, '2023-06-15'),
  (4, 10, 'Intermediate', 75, '2023-02-20'),
  
  -- Bongani (Support)
  (5, 1, 'Expert', 90, '2023-04-01'),
  (5, 5, 'Advanced', 88, '2023-04-01'),
  (5, 10, 'Advanced', 85, '2023-07-01'),
  
  -- Sipho (Intern)
  (7, 8, 'Beginner', 45, '2024-09-01'),
  (7, 5, 'Intermediate', 65, '2024-09-01');

-- ============================================================================
-- LEAVE TYPES
-- ============================================================================

INSERT OR IGNORE INTO leave_types (id, organization_id, name, code, category, is_paid, max_days_per_year, accrual_rate, created_at)
VALUES 
  (1, 1, 'Annual Leave', 'ANNUAL', 'Annual', 1, 15, 1.25, datetime('now')),
  (2, 1, 'Sick Leave', 'SICK', 'Sick', 1, 30, 2.5, datetime('now')),
  (3, 1, 'Family Responsibility Leave', 'FAMILY', 'Family Responsibility', 1, 3, 0.25, datetime('now')),
  (4, 1, 'Maternity Leave', 'MATERNITY', 'Maternity', 1, 120, 0, datetime('now')),
  (5, 1, 'Unpaid Leave', 'UNPAID', 'Unpaid', 0, NULL, 0, datetime('now'));

-- ============================================================================
-- SHIFT TEMPLATES
-- ============================================================================

INSERT OR IGNORE INTO shift_templates (id, organization_id, name, location_id, department_id, start_time, end_time, duration_hours, break_duration_minutes, pay_multiplier, created_at)
VALUES 
  (1, 1, 'Morning Shift', 1, 1, '08:00', '16:00', 8, 60, 1.0, datetime('now')),
  (2, 1, 'Afternoon Shift', 1, 1, '14:00', '22:00', 8, 60, 1.0, datetime('now')),
  (3, 1, 'Night Shift', 1, 1, '22:00', '06:00', 8, 60, 1.5, datetime('now')),
  (4, 1, 'Weekend Shift', 1, 1, '08:00', '17:00', 9, 60, 1.5, datetime('now'));

-- ============================================================================
-- SHIFTS (Sample for today)
-- ============================================================================

INSERT OR IGNORE INTO shifts (
  organization_id, shift_template_id, employee_id, location_id, department_id,
  shift_date, start_time, end_time, duration_hours, shift_type, status, created_at
)
VALUES 
  (1, 1, 1, 1, 1, DATE('now'), DATETIME('now', 'start of day', '+8 hours'), DATETIME('now', 'start of day', '+16 hours'), 8, 'Regular', 'Scheduled', datetime('now')),
  (1, 1, 4, 1, 3, DATE('now'), DATETIME('now', 'start of day', '+8 hours'), DATETIME('now', 'start of day', '+16 hours'), 8, 'Regular', 'Scheduled', datetime('now')),
  (1, 1, 8, 1, 1, DATE('now'), DATETIME('now', 'start of day', '+8 hours'), DATETIME('now', 'start of day', '+16 hours'), 8, 'Regular', 'Scheduled', datetime('now')),
  (1, 2, 5, 2, 4, DATE('now'), DATETIME('now', 'start of day', '+14 hours'), DATETIME('now', 'start of day', '+22 hours'), 8, 'Regular', 'Scheduled', datetime('now')),
  (1, 1, NULL, 1, 1, DATE('now'), DATETIME('now', 'start of day', '+8 hours'), DATETIME('now', 'start of day', '+16 hours'), 8, 'Regular', 'Scheduled', datetime('now'));

-- ============================================================================
-- KPIs
-- ============================================================================

INSERT OR IGNORE INTO kpis (id, organization_id, name, description, category, target_value, frequency, applicable_to, created_at)
VALUES 
  (1, 1, 'Customer Satisfaction', 'Average customer satisfaction rating', 'Customer Satisfaction', 4.5, 'Monthly', 'Individual', datetime('now')),
  (2, 1, 'Sales Target Achievement', 'Percentage of monthly sales target achieved', 'Financial', 100, 'Monthly', 'Individual', datetime('now')),
  (3, 1, 'Attendance Rate', 'Percentage of scheduled shifts attended', 'Attendance', 95, 'Monthly', 'Individual', datetime('now')),
  (4, 1, 'Training Hours', 'Hours of training completed', 'Other', 20, 'Annual', 'Individual', datetime('now')),
  (5, 1, 'Team Productivity', 'Team productivity score', 'Productivity', 85, 'Monthly', 'Team', datetime('now'));

-- ============================================================================
-- SOCIAL POSTS (Sample)
-- ============================================================================

INSERT OR IGNORE INTO social_posts (organization_id, author_id, post_type, content, visibility, likes_count, comments_count, created_at)
VALUES 
  (1, 1, 'Announcement', 'Welcome to ZuZaWorksOS! Excited to have this powerful system to manage our workforce efficiently. Looking forward to seeing everyone using the platform.', 'Public', 12, 3, datetime('now', '-2 days')),
  (1, 4, 'Achievement', 'Just closed the biggest deal of the quarter! 🎉 Thanks to the amazing sales team for the support. This is what teamwork looks like!', 'Public', 25, 5, datetime('now', '-1 day')),
  (1, 2, 'Knowledge Share', 'Reminder: BCEA compliance training session tomorrow at 10 AM. All managers must attend. We will cover recent updates to labour regulations.', 'Department', 8, 2, datetime('now', '-5 hours')),
  (1, 7, 'Question', 'Can someone help me understand the new leave request process? I want to make sure I am doing it correctly.', 'Public', 4, 6, datetime('now', '-3 hours'));

-- ============================================================================
-- DIGITAL TWINS (Sample)
-- ============================================================================

INSERT OR IGNORE INTO digital_twins (employee_id, twin_name, interactions_count, suggestions_accepted, suggestions_rejected, created_at)
VALUES 
  (1, 'Thabo\'s Work Assistant', 45, 32, 8, datetime('now', '-30 days')),
  (4, 'Lerato\'s Career Coach', 28, 18, 5, datetime('now', '-20 days')),
  (5, 'Bongani\'s Performance Buddy', 15, 10, 2, datetime('now', '-15 days'));

-- ============================================================================
-- NOTIFICATIONS (Sample)
-- ============================================================================

INSERT OR IGNORE INTO notifications (organization_id, recipient_id, type, category, title, message, is_read, created_at)
VALUES 
  (1, 1, 'Info', 'Shift', 'Shift Schedule Updated', 'Your shift schedule for next week has been updated. Please review.', 0, datetime('now', '-2 hours')),
  (1, 4, 'Success', 'Performance', 'Sales Target Achieved', 'Congratulations! You have exceeded your monthly sales target by 15%.', 0, datetime('now', '-1 hour')),
  (1, 2, 'Warning', 'Compliance', 'Certification Expiring Soon', '3 employees have certifications expiring within 30 days. Action required.', 0, datetime('now', '-30 minutes')),
  (1, 5, 'Info', 'Training', 'New Training Available', 'Customer Service Excellence course now available. Enroll today!', 0, datetime('now', '-15 minutes'));

-- ============================================================================
-- COMPLIANCE CHECKS (Sample)
-- ============================================================================

INSERT OR IGNORE INTO compliance_checks (organization_id, check_type, check_name, description, frequency, status, score, last_check_date, next_check_date, created_at)
VALUES 
  (1, 'BCEA', 'Working Hours Compliance', 'Check all employees are within BCEA working hour limits', 'Weekly', 'Compliant', 94, DATE('now', '-2 days'), DATE('now', '+5 days'), datetime('now')),
  (1, 'Skills Development', 'Training Budget Utilization', 'Verify 1% payroll spent on training', 'Monthly', 'Compliant', 88, DATE('now', '-5 days'), DATE('now', '+25 days'), datetime('now')),
  (1, 'Employment Equity', 'EE Plan Progress', 'Track progress against Employment Equity plan targets', 'Quarterly', 'Minor Issues', 76, DATE('now', '-10 days'), DATE('now', '+80 days'), datetime('now')),
  (1, 'BBEE', 'B-BBEE Scorecard', 'Overall B-BBEE level assessment', 'Annual', 'Compliant', 92, DATE('now', '-30 days'), DATE('now', '+335 days'), datetime('now'));
