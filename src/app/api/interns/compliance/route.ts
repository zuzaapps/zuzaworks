import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';

    if (action === 'dashboard') {
      // Overall intern compliance dashboard
      const totalInterns = queryOne<any>(`SELECT COUNT(*) as count FROM interns WHERE status = 'active'`);

      // Check compliance across all active interns
      const agreementCompliance = queryOne<any>(`
        SELECT COUNT(*) as count FROM interns
        WHERE status = 'active' AND start_date IS NOT NULL
      `);

      const stipendCompliance = queryOne<any>(`
        SELECT COUNT(DISTINCT i.id) as count
        FROM interns i
        WHERE i.status = 'active'
          AND EXISTS (
            SELECT 1 FROM intern_stipend_payments sp
            WHERE sp.intern_id = i.id AND sp.status = 'paid'
          )
      `);

      const mentorshipCompliance = queryOne<any>(`
        SELECT COUNT(DISTINCT i.id) as count
        FROM interns i
        WHERE i.status = 'active'
          AND EXISTS (
            SELECT 1 FROM intern_mentorship_sessions ms
            WHERE ms.intern_id = i.id AND ms.status = 'completed'
          )
      `);

      const assessmentCompliance = queryOne<any>(`
        SELECT COUNT(DISTINCT i.id) as count
        FROM interns i
        WHERE i.status = 'active'
          AND EXISTS (
            SELECT 1 FROM intern_assessments ia
            WHERE ia.intern_id = i.id AND ia.status = 'completed'
          )
      `);

      const total = totalInterns?.count || 0;

      return NextResponse.json({
        success: true,
        data: {
          total_active_interns: total,
          compliance_areas: [
            {
              area: 'Agreements',
              compliant: agreementCompliance?.count || 0,
              total,
              percentage: total > 0 ? Math.round(((agreementCompliance?.count || 0) / total) * 100) : 0,
            },
            {
              area: 'Stipend Payments',
              compliant: stipendCompliance?.count || 0,
              total,
              percentage: total > 0 ? Math.round(((stipendCompliance?.count || 0) / total) * 100) : 0,
            },
            {
              area: 'Mentorship Sessions',
              compliant: mentorshipCompliance?.count || 0,
              total,
              percentage: total > 0 ? Math.round(((mentorshipCompliance?.count || 0) / total) * 100) : 0,
            },
            {
              area: 'Assessments',
              compliant: assessmentCompliance?.count || 0,
              total,
              percentage: total > 0 ? Math.round(((assessmentCompliance?.count || 0) / total) * 100) : 0,
            },
          ],
          overall_score: total > 0
            ? Math.round(
                (((agreementCompliance?.count || 0) +
                  (stipendCompliance?.count || 0) +
                  (mentorshipCompliance?.count || 0) +
                  (assessmentCompliance?.count || 0)) /
                  (total * 4)) *
                  100
              )
            : 0,
        },
      });
    }

    if (action === 'checkpoints') {
      // Get intern-specific compliance checkpoints
      const checkpoints = query<any>(`
        SELECT
          cp.id,
          cp.code,
          cp.title,
          cp.description,
          cp.check_type,
          cp.frequency,
          cc.name as category_name,
          cc.code as category_code
        FROM compliance_checkpoints cp
        JOIN compliance_categories cc ON cp.category_id = cc.id
        WHERE cc.code IN ('SDA', 'BCEA', 'EEA')
          AND cp.is_active = 1
        ORDER BY cc.name, cp.title
      `);

      return NextResponse.json({
        success: true,
        data: checkpoints,
      });
    }

    if (action === 'alerts') {
      // Get intern-related compliance alerts
      const alerts = query<any>(`
        SELECT
          ca.id,
          ca.alert_type,
          ca.severity,
          ca.title,
          ca.description,
          ca.due_date,
          ca.status,
          ca.created_at,
          i.first_name,
          i.last_name,
          i.intern_number
        FROM compliance_alerts ca
        LEFT JOIN interns i ON ca.employee_id = i.id
        WHERE ca.alert_type IN ('training', 'deadline', 'expiry')
          AND ca.status IN ('new', 'acknowledged')
        ORDER BY ca.severity DESC, ca.due_date ASC
        LIMIT 20
      `);

      return NextResponse.json({
        success: true,
        data: alerts,
      });
    }

    if (action === 'scan') {
      // Run compliance scan across all active interns
      const activeInterns = query<any>(`
        SELECT i.id, i.intern_number, i.first_name, i.last_name,
               i.start_date, i.end_date, i.stipend_amount,
               ip.program_name
        FROM interns i
        LEFT JOIN intern_programs ip ON i.program_id = ip.id
        WHERE i.status = 'active'
      `);

      const issues: any[] = [];

      for (const intern of activeInterns) {
        // Check stipend payments
        const lastStipend = queryOne<any>(`
          SELECT MAX(payment_date) as last_payment
          FROM intern_stipend_payments
          WHERE intern_id = ? AND status = 'paid'
        `, [intern.id]);

        if (!lastStipend?.last_payment) {
          issues.push({
            intern_id: intern.id,
            intern_number: intern.intern_number,
            intern_name: `${intern.first_name} ${intern.last_name}`,
            issue_type: 'missing_stipend',
            severity: 'warning',
            description: 'No stipend payments recorded',
          });
        }

        // Check mentorship
        const mentorshipCount = queryOne<any>(`
          SELECT COUNT(*) as count FROM intern_mentorship_sessions
          WHERE intern_id = ? AND status = 'completed'
        `, [intern.id]);

        if ((mentorshipCount?.count || 0) === 0) {
          issues.push({
            intern_id: intern.id,
            intern_number: intern.intern_number,
            intern_name: `${intern.first_name} ${intern.last_name}`,
            issue_type: 'no_mentorship',
            severity: 'warning',
            description: 'No mentorship sessions recorded',
          });
        }

        // Check if end date is approaching with no assessment
        if (intern.end_date) {
          const daysRemaining = Math.ceil((new Date(intern.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysRemaining <= 30 && daysRemaining > 0) {
            const assessmentCount = queryOne<any>(`
              SELECT COUNT(*) as count FROM intern_assessments
              WHERE intern_id = ? AND status = 'completed'
            `, [intern.id]);

            if ((assessmentCount?.count || 0) === 0) {
              issues.push({
                intern_id: intern.id,
                intern_number: intern.intern_number,
                intern_name: `${intern.first_name} ${intern.last_name}`,
                issue_type: 'ending_no_assessment',
                severity: 'critical',
                description: `Program ending in ${daysRemaining} days with no assessments`,
              });
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          scanned_interns: activeInterns.length,
          total_issues: issues.length,
          critical_issues: issues.filter(i => i.severity === 'critical').length,
          warning_issues: issues.filter(i => i.severity === 'warning').length,
          issues,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use: dashboard, checkpoints, alerts, or scan' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intern compliance data', message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'seed') {
      // Create intern-specific tables
      const db = getDb();

      db.exec(`
        CREATE TABLE IF NOT EXISTS intern_programs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          program_name TEXT NOT NULL,
          program_type TEXT NOT NULL CHECK(program_type IN ('learnership', 'internship', 'apprenticeship', 'yes_program', 'skills_program')),
          description TEXT,
          seta_id TEXT,
          qualification_code TEXT,
          qualification_title TEXT,
          nqf_level INTEGER,
          credits INTEGER,
          duration_months INTEGER DEFAULT 12,
          max_interns INTEGER,
          stipend_amount REAL,
          stipend_frequency TEXT DEFAULT 'monthly',
          mentor_id INTEGER,
          start_date TEXT,
          end_date TEXT,
          status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'completed', 'cancelled')),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS interns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          intern_number TEXT NOT NULL UNIQUE,
          program_id INTEGER REFERENCES intern_programs(id),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          id_number TEXT,
          date_of_birth TEXT,
          gender TEXT,
          race TEXT,
          disability_status INTEGER DEFAULT 0,
          email TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          city TEXT,
          province TEXT,
          postal_code TEXT,
          qualification TEXT,
          institution TEXT,
          year_completed INTEGER,
          mentor_id INTEGER,
          department_id INTEGER,
          location_id INTEGER,
          start_date TEXT,
          end_date TEXT,
          stipend_amount REAL,
          status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'terminated', 'suspended', 'withdrawn')),
          completion_date TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS intern_stipend_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          intern_id INTEGER NOT NULL REFERENCES interns(id),
          amount REAL NOT NULL,
          net_amount REAL,
          deductions REAL DEFAULT 0,
          payment_date TEXT NOT NULL,
          period_start TEXT,
          period_end TEXT,
          payment_method TEXT DEFAULT 'bank_transfer',
          payment_reference TEXT,
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'reversed')),
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS intern_mentorship_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          intern_id INTEGER NOT NULL REFERENCES interns(id),
          mentor_id INTEGER,
          session_date TEXT NOT NULL,
          duration_hours REAL,
          session_type TEXT DEFAULT 'one_on_one',
          topics_covered TEXT,
          objectives TEXT,
          outcomes TEXT,
          intern_feedback TEXT,
          mentor_feedback TEXT,
          next_session_date TEXT,
          action_items TEXT,
          notes TEXT,
          status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS intern_assessments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          intern_id INTEGER NOT NULL REFERENCES interns(id),
          assessment_type TEXT NOT NULL,
          assessment_date TEXT NOT NULL,
          assessor_id INTEGER,
          assessor_name TEXT,
          score REAL,
          max_score REAL,
          percentage REAL,
          grade TEXT,
          competencies_assessed TEXT,
          strengths TEXT,
          areas_for_improvement TEXT,
          recommendations TEXT,
          intern_comments TEXT,
          assessor_comments TEXT,
          next_assessment_date TEXT,
          notes TEXT,
          status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS intern_completions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          intern_id INTEGER NOT NULL UNIQUE REFERENCES interns(id),
          completion_date TEXT NOT NULL,
          completion_type TEXT DEFAULT 'successful' CHECK(completion_type IN ('successful', 'partial', 'early_termination')),
          certificate_number TEXT,
          certificate_issued INTEGER DEFAULT 0,
          final_assessment_score REAL,
          final_grade TEXT,
          competencies_achieved TEXT,
          hours_completed REAL,
          credits_achieved INTEGER,
          employer_recommendation TEXT,
          mentor_comments TEXT,
          intern_feedback TEXT,
          employment_offered INTEGER DEFAULT 0,
          employment_start_date TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS seta_grants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          seta_name TEXT NOT NULL,
          seta_id TEXT,
          grant_type TEXT NOT NULL,
          grant_reference TEXT,
          application_date TEXT,
          approval_date TEXT,
          grant_amount REAL,
          amount_received REAL DEFAULT 0,
          amount_pending REAL DEFAULT 0,
          financial_year TEXT,
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'disbursed', 'completed')),
          conditions TEXT,
          reporting_deadline TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS seta_wsp_submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          financial_year TEXT NOT NULL,
          submission_type TEXT NOT NULL CHECK(submission_type IN ('WSP', 'ATR', 'WSP_ATR')),
          submission_date TEXT,
          submission_deadline TEXT,
          status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'accepted', 'rejected', 'amended')),
          seta_name TEXT,
          reference_number TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      return NextResponse.json({
        success: true,
        data: {
          message: 'Intern compliance tables seeded successfully',
          tables_created: [
            'intern_programs',
            'interns',
            'intern_stipend_payments',
            'intern_mentorship_sessions',
            'intern_assessments',
            'intern_completions',
            'seta_grants',
            'seta_wsp_submissions',
          ],
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use: seed' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to execute intern compliance action', message: String(error) },
      { status: 500 }
    );
  }
}
