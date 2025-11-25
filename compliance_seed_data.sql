-- =====================================================
-- COMPLIANCE SYSTEM SEED DATA
-- =====================================================
-- Seeds 50 critical compliance checkpoints across 16 categories
-- for immediate compliance monitoring and alert generation

-- =====================================================
-- SEED: 16 COMPLIANCE CATEGORIES (already created in migration)
-- =====================================================

-- =====================================================
-- SEED: 50 CRITICAL COMPLIANCE CHECKPOINTS
-- =====================================================

-- CATEGORY 1: LEGISLATIVE FRAMEWORK (5 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(1, 'LEG_LRA_AWARE', 'LRA Awareness Training', 'All managers trained on Labour Relations Act', 'training', 'annually', 'hr_manager', 60, 0, 0, 50000, 'LRA Act 66 of 1995'),
(1, 'LEG_BCEA_AWARE', 'BCEA Compliance Training', 'All HR staff trained on Basic Conditions of Employment Act', 'training', 'annually', 'hr_manager', 60, 0, 0, 100000, 'BCEA Act 75 of 1997'),
(1, 'LEG_EEA_AWARE', 'EEA Training', 'EEA requirements training for recruitment team', 'training', 'annually', 'hr_manager', 60, 0, 0, 50000, 'EEA Act 55 of 1998'),
(1, 'LEG_OHSA_AWARE', 'OHSA Training', 'Health & Safety Act training for all managers', 'training', 'annually', 'compliance_officer', 60, 0, 0, 500000, 'OHSA Act 85 of 1993'),
(1, 'LEG_POPIA_AWARE', 'POPIA Compliance Training', 'Data protection training for all staff with employee data access', 'training', 'annually', 'hr_manager', 60, 0, 0, 10000000, 'POPIA Act 4 of 2013');

-- CATEGORY 2: REGISTRATION & LICENSING (8 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(2, 'REG_CIPC_ANNUAL', 'CIPC Annual Return', 'Company annual return filed with CIPC', 'report', 'annually', 'super_admin', 60, 0, 100, 10000, 'Companies Act 71 of 2008'),
(2, 'REG_SARS_TAX', 'SARS Tax Clearance', 'Valid tax clearance certificate', 'registration', 'annually', 'payroll_admin', 30, 1, 0, 0, 'Income Tax Act'),
(2, 'REG_SARS_PAYE', 'PAYE Registration Current', 'PAYE registration active and current', 'registration', 'on_event', 'payroll_admin', 0, 1, 0, 0, 'Income Tax Act'),
(2, 'REG_UIF_CURRENT', 'UIF Registration Current', 'UIF registration active', 'registration', 'on_event', 'hr_manager', 0, 1, 0, 500000, 'UIA Act 63 of 2001'),
(2, 'REG_DOEL_WORKPLACE', 'DoEL Workplace Registration', 'Workplace registered with Department of Employment and Labour', 'registration', 'on_event', 'hr_manager', 0, 0, 0, 100000, 'BCEA'),
(2, 'REG_TES_LICENSE', 'TES License Valid', 'Temporary Employment Services license current (if applicable)', 'registration', 'annually', 'super_admin', 60, 1, 0, 0, 'ESA Act 4 of 2014'),
(2, 'REG_BARGAINING', 'Bargaining Council Registration', 'Registered with relevant bargaining council (if applicable)', 'registration', 'on_event', 'hr_manager', 0, 0, 0, 50000, 'LRA'),
(2, 'REG_SETA', 'SETA Registration', 'Registered with relevant Sector Education and Training Authority', 'registration', 'on_event', 'training_coordinator', 0, 0, 0, 0, 'Skills Development Act');

-- CATEGORY 3: EMPLOYMENT CONTRACTS (7 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(3, 'CONTRACT_WRITTEN', 'Written Contracts Issued', 'All employees have written employment contracts', 'document', 'on_event', 'hr_manager', 0, 1, 0, 50000, 'BCEA Section 29'),
(3, 'CONTRACT_SIGNED', 'Contracts Signed', 'All employment contracts signed by employee', 'document', 'on_event', 'hr_manager', 7, 1, 0, 10000, 'BCEA Section 29'),
(3, 'CONTRACT_TERMS', 'Contract Terms Compliant', 'Contracts include all BCEA-required terms', 'document', 'on_event', 'hr_manager', 0, 0, 0, 50000, 'BCEA Section 29'),
(3, 'CONTRACT_FIXED_TERM', 'Fixed-Term Contracts Valid', 'Fixed-term contracts have valid reasons and correct durations', 'record', 'monthly', 'hr_manager', 14, 1, 0, 50000, 'BCEA Section 198B'),
(3, 'CONTRACT_TES_3MONTH', 'TES 3-Month Rule Compliance', 'Track TES placements to ensure permanent rights after 3 months', 'record', 'daily', 'hr_manager', 14, 1, 0, 100000, 'LRA Section 198A'),
(3, 'CONTRACT_PROBATION', 'Probation Period Tracking', 'Probation periods documented and end dates tracked', 'record', 'weekly', 'hr_manager', 14, 1, 0, 0, 'BCEA'),
(3, 'CONTRACT_ID_VERIFICATION', 'ID/Work Permit Verification', 'Copy of ID or valid work permit on file for all employees', 'document', 'on_event', 'hr_manager', 0, 1, 0, 10000, 'Immigration Act, POPIA');

-- CATEGORY 4: WAGES & REMUNERATION (6 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(4, 'WAGE_NMW_COMPLIANCE', 'National Minimum Wage Compliance', 'All employees paid at or above National Minimum Wage', 'payment', 'monthly', 'payroll_admin', 0, 1, 0, 1000000, 'National Minimum Wage Act'),
(4, 'WAGE_PAYSLIPS', 'Payslips Issued', 'All employees receive compliant payslips every payment period', 'document', 'monthly', 'payroll_admin', 0, 1, 0, 50000, 'BCEA Section 30'),
(4, 'WAGE_PAYMENT_TIMELY', 'Timely Payment', 'Wages paid within 7 days of becoming due', 'payment', 'monthly', 'payroll_admin', 3, 1, 0, 50000, 'BCEA Section 32'),
(4, 'WAGE_EQUAL_PAY', 'Equal Pay for Equal Work', 'Temporary workers paid same as permanent for similar roles', 'record', 'quarterly', 'hr_manager', 30, 0, 0, 100000, 'LRA Section 198A'),
(4, 'WAGE_OVERTIME_PREMIUM', 'Overtime Premium Payment', 'Overtime paid at 1.5x rate', 'payment', 'monthly', 'payroll_admin', 0, 1, 0, 50000, 'BCEA Section 10'),
(4, 'WAGE_DEDUCTIONS_AUTHORIZED', 'Authorized Deductions Only', 'All deductions have written employee authorization', 'document', 'monthly', 'payroll_admin', 0, 1, 0, 50000, 'BCEA Section 34');

-- CATEGORY 5: WORKING TIME (4 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(5, 'TIME_45H_WEEK', '45-Hour Work Week Compliance', 'No employee exceeds 45 hours per week (ordinary time)', 'record', 'weekly', 'department_manager', 0, 1, 0, 50000, 'BCEA Section 9'),
(5, 'TIME_OVERTIME_LIMIT', 'Overtime Limit Compliance', 'Overtime not exceeding 10h/week or 3h/day', 'record', 'weekly', 'department_manager', 0, 1, 0, 50000, 'BCEA Section 10'),
(5, 'TIME_DAILY_REST', 'Daily Rest Period', 'All employees get 12-hour rest between shifts', 'record', 'daily', 'shift_supervisor', 0, 1, 0, 50000, 'BCEA Section 14'),
(5, 'TIME_WEEKLY_REST', 'Weekly Rest Period', '36-hour weekly rest period provided', 'record', 'weekly', 'department_manager', 0, 1, 0, 50000, 'BCEA Section 15');

-- CATEGORY 6: LEAVE ENTITLEMENTS (4 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(6, 'LEAVE_ANNUAL_ACCRUAL', 'Annual Leave Accrual Correct', 'Annual leave accruing at 21 days/year or 1 day per 17 worked', 'record', 'monthly', 'hr_manager', 0, 1, 0, 50000, 'BCEA Section 20'),
(6, 'LEAVE_SICK_AVAILABLE', 'Sick Leave Entitlement', '30 days sick leave per 3-year cycle available', 'record', 'quarterly', 'hr_manager', 30, 1, 0, 50000, 'BCEA Section 22'),
(6, 'LEAVE_SICK_CERTIFICATES', 'Sick Leave Certificates', 'Medical certificates obtained for absences >2 days', 'document', 'weekly', 'hr_manager', 3, 1, 0, 10000, 'BCEA Section 23'),
(6, 'LEAVE_MATERNITY', 'Maternity Leave Compliance', 'Maternity leave of 4 months granted', 'record', 'on_event', 'hr_manager', 30, 0, 0, 50000, 'BCEA Section 25');

-- CATEGORY 7: HEALTH & SAFETY (6 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(7, 'HS_POLICY', 'H&S Policy Exists', 'Written health and safety policy in place', 'policy', 'annually', 'compliance_officer', 90, 0, 0, 100000, 'OHSA Section 7'),
(7, 'HS_REP_APPOINTED', 'H&S Representatives Appointed', 'Health and safety reps elected and trained', 'record', 'annually', 'compliance_officer', 60, 1, 0, 100000, 'OHSA Section 17'),
(7, 'HS_COMMITTEE', 'H&S Committee Meetings', 'H&S committee meets quarterly (if required)', 'record', 'quarterly', 'compliance_officer', 30, 1, 0, 50000, 'OHSA Section 19'),
(7, 'HS_RISK_ASSESSMENT', 'Risk Assessments Current', 'Risk assessments conducted and up-to-date', 'document', 'annually', 'compliance_officer', 60, 1, 0, 500000, 'OHSA Section 8'),
(7, 'HS_INCIDENT_REPORTING', 'Incident Reporting Timely', 'All serious incidents reported to DoEL within 7 days', 'report', 'on_event', 'compliance_officer', 2, 0, 0, 500000, 'OHSA Section 24'),
(7, 'HS_PPE_PROVIDED', 'PPE Provided', 'Personal protective equipment provided free of charge', 'record', 'quarterly', 'location_manager', 30, 0, 0, 100000, 'OHSA Section 8');

-- CATEGORY 8: INSURANCE & COMPENSATION (3 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(8, 'INS_COIDA_REGISTRATION', 'COIDA Registration Current', 'Registered with Compensation Commissioner', 'registration', 'annually', 'hr_manager', 60, 1, 0, 100000, 'COIDA'),
(8, 'INS_UIF_PAYMENTS', 'UIF Contributions Paid', 'Monthly UIF contributions paid by 7th of following month', 'payment', 'monthly', 'payroll_admin', 5, 1, 0, 500000, 'UIA'),
(8, 'INS_SDL_PAYMENTS', 'SDL Levy Paid', 'Skills Development Levy paid monthly (1% of payroll if >R500k)', 'payment', 'monthly', 'payroll_admin', 5, 1, 0, 100000, 'Skills Development Act');

-- CATEGORY 9: EMPLOYMENT EQUITY (2 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(9, 'EEA_PLAN_SUBMITTED', 'EE Plan Submitted', 'Employment Equity Plan submitted (if designated employer)', 'report', 'annually', 'hr_manager', 60, 0, 0, 1500000, 'EEA Section 20'),
(9, 'EEA_ANNUAL_REPORT', 'EEA Annual Report', 'EEA report (EEA12/13) submitted by Jan 15', 'report', 'annually', 'hr_manager', 30, 0, 0, 1500000, 'EEA Section 21');

-- CATEGORY 10: SKILLS DEVELOPMENT (2 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(10, 'SD_WSP_SUBMITTED', 'WSP Submitted', 'Workplace Skills Plan submitted to SETA by April 30', 'report', 'annually', 'training_coordinator', 60, 0, 0, 0, 'Skills Development Act'),
(10, 'SD_ATR_SUBMITTED', 'ATR Submitted', 'Annual Training Report submitted to SETA by April 30', 'report', 'annually', 'training_coordinator', 60, 0, 0, 0, 'Skills Development Act');

-- CATEGORY 11: DATA PROTECTION (3 critical)
INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
(11, 'DATA_INFO_OFFICER', 'Information Officer Appointed', 'POPIA Information Officer appointed and registered', 'registration', 'on_event', 'super_admin', 0, 0, 0, 10000000, 'POPIA Section 55'),
(11, 'DATA_CONSENT_FORMS', 'Employee Consent Forms', 'POPIA consent forms signed by all employees', 'document', 'on_event', 'hr_manager', 7, 1, 0, 10000000, 'POPIA Section 11'),
(11, 'DATA_RETENTION_POLICY', 'Data Retention Policy', 'Data retention and destruction policy documented', 'policy', 'annually', 'hr_manager', 90, 0, 0, 10000000, 'POPIA Section 14');

-- Success message
SELECT 'Compliance checkpoints seeded successfully - 50 critical checkpoints loaded' AS message;
