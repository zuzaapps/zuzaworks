import { NextResponse } from 'next/server';
import { execute, getDb, query } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();

    // Create compliance tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS compliance_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        risk_level TEXT NOT NULL DEFAULT 'medium' CHECK(risk_level IN ('critical', 'high', 'medium', 'low')),
        governing_body TEXT,
        legislation TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS compliance_checkpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES compliance_categories(id),
        code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        check_type TEXT NOT NULL DEFAULT 'document' CHECK(check_type IN ('document', 'registration', 'payment', 'submission', 'training', 'policy', 'audit', 'certification')),
        frequency TEXT NOT NULL DEFAULT 'annual' CHECK(frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'once_off', 'as_needed')),
        responsible_role TEXT,
        days_before_alert INTEGER DEFAULT 30,
        is_automated INTEGER NOT NULL DEFAULT 0,
        penalty_amount_min REAL,
        penalty_amount_max REAL,
        legislation_reference TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS organization_compliance_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checkpoint_id INTEGER NOT NULL REFERENCES compliance_checkpoints(id),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('compliant', 'non_compliant', 'pending', 'in_progress', 'not_applicable')),
        compliance_date TEXT,
        expiry_date TEXT,
        next_review_date TEXT,
        evidence_document_path TEXT,
        notes TEXT,
        last_checked_at TEXT,
        last_checked_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS employee_compliance_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        checkpoint_id INTEGER NOT NULL REFERENCES compliance_checkpoints(id),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('compliant', 'non_compliant', 'pending', 'in_progress', 'not_applicable')),
        compliance_date TEXT,
        expiry_date TEXT,
        next_review_date TEXT,
        evidence_document_path TEXT,
        notes TEXT,
        last_checked_at TEXT,
        last_checked_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(employee_id, checkpoint_id)
      );

      CREATE TABLE IF NOT EXISTS compliance_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER REFERENCES compliance_categories(id),
        checkpoint_id INTEGER REFERENCES compliance_checkpoints(id),
        employee_id INTEGER,
        alert_type TEXT NOT NULL DEFAULT 'expiry' CHECK(alert_type IN ('expiry', 'deadline', 'violation', 'renewal', 'audit', 'policy_update', 'training', 'custom')),
        severity TEXT NOT NULL DEFAULT 'info' CHECK(severity IN ('critical', 'warning', 'info')),
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT,
        days_until_due INTEGER,
        responsible_role TEXT,
        assigned_to TEXT,
        status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
        acknowledged_at TEXT,
        acknowledged_by TEXT,
        resolved_at TEXT,
        resolved_by TEXT,
        resolution_notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS compliance_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT NOT NULL,
        checkpoint_id INTEGER,
        employee_id INTEGER,
        old_status TEXT,
        new_status TEXT,
        performed_by TEXT,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS employee_training_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        training_name TEXT NOT NULL,
        training_provider TEXT,
        training_date TEXT,
        completion_date TEXT,
        expiry_date TEXT,
        certificate_number TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'expired', 'failed')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS employment_contract_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL UNIQUE,
        contract_type TEXT,
        start_date TEXT,
        end_date TEXT,
        probation_end_date TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        last_reviewed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS statutory_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_type TEXT NOT NULL,
        period_start TEXT,
        period_end TEXT,
        due_date TEXT NOT NULL,
        amount_due REAL,
        amount_paid REAL,
        payment_date TEXT,
        payment_reference TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue', 'partial')),
        late_penalty REAL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS statutory_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_type TEXT NOT NULL,
        reporting_period_start TEXT,
        reporting_period_end TEXT,
        submission_deadline TEXT NOT NULL,
        submission_date TEXT,
        submission_reference TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'overdue', 'accepted', 'rejected')),
        submitted_by TEXT,
        report_document_path TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS bcea_violations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER DEFAULT 1,
        employee_id INTEGER NOT NULL,
        violation_type TEXT NOT NULL,
        violation_date TEXT NOT NULL,
        description TEXT,
        severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('critical', 'high', 'medium', 'low')),
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved', 'dismissed')),
        resolution_notes TEXT,
        resolved_by TEXT,
        resolved_at TEXT,
        is_recurring INTEGER NOT NULL DEFAULT 0,
        preventive_action TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Seed South African compliance categories
    const existingCategories = query<any>(`SELECT COUNT(*) as count FROM compliance_categories`);
    if (existingCategories[0]?.count === 0) {
      const categories = [
        { code: 'BCEA', name: 'Basic Conditions of Employment Act', description: 'BCEA compliance including working hours, leave, and contracts', risk_level: 'critical', governing_body: 'Department of Employment and Labour', legislation: 'Basic Conditions of Employment Act 75 of 1997' },
        { code: 'LRA', name: 'Labour Relations Act', description: 'Fair labour practices, collective bargaining, dispute resolution', risk_level: 'critical', governing_body: 'CCMA / Labour Court', legislation: 'Labour Relations Act 66 of 1995' },
        { code: 'EEA', name: 'Employment Equity Act', description: 'Workplace equity, affirmative action, non-discrimination', risk_level: 'high', governing_body: 'Department of Employment and Labour', legislation: 'Employment Equity Act 55 of 1998' },
        { code: 'SDA', name: 'Skills Development Act', description: 'Skills development levies, SETA registration, WSP/ATR submissions', risk_level: 'high', governing_body: 'SETA', legislation: 'Skills Development Act 97 of 1998' },
        { code: 'OHS', name: 'Occupational Health & Safety', description: 'Workplace safety, health regulations, incident reporting', risk_level: 'critical', governing_body: 'Department of Employment and Labour', legislation: 'Occupational Health and Safety Act 85 of 1993' },
        { code: 'COIDA', name: 'Compensation for Occupational Injuries', description: 'COIDA registration, annual returns, claims management', risk_level: 'critical', governing_body: 'Compensation Fund', legislation: 'Compensation for Occupational Injuries and Diseases Act 130 of 1993' },
        { code: 'UIF', name: 'Unemployment Insurance Fund', description: 'UIF registration, monthly declarations, contributions', risk_level: 'critical', governing_body: 'Department of Employment and Labour', legislation: 'Unemployment Insurance Act 63 of 2001' },
        { code: 'TAX', name: 'Tax Compliance', description: 'PAYE, SDL, UIF contributions, tax returns', risk_level: 'critical', governing_body: 'SARS', legislation: 'Income Tax Act 58 of 1962' },
        { code: 'POPI', name: 'Protection of Personal Information', description: 'Data protection, privacy compliance, information officer', risk_level: 'high', governing_body: 'Information Regulator', legislation: 'Protection of Personal Information Act 4 of 2013' },
        { code: 'BBEE', name: 'Broad-Based Black Economic Empowerment', description: 'B-BBEE compliance, scorecards, certificates', risk_level: 'medium', governing_body: 'DTI / B-BBEE Commission', legislation: 'Broad-Based Black Economic Empowerment Act 53 of 2003' },
      ];

      for (const cat of categories) {
        execute(
          `INSERT INTO compliance_categories (code, name, description, risk_level, governing_body, legislation)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [cat.code, cat.name, cat.description, cat.risk_level, cat.governing_body, cat.legislation]
        );
      }

      // Seed key checkpoints for each category
      const checkpoints = [
        // BCEA
        { category: 'BCEA', code: 'BCEA-001', title: 'Written Employment Contracts', description: 'All employees must have written employment contracts per Section 29', check_type: 'document', frequency: 'once_off', penalty_min: 500, penalty_max: 10000 },
        { category: 'BCEA', code: 'BCEA-002', title: 'Working Hours Compliance', description: 'Maximum 45 ordinary hours per week (Section 9)', check_type: 'audit', frequency: 'weekly', penalty_min: 1000, penalty_max: 50000 },
        { category: 'BCEA', code: 'BCEA-003', title: 'Overtime Compliance', description: 'Maximum 10 hours overtime per week, paid at 1.5x rate', check_type: 'audit', frequency: 'weekly', penalty_min: 1000, penalty_max: 50000 },
        { category: 'BCEA', code: 'BCEA-004', title: 'Annual Leave Provision', description: 'Minimum 21 consecutive days annual leave per cycle', check_type: 'audit', frequency: 'annual', penalty_min: 500, penalty_max: 10000 },
        { category: 'BCEA', code: 'BCEA-005', title: 'Sick Leave Records', description: 'Proper sick leave records and medical certificates', check_type: 'document', frequency: 'monthly', penalty_min: 500, penalty_max: 10000 },
        // LRA
        { category: 'LRA', code: 'LRA-001', title: 'Disciplinary Code & Procedures', description: 'Written disciplinary code accessible to all employees', check_type: 'policy', frequency: 'annual', penalty_min: 5000, penalty_max: 100000 },
        { category: 'LRA', code: 'LRA-002', title: 'Grievance Procedures', description: 'Formal grievance procedures in place', check_type: 'policy', frequency: 'annual', penalty_min: 5000, penalty_max: 50000 },
        // EEA
        { category: 'EEA', code: 'EEA-001', title: 'Employment Equity Plan', description: 'Current EE plan filed with Department of Labour', check_type: 'submission', frequency: 'annual', penalty_min: 50000, penalty_max: 900000 },
        { category: 'EEA', code: 'EEA-002', title: 'EEA2 Report Submission', description: 'Annual EEA2 report submitted by 15 January', check_type: 'submission', frequency: 'annual', penalty_min: 50000, penalty_max: 900000 },
        // SDA
        { category: 'SDA', code: 'SDA-001', title: 'Skills Development Levy', description: 'Monthly SDL payment (1% of payroll)', check_type: 'payment', frequency: 'monthly', penalty_min: 5000, penalty_max: 50000 },
        { category: 'SDA', code: 'SDA-002', title: 'Workplace Skills Plan', description: 'Annual WSP submission to SETA by 30 April', check_type: 'submission', frequency: 'annual', penalty_min: 10000, penalty_max: 50000 },
        // OHS
        { category: 'OHS', code: 'OHS-001', title: 'Health & Safety Policy', description: 'Written OHS policy displayed at workplace', check_type: 'policy', frequency: 'annual', penalty_min: 10000, penalty_max: 100000 },
        { category: 'OHS', code: 'OHS-002', title: 'Safety Representative Appointed', description: 'H&S representative for every 20 employees', check_type: 'document', frequency: 'annual', penalty_min: 5000, penalty_max: 50000 },
        { category: 'OHS', code: 'OHS-003', title: 'First Aid Kit & Trained Personnel', description: 'Adequate first aid facilities and trained first aiders', check_type: 'certification', frequency: 'annual', penalty_min: 5000, penalty_max: 50000 },
        // COIDA
        { category: 'COIDA', code: 'COIDA-001', title: 'COIDA Registration', description: 'Employer registered with Compensation Fund', check_type: 'registration', frequency: 'once_off', penalty_min: 10000, penalty_max: 100000 },
        { category: 'COIDA', code: 'COIDA-002', title: 'COIDA Annual Return', description: 'Annual return of earnings submitted', check_type: 'submission', frequency: 'annual', penalty_min: 10000, penalty_max: 100000 },
        { category: 'COIDA', code: 'COIDA-003', title: 'Letter of Good Standing', description: 'Valid Letter of Good Standing', check_type: 'document', frequency: 'annual', penalty_min: 10000, penalty_max: 50000 },
        // UIF
        { category: 'UIF', code: 'UIF-001', title: 'UIF Registration', description: 'Employer registered with UIF', check_type: 'registration', frequency: 'once_off', penalty_min: 10000, penalty_max: 50000 },
        { category: 'UIF', code: 'UIF-002', title: 'Monthly UIF Declarations', description: 'Monthly UIF declarations submitted via uFiling', check_type: 'submission', frequency: 'monthly', penalty_min: 1000, penalty_max: 20000 },
        // TAX
        { category: 'TAX', code: 'TAX-001', title: 'PAYE Registration', description: 'Employer registered for PAYE', check_type: 'registration', frequency: 'once_off', penalty_min: 10000, penalty_max: 100000 },
        { category: 'TAX', code: 'TAX-002', title: 'Monthly EMP201 Submission', description: 'Monthly employer return (PAYE, SDL, UIF)', check_type: 'submission', frequency: 'monthly', penalty_min: 5000, penalty_max: 50000 },
        { category: 'TAX', code: 'TAX-003', title: 'Bi-Annual EMP501 Reconciliation', description: 'IRP5/IT3(a) reconciliation submitted', check_type: 'submission', frequency: 'annual', penalty_min: 10000, penalty_max: 100000 },
        // POPI
        { category: 'POPI', code: 'POPI-001', title: 'Information Officer Registered', description: 'Information officer registered with Information Regulator', check_type: 'registration', frequency: 'once_off', penalty_min: 50000, penalty_max: 10000000 },
        { category: 'POPI', code: 'POPI-002', title: 'PAIA Manual', description: 'Section 51 manual published and accessible', check_type: 'document', frequency: 'annual', penalty_min: 50000, penalty_max: 10000000 },
        // BBEE
        { category: 'BBEE', code: 'BBEE-001', title: 'B-BBEE Certificate', description: 'Valid B-BBEE certificate or sworn affidavit', check_type: 'certification', frequency: 'annual', penalty_min: 0, penalty_max: 0 },
      ];

      for (const cp of checkpoints) {
        const cat = query<any>(`SELECT id FROM compliance_categories WHERE code = ?`, [cp.category]);
        if (cat.length > 0) {
          execute(
            `INSERT INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, penalty_amount_min, penalty_amount_max)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [cat[0].id, cp.code, cp.title, cp.description, cp.check_type, cp.frequency, cp.penalty_min, cp.penalty_max]
          );
        }
      }

      // Create organization_compliance_status entries for all checkpoints
      const allCheckpoints = query<any>(`SELECT id FROM compliance_checkpoints`);
      for (const cp of allCheckpoints) {
        execute(
          `INSERT OR IGNORE INTO organization_compliance_status (checkpoint_id, status) VALUES (?, 'pending')`,
          [cp.id]
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Compliance system initialized successfully',
        tables_created: [
          'compliance_categories',
          'compliance_checkpoints',
          'organization_compliance_status',
          'employee_compliance_status',
          'compliance_alerts',
          'compliance_audit_log',
          'employee_training_records',
          'employment_contract_status',
          'statutory_payments',
          'statutory_reports',
          'bcea_violations',
        ],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to initialize compliance system', message: String(error) },
      { status: 500 }
    );
  }
}
