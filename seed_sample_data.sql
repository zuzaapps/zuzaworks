-- Seed Sample Data for All Modules

-- More employees
INSERT OR IGNORE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, job_title, hire_date, department_id, location_id, phone_mobile, id_number, salary_amount) VALUES
  (2, 1, 'EMP002', 'Sipho', 'Nkosi', 'sipho.nkosi@zuzaworks.co.za', 'Full-time', 'Active', 'Operations Manager', '2024-02-01', 1, 2, '+27823456789', '8702025800088', 45000.00),
  (3, 1, 'EMP003', 'Thandiwe', 'Dlamini', 'thandiwe.dlamini@zuzaworks.co.za', 'Full-time', 'Active', 'HR Officer', '2024-03-15', 3, 1, '+27824567890', '9103015800089', 35000.00),
  (4, 1, 'EMP004', 'Mandla', 'Khumalo', 'mandla.khumalo@zuzaworks.co.za', 'Part-time', 'Active', 'Warehouse Assistant', '2024-04-01', 5, 3, '+27825678901', '9204025800090', 18000.00),
  (5, 1, 'EMP005', 'Nomsa', 'Mbatha', 'nomsa.mbatha@zuzaworks.co.za', 'Full-time', 'Active', 'Training Coordinator', '2024-05-01', 4, 1, '+27826789012', '8805035800091', 38000.00);

-- Shifts
INSERT INTO shifts (employee_id, shift_date, start_time, end_time, location_id, status, notes) VALUES
  (2, date('now'), '06:00', '14:00', 2, 'completed', 'Morning shift'),
  (2, date('now', '+1 day'), '06:00', '14:00', 2, 'scheduled', NULL),
  (3, date('now'), '08:00', '17:00', 1, 'completed', 'Regular office hours'),
  (3, date('now', '+1 day'), '08:00', '17:00', 1, 'scheduled', NULL),
  (4, date('now'), '14:00', '22:00', 3, 'completed', 'Afternoon shift'),
  (4, date('now', '+1 day'), '14:00', '22:00', 3, 'scheduled', NULL),
  (5, date('now'), '08:00', '17:00', 1, 'completed', 'Training sessions'),
  (5, date('now', '+1 day'), '08:00', '17:00', 1, 'scheduled', NULL);

-- Shift Swaps
INSERT INTO shift_swaps (requesting_employee_id, target_employee_id, shift_id, status, reason, requested_at) VALUES
  (2, 4, 5, 'pending', 'Family emergency - need to swap afternoon shift', datetime('now', '-2 hours')),
  (3, 5, 6, 'approved', 'Doctor appointment', datetime('now', '-1 day')),
  (4, 2, 2, 'rejected', 'Prefer morning shifts', datetime('now', '-3 days'));

-- Time Entries
INSERT INTO time_entries (employee_id, clock_in, clock_out, break_minutes, location_id, notes) VALUES
  (2, datetime('now', '-8 hours'), datetime('now', '-30 minutes'), 30, 2, 'Warehouse operations'),
  (3, datetime('now', '-7 hours'), NULL, 0, 1, 'Currently working'),
  (4, datetime('now', '-6 hours'), datetime('now', '-1 hour'), 30, 3, 'Distribution'),
  (5, datetime('now', '-8 hours'), datetime('now'), 45, 1, 'Training workshop');

-- Attendance Violations
INSERT INTO attendance_violations (employee_id, rule_id, violation_date, severity, resolved, notes) VALUES
  (2, 1, date('now', '-5 days'), 'minor', 1, 'Arrived 20 minutes late - traffic'),
  (4, 1, date('now', '-3 days'), 'minor', 0, 'Arrived 18 minutes late'),
  (4, 3, date('now', '-2 days'), 'minor', 0, 'Forgot to clock in');

-- Leave Requests
INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, days_requested, status, reason, requested_at) VALUES
  (2, 1, date('now', '+7 days'), date('now', '+11 days'), 5, 'approved', 'Annual family vacation', datetime('now', '-5 days')),
  (3, 2, date('now', '+2 days'), date('now', '+2 days'), 1, 'pending', 'Medical appointment', datetime('now', '-1 hour')),
  (4, 3, date('now', '+1 day'), date('now', '+1 day'), 1, 'pending', 'Child school event', datetime('now', '-2 hours')),
  (5, 5, date('now', '+14 days'), date('now', '+16 days'), 3, 'approved', 'Professional development course', datetime('now', '-7 days'));

-- COIDA Incidents
INSERT INTO coida_incidents (employee_id, incident_date, incident_type, severity, description, location_id, medical_attention, days_lost, status) VALUES
  (2, date('now', '-10 days'), 'Minor Injury', 'minor', 'Paper cut while handling documents', 2, 0, 0, 'closed'),
  (4, date('now', '-15 days'), 'Slip and Fall', 'moderate', 'Slipped on wet floor in warehouse', 3, 1, 1, 'closed'),
  (2, date('now', '-5 days'), 'Near Miss', 'minor', 'Almost hit by forklift - safety protocol reminder issued', 2, 0, 0, 'open');

-- Safety Training
INSERT INTO safety_training (employee_id, training_type, training_date, expiry_date, trainer_name, status) VALUES
  (1, 'Fire Safety', date('now', '-60 days'), date('now', '+305 days'), 'Safety Officer Smith', 'active'),
  (2, 'Forklift Operation', date('now', '-90 days'), date('now', '+275 days'), 'Warehouse Manager', 'active'),
  (3, 'First Aid', date('now', '-30 days'), date('now', '+335 days'), 'Red Cross Trainer', 'active'),
  (4, 'Manual Handling', date('now', '-45 days'), date('now', '+320 days'), 'Safety Officer Smith', 'active'),
  (5, 'Workplace Safety', date('now', '-20 days'), date('now', '+345 days'), 'Safety Officer Smith', 'active');

-- Onboarding Checklists
INSERT INTO onboarding_checklists (employee_id, task_name, task_category, is_completed, completed_date, assigned_to, due_date) VALUES
  (5, 'Complete HR paperwork', 'Documentation', 1, date('now', '-25 days'), 3, date('now', '-26 days')),
  (5, 'IT equipment setup', 'Equipment', 1, date('now', '-24 days'), 3, date('now', '-25 days')),
  (5, 'Safety orientation', 'Training', 1, date('now', '-23 days'), 3, date('now', '-24 days')),
  (5, '30-day check-in', 'Review', 0, NULL, 3, date('now', '+5 days')),
  (5, '90-day performance review', 'Review', 0, NULL, 1, date('now', '+65 days'));

-- Documents
INSERT INTO documents (employee_id, document_name, document_type, file_url, uploaded_by, is_confidential, uploaded_at) VALUES
  (2, 'Employment Contract - Sipho Nkosi', 'Contract', '/files/emp002_contract.pdf', 3, 1, datetime('now', '-120 days')),
  (3, 'ID Copy - Thandiwe Dlamini', 'Identity', '/files/emp003_id.pdf', 3, 1, datetime('now', '-90 days')),
  (4, 'Payslip March 2024', 'Payslip', '/files/emp004_payslip_mar.pdf', 3, 1, datetime('now', '-60 days')),
  (5, 'Training Certificate - Workplace Safety', 'Certificate', '/files/emp005_cert_safety.pdf', 5, 0, datetime('now', '-20 days')),
  (NULL, 'Company Policy Handbook 2024', 'Policy', '/files/policy_handbook_2024.pdf', 1, 0, datetime('now', '-180 days'));

-- Messages
INSERT INTO messages (sender_id, recipient_id, subject, message_text, is_broadcast, is_read, sent_at) VALUES
  (1, 2, 'Shift Schedule Update', 'Please review your updated shift schedule for next week.', 0, 1, datetime('now', '-2 days')),
  (3, 4, 'Leave Request Follow-up', 'Your leave request has been submitted. Awaiting approval.', 0, 0, datetime('now', '-1 hour')),
  (1, NULL, 'Company-wide: Safety Week', 'Next week is Safety Week. All employees must attend the morning briefings.', 1, 0, datetime('now', '-3 hours')),
  (3, 5, 'Onboarding Progress', 'Great progress on your onboarding tasks! 30-day check-in scheduled.', 0, 1, datetime('now', '-5 days'));

-- Payroll Batches
INSERT INTO payroll_batches (batch_name, period_start, period_end, employee_count, total_amount, status, created_by, created_at) VALUES
  ('March 2024 Payroll', '2024-03-01', '2024-03-31', 5, 211000.00, 'approved', 1, datetime('now', '-30 days')),
  ('April 2024 Payroll', '2024-04-01', '2024-04-30', 5, 211000.00, 'draft', 1, datetime('now', '-2 days'));

-- Payroll Entries
INSERT INTO payroll_entries (batch_id, employee_id, base_salary, overtime_amount, bonus_amount, deductions, net_amount, payment_date, payment_method) VALUES
  (1, 1, 75000, 0, 5000, 15000, 65000, '2024-03-25', 'bank_transfer'),
  (1, 2, 45000, 2000, 0, 8500, 38500, '2024-03-25', 'bank_transfer'),
  (1, 3, 35000, 0, 1000, 6500, 29500, '2024-03-25', 'bank_transfer'),
  (1, 4, 18000, 1500, 0, 3500, 16000, '2024-03-25', 'cash'),
  (1, 5, 38000, 0, 2000, 7000, 33000, '2024-03-25', 'bank_transfer');

-- Budgets
INSERT INTO budgets (department_id, budget_year, budget_month, category, allocated_amount, spent_amount) VALUES
  (1, 2024, 11, 'Salaries', 150000, 145000),
  (1, 2024, 11, 'Equipment', 50000, 35000),
  (2, 2024, 11, 'Salaries', 80000, 75000),
  (3, 2024, 11, 'Salaries', 70000, 68000),
  (3, 2024, 11, 'Training', 20000, 12000),
  (4, 2024, 11, 'Training Materials', 30000, 18000),
  (5, 2024, 11, 'Logistics', 100000, 92000);

-- Forecasts
INSERT INTO forecasts (department_id, forecast_type, forecast_period, predicted_value, confidence_level) VALUES
  (1, 'Headcount', '2024-Q4', 55, 'high'),
  (2, 'Budget Required', '2024-Q4', 85000, 'medium'),
  (3, 'Turnover Rate', '2024-Q4', 0.05, 'high'),
  (4, 'Training Hours', '2024-Q4', 320, 'medium'),
  (5, 'Logistics Cost', '2024-Q4', 105000, 'medium');

-- Achievements & Gamification
INSERT INTO achievements (employee_id, achievement_type, achievement_name, points_awarded, awarded_date, icon) VALUES
  (2, 'attendance', 'Perfect Attendance - March', 100, date('now', '-30 days'), '⭐'),
  (3, 'training', 'Training Champion', 150, date('now', '-20 days'), '📚'),
  (4, 'safety', 'Safety Star', 120, date('now', '-15 days'), '🛡️'),
  (5, 'onboarding', 'Quick Start', 80, date('now', '-10 days'), '🚀');

-- Leaderboard
INSERT INTO leaderboard (employee_id, total_points, level, rank_position, streak_days, last_activity) VALUES
  (1, 1500, 8, 1, 45, datetime('now')),
  (2, 1200, 7, 2, 30, datetime('now', '-1 hour')),
  (3, 950, 6, 3, 22, datetime('now', '-2 hours')),
  (5, 780, 5, 4, 18, datetime('now', '-5 hours')),
  (4, 650, 4, 5, 12, datetime('now', '-1 day'));

-- Engagement Activities
INSERT INTO engagement_activities (activity_type, employee_id, activity_description, points_earned, activity_date) VALUES
  ('login', 2, 'Daily login', 10, datetime('now')),
  ('shift_complete', 2, 'Completed shift on time', 50, datetime('now', '-30 minutes')),
  ('training', 3, 'Completed First Aid training', 150, datetime('now', '-30 days')),
  ('feedback', 4, 'Provided safety feedback', 30, datetime('now', '-2 days')),
  ('milestone', 5, '30 days with company', 100, datetime('now', '-5 days'));
