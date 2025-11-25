#!/bin/bash

# ZuZaWorksOS - Realistic Test Data Seeding Script
# This script populates the system with comprehensive test data

BASE_URL="https://zuzaworksos.pages.dev"

echo "=========================================="
echo "ZuZaWorksOS Test Data Seeding"
echo "=========================================="
echo ""

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        curl -s -X $method "${BASE_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X $method "${BASE_URL}${endpoint}"
    fi
}

echo "1. Initializing Systems..."
echo "   - Compliance System"
api_call POST "/api/compliance/initialize" "" > /dev/null
echo "   - COIDA System"
api_call POST "/api/coida/initialize" "" > /dev/null
echo "   - Seeding Intern Compliance Checkpoints"
api_call POST "/api/interns/compliance/seed" "" > /dev/null
echo "   ✅ Systems initialized"
echo ""

echo "2. Creating Departments..."
api_call POST "/api/departments" '{
  "name": "Human Resources",
  "code": "HR",
  "budget": 2500000,
  "head_count": 8
}' > /dev/null

api_call POST "/api/departments" '{
  "name": "Operations",
  "code": "OPS",
  "budget": 5000000,
  "head_count": 45
}' > /dev/null

api_call POST "/api/departments" '{
  "name": "Finance & Payroll",
  "code": "FIN",
  "budget": 1800000,
  "head_count": 6
}' > /dev/null

api_call POST "/api/departments" '{
  "name": "Training & Development",
  "code": "TRN",
  "budget": 1200000,
  "head_count": 4
}' > /dev/null

echo "   ✅ 4 Departments created"
echo ""

echo "3. Creating Locations..."
api_call POST "/api/locations" '{
  "name": "Head Office - Johannesburg",
  "address": "123 Nelson Mandela Square, Sandton, Johannesburg, 2196",
  "city": "Johannesburg",
  "province": "Gauteng",
  "country": "South Africa"
}' > /dev/null

api_call POST "/api/locations" '{
  "name": "Cape Town Branch",
  "address": "456 Victoria & Alfred Waterfront, Cape Town, 8001",
  "city": "Cape Town",
  "province": "Western Cape",
  "country": "South Africa"
}' > /dev/null

echo "   ✅ 2 Locations created"
echo ""

echo "4. Creating Test Employees..."

# HR Manager
api_call POST "/api/employees" '{
  "first_name": "Thandi",
  "last_name": "Nkosi",
  "email": "thandi.nkosi@zuzaworks.co.za",
  "id_number": "8506125432087",
  "phone": "+27 11 234 5678",
  "department_id": 1,
  "location_id": 1,
  "position": "HR Manager",
  "employment_type": "permanent",
  "employment_status": "active",
  "hire_date": "2020-03-15",
  "salary": 45000
}' > /dev/null

# Payroll Administrator
api_call POST "/api/employees" '{
  "first_name": "Sipho",
  "last_name": "Dlamini",
  "email": "sipho.dlamini@zuzaworks.co.za",
  "id_number": "9102048765092",
  "phone": "+27 11 234 5679",
  "department_id": 3,
  "location_id": 1,
  "position": "Payroll Administrator",
  "employment_type": "permanent",
  "employment_status": "active",
  "hire_date": "2019-07-01",
  "salary": 38000
}' > /dev/null

# Training Coordinator
api_call POST "/api/employees" '{
  "first_name": "Lerato",
  "last_name": "Mokoena",
  "email": "lerato.mokoena@zuzaworks.co.za",
  "id_number": "8709156543098",
  "phone": "+27 11 234 5680",
  "department_id": 4,
  "location_id": 1,
  "position": "Training Coordinator",
  "employment_type": "permanent",
  "employment_status": "active",
  "hire_date": "2021-01-10",
  "salary": 35000
}' > /dev/null

# Operations Worker (for COIDA incident)
api_call POST "/api/employees" '{
  "first_name": "Mandla",
  "last_name": "Khumalo",
  "email": "mandla.khumalo@zuzaworks.co.za",
  "id_number": "9305128976054",
  "phone": "+27 11 234 5681",
  "department_id": 2,
  "location_id": 1,
  "position": "Machine Operator",
  "employment_type": "permanent",
  "employment_status": "active",
  "hire_date": "2022-06-01",
  "salary": 18000
}' > /dev/null

# Compliance Officer
api_call POST "/api/employees" '{
  "first_name": "Nomsa",
  "last_name": "Zulu",
  "email": "nomsa.zulu@zuzaworks.co.za",
  "id_number": "8812095432076",
  "phone": "+27 11 234 5682",
  "department_id": 1,
  "location_id": 1,
  "position": "Compliance Officer",
  "employment_type": "permanent",
  "employment_status": "active",
  "hire_date": "2020-09-15",
  "salary": 42000
}' > /dev/null

echo "   ✅ 5 Employees created"
echo ""

echo "5. Setting up COIDA Registration..."
api_call PUT "/api/coida/registration" '{
  "registration_number": "U987654321",
  "primary_tariff_code": "14101",
  "primary_tariff_rate": 1.89,
  "risk_class": "medium"
}' > /dev/null
echo "   ✅ COIDA Registration: U987654321"
echo ""

echo "6. Submitting COIDA Annual Return (2024)..."
api_call POST "/api/coida/annual-return" '{
  "return_year": 2024,
  "total_earnings_declared": 8500000,
  "total_employees_covered": 63,
  "assessment_amount": 160650,
  "w_as2_form_path": "/documents/coida/w_as2_2024.pdf"
}' > /dev/null
echo "   ✅ W.As.2 submitted for 2024"
echo ""

echo "7. Recording COIDA Workplace Incident..."
api_call POST "/api/coida/incident/report" '{
  "employee_id": 4,
  "incident_date": "2025-11-20",
  "incident_time": "14:30",
  "incident_location": "Factory Floor - Production Area B",
  "incident_type": "major_injury",
  "injury_description": "Deep laceration to left hand from machinery. Required 15 stitches.",
  "body_part_affected": "Left hand",
  "witnesses": "Supervisor John Modise, Co-worker Sarah Sithole",
  "reported_to_saps": 0,
  "reported_to_ohs": 1,
  "reported_by": 1
}' > /dev/null
echo "   ✅ Incident reported (W.Cl.2 + W.Cl.4 auto-issued)"
echo ""

echo "8. Creating Intern Programmes..."
api_call POST "/api/interns/programs" '{
  "program_name": "Information Technology Learnership NQF5",
  "program_type": "seta_learnership",
  "seta_name": "MICT SETA",
  "qualification_title": "IT Systems Development",
  "qualification_nqf_level": 5,
  "duration_months": 12,
  "stipend_amount": 5000,
  "funding_source": "seta_grant",
  "start_date": "2025-01-15",
  "is_active": 1
}' > /dev/null

api_call POST "/api/interns/programs" '{
  "program_name": "YES Youth Employment Programme",
  "program_type": "yes_program",
  "seta_name": null,
  "qualification_title": "Work Experience Programme",
  "qualification_nqf_level": null,
  "duration_months": 12,
  "stipend_amount": 4500,
  "funding_source": "yes_grant",
  "start_date": "2025-02-01",
  "is_active": 1
}' > /dev/null

echo "   ✅ 2 Intern Programmes created"
echo ""

echo "9. Registering Interns..."
api_call POST "/api/interns/register" '{
  "first_name": "Thabo",
  "last_name": "Mabasa",
  "id_number": "0312155432089",
  "program_id": 1,
  "program_type": "seta_learnership",
  "legal_status": "learner",
  "start_date": "2025-01-15",
  "expected_end_date": "2026-01-14",
  "seta_name": "MICT SETA"
}' > /dev/null

api_call POST "/api/interns/register" '{
  "first_name": "Zanele",
  "last_name": "Ndlovu",
  "id_number": "0205098765043",
  "program_id": 2,
  "program_type": "yes_program",
  "legal_status": "participant",
  "start_date": "2025-02-01",
  "expected_end_date": "2026-01-31"
}' > /dev/null

echo "   ✅ 2 Interns registered"
echo ""

echo "10. Processing Intern Stipend Payments..."
api_call POST "/api/interns/stipend/pay" '{
  "intern_id": 1,
  "payment_year": 2025,
  "payment_month": 11,
  "basic_stipend": 5000,
  "allowances": 0,
  "paye_deducted": 0,
  "uif_deducted": 0,
  "net_amount": 5000,
  "payment_date": "2025-11-25",
  "payment_reference": "PAY202511001"
}' > /dev/null

api_call POST "/api/interns/stipend/pay" '{
  "intern_id": 2,
  "payment_year": 2025,
  "payment_month": 11,
  "basic_stipend": 4500,
  "allowances": 0,
  "paye_deducted": 0,
  "uif_deducted": 0,
  "net_amount": 4500,
  "payment_date": "2025-11-25",
  "payment_reference": "PAY202511002"
}' > /dev/null

echo "   ✅ November stipends paid"
echo ""

echo "=========================================="
echo "✅ TEST DATA SEEDING COMPLETE!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - 4 Departments"
echo "  - 2 Locations"
echo "  - 5 Employees"
echo "  - 1 COIDA Registration"
echo "  - 1 COIDA Annual Return"
echo "  - 1 COIDA Incident Report"
echo "  - 2 Intern Programmes"
echo "  - 2 Interns Registered"
echo "  - 2 Stipend Payments"
echo ""
echo "You can now test the compliance dashboards with real data!"
echo "Access: http://localhost:3000/static/compliance-index"
echo ""
