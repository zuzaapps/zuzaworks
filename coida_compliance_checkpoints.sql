-- =====================================================
-- COIDA-SPECIFIC COMPLIANCE CHECKPOINTS
-- =====================================================
-- Adds comprehensive COIDA checkpoints to compliance_checkpoints table
-- Based on COIDA Act 130 of 1993 requirements

-- Get COIDA category ID (assumes category already exists from migration 0004)
-- Category: INSURANCE_COMPENSATION (code: 'INSURANCE_COMPENSATION')

-- =====================================================
-- 1. REGISTRATION & LICENSING (10 checkpoints)
-- =====================================================

INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
-- Get category_id dynamically
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_REG_INITIAL', 'Initial COIDA Registration', 'Business registered with Compensation Commissioner within 14 days of starting/hiring first employee', 'registration', 'once', 'hr_manager', 7, 1, 0, 100000, 'COIDA Section 82'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_REG_CURRENT', 'COIDA Registration Current', 'Registration maintained and active with Compensation Fund', 'registration', 'monthly', 'hr_manager', 30, 1, 0, 100000, 'COIDA Section 82'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_REG_CERT_DISPLAY', 'Registration Certificate Displayed', 'COIDA registration certificate displayed at workplace', 'document', 'monthly', 'location_manager', 0, 0, 0, 10000, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_TARIFF_CORRECT', 'Correct Tariff Classification', 'Business activities classified under correct tariff code(s)', 'record', 'annually', 'payroll_admin', 60, 0, 0, 0, 'COIDA Schedule 3'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_TARIFF_REVIEW', 'Tariff Code Annual Review', 'Review tariff codes annually to ensure accuracy as business activities change', 'process', 'annually', 'payroll_admin', 90, 0, 0, 0, 'COIDA Best Practice'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_TES_CLASSIFICATION', 'TES Workers Correctly Classified', 'Temporary workers classified based on actual work performed (not admin rate)', 'record', 'quarterly', 'hr_manager', 30, 0, 0, 500000, 'COIDA Regulation 3'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_MULTI_ACTIVITY', 'Multiple Activity Declaration', 'All business activities with different tariff codes declared separately', 'record', 'annually', 'payroll_admin', 60, 0, 0, 100000, 'COIDA Form W.As.2'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_ADDRESS_UPDATE', 'Registered Address Current', 'Business address updated with Compensation Fund if changed', 'record', 'on_event', 'super_admin', 30, 0, 0, 10000, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_CONTACT_UPDATE', 'Contact Details Current', 'Contact person and details updated with Compensation Fund', 'record', 'on_event', 'hr_manager', 30, 0, 0, 10000, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_DEREGISTRATION', 'Deregistration if Ceased Trading', 'Notify Compensation Fund if business ceases operations', 'process', 'on_event', 'super_admin', 0, 0, 0, 50000, 'COIDA Section 82');

-- =====================================================
-- 2. ANNUAL RETURNS & ASSESSMENTS (15 checkpoints)
-- =====================================================

INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_W_AS2_SUBMISSION', 'W.As.2 Annual Return Submission', 'Form W.As.2 submitted by March 31 for previous calendar year', 'report', 'annually', 'payroll_admin', 60, 1, 0, 0, 'COIDA Section 82'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_W_AS2_ACCURACY', 'W.As.2 Earnings Accuracy', 'All employee earnings accurately declared on W.As.2', 'record', 'annually', 'payroll_admin', 60, 1, 0, 500000, 'COIDA Section 82'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_W_AS2_ALL_EMPLOYEES', 'All Employees Included in Return', 'Temporary, casual, part-time, and full-time employees all included in W.As.2', 'record', 'annually', 'payroll_admin', 60, 1, 0, 500000, 'COIDA Section 82'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_W_AS2_SARS_RECONCILE', 'W.As.2 vs PAYE Reconciliation', 'Earnings declared on W.As.2 reconcile with PAYE submissions to SARS', 'record', 'annually', 'payroll_admin', 60, 1, 0, 500000, 'Tax/COIDA Cross-Compliance'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_W_AS2_TARIFF_SPLIT', 'Earnings Split by Tariff Code', 'Earnings correctly split by tariff code for multiple activities', 'record', 'annually', 'payroll_admin', 60, 0, 0, 100000, 'COIDA Form W.As.2 Section B'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_W_AS2_RECORDS', 'Supporting Records for W.As.2', 'Payroll records, IRP5s, and earnings documentation available to support W.As.2', 'document', 'annually', 'payroll_admin', 60, 0, 0, 100000, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_W_AS2_LATE_PENALTY', 'No Late Submission Penalty', 'W.As.2 submitted on time (no 10% penalty applied)', 'payment', 'annually', 'payroll_admin', 60, 1, 0, 0, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_ASSESSMENT_NOTICE', 'Assessment Notice Received', 'Assessment notice from Compensation Fund received and reviewed', 'record', 'annually', 'payroll_admin', 30, 0, 0, 0, 'COIDA Section 82'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_ASSESSMENT_PAYMENT', 'Assessment Paid Within 30 Days', 'Assessment paid in full within 30 days of assessment notice', 'payment', 'annually', 'payroll_admin', 15, 1, 0, 0, 'COIDA Section 86'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_ASSESSMENT_INTEREST', 'No Assessment Interest Charged', 'Assessment paid on time (no interest charged for late payment)', 'payment', 'annually', 'payroll_admin', 15, 1, 0, 0, 'COIDA Section 86'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_ASSESSMENT_OBJECTION', 'Assessment Objection if Incorrect', 'Object to assessment within 90 days if calculation incorrect', 'process', 'on_event', 'payroll_admin', 60, 0, 0, 0, 'COIDA Section 91'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_ADVANCE_JULY', 'Advance Payment July', 'First advance payment (50% of previous assessment) paid by July 31', 'payment', 'annually', 'payroll_admin', 30, 1, 0, 0, 'COIDA Section 85'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_ADVANCE_JANUARY', 'Advance Payment January', 'Second advance payment (50% of previous assessment) paid by January 31', 'payment', 'annually', 'payroll_admin', 30, 1, 0, 0, 'COIDA Section 85'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_PAYMENT_RECORDS', 'Payment Records Retained', 'Proof of assessment and advance payments retained for at least 4 years', 'document', 'quarterly', 'payroll_admin', 30, 0, 0, 50000, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_LOGS_VALID', 'Letter of Good Standing Valid', 'Current Letter of Good Standing available (valid 3 months) when needed', 'document', 'quarterly', 'payroll_admin', 30, 1, 0, 0, 'COIDA Best Practice');

-- =====================================================
-- 3. INJURY/DISEASE REPORTING (12 checkpoints)
-- =====================================================

INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_INJURY_PROCEDURE', 'Injury Reporting Procedure Documented', 'Written procedure for reporting workplace injuries available to all employees', 'policy', 'annually', 'compliance_officer', 90, 0, 0, 50000, 'COIDA Section 38'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_FIRST_AID', 'First Aid Provided Immediately', 'First aid administered immediately after injury and medical treatment arranged', 'process', 'on_event', 'shift_supervisor', 0, 0, 0, 500000, 'COIDA Section 38'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_W_CL4_ISSUED', 'W.Cl.4 Medical Authorization Issued', 'Form W.Cl.4 completed and given to employee before seeing doctor', 'document', 'on_event', 'hr_manager', 0, 0, 0, 100000, 'COIDA Section 40'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_W_CL2_7DAYS', 'W.Cl.2 Submitted Within 7 Days', 'All workplace injuries reported to Compensation Fund within 7 days (Form W.Cl.2)', 'report', 'on_event', 'hr_manager', 2, 1, 0, 100000, 'COIDA Section 38'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_W_CL2_MINOR', 'Minor Injuries Also Reported', 'Even minor injuries reported on W.Cl.2 (employee may claim later)', 'report', 'on_event', 'hr_manager', 2, 0, 0, 50000, 'COIDA Best Practice'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_W_CL2_ACCURACY', 'W.Cl.2 Accuracy and Completeness', 'W.Cl.2 fully completed with accurate details of incident', 'document', 'on_event', 'hr_manager', 0, 0, 0, 50000, 'COIDA Section 38'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_FATALITY_IMMEDIATE', 'Fatality Reported Immediately', 'Workplace fatalities reported to Compensation Fund, SAPS, and OHS inspector immediately', 'report', 'on_event', 'super_admin', 0, 1, 0, 500000, 'COIDA Section 38 + OHSA'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_W_CL6_FATALITY', 'W.Cl.6 Fatal Accident Report', 'Form W.Cl.6 submitted within 14 days for workplace fatalities', 'report', 'on_event', 'compliance_officer', 7, 0, 0, 500000, 'COIDA Section 38'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_SCENE_PRESERVED', 'Accident Scene Preserved', 'Accident scene secured and preserved (especially for serious injuries/fatalities)', 'process', 'on_event', 'location_manager', 0, 0, 0, 500000, 'COIDA/OHSA Investigation'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_INVESTIGATION', 'Accident Investigation Conducted', 'Internal investigation completed for all reportable injuries', 'process', 'on_event', 'compliance_officer', 3, 0, 0, 100000, 'COIDA/OHSA Best Practice'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_CORRECTIVE_ACTION', 'Corrective Actions Implemented', 'Root causes identified and corrective actions implemented to prevent recurrence', 'process', 'on_event', 'compliance_officer', 14, 0, 0, 500000, 'OHSA Section 8'),
((SELECT id FROM compliance_categories WHERE code = 'HEALTH_SAFETY'), 'COIDA_ACCIDENT_REGISTER', 'Accident Register Maintained', 'All workplace accidents recorded in accident register at each location', 'record', 'monthly', 'location_manager', 0, 0, 0, 50000, 'OHSA Section 24');

-- =====================================================
-- 4. CLAIMS MANAGEMENT (10 checkpoints)
-- =====================================================

INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_W_CL3_ASSIST', 'Assist Employee with W.Cl.3 Claim', 'Employer assists employee with completing Form W.Cl.3 (claim for compensation) if requested', 'process', 'on_event', 'hr_manager', 0, 0, 0, 0, 'COIDA Section 44'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_W_CL22_7DAYS', 'W.Cl.22 Submitted Within 7 Days', 'Earnings certificate (Form W.Cl.22) completed within 7 days of request from Compensation Fund', 'document', 'on_event', 'payroll_admin', 3, 1, 0, 50000, 'COIDA Section 45'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_W_CL22_ACCURACY', 'W.Cl.22 Earnings Accuracy', 'Employee earnings accurately reflected on W.Cl.22 (last 12 months)', 'document', 'on_event', 'payroll_admin', 3, 0, 0, 50000, 'COIDA Section 45'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_CLAIM_COOPERATION', 'Cooperate with Claim Investigation', 'Employer cooperates fully with Compensation Fund investigation of claims', 'process', 'on_event', 'hr_manager', 0, 0, 0, 100000, 'COIDA Section 46'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_CLAIM_OBJECTION', 'Claim Objection if Fraudulent', 'Object to fraudulent/false claims in writing with evidence', 'process', 'on_event', 'hr_manager', 7, 0, 0, 0, 'COIDA Section 47'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_EMPLOYEE_NOT_DISMISSED', 'Employee Not Dismissed During Claim', 'Employee not dismissed while claim is being processed (unless valid fair reason)', 'record', 'on_event', 'hr_manager', 0, 0, 0, 500000, 'LRA + COIDA Best Practice'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_LIGHT_DUTY', 'Light Duty Offered if Possible', 'Light/modified duties offered to injured employee during recovery period', 'process', 'on_event', 'department_manager', 7, 0, 0, 0, 'COIDA Best Practice'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_RETURN_TO_WORK', 'Return-to-Work Program', 'Structured return-to-work program in place for injured employees', 'policy', 'annually', 'hr_manager', 90, 0, 0, 0, 'COIDA Best Practice'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_DEPENDANTS_ASSIST', 'Assist Dependants with Death Claims', 'Assist deceased employee\'s dependants with W.Cl.3 claim for death benefits', 'process', 'on_event', 'hr_manager', 0, 0, 0, 0, 'COIDA Section 44 + Compassion'),
((SELECT id FROM compliance_categories WHERE code = 'INSURANCE_COMPENSATION'), 'COIDA_MEDICAL_RECORDS', 'Medical Records Availability', 'Employee medical records available and provided to Compensation Fund when requested', 'document', 'on_event', 'hr_manager', 0, 0, 0, 50000, 'COIDA Section 46');

-- =====================================================
-- 5. RECORD-KEEPING & DOCUMENTATION (8 checkpoints)
-- =====================================================

INSERT OR IGNORE INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max, legislation_reference) VALUES
((SELECT id FROM compliance_categories WHERE code = 'RECORD_KEEPING'), 'COIDA_RECORDS_4YEARS', 'COIDA Records Retained 4 Years', 'All COIDA-related records retained for minimum 4 years', 'record', 'annually', 'hr_manager', 90, 0, 0, 50000, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'RECORD_KEEPING'), 'COIDA_W_AS2_COPIES', 'W.As.2 Copies Retained', 'Copies of all W.As.2 annual returns retained for 4+ years', 'document', 'annually', 'payroll_admin', 0, 0, 0, 50000, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'RECORD_KEEPING'), 'COIDA_W_CL2_COPIES', 'W.Cl.2 Injury Reports Retained', 'Copies of all W.Cl.2 injury reports retained for 4+ years', 'document', 'monthly', 'hr_manager', 0, 0, 0, 50000, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'RECORD_KEEPING'), 'COIDA_PAYMENT_PROOFS', 'Payment Proofs Retained', 'Proof of assessment and advance payments retained for 4+ years', 'document', 'quarterly', 'payroll_admin', 0, 0, 0, 50000, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'RECORD_KEEPING'), 'COIDA_CORRESPONDENCE', 'CF Correspondence Filed', 'All correspondence with Compensation Fund filed and accessible', 'document', 'monthly', 'hr_manager', 0, 0, 0, 10000, 'COIDA Best Practice'),
((SELECT id FROM compliance_categories WHERE code = 'RECORD_KEEPING'), 'COIDA_CLAIMS_REGISTER', 'Claims Register Maintained', 'Register of all COIDA claims (successful and unsuccessful) maintained', 'record', 'monthly', 'hr_manager', 0, 0, 0, 10000, 'COIDA Best Practice'),
((SELECT id FROM compliance_categories WHERE code = 'RECORD_KEEPING'), 'COIDA_AUDIT_READY', 'Audit-Ready Documentation', 'All COIDA records organized and readily available for Compensation Fund audit', 'record', 'quarterly', 'payroll_admin', 30, 0, 0, 100000, 'COIDA Regulations'),
((SELECT id FROM compliance_categories WHERE code = 'RECORD_KEEPING'), 'COIDA_DIGITAL_BACKUP', 'Digital Backup of COIDA Records', 'Digital/scanned copies of all COIDA documents backed up securely', 'document', 'quarterly', 'super_admin', 30, 0, 0, 0, 'COIDA Best Practice');

-- Success message
SELECT 'COIDA compliance checkpoints seeded successfully - 55 COIDA-specific checkpoints added' AS message;
