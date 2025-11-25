-- ============================================================================
-- INTERN MANAGEMENT COMPLIANCE CHECKPOINTS
-- ============================================================================
-- Integration with existing compliance_categories and compliance_checkpoints tables
-- These checkpoints monitor the entire intern lifecycle for SETA, YES, NYS programs
-- Links to intern_programs, interns, seta_registrations, yes_registrations tables
-- ============================================================================

-- First, add INTERNS_MANAGEMENT compliance category
INSERT INTO compliance_categories (code, name, description, risk_level, legislative_reference, created_at)
VALUES (
  'INTERNS_MANAGEMENT',
  'Interns & Learnership Management',
  'Compliance for SETA learnerships, YES program, NYS program, and self-funded interns including registration, reporting, stipends, assessments, and graduation',
  'high',
  'Skills Development Act (SDA), YES Initiative, National Youth Service Act, BCEA (learner vs employee status)',
  CURRENT_TIMESTAMP
);

-- Get the category_id for reference (will be used in checkpoints below)
-- Note: In production, you'd query this first, but for seed data we'll reference by code

-- ============================================================================
-- CATEGORY 1: SETA REGISTRATION & COMPLIANCE (10 checkpoints)
-- ============================================================================

INSERT INTO compliance_checkpoints (
  category_id, code, title, description, 
  check_type, frequency, responsible_role, 
  days_before_alert, is_automated, 
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT 
  cc.id,
  'INTERN_SETA_REG_14DAYS',
  'SETA Learnership Registration Within 14 Days',
  'All learnership agreements must be registered with relevant SETA within 14 days of commencement. Late registration may result in grant forfeiture.',
  'registration',
  'once_per_intern',
  'hr_manager',
  7,
  0,
  0,
  0,
  'Grant forfeiture (R30,000-R80,000 per learnership)',
  'seta_registrations.registration_number',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_QUARTERLY_REPORT',
  'SETA Quarterly Progress Report',
  'Submit quarterly progress reports to SETA showing learner attendance, progress on learning programmes, and mentorship activities.',
  'report',
  'quarterly',
  'training_coordinator',
  30,
  1,
  0,
  0,
  'Grant suspension, potential grant clawback',
  'seta_registrations.next_quarterly_report_due',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_COMMENCEMENT_GRANT',
  'SETA Commencement Grant Claim',
  'Claim commencement grant within 30 days of learnership registration. Grant ranges from R30,000-R80,000 depending on qualification level.',
  'financial',
  'once_per_intern',
  'payroll_admin',
  15,
  0,
  30000,
  80000,
  'Loss of commencement grant funding',
  'seta_registrations.commencement_grant_claimed',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_PROGRESS_GRANT',
  'SETA Progress Grant Claim',
  'Claim progress grant after 6 months of successful learnership progress. Requires submission of progress assessments and attendance records.',
  'financial',
  'once_per_intern',
  'payroll_admin',
  30,
  0,
  30000,
  80000,
  'Loss of progress grant funding',
  'seta_registrations.progress_grant_claimed',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_COMPLETION_GRANT',
  'SETA Completion Grant Claim',
  'Claim completion grant within 30 days of learnership completion and qualification achievement. Requires proof of qualification and final assessments.',
  'financial',
  'once_per_intern',
  'payroll_admin',
  15,
  0,
  30000,
  80000,
  'Loss of completion grant funding',
  'seta_registrations.completion_grant_claimed',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_LEARNING_AGREEMENT',
  'SETA Learning Agreement Signed',
  'Tripartite learning agreement must be signed by employer, learner, and training provider before commencement. Required for SETA registration.',
  'document',
  'once_per_intern',
  'hr_manager',
  7,
  0,
  0,
  0,
  'SETA registration rejection, grant forfeiture',
  'interns.learning_agreement_path',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_WORKPLACE_GUIDE',
  'SETA Workplace Skills Plan Alignment',
  'Ensure learnership aligns with organization Workplace Skills Plan (WSP) and Annual Training Report (ATR) submitted to SETA.',
  'compliance',
  'annually',
  'training_coordinator',
  60,
  0,
  0,
  0,
  'Grant rejection, non-compliance with SDA',
  NULL,
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_MENTOR_REGISTRATION',
  'SETA Mentor Registration & Qualifications',
  'Ensure workplace mentor is registered with SETA and meets minimum qualification requirements (typically NQF level 5 or relevant trade qualification).',
  'registration',
  'once_per_intern',
  'training_coordinator',
  30,
  0,
  0,
  0,
  'Learnership registration rejection',
  'intern_mentorship_sessions.mentor_id',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_CHANGE_NOTIFICATION',
  'SETA Change Notification (Status, Mentor, Programme)',
  'Notify SETA within 14 days of any changes to learnership status, mentor assignment, or programme structure.',
  'notification',
  'as_needed',
  'training_coordinator',
  7,
  0,
  0,
  0,
  'Grant suspension, compliance breach',
  NULL,
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_CANCELLATION_NOTICE',
  'SETA Learnership Cancellation/Withdrawal Notification',
  'If learnership is terminated or learner withdraws, notify SETA within 7 days with reason and supporting documentation.',
  'notification',
  'as_needed',
  'hr_manager',
  3,
  0,
  0,
  0,
  'Grant clawback (up to full commencement grant)',
  NULL,
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

-- ============================================================================
-- CATEGORY 2: YES PROGRAM COMPLIANCE (8 checkpoints)
-- ============================================================================

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_YES_REGISTRATION',
  'YES Program Participant Registration',
  'Register YES participants on YES Hub portal within 14 days of placement. Registration required for B-BBEE recognition.',
  'registration',
  'once_per_intern',
  'hr_manager',
  7,
  0,
  0,
  0,
  'No B-BBEE points recognition (up to 5 points per youth)',
  'yes_registrations.yes_participant_id',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_YES_MONTHLY_REPORT',
  'YES Hub Monthly Attendance Report',
  'Submit monthly attendance and activity reports via YES Hub portal by 5th of following month. Required for B-BBEE certificate issuance.',
  'report',
  'monthly',
  'training_coordinator',
  10,
  1,
  0,
  0,
  'B-BBEE certificate not issued, points not awarded',
  'yes_registrations.last_monthly_report_date',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_YES_BBBEE_CERTIFICATE',
  'YES B-BBEE Recognition Certificate Renewal',
  'YES B-BBEE certificates are valid for 12 months. Apply for renewal 60 days before expiry to maintain Skills Development scorecard points.',
  'registration',
  'annually',
  'compliance_officer',
  60,
  1,
  0,
  0,
  'Loss of B-BBEE Skills Development points (up to 5 points per youth)',
  'yes_registrations.b_bbee_certificate_expiry_date',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_YES_12MONTH_MINIMUM',
  'YES 12-Month Minimum Placement Duration',
  'YES participants must complete minimum 12-month work experience for B-BBEE recognition. Monitor approaching completion dates.',
  'compliance',
  'once_per_intern',
  'training_coordinator',
  30,
  1,
  0,
  0,
  'B-BBEE points not awarded if early exit',
  'interns.expected_end_date',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_YES_AGE_ELIGIBILITY',
  'YES Age Eligibility Verification (18-35 years)',
  'Verify YES participant is between 18-35 years old at time of placement using ID number. Non-compliance disqualifies B-BBEE recognition.',
  'compliance',
  'once_per_intern',
  'hr_manager',
  0,
  1,
  0,
  0,
  'B-BBEE recognition rejected',
  'interns.id_number',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_YES_STIPEND_MINIMUM',
  'YES Minimum Stipend Requirement (R3,500-R5,000)',
  'YES participants must receive minimum stipend of R3,500-R5,000 per month depending on qualification level. Non-compliance disqualifies B-BBEE points.',
  'financial',
  'monthly',
  'payroll_admin',
  10,
  1,
  3500,
  5000,
  'B-BBEE recognition rejected',
  'intern_stipend_payments.basic_stipend',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_YES_EXIT_REPORT',
  'YES Participant Exit Report & Outcome',
  'Submit exit report via YES Hub within 14 days of completion, including employment outcome (employed/unemployed/further study/entrepreneurship).',
  'report',
  'once_per_intern',
  'training_coordinator',
  7,
  0,
  0,
  0,
  'B-BBEE certificate not finalized',
  'intern_completions.yes_completion_reported',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_YES_CLAIMS_VERIFICATION',
  'YES B-BBEE Points Claims Verification',
  'Ensure all YES participants claimed for B-BBEE points meet eligibility criteria. Subject to verification audits by YES and B-BBEE verification agencies.',
  'audit',
  'annually',
  'compliance_officer',
  60,
  0,
  0,
  0,
  'B-BBEE level downgrade if fraudulent claims found',
  'yes_registrations.b_bbee_points_claimed',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

-- ============================================================================
-- CATEGORY 3: NYS PROGRAM COMPLIANCE (5 checkpoints)
-- ============================================================================

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_NYS_REGISTRATION',
  'NYS Program Participant Registration',
  'Register NYS participants with relevant provincial or national NYS coordinating office within 14 days of placement.',
  'registration',
  'once_per_intern',
  'hr_manager',
  7,
  0,
  0,
  0,
  'Participant not recognized, potential funding clawback',
  'nys_registrations.nys_participant_id',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_NYS_MONTHLY_ATTENDANCE',
  'NYS Monthly Attendance Register Submission',
  'Submit signed monthly attendance register to NYS coordinating office by 10th of following month. Required for stipend reimbursement.',
  'report',
  'monthly',
  'training_coordinator',
  10,
  1,
  0,
  0,
  'Stipend reimbursement withheld',
  'nys_registrations.last_attendance_submission_date',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_NYS_QUARTERLY_PROGRESS',
  'NYS Quarterly Progress Report',
  'Submit quarterly progress report detailing skills development, community service activities, and personal development outcomes.',
  'report',
  'quarterly',
  'training_coordinator',
  30,
  1,
  0,
  0,
  'Programme termination, funding suspended',
  'nys_registrations.next_quarterly_report_due',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_NYS_COMPLETION_CERTIFICATE',
  'NYS Completion Certificate Issuance',
  'Issue NYS completion certificate within 30 days of programme completion. Required for participant employability verification.',
  'document',
  'once_per_intern',
  'training_coordinator',
  15,
  0,
  0,
  0,
  'Participant outcomes not recognized',
  'intern_completions.nys_completion_certificate_path',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_NYS_EXIT_OUTCOME',
  'NYS Exit Outcome Report & Tracking',
  'Submit exit outcome report within 14 days of completion, tracking employment, further education, or entrepreneurship outcomes for 12 months post-exit.',
  'report',
  'once_per_intern',
  'training_coordinator',
  7,
  0,
  0,
  0,
  'Programme effectiveness not measured, future funding risk',
  'intern_completions.nys_completion_reported',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

-- ============================================================================
-- CATEGORY 4: STIPEND PAYMENTS & FINANCIAL COMPLIANCE (8 checkpoints)
-- ============================================================================

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_STIPEND_MONTHLY_PAYMENT',
  'Monthly Stipend Payment by 25th',
  'Process intern stipends by 25th of each month. Late payments affect intern morale and may breach learnership agreements.',
  'financial',
  'monthly',
  'payroll_admin',
  5,
  1,
  0,
  0,
  'Contract breach, intern grievances, CCMA referrals',
  'intern_stipend_payments.payment_date',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_PAYE_COMPLIANCE',
  'Intern PAYE Tax Compliance (If Applicable)',
  'If intern is treated as employee (not learner), deduct PAYE according to tax tables. Submit monthly PAYE to SARS by 7th of following month.',
  'financial',
  'monthly',
  'payroll_admin',
  5,
  1,
  0,
  0,
  'SARS penalties and interest on late PAYE submissions',
  'intern_stipend_payments.paye_deducted',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_UIF_COMPLIANCE',
  'Intern UIF Contributions (If Employee Status)',
  'If intern has employee status, register for UIF and deduct 1% from stipend, employer contributes 1%. Submit monthly declarations to UIF.',
  'financial',
  'monthly',
  'payroll_admin',
  10,
  1,
  0,
  0,
  'UIF penalties, intern not covered for unemployment benefits',
  'intern_stipend_payments.uif_deducted',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_LEGAL_STATUS_CLARITY',
  'Intern Legal Status Classification (Learner vs Employee)',
  'Clearly determine and document whether intern is classified as learner (SETA learnership) or employee (self-funded). Critical for BCEA compliance.',
  'compliance',
  'once_per_intern',
  'hr_manager',
  0,
  0,
  0,
  100000,
  'Incorrect classification = BCEA violations, backdated benefits claims',
  'interns.legal_status',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_STIPEND_PROOF_PAYMENT',
  'Stipend Proof of Payment & Records',
  'Maintain proof of payment for all stipend payments (EFT confirmations, payslips). Required for SETA/YES audits and grant verifications.',
  'record_keeping',
  'monthly',
  'payroll_admin',
  0,
  1,
  0,
  0,
  'Grant clawback if payments cannot be proven',
  'intern_stipend_payments.proof_of_payment_path',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_PAYMENT_REPORTING',
  'SETA Stipend Payment Reporting',
  'Report stipend payments to SETA as part of quarterly progress reports. Required to demonstrate financial commitment to learnership.',
  'report',
  'quarterly',
  'payroll_admin',
  30,
  0,
  0,
  0,
  'Grant suspension if payments not evidenced',
  'intern_stipend_payments.reported_to_seta',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_YES_PAYMENT_REPORTING',
  'YES Stipend Payment Reporting',
  'Report stipend payments to YES Hub as part of monthly attendance reports. Required for B-BBEE recognition verification.',
  'report',
  'monthly',
  'payroll_admin',
  10,
  1,
  0,
  0,
  'B-BBEE points not awarded if stipends not proven',
  'intern_stipend_payments.reported_to_yes',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_GRANT_RECONCILIATION',
  'SETA Grant vs Stipend Reconciliation',
  'Quarterly reconciliation: ensure SETA grants received (commencement, progress, completion) cover stipend costs. Flag funding gaps.',
  'financial',
  'quarterly',
  'finance_manager',
  30,
  0,
  0,
  0,
  'Budget shortfalls, programme sustainability risk',
  NULL,
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

-- ============================================================================
-- CATEGORY 5: LEARNING PLANS & ASSESSMENTS (6 checkpoints)
-- ============================================================================

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_LEARNING_PLAN_30DAYS',
  'Individual Learning Plan Created Within 30 Days',
  'Create Individual Learning Plan (ILP) within 30 days of intern commencement. Required for SETA compliance and effective skills development.',
  'document',
  'once_per_intern',
  'training_coordinator',
  15,
  1,
  0,
  0,
  'SETA non-compliance, ineffective training',
  'intern_learning_plans.created_at',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_LEARNING_PLAN_QUARTERLY_REVIEW',
  'Learning Plan Quarterly Review & Updates',
  'Review and update Individual Learning Plans quarterly to reflect progress, adjust objectives, and address gaps. Document all revisions.',
  'compliance',
  'quarterly',
  'training_coordinator',
  30,
  1,
  0,
  0,
  'Poor learning outcomes, SETA audit findings',
  'intern_learning_plans.last_review_date',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_FORMATIVE_ASSESSMENTS',
  'Formative Assessments (Monthly)',
  'Conduct monthly formative assessments to monitor skill development, identify learning gaps, and provide feedback. Document all assessments.',
  'assessment',
  'monthly',
  'mentor',
  10,
  1,
  0,
  0,
  'Poor learning outcomes, SETA grant withholding',
  'intern_assessments.assessment_date',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SUMMATIVE_ASSESSMENTS',
  'Summative Assessments (Quarterly)',
  'Conduct quarterly summative assessments to measure competency achievement against learning plan objectives. Required for SETA progress reporting.',
  'assessment',
  'quarterly',
  'training_coordinator',
  30,
  1,
  0,
  0,
  'SETA progress grant withheld, non-compliance',
  'intern_assessments.assessment_date',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_FINAL_ASSESSMENT',
  'Final Competency Assessment (30 Days Before Completion)',
  'Conduct final summative assessment 30 days before expected completion date. Determines qualification readiness and employment suitability.',
  'assessment',
  'once_per_intern',
  'training_coordinator',
  45,
  1,
  0,
  0,
  'Incomplete qualification, SETA completion grant not claimable',
  'intern_assessments.assessment_date',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_ASSESSOR_CREDENTIALS',
  'Assessor Registration & Credentials Verification',
  'Ensure all assessors conducting formal assessments are QCTO/SETA registered and credentials are valid. Invalid assessors = invalid assessments.',
  'compliance',
  'annually',
  'training_coordinator',
  60,
  0,
  0,
  0,
  'Assessments invalidated, qualification not awarded, grant clawback',
  'employees.assessor_registration_number',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

-- ============================================================================
-- CATEGORY 6: REGISTRATION & ONBOARDING (5 checkpoints)
-- ============================================================================

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_CONTRACT_SIGNED',
  'Intern Contract/Agreement Signed Before Commencement',
  'Ensure learnership agreement or intern contract is signed by all parties before commencement. Specifies terms, duration, stipend, and obligations.',
  'document',
  'once_per_intern',
  'hr_manager',
  0,
  0,
  0,
  0,
  'Legal disputes, unclear expectations, SETA non-compliance',
  'interns.contract_path',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_MEDICAL_CLEARANCE',
  'Medical Clearance for High-Risk Roles',
  'If intern role involves machinery, heights, chemicals, or physical exertion, obtain medical fitness certificate before commencement. OHSA requirement.',
  'document',
  'once_per_intern',
  'hr_manager',
  7,
  0,
  0,
  100000,
  'OHSA violation, workplace injury liability',
  'interns.medical_clearance_path',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_INDUCTION_COMPLETION',
  'Intern Induction Programme Completion (First Week)',
  'Complete comprehensive induction covering workplace policies, health & safety, POPIA consent, code of conduct, and emergency procedures.',
  'training',
  'once_per_intern',
  'hr_manager',
  3,
  0,
  0,
  0,
  'Safety incidents, policy violations, poor integration',
  'interns.induction_completed_at',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_POPIA_CONSENT',
  'POPIA Consent for Intern Data Processing',
  'Obtain written POPIA consent for processing intern personal information (ID, contact details, assessments, photos). Required before data capture.',
  'document',
  'once_per_intern',
  'hr_manager',
  0,
  0,
  0,
  10000000,
  'POPIA violation, fines up to R10 million',
  'interns.popia_consent_path',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_MENTOR_ASSIGNMENT',
  'Mentor Assignment Within 7 Days of Commencement',
  'Assign qualified workplace mentor within 7 days of intern starting. Mentor must meet SETA qualification requirements for learnership compliance.',
  'compliance',
  'once_per_intern',
  'training_coordinator',
  3,
  1,
  0,
  0,
  'SETA non-compliance, poor learning outcomes',
  'intern_mentorship_sessions.mentor_id',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

-- ============================================================================
-- CATEGORY 7: GRADUATION & EXIT MANAGEMENT (5 checkpoints)
-- ============================================================================

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_GRADUATION_READINESS',
  'Graduation Readiness Review (60 Days Before End)',
  'Conduct graduation readiness review 60 days before expected end date: verify competency, assessments complete, qualification requirements met.',
  'compliance',
  'once_per_intern',
  'training_coordinator',
  60,
  1,
  0,
  0,
  'Delayed graduation, incomplete qualification',
  'interns.expected_end_date',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_QUALIFICATION_ISSUANCE',
  'Qualification/Certificate Issuance (30 Days Post-Completion)',
  'Apply for and issue qualification certificate from SETA/QCTO within 30 days of completion. Required for SETA completion grant claim.',
  'document',
  'once_per_intern',
  'training_coordinator',
  15,
  0,
  0,
  0,
  'SETA completion grant forfeiture (R30,000-R80,000)',
  'intern_completions.qualification_certificate_path',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_EMPLOYMENT_OUTCOME_TRACKING',
  'Employment Outcome Tracking & Reporting',
  'Track and report employment outcome for 12 months post-completion (employed by host, employed elsewhere, unemployed, further study, entrepreneurship).',
  'report',
  'once_per_intern',
  'training_coordinator',
  30,
  0,
  0,
  0,
  'SETA/YES outcome reporting incomplete, future funding risk',
  'intern_completions.employment_status',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_EXIT_INTERVIEW',
  'Structured Exit Interview & Feedback',
  'Conduct exit interview to gather feedback on programme quality, mentorship effectiveness, skills gained, and employment readiness.',
  'compliance',
  'once_per_intern',
  'training_coordinator',
  7,
  0,
  0,
  0,
  'Programme improvement opportunities missed',
  'intern_completions.exit_interview_completed',
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_GRADUATION_CEREMONY',
  'Graduation Ceremony & Recognition',
  'Host quarterly graduation ceremony to recognize intern achievements, present certificates, and celebrate employment conversions. Boosts employer brand.',
  'event',
  'quarterly',
  'hr_manager',
  30,
  0,
  0,
  0,
  'Missed employer branding opportunity, low intern morale',
  NULL,
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

-- ============================================================================
-- CATEGORY 8: RECORD-KEEPING & AUDIT READINESS (5 checkpoints)
-- ============================================================================

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_RECORDS_5YEARS',
  'Intern Records Retention (5 Years Post-Completion)',
  'Retain all intern records for minimum 5 years post-completion: contracts, assessments, attendance, stipends, SETA correspondence. Required for audits.',
  'record_keeping',
  'ongoing',
  'hr_manager',
  0,
  0,
  0,
  0,
  'SETA audit failure, grant clawback, legal disputes',
  NULL,
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_SETA_AUDIT_READINESS',
  'SETA Audit Readiness Check',
  'Quarterly audit readiness check: ensure all SETA documentation is complete, up-to-date, and easily accessible. Prepare for unannounced SETA audits.',
  'audit',
  'quarterly',
  'compliance_officer',
  30,
  0,
  0,
  0,
  'SETA audit findings, grant clawback',
  NULL,
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_YES_AUDIT_READINESS',
  'YES Audit Readiness Check',
  'Semi-annual YES audit readiness check: verify all attendance records, stipend proofs, and monthly reports are complete. Prepare for B-BBEE verification audits.',
  'audit',
  'semi_annually',
  'compliance_officer',
  30,
  0,
  0,
  0,
  'B-BBEE points disallowed, verification failures',
  NULL,
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_ATTENDANCE_REGISTER',
  'Daily Attendance Register Maintenance',
  'Maintain daily signed attendance register for all interns. Required for SETA/YES reporting and proof of work experience. Digital or physical records acceptable.',
  'record_keeping',
  'daily',
  'training_coordinator',
  0,
  1,
  0,
  0,
  'SETA/YES reporting failure, grant/B-BBEE points withheld',
  NULL,
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

INSERT INTO compliance_checkpoints (
  category_id, code, title, description,
  check_type, frequency, responsible_role,
  days_before_alert, is_automated,
  penalty_amount_min, penalty_amount_max, penalty_description,
  compliance_status_field, created_at
)
SELECT
  cc.id,
  'INTERN_DOCUMENT_COMPLETENESS',
  'Intern File Completeness Audit',
  'Monthly audit: verify each intern file contains all required documents (ID copy, contract, POPIA consent, medical clearance, learning plan, assessments).',
  'audit',
  'monthly',
  'hr_manager',
  10,
  1,
  0,
  0,
  'Compliance gaps, audit failures, legal exposure',
  NULL,
  CURRENT_TIMESTAMP
FROM compliance_categories cc WHERE cc.code = 'INTERNS_MANAGEMENT';

-- ============================================================================
-- SUMMARY QUERY: Count checkpoints by category
-- ============================================================================

-- Run this to verify checkpoint counts:
-- SELECT 
--   'SETA Registration & Compliance' as category, COUNT(*) as checkpoint_count
-- FROM compliance_checkpoints WHERE code LIKE 'INTERN_SETA_%'
-- UNION ALL
-- SELECT 'YES Program Compliance', COUNT(*) FROM compliance_checkpoints WHERE code LIKE 'INTERN_YES_%'
-- UNION ALL
-- SELECT 'NYS Program Compliance', COUNT(*) FROM compliance_checkpoints WHERE code LIKE 'INTERN_NYS_%'
-- UNION ALL
-- SELECT 'Stipend Payments & Financial', COUNT(*) FROM compliance_checkpoints WHERE code LIKE 'INTERN_STIPEND_%' OR code LIKE 'INTERN_PAYE_%' OR code LIKE 'INTERN_UIF_%' OR code LIKE 'INTERN_LEGAL_%' OR code LIKE 'INTERN_GRANT_%'
-- UNION ALL
-- SELECT 'Learning Plans & Assessments', COUNT(*) FROM compliance_checkpoints WHERE code LIKE 'INTERN_LEARNING_%' OR code LIKE 'INTERN_FORMATIVE_%' OR code LIKE 'INTERN_SUMMATIVE_%' OR code LIKE 'INTERN_FINAL_%' OR code LIKE 'INTERN_ASSESSOR_%'
-- UNION ALL
-- SELECT 'Registration & Onboarding', COUNT(*) FROM compliance_checkpoints WHERE code LIKE 'INTERN_CONTRACT_%' OR code LIKE 'INTERN_MEDICAL_%' OR code LIKE 'INTERN_INDUCTION_%' OR code LIKE 'INTERN_POPIA_%' OR code LIKE 'INTERN_MENTOR_ASSIGNMENT%'
-- UNION ALL
-- SELECT 'Graduation & Exit Management', COUNT(*) FROM compliance_checkpoints WHERE code LIKE 'INTERN_GRADUATION_%' OR code LIKE 'INTERN_QUALIFICATION_%' OR code LIKE 'INTERN_EMPLOYMENT_%' OR code LIKE 'INTERN_EXIT_%'
-- UNION ALL
-- SELECT 'Record-Keeping & Audit Readiness', COUNT(*) FROM compliance_checkpoints WHERE code LIKE 'INTERN_RECORDS_%' OR code LIKE 'INTERN_ATTENDANCE_%' OR code LIKE 'INTERN_DOCUMENT_%' OR code LIKE '%AUDIT_READINESS%';

-- ============================================================================
-- CHECKPOINT DISTRIBUTION:
-- ============================================================================
-- SETA Registration & Compliance: 10 checkpoints
-- YES Program Compliance: 8 checkpoints
-- NYS Program Compliance: 5 checkpoints
-- Stipend Payments & Financial: 8 checkpoints
-- Learning Plans & Assessments: 6 checkpoints
-- Registration & Onboarding: 5 checkpoints
-- Graduation & Exit Management: 5 checkpoints
-- Record-Keeping & Audit Readiness: 5 checkpoints
-- ============================================================================
-- TOTAL: 52 INTERN-SPECIFIC COMPLIANCE CHECKPOINTS
-- ============================================================================
