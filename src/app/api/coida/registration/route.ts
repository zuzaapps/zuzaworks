import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function GET() {
  try {
    const registration = queryOne<any>(`
      SELECT
        id,
        employer_name,
        registration_number,
        cf_registration_number,
        registration_date,
        employer_class,
        assessment_rate,
        industry_code,
        industry_description,
        postal_address,
        physical_address,
        contact_person,
        contact_phone,
        contact_email,
        total_employees,
        total_annual_earnings,
        status,
        last_updated_at,
        created_at
      FROM coida_registration
      WHERE id = 1
    `);

    if (!registration) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No COIDA registration found. Please initialize the COIDA system first.',
      });
    }

    return NextResponse.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch COIDA registration', message: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employer_name,
      registration_number,
      cf_registration_number,
      employer_class,
      assessment_rate,
      industry_code,
      industry_description,
      postal_address,
      physical_address,
      contact_person,
      contact_phone,
      contact_email,
      total_employees,
      total_annual_earnings,
      status,
    } = body;

    const existing = queryOne<any>(`SELECT id FROM coida_registration WHERE id = 1`);

    if (!existing) {
      execute(
        `INSERT INTO coida_registration (
          id, employer_name, registration_number, cf_registration_number,
          employer_class, assessment_rate, industry_code, industry_description,
          postal_address, physical_address, contact_person, contact_phone,
          contact_email, total_employees, total_annual_earnings, status,
          registration_date, last_updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE('now'), datetime('now'))`,
        [
          employer_name || null, registration_number || null, cf_registration_number || null,
          employer_class || null, assessment_rate || null, industry_code || null,
          industry_description || null, postal_address || null, physical_address || null,
          contact_person || null, contact_phone || null, contact_email || null,
          total_employees || null, total_annual_earnings || null, status || 'active',
        ]
      );
    } else {
      execute(
        `UPDATE coida_registration
         SET employer_name = COALESCE(?, employer_name),
             registration_number = COALESCE(?, registration_number),
             cf_registration_number = COALESCE(?, cf_registration_number),
             employer_class = COALESCE(?, employer_class),
             assessment_rate = COALESCE(?, assessment_rate),
             industry_code = COALESCE(?, industry_code),
             industry_description = COALESCE(?, industry_description),
             postal_address = COALESCE(?, postal_address),
             physical_address = COALESCE(?, physical_address),
             contact_person = COALESCE(?, contact_person),
             contact_phone = COALESCE(?, contact_phone),
             contact_email = COALESCE(?, contact_email),
             total_employees = COALESCE(?, total_employees),
             total_annual_earnings = COALESCE(?, total_annual_earnings),
             status = COALESCE(?, status),
             last_updated_at = datetime('now')
         WHERE id = 1`,
        [
          employer_name || null, registration_number || null, cf_registration_number || null,
          employer_class || null, assessment_rate || null, industry_code || null,
          industry_description || null, postal_address || null, physical_address || null,
          contact_person || null, contact_phone || null, contact_email || null,
          total_employees || null, total_annual_earnings || null, status || null,
        ]
      );
    }

    const updated = queryOne<any>(`SELECT * FROM coida_registration WHERE id = 1`);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update COIDA registration', message: String(error) },
      { status: 500 }
    );
  }
}
