import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();

    db.exec(`
      CREATE TABLE IF NOT EXISTS coida_registration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employer_name TEXT,
        registration_number TEXT,
        cf_registration_number TEXT,
        registration_date TEXT,
        employer_class TEXT,
        assessment_rate REAL,
        industry_code TEXT,
        industry_description TEXT,
        postal_address TEXT,
        physical_address TEXT,
        contact_person TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        total_employees INTEGER,
        total_annual_earnings REAL,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended', 'cancelled')),
        last_updated_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS coida_annual_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_year INTEGER NOT NULL UNIQUE,
        total_employees INTEGER,
        total_annual_earnings REAL,
        assessment_rate REAL,
        assessment_amount REAL,
        industry_code TEXT,
        submission_date TEXT,
        submitted_by TEXT,
        acceptance_date TEXT,
        reference_number TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'accepted', 'rejected', 'amended')),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS coida_advance_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_year INTEGER NOT NULL,
        amount_due REAL,
        amount_paid REAL NOT NULL,
        payment_date TEXT NOT NULL,
        payment_method TEXT,
        payment_reference TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'partial', 'overdue', 'refunded')),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS coida_letter_of_good_standing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_number TEXT,
        issue_date TEXT,
        expiry_date TEXT,
        status TEXT NOT NULL DEFAULT 'valid' CHECK(status IN ('valid', 'expired', 'revoked', 'pending')),
        certificate_number TEXT,
        document_path TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS coida_incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_number TEXT NOT NULL UNIQUE,
        employee_id INTEGER NOT NULL,
        incident_date TEXT NOT NULL,
        incident_time TEXT,
        incident_type TEXT NOT NULL DEFAULT 'workplace_injury' CHECK(incident_type IN ('workplace_injury', 'occupational_disease', 'commuting_accident', 'fatal')),
        location_description TEXT,
        location_id INTEGER,
        description TEXT NOT NULL,
        injury_description TEXT,
        body_part_injured TEXT,
        injury_severity TEXT NOT NULL DEFAULT 'minor' CHECK(injury_severity IN ('minor', 'moderate', 'serious', 'critical', 'fatal')),
        witness_names TEXT,
        witness_statements TEXT,
        immediate_action_taken TEXT,
        first_aid_administered INTEGER NOT NULL DEFAULT 0,
        first_aid_by TEXT,
        medical_treatment_required INTEGER NOT NULL DEFAULT 0,
        hospital_name TEXT,
        doctor_name TEXT,
        reported_by TEXT,
        days_absent INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'reported' CHECK(status IN ('reported', 'investigating', 'claim_submitted', 'claim_accepted', 'claim_rejected', 'closed')),
        wcl2_submitted INTEGER NOT NULL DEFAULT 0,
        wcl2_submission_date TEXT,
        wcl2_reference TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS coida_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_reference TEXT NOT NULL UNIQUE,
        incident_id INTEGER NOT NULL REFERENCES coida_incidents(id),
        employee_id INTEGER NOT NULL,
        claim_type TEXT NOT NULL DEFAULT 'medical' CHECK(claim_type IN ('medical', 'temporary_disability', 'permanent_disability', 'fatal', 'combined')),
        claim_description TEXT,
        medical_costs REAL DEFAULT 0,
        temporary_disability_days INTEGER DEFAULT 0,
        permanent_disability_percentage REAL DEFAULT 0,
        fatal INTEGER NOT NULL DEFAULT 0,
        dependants_details TEXT,
        submission_date TEXT,
        submitted_by TEXT,
        acceptance_date TEXT,
        rejection_reason TEXT,
        compensation_amount REAL,
        compensation_paid_date TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'paid', 'appealed', 'closed')),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    return NextResponse.json({
      success: true,
      data: {
        message: 'COIDA tables initialized successfully',
        tables_created: [
          'coida_registration',
          'coida_annual_returns',
          'coida_advance_payments',
          'coida_letter_of_good_standing',
          'coida_incidents',
          'coida_claims',
        ],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to initialize COIDA tables', message: String(error) },
      { status: 500 }
    );
  }
}
