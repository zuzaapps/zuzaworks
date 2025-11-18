-- ZuZaWorksOS - COMPREHENSIVE CORPORATE DEMO SEED DATA
-- Multi-Industry, Multi-Location, White & Blue Collar Workers
-- Realistic South African Corporate Environment

-- ============================================================================
-- ORGANIZATION - Large SA Corporation
-- ============================================================================

INSERT OR REPLACE INTO organizations (id, name, bbee_level, tax_number, company_registration, industry, employee_count, created_at, updated_at)
VALUES 
  (1, 'Mzansi Industrial Group (Pty) Ltd', '1', '9123456789', '2015/123456/07', 'Multi-Industry Conglomerate', 150, datetime('now'), datetime('now'));

-- ============================================================================
-- LOCATIONS - Across South Africa (9 Provinces)
-- ============================================================================

INSERT OR REPLACE INTO locations (id, organization_id, name, province, city, address, latitude, longitude, timezone, is_active, created_at)
VALUES 
  -- HEAD OFFICE
  (1, 1, 'Head Office - Sandton', 'Gauteng', 'Johannesburg', 'Sandton City, 83 Rivonia Rd', -26.1076, 28.0567, 'Africa/Johannesburg', 1, datetime('now')),
  
  -- MANUFACTURING
  (2, 1, 'Manufacturing Plant - Rosslyn', 'Gauteng', 'Pretoria', 'Rosslyn Industrial Area', -25.6833, 28.0833, 'Africa/Johannesburg', 1, datetime('now')),
  (3, 1, 'Assembly Line - East London', 'Eastern Cape', 'East London', 'Buffalo Harbour Industrial Zone', -33.0292, 27.9119, 'Africa/Johannesburg', 1, datetime('now')),
  
  -- MINING
  (4, 1, 'Gold Mine - Klerksdorp', 'North West', 'Klerksdorp', 'West Rand Gold Field', -26.8500, 26.6667, 'Africa/Johannesburg', 1, datetime('now')),
  (5, 1, 'Chrome Mine - Steelpoort', 'Limpopo', 'Steelpoort', 'Bushveld Complex', -24.7333, 30.1500, 'Africa/Johannesburg', 1, datetime('now')),
  
  -- RETAIL
  (6, 1, 'Retail Store - V&A Waterfront', 'Western Cape', 'Cape Town', 'V&A Waterfront Shopping Centre', -33.9028, 18.4194, 'Africa/Johannesburg', 1, datetime('now')),
  (7, 1, 'Retail Store - Gateway', 'KwaZulu-Natal', 'Durban', 'Gateway Theatre of Shopping', -29.7633, 31.0472, 'Africa/Johannesburg', 1, datetime('now')),
  (8, 1, 'Retail Store - Bloemfontein Mall', 'Free State', 'Bloemfontein', 'Mimosa Mall', -29.1053, 26.1937, 'Africa/Johannesburg', 1, datetime('now')),
  
  -- CONSTRUCTION
  (9, 1, 'Construction Site - Umhlanga Ridge', 'KwaZulu-Natal', 'Umhlanga', 'New Development Project', -29.7278, 31.0819, 'Africa/Johannesburg', 1, datetime('now')),
  (10, 1, 'Construction Site - Nelspruit', 'Mpumalanga', 'Mbombela', 'Industrial Park Development', -25.4753, 30.9694, 'Africa/Johannesburg', 1, datetime('now')),
  
  -- LOGISTICS & WAREHOUSING
  (11, 1, 'Distribution Centre - Midrand', 'Gauteng', 'Midrand', 'Grand Central Airport', -25.9953, 28.1250, 'Africa/Johannesburg', 1, datetime('now')),
  (12, 1, 'Warehouse - Port Elizabeth', 'Eastern Cape', 'Gqeberha', 'Port Elizabeth Harbour', -33.9608, 25.6022, 'Africa/Johannesburg', 1, datetime('now')),
  
  -- CORPORATE OFFICES
  (13, 1, 'Regional Office - Cape Town CBD', 'Western Cape', 'Cape Town', 'Foreshore, Heerengracht St', -33.9249, 18.4241, 'Africa/Johannesburg', 1, datetime('now')),
  (14, 1, 'Regional Office - Durban Point', 'KwaZulu-Natal', 'Durban', 'Point Waterfront', -29.8642, 31.0456, 'Africa/Johannesburg', 1, datetime('now')),
  (15, 1, 'Regional Office - Kimberley', 'Northern Cape', 'Kimberley', 'Diamond District', -28.7382, 24.7614, 'Africa/Johannesburg', 1, datetime('now'));

-- ============================================================================
-- DEPARTMENTS - Multi-Industry Structure
-- ============================================================================

INSERT OR REPLACE INTO departments (id, organization_id, location_id, name, code, budget_annual, headcount_target, created_at)
VALUES 
  -- CORPORATE (Head Office)
  (1, 1, 1, 'Executive Management', 'EXEC', 5000000, 8, datetime('now')),
  (2, 1, 1, 'Human Resources', 'HR', 3000000, 12, datetime('now')),
  (3, 1, 1, 'Finance & Accounting', 'FIN', 4000000, 15, datetime('now')),
  (4, 1, 1, 'IT & Technology', 'IT', 6000000, 20, datetime('now')),
  (5, 1, 1, 'Legal & Compliance', 'LEGAL', 2500000, 6, datetime('now')),
  
  -- MANUFACTURING
  (6, 1, 2, 'Production Line A', 'PROD-A', 8000000, 30, datetime('now')),
  (7, 1, 2, 'Production Line B', 'PROD-B', 8000000, 30, datetime('now')),
  (8, 1, 2, 'Quality Control', 'QC', 2000000, 10, datetime('now')),
  (9, 1, 2, 'Maintenance', 'MAINT', 3000000, 15, datetime('now')),
  (10, 1, 3, 'Assembly Operations', 'ASSY', 7000000, 25, datetime('now')),
  
  -- MINING
  (11, 1, 4, 'Underground Operations', 'MINE-UG', 15000000, 50, datetime('now')),
  (12, 1, 4, 'Surface Operations', 'MINE-SF', 8000000, 20, datetime('now')),
  (13, 1, 5, 'Chrome Processing', 'CHROME', 12000000, 35, datetime('now')),
  
  -- RETAIL
  (14, 1, 6, 'Sales Floor - CPT', 'RETAIL-CPT', 2000000, 15, datetime('now')),
  (15, 1, 7, 'Sales Floor - DBN', 'RETAIL-DBN', 2000000, 15, datetime('now')),
  (16, 1, 8, 'Sales Floor - BFN', 'RETAIL-BFN', 1500000, 10, datetime('now')),
  
  -- CONSTRUCTION
  (17, 1, 9, 'Site Management - Umhlanga', 'CONST-UMH', 5000000, 20, datetime('now')),
  (18, 1, 10, 'Site Labor - Nelspruit', 'CONST-NEL', 4000000, 30, datetime('now')),
  
  -- LOGISTICS
  (19, 1, 11, 'Warehouse Operations', 'WHSE', 4000000, 25, datetime('now')),
  (20, 1, 11, 'Logistics Coordination', 'LOG', 3000000, 10, datetime('now'));

-- ============================================================================
-- EMPLOYEES - 150 Workers (White & Blue Collar Mix)
-- ============================================================================

-- EXECUTIVE TEAM (White Collar - Head Office Sandton)
INSERT OR REPLACE INTO employees (
  id, organization_id, employee_number, first_name, last_name, email, 
  employment_type, employment_status, department_id, location_id, 
  job_title, job_level, manager_id, hire_date, 
  phone_mobile, gender, nationality, race, disability_status,
  contracted_hours_per_week, salary_amount, salary_currency, salary_frequency,
  leave_annual_balance, leave_sick_balance, leave_family_balance,
  is_active, created_at, updated_at
) VALUES 
  (1, 1, 'EMP001', 'Thabo', 'Motsepe', 'thabo.motsepe@mzansi.co.za', 'Full-Time', 'Active', 1, 1, 'Chief Executive Officer', 'Executive', NULL, '2018-01-15', '0821234501', 'Male', 'South African', 'African', 0, 45, 1500000, 'ZAR', 'Annual', 25, 30, 3, 1, datetime('now'), datetime('now')),
  (2, 1, 'EMP002', 'Zanele', 'Nkosi', 'zanele.nkosi@mzansi.co.za', 'Full-Time', 'Active', 1, 1, 'Chief Operations Officer', 'Executive', 1, '2018-06-01', '0821234502', 'Female', 'South African', 'African', 0, 45, 1200000, 'ZAR', 'Annual', 25, 30, 3, 1, datetime('now'), datetime('now')),
  (3, 1, 'EMP003', 'Sarah', 'van der Merwe', 'sarah.vdm@mzansi.co.za', 'Full-Time', 'Active', 1, 1, 'Chief Financial Officer', 'Executive', 1, '2019-03-10', '0821234503', 'Female', 'South African', 'White', 0, 45, 1100000, 'ZAR', 'Annual', 25, 30, 3, 1, datetime('now'), datetime('now'));

-- HR DEPARTMENT (White Collar)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (4, 1, 'EMP004', 'Nomsa', 'Dlamini', 'nomsa.dlamini@mzansi.co.za', 'Full-Time', 'Active', 2, 1, 'HR Director', 'Director', 2, '2019-07-01', '0821234504', 'Female', 'South African', 'African', 0, 45, 750000, 'ZAR', 'Annual', 22, 30, 3, 1, datetime('now'), datetime('now')),
  (5, 1, 'EMP005', 'Fatima', 'Khan', 'fatima.khan@mzansi.co.za', 'Full-Time', 'Active', 2, 1, 'HR Manager - Recruitment', 'Manager', 4, '2020-02-15', '0821234505', 'Female', 'South African', 'Indian', 0, 45, 450000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (6, 1, 'EMP006', 'Bongani', 'Ndlovu', 'bongani.ndlovu@mzansi.co.za', 'Full-Time', 'Active', 2, 1, 'HR Manager - Employee Relations', 'Manager', 4, '2020-05-20', '0821234506', 'Male', 'South African', 'African', 0, 45, 450000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now'));

-- PRODUCTION WORKERS (Blue Collar - Manufacturing Rosslyn)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (10, 1, 'EMP010', 'Sipho', 'Mkhize', 'sipho.mkhize@mzansi.co.za', 'Full-Time', 'Active', 6, 2, 'Production Supervisor', 'Manager', 2, '2019-08-12', '0821234510', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (11, 1, 'EMP011', 'Thandi', 'Zulu', 'thandi.zulu@mzansi.co.za', 'Full-Time', 'Active', 6, 2, 'Machine Operator', 'Mid', 10, '2020-11-05', '0821234511', 'Female', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (12, 1, 'EMP012', 'Lucky', 'Mokoena', 'lucky.mokoena@mzansi.co.za', 'Full-Time', 'Active', 6, 2, 'Assembly Worker', 'Junior', 10, '2021-03-18', '0821234512', 'Male', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (13, 1, 'EMP013', 'Lindiwe', 'Khumalo', 'lindiwe.khumalo@mzansi.co.za', 'Full-Time', 'Active', 6, 2, 'Assembly Worker', 'Junior', 10, '2021-06-22', '0821234513', 'Female', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now'));

-- MINING WORKERS (Blue Collar - Gold Mine Klerksdorp)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (20, 1, 'EMP020', 'Johannes', 'Mabuza', 'johannes.mabuza@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'Mine Shift Boss', 'Manager', 2, '2017-04-10', '0821234520', 'Male', 'South African', 'African', 0, 45, 520000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (21, 1, 'EMP021', 'Patrick', 'Nkuna', 'patrick.nkuna@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'Rock Drill Operator', 'Mid', 20, '2018-09-15', '0821234521', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (22, 1, 'EMP022', 'Mandla', 'Sithole', 'mandla.sithole@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'Blaster', 'Mid', 20, '2018-11-20', '0821234522', 'Male', 'South African', 'African', 0, 45, 360000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (23, 1, 'EMP023', 'Themba', 'Dube', 'themba.dube@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'General Mine Worker', 'Junior', 20, '2019-02-08', '0821234523', 'Male', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now'));

-- RETAIL WORKERS (Mix - V&A Waterfront Cape Town)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (30, 1, 'EMP030', 'Lerato', 'Mokwena', 'lerato.mokwena@mzansi.co.za', 'Full-Time', 'Active', 14, 6, 'Store Manager', 'Manager', 2, '2019-05-14', '0821234530', 'Female', 'South African', 'African', 0, 45, 420000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (31, 1, 'EMP031', 'David', 'Pillay', 'david.pillay@mzansi.co.za', 'Part-Time', 'Active', 14, 6, 'Sales Associate', 'Junior', 30, '2021-08-10', '0821234531', 'Male', 'South African', 'Indian', 0, 25, 120000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (32, 1, 'EMP032', 'Amahle', 'Ngubane', 'amahle.ngubane@mzansi.co.za', 'Part-Time', 'Active', 14, 6, 'Sales Associate', 'Junior', 30, '2021-09-22', '0821234532', 'Female', 'South African', 'African', 0, 25, 120000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now'));

-- CONSTRUCTION WORKERS (Blue Collar - Umhlanga Site)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (40, 1, 'EMP040', 'Andile', 'Cele', 'andile.cele@mzansi.co.za', 'Contract', 'Active', 17, 9, 'Site Foreman', 'Manager', 2, '2024-01-15', '0821234540', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 12, 20, 2, 1, datetime('now'), datetime('now')),
  (41, 1, 'EMP041', 'Bheki', 'Mthembu', 'bheki.mthembu@mzansi.co.za', 'Contract', 'Active', 17, 9, 'Steel Fixer', 'Mid', 40, '2024-02-01', '0821234541', 'Male', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 10, 20, 2, 1, datetime('now'), datetime('now')),
  (42, 1, 'EMP042', 'Simphiwe', 'Gumede', 'simphiwe.gumede@mzansi.co.za', 'Contract', 'Active', 17, 9, 'General Laborer', 'Junior', 40, '2024-03-10', '0821234542', 'Male', 'South African', 'African', 0, 45, 200000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now'));

-- FIELD WORKERS & LOGISTICS (Mobile Workers)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (50, 1, 'EMP050', 'Mpho', 'Maseko', 'mpho.maseko@mzansi.co.za', 'Full-Time', 'Active', 20, 11, 'Logistics Manager', 'Manager', 2, '2020-06-08', '0821234550', 'Male', 'South African', 'African', 0, 45, 480000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (51, 1, 'EMP051', 'Khaya', 'Moyo', 'khaya.moyo@mzansi.co.za', 'Full-Time', 'Active', 20, 11, 'Delivery Driver', 'Mid', 50, '2021-01-12', '0821234551', 'Male', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (52, 1, 'EMP052', 'Tshepo', 'Moloi', 'tshepo.moloi@mzansi.co.za', 'Full-Time', 'Active', 20, 11, 'Delivery Driver', 'Mid', 50, '2021-02-18', '0821234552', 'Male', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now'));

-- FINANCE TEAM (White Collar - Head Office)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (7, 1, 'EMP007', 'Rajesh', 'Chetty', 'rajesh.chetty@mzansi.co.za', 'Full-Time', 'Active', 3, 1, 'Financial Controller', 'Manager', 3, '2020-01-08', '0821234507', 'Male', 'South African', 'Indian', 0, 45, 650000, 'ZAR', 'Annual', 20, 30, 3, 1, datetime('now'), datetime('now')),
  (8, 1, 'EMP008', 'Naledi', 'Moyo', 'naledi.moyo@mzansi.co.za', 'Full-Time', 'Active', 3, 1, 'Senior Accountant', 'Senior', 7, '2021-03-15', '0821234508', 'Female', 'South African', 'African', 0, 45, 480000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (9, 1, 'EMP009', 'Claire', 'Botha', 'claire.botha@mzansi.co.za', 'Full-Time', 'Active', 3, 1, 'Accountant', 'Mid', 7, '2022-06-10', '0821234509', 'Female', 'South African', 'White', 0, 45, 380000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (53, 1, 'EMP053', 'Brandon', 'Jacobs', 'brandon.jacobs@mzansi.co.za', 'Full-Time', 'Active', 3, 1, 'Payroll Specialist', 'Mid', 7, '2022-09-05', '0821234553', 'Male', 'South African', 'Coloured', 0, 45, 350000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (54, 1, 'EMP054', 'Palesa', 'Tau', 'palesa.tau@mzansi.co.za', 'Full-Time', 'Active', 3, 1, 'Finance Administrator', 'Junior', 7, '2023-02-20', '0821234554', 'Female', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now'));

-- IT TEAM (White Collar - Head Office)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (55, 1, 'EMP055', 'Michael', 'Chen', 'michael.chen@mzansi.co.za', 'Full-Time', 'Active', 4, 1, 'IT Director', 'Director', 2, '2019-04-12', '0821234555', 'Male', 'South African', 'Indian', 0, 45, 850000, 'ZAR', 'Annual', 22, 30, 3, 1, datetime('now'), datetime('now')),
  (56, 1, 'EMP056', 'Kagiso', 'Mahlaba', 'kagiso.mahlaba@mzansi.co.za', 'Full-Time', 'Active', 4, 1, 'Senior Developer', 'Senior', 55, '2020-07-18', '0821234556', 'Male', 'South African', 'African', 0, 45, 620000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (57, 1, 'EMP057', 'Siya', 'Naidoo', 'siya.naidoo@mzansi.co.za', 'Full-Time', 'Active', 4, 1, 'DevOps Engineer', 'Mid', 55, '2021-05-22', '0821234557', 'Female', 'South African', 'Indian', 0, 45, 550000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (58, 1, 'EMP058', 'Ryan', 'Smith', 'ryan.smith@mzansi.co.za', 'Full-Time', 'Active', 4, 1, 'Network Administrator', 'Mid', 55, '2021-11-03', '0821234558', 'Male', 'South African', 'White', 0, 45, 480000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (59, 1, 'EMP059', 'Thandiwe', 'Shabalala', 'thandiwe.shabalala@mzansi.co.za', 'Full-Time', 'Active', 4, 1, 'IT Support Specialist', 'Junior', 55, '2023-01-10', '0821234559', 'Female', 'South African', 'African', 0, 45, 320000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now'));

-- LEGAL TEAM (White Collar - Head Office)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (60, 1, 'EMP060', 'James', 'van Wyk', 'james.vanwyk@mzansi.co.za', 'Full-Time', 'Active', 5, 1, 'Legal Counsel', 'Manager', 2, '2019-09-20', '0821234560', 'Male', 'South African', 'White', 0, 45, 720000, 'ZAR', 'Annual', 20, 30, 3, 1, datetime('now'), datetime('now')),
  (61, 1, 'EMP061', 'Busisiwe', 'Zungu', 'busisiwe.zungu@mzansi.co.za', 'Full-Time', 'Active', 5, 1, 'Compliance Officer', 'Mid', 60, '2021-04-08', '0821234561', 'Female', 'South African', 'African', 0, 45, 480000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now'));

-- MORE MANUFACTURING WORKERS (Blue Collar - Rosslyn & East London)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  -- Production Line A
  (14, 1, 'EMP014', 'Samuel', 'Mabaso', 'samuel.mabaso@mzansi.co.za', 'Full-Time', 'Active', 6, 2, 'Assembly Worker', 'Junior', 10, '2021-09-14', '0821234514', 'Male', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (15, 1, 'EMP015', 'Zanele', 'Hadebe', 'zanele.hadebe@mzansi.co.za', 'Full-Time', 'Active', 6, 2, 'Quality Inspector', 'Mid', 10, '2020-12-01', '0821234515', 'Female', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (16, 1, 'EMP016', 'Johannes', 'Botha', 'johannes.botha@mzansi.co.za', 'Full-Time', 'Active', 6, 2, 'Machine Operator', 'Mid', 10, '2020-08-22', '0821234516', 'Male', 'South African', 'White', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (17, 1, 'EMP017', 'Precious', 'Nkomo', 'precious.nkomo@mzansi.co.za', 'Contract', 'Active', 6, 2, 'Assembly Worker', 'Junior', 10, '2024-05-10', '0821234517', 'Female', 'South African', 'African', 0, 45, 200000, 'ZAR', 'Annual', 10, 20, 2, 1, datetime('now'), datetime('now')),
  (18, 1, 'EMP018', 'Kabelo', 'Mofokeng', 'kabelo.mofokeng@mzansi.co.za', 'Full-Time', 'Active', 6, 2, 'Forklift Driver', 'Mid', 10, '2022-01-18', '0821234518', 'Male', 'South African', 'African', 0, 45, 260000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Production Line B
  (62, 1, 'EMP062', 'Kgotso', 'Letsie', 'kgotso.letsie@mzansi.co.za', 'Full-Time', 'Active', 7, 2, 'Production Supervisor', 'Manager', 2, '2020-03-15', '0821234562', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (63, 1, 'EMP063', 'Dikeledi', 'Mashaba', 'dikeledi.mashaba@mzansi.co.za', 'Full-Time', 'Active', 7, 2, 'Machine Operator', 'Mid', 62, '2021-07-20', '0821234563', 'Female', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (64, 1, 'EMP064', 'Thabiso', 'Molefe', 'thabiso.molefe@mzansi.co.za', 'Full-Time', 'Active', 7, 2, 'Assembly Worker', 'Junior', 62, '2022-04-05', '0821234564', 'Male', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (65, 1, 'EMP065', 'Karabo', 'Sebego', 'karabo.sebego@mzansi.co.za', 'Full-Time', 'Active', 7, 2, 'Assembly Worker', 'Junior', 62, '2022-08-15', '0821234565', 'Female', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Quality Control
  (66, 1, 'EMP066', 'Pieter', 'Kruger', 'pieter.kruger@mzansi.co.za', 'Full-Time', 'Active', 8, 2, 'QC Manager', 'Manager', 2, '2019-11-12', '0821234566', 'Male', 'South African', 'White', 0, 45, 520000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (67, 1, 'EMP067', 'Ntombi', 'Mdlalose', 'ntombi.mdlalose@mzansi.co.za', 'Full-Time', 'Active', 8, 2, 'QC Inspector', 'Mid', 66, '2021-02-18', '0821234567', 'Female', 'South African', 'African', 0, 45, 320000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (68, 1, 'EMP068', 'Mbali', 'Dlamini', 'mbali.dlamini@mzansi.co.za', 'Full-Time', 'Active', 8, 2, 'QC Inspector', 'Mid', 66, '2021-09-05', '0821234568', 'Female', 'South African', 'African', 0, 45, 320000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Maintenance
  (69, 1, 'EMP069', 'Willem', 'Venter', 'willem.venter@mzansi.co.za', 'Full-Time', 'Active', 9, 2, 'Maintenance Manager', 'Manager', 2, '2018-05-10', '0821234569', 'Male', 'South African', 'White', 0, 45, 580000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (70, 1, 'EMP070', 'Sello', 'Maake', 'sello.maake@mzansi.co.za', 'Full-Time', 'Active', 9, 2, 'Electrician', 'Mid', 69, '2019-08-14', '0821234570', 'Male', 'South African', 'African', 0, 45, 420000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (71, 1, 'EMP071', 'Themba', 'Ngcobo', 'themba.ngcobo@mzansi.co.za', 'Full-Time', 'Active', 9, 2, 'Mechanic', 'Mid', 69, '2020-01-22', '0821234571', 'Male', 'South African', 'African', 0, 45, 400000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (72, 1, 'EMP072', 'Daniel', 'Erasmus', 'daniel.erasmus@mzansi.co.za', 'Full-Time', 'Active', 9, 2, 'Welder', 'Mid', 69, '2020-06-08', '0821234572', 'Male', 'South African', 'White', 0, 45, 380000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Assembly Operations East London
  (73, 1, 'EMP073', 'Xolani', 'Jali', 'xolani.jali@mzansi.co.za', 'Full-Time', 'Active', 10, 3, 'Assembly Supervisor', 'Manager', 2, '2020-09-10', '0821234573', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (74, 1, 'EMP074', 'Nomvula', 'Gumede', 'nomvula.gumede@mzansi.co.za', 'Full-Time', 'Active', 10, 3, 'Assembly Worker', 'Junior', 73, '2021-11-18', '0821234574', 'Female', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (75, 1, 'EMP075', 'Siyabonga', 'Mhlongo', 'siyabonga.mhlongo@mzansi.co.za', 'Full-Time', 'Active', 10, 3, 'Assembly Worker', 'Junior', 73, '2022-02-14', '0821234575', 'Male', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now'));

-- MORE MINING WORKERS (Blue Collar - Klerksdorp & Steelpoort)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  -- Underground Operations
  (24, 1, 'EMP024', 'Isaac', 'Vilakazi', 'isaac.vilakazi@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'General Mine Worker', 'Junior', 20, '2019-05-20', '0821234524', 'Male', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (25, 1, 'EMP025', 'Bongani', 'Nkosi', 'bongani.nkosi@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'Rock Drill Operator', 'Mid', 20, '2019-08-15', '0821234525', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (26, 1, 'EMP026', 'Moses', 'Chauke', 'moses.chauke@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'Winch Operator', 'Mid', 20, '2020-02-10', '0821234526', 'Male', 'South African', 'African', 0, 45, 360000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (27, 1, 'EMP027', 'Joseph', 'Maluleke', 'joseph.maluleke@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'General Mine Worker', 'Junior', 20, '2020-07-08', '0821234527', 'Male', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (28, 1, 'EMP028', 'Solomon', 'Mtshali', 'solomon.mtshali@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'Rock Drill Operator', 'Mid', 20, '2021-01-12', '0821234528', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Surface Operations
  (76, 1, 'EMP076', 'Piet', 'Coetzee', 'piet.coetzee@mzansi.co.za', 'Full-Time', 'Active', 12, 4, 'Surface Manager', 'Manager', 2, '2018-03-15', '0821234576', 'Male', 'South African', 'White', 0, 45, 580000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (77, 1, 'EMP077', 'Elias', 'Shongwe', 'elias.shongwe@mzansi.co.za', 'Full-Time', 'Active', 12, 4, 'Heavy Equipment Operator', 'Mid', 76, '2019-06-20', '0821234577', 'Male', 'South African', 'African', 0, 45, 420000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (78, 1, 'EMP078', 'Alfred', 'Mashego', 'alfred.mashego@mzansi.co.za', 'Full-Time', 'Active', 12, 4, 'Plant Operator', 'Mid', 76, '2020-03-10', '0821234578', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (79, 1, 'EMP079', 'Simon', 'Mathebula', 'simon.mathebula@mzansi.co.za', 'Full-Time', 'Active', 12, 4, 'Loader Operator', 'Mid', 76, '2020-09-14', '0821234579', 'Male', 'South African', 'African', 0, 45, 360000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Chrome Processing
  (80, 1, 'EMP080', 'Phineas', 'Maswanganyi', 'phineas.maswanganyi@mzansi.co.za', 'Full-Time', 'Active', 13, 5, 'Processing Manager', 'Manager', 2, '2019-02-18', '0821234580', 'Male', 'South African', 'African', 0, 45, 580000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (81, 1, 'EMP081', 'Richard', 'Baloyi', 'richard.baloyi@mzansi.co.za', 'Full-Time', 'Active', 13, 5, 'Plant Operator', 'Mid', 80, '2019-11-22', '0821234581', 'Male', 'South African', 'African', 0, 45, 400000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (82, 1, 'EMP082', 'Jackson', 'Nkuna', 'jackson.nkuna@mzansi.co.za', 'Full-Time', 'Active', 13, 5, 'Crusher Operator', 'Mid', 80, '2020-05-08', '0821234582', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (83, 1, 'EMP083', 'Petrus', 'Maluleke', 'petrus.maluleke@mzansi.co.za', 'Full-Time', 'Active', 13, 5, 'Quality Technician', 'Mid', 80, '2021-01-15', '0821234583', 'Male', 'South African', 'African', 0, 45, 360000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now'));

-- MORE RETAIL WORKERS (Mix - All 3 Stores)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  -- V&A Waterfront Cape Town
  (33, 1, 'EMP033', 'Ayanda', 'Makhanya', 'ayanda.makhanya@mzansi.co.za', 'Part-Time', 'Active', 14, 6, 'Sales Associate', 'Junior', 30, '2022-01-20', '0821234533', 'Female', 'South African', 'African', 0, 25, 120000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (34, 1, 'EMP034', 'Tasneem', 'Abrahams', 'tasneem.abrahams@mzansi.co.za', 'Part-Time', 'Active', 14, 6, 'Cashier', 'Junior', 30, '2022-05-15', '0821234534', 'Female', 'South African', 'Coloured', 0, 25, 110000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (35, 1, 'EMP035', 'Zintle', 'Zwane', 'zintle.zwane@mzansi.co.za', 'Part-Time', 'Active', 14, 6, 'Sales Associate', 'Junior', 30, '2022-09-10', '0821234535', 'Female', 'South African', 'African', 0, 25, 120000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (84, 1, 'EMP084', 'Ashwin', 'Naidoo', 'ashwin.naidoo@mzansi.co.za', 'Full-Time', 'Active', 14, 6, 'Assistant Manager', 'Senior', 30, '2021-03-12', '0821234584', 'Male', 'South African', 'Indian', 0, 45, 320000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Gateway Durban
  (85, 1, 'EMP085', 'Nhlanhla', 'Khoza', 'nhlanhla.khoza@mzansi.co.za', 'Full-Time', 'Active', 15, 7, 'Store Manager', 'Manager', 2, '2020-02-10', '0821234585', 'Male', 'South African', 'African', 0, 45, 420000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (86, 1, 'EMP086', 'Nosipho', 'Buthelezi', 'nosipho.buthelezi@mzansi.co.za', 'Full-Time', 'Active', 15, 7, 'Assistant Manager', 'Senior', 85, '2021-06-15', '0821234586', 'Female', 'South African', 'African', 0, 45, 320000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (87, 1, 'EMP087', 'Sanele', 'Dladla', 'sanele.dladla@mzansi.co.za', 'Part-Time', 'Active', 15, 7, 'Sales Associate', 'Junior', 85, '2022-03-20', '0821234587', 'Male', 'South African', 'African', 0, 25, 120000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (88, 1, 'EMP088', 'Zanele', 'Mthembu', 'zanele.mthembu@mzansi.co.za', 'Part-Time', 'Active', 15, 7, 'Sales Associate', 'Junior', 85, '2022-08-05', '0821234588', 'Female', 'South African', 'African', 0, 25, 120000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (89, 1, 'EMP089', 'Nkanyiso', 'Zulu', 'nkanyiso.zulu@mzansi.co.za', 'Part-Time', 'Active', 15, 7, 'Cashier', 'Junior', 85, '2023-01-15', '0821234589', 'Male', 'South African', 'African', 0, 25, 110000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  
  -- Bloemfontein Mall
  (90, 1, 'EMP090', 'Pule', 'Mokoena', 'pule.mokoena@mzansi.co.za', 'Full-Time', 'Active', 16, 8, 'Store Manager', 'Manager', 2, '2020-11-18', '0821234590', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (91, 1, 'EMP091', 'Dimakatso', 'Moloi', 'dimakatso.moloi@mzansi.co.za', 'Part-Time', 'Active', 16, 8, 'Sales Associate', 'Junior', 90, '2022-04-10', '0821234591', 'Female', 'South African', 'African', 0, 25, 120000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (92, 1, 'EMP092', 'Teboho', 'Tau', 'teboho.tau@mzansi.co.za', 'Part-Time', 'Active', 16, 8, 'Sales Associate', 'Junior', 90, '2022-10-05', '0821234592', 'Male', 'South African', 'African', 0, 25, 120000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (93, 1, 'EMP093', 'Refilwe', 'Sebolai', 'refilwe.sebolai@mzansi.co.za', 'Part-Time', 'Active', 16, 8, 'Cashier', 'Junior', 90, '2023-03-20', '0821234593', 'Female', 'South African', 'African', 0, 25, 110000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now'));

-- MORE CONSTRUCTION WORKERS (Blue Collar - Both Sites)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  -- Umhlanga Site
  (43, 1, 'EMP043', 'Musa', 'Ndaba', 'musa.ndaba@mzansi.co.za', 'Contract', 'Active', 17, 9, 'Carpenter', 'Mid', 40, '2024-03-15', '0821234543', 'Male', 'South African', 'African', 0, 45, 260000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (44, 1, 'EMP044', 'Vusi', 'Mthembu', 'vusi.mthembu@mzansi.co.za', 'Contract', 'Active', 17, 9, 'Bricklayer', 'Mid', 40, '2024-04-01', '0821234544', 'Male', 'South African', 'African', 0, 45, 260000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (45, 1, 'EMP045', 'Lungile', 'Ngubane', 'lungile.ngubane@mzansi.co.za', 'Contract', 'Active', 17, 9, 'General Laborer', 'Junior', 40, '2024-04-15', '0821234545', 'Male', 'South African', 'African', 0, 45, 200000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (46, 1, 'EMP046', 'Bonginkosi', 'Cele', 'bonginkosi.cele@mzansi.co.za', 'Contract', 'Active', 17, 9, 'General Laborer', 'Junior', 40, '2024-05-01', '0821234546', 'Male', 'South African', 'African', 0, 45, 200000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (47, 1, 'EMP047', 'Jabulani', 'Khumalo', 'jabulani.khumalo@mzansi.co.za', 'Contract', 'Active', 17, 9, 'Plasterer', 'Mid', 40, '2024-05-10', '0821234547', 'Male', 'South African', 'African', 0, 45, 260000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  
  -- Nelspruit Site
  (94, 1, 'EMP094', 'Frans', 'Grobler', 'frans.grobler@mzansi.co.za', 'Contract', 'Active', 18, 10, 'Site Manager', 'Manager', 2, '2023-11-10', '0821234594', 'Male', 'South African', 'White', 0, 45, 480000, 'ZAR', 'Annual', 15, 25, 3, 1, datetime('now'), datetime('now')),
  (95, 1, 'EMP095', 'Justice', 'Mashaba', 'justice.mashaba@mzansi.co.za', 'Contract', 'Active', 18, 10, 'Foreman', 'Senior', 94, '2024-01-15', '0821234595', 'Male', 'South African', 'African', 0, 45, 320000, 'ZAR', 'Annual', 12, 20, 2, 1, datetime('now'), datetime('now')),
  (96, 1, 'EMP096', 'Gift', 'Nkosi', 'gift.nkosi@mzansi.co.za', 'Contract', 'Active', 18, 10, 'Steel Fixer', 'Mid', 95, '2024-02-20', '0821234596', 'Male', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 10, 20, 2, 1, datetime('now'), datetime('now')),
  (97, 1, 'EMP097', 'Welcome', 'Sithole', 'welcome.sithole@mzansi.co.za', 'Contract', 'Active', 18, 10, 'Carpenter', 'Mid', 95, '2024-03-05', '0821234597', 'Male', 'South African', 'African', 0, 45, 260000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (98, 1, 'EMP098', 'Lucky', 'Mathebula', 'lucky.mathebula@mzansi.co.za', 'Contract', 'Active', 18, 10, 'General Laborer', 'Junior', 95, '2024-04-10', '0821234598', 'Male', 'South African', 'African', 0, 45, 200000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now')),
  (99, 1, 'EMP099', 'Piet', 'van der Walt', 'piet.vanderwalt@mzansi.co.za', 'Contract', 'Active', 18, 10, 'Equipment Operator', 'Mid', 95, '2024-04-20', '0821234599', 'Male', 'South African', 'White', 0, 45, 340000, 'ZAR', 'Annual', 10, 20, 2, 1, datetime('now'), datetime('now')),
  (100, 1, 'EMP100', 'Thulani', 'Dlamini', 'thulani.dlamini@mzansi.co.za', 'Contract', 'Active', 18, 10, 'General Laborer', 'Junior', 95, '2024-05-05', '0821234600', 'Male', 'South African', 'African', 0, 45, 200000, 'ZAR', 'Annual', 10, 15, 2, 1, datetime('now'), datetime('now'));

-- MORE LOGISTICS WORKERS (Field Workers - Midrand & PE)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  -- Warehouse Operations
  (101, 1, 'EMP101', 'Simon', 'Radebe', 'simon.radebe@mzansi.co.za', 'Full-Time', 'Active', 19, 11, 'Warehouse Supervisor', 'Manager', 50, '2020-08-15', '0821234601', 'Male', 'South African', 'African', 0, 45, 420000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (102, 1, 'EMP102', 'Dumisani', 'Mthethwa', 'dumisani.mthethwa@mzansi.co.za', 'Full-Time', 'Active', 19, 11, 'Forklift Operator', 'Mid', 101, '2021-02-20', '0821234602', 'Male', 'South African', 'African', 0, 45, 300000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (103, 1, 'EMP103', 'Mandla', 'Khumalo', 'mandla.khumalo@mzansi.co.za', 'Full-Time', 'Active', 19, 11, 'Warehouse Assistant', 'Junior', 101, '2021-09-10', '0821234603', 'Male', 'South African', 'African', 0, 45, 240000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (104, 1, 'EMP104', 'Sifiso', 'Zuma', 'sifiso.zuma@mzansi.co.za', 'Full-Time', 'Active', 19, 11, 'Packer', 'Junior', 101, '2022-03-15', '0821234604', 'Male', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (105, 1, 'EMP105', 'Bongi', 'Shabalala', 'bongi.shabalala@mzansi.co.za', 'Full-Time', 'Active', 19, 11, 'Inventory Clerk', 'Junior', 101, '2022-07-20', '0821234605', 'Female', 'South African', 'African', 0, 45, 260000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Logistics Drivers
  (106, 1, 'EMP106', 'Bongani', 'Nkabinde', 'bongani.nkabinde@mzansi.co.za', 'Full-Time', 'Active', 20, 11, 'Delivery Driver', 'Mid', 50, '2021-04-10', '0821234606', 'Male', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (107, 1, 'EMP107', 'Xolani', 'Ndlovu', 'xolani.ndlovu@mzansi.co.za', 'Full-Time', 'Active', 20, 11, 'Delivery Driver', 'Mid', 50, '2021-08-15', '0821234607', 'Male', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (108, 1, 'EMP108', 'Themba', 'Mabaso', 'themba.mabaso@mzansi.co.za', 'Full-Time', 'Active', 20, 11, 'Delivery Driver', 'Mid', 50, '2022-01-20', '0821234608', 'Male', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (109, 1, 'EMP109', 'Nkululeko', 'Mnguni', 'nkululeko.mnguni@mzansi.co.za', 'Full-Time', 'Active', 20, 11, 'Fleet Coordinator', 'Mid', 50, '2020-11-05', '0821234609', 'Male', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- PE Warehouse
  (110, 1, 'EMP110', 'Andre', 'du Plessis', 'andre.duplessis@mzansi.co.za', 'Full-Time', 'Active', 19, 12, 'Warehouse Manager', 'Manager', 50, '2019-06-20', '0821234610', 'Male', 'South African', 'White', 0, 45, 480000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (111, 1, 'EMP111', 'Simphiwe', 'Qwabe', 'simphiwe.qwabe@mzansi.co.za', 'Full-Time', 'Active', 19, 12, 'Forklift Operator', 'Mid', 110, '2020-09-15', '0821234611', 'Male', 'South African', 'African', 0, 45, 300000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (112, 1, 'EMP112', 'Ayanda', 'Gqweta', 'ayanda.gqweta@mzansi.co.za', 'Full-Time', 'Active', 19, 12, 'Warehouse Assistant', 'Junior', 110, '2021-05-10', '0821234612', 'Male', 'South African', 'African', 0, 45, 240000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (113, 1, 'EMP113', 'Thando', 'Mda', 'thando.mda@mzansi.co.za', 'Full-Time', 'Active', 19, 12, 'Packer', 'Junior', 110, '2022-02-18', '0821234613', 'Female', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now'));

-- REGIONAL OFFICE STAFF (White Collar - Cape Town, Durban, Kimberley)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  -- Cape Town Regional Office
  (114, 1, 'EMP114', 'Trevor', 'Williams', 'trevor.williams@mzansi.co.za', 'Full-Time', 'Active', 1, 13, 'Regional Manager - Western Cape', 'Manager', 2, '2019-10-15', '0821234614', 'Male', 'South African', 'Coloured', 0, 45, 720000, 'ZAR', 'Annual', 20, 30, 3, 1, datetime('now'), datetime('now')),
  (115, 1, 'EMP115', 'Zukiswa', 'Jantjies', 'zukiswa.jantjies@mzansi.co.za', 'Full-Time', 'Active', 2, 13, 'Regional HR Officer', 'Mid', 4, '2021-01-20', '0821234615', 'Female', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (116, 1, 'EMP116', 'Jason', 'Samuels', 'jason.samuels@mzansi.co.za', 'Full-Time', 'Active', 3, 13, 'Regional Accountant', 'Mid', 7, '2021-07-10', '0821234616', 'Male', 'South African', 'Coloured', 0, 45, 420000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Durban Regional Office
  (117, 1, 'EMP117', 'Sizwe', 'Mthethwa', 'sizwe.mthethwa@mzansi.co.za', 'Full-Time', 'Active', 1, 14, 'Regional Manager - KZN', 'Manager', 2, '2020-03-08', '0821234617', 'Male', 'South African', 'African', 0, 45, 720000, 'ZAR', 'Annual', 20, 30, 3, 1, datetime('now'), datetime('now')),
  (118, 1, 'EMP118', 'Thembeka', 'Ngcobo', 'thembeka.ngcobo@mzansi.co.za', 'Full-Time', 'Active', 2, 14, 'Regional HR Officer', 'Mid', 4, '2021-06-15', '0821234618', 'Female', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (119, 1, 'EMP119', 'Vimal', 'Naidoo', 'vimal.naidoo@mzansi.co.za', 'Full-Time', 'Active', 3, 14, 'Regional Accountant', 'Mid', 7, '2021-11-20', '0821234619', 'Male', 'South African', 'Indian', 0, 45, 420000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  
  -- Kimberley Regional Office
  (120, 1, 'EMP120', 'Jacobus', 'van Rooyen', 'jacobus.vanrooyen@mzansi.co.za', 'Full-Time', 'Active', 1, 15, 'Regional Manager - Northern Cape', 'Manager', 2, '2020-09-10', '0821234620', 'Male', 'South African', 'White', 0, 45, 680000, 'ZAR', 'Annual', 20, 30, 3, 1, datetime('now'), datetime('now')),
  (121, 1, 'EMP121', 'Keabetswe', 'Mothibi', 'keabetswe.mothibi@mzansi.co.za', 'Full-Time', 'Active', 2, 15, 'Regional HR Officer', 'Mid', 4, '2022-02-14', '0821234621', 'Female', 'South African', 'African', 0, 45, 360000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now'));

-- HR ASSISTANTS & COORDINATORS (Spread across locations)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (122, 1, 'EMP122', 'Mpumi', 'Mazibuko', 'mpumi.mazibuko@mzansi.co.za', 'Full-Time', 'Active', 2, 1, 'HR Coordinator', 'Mid', 4, '2021-08-10', '0821234622', 'Female', 'South African', 'African', 0, 45, 350000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (123, 1, 'EMP123', 'Nthabiseng', 'Molefe', 'nthabiseng.molefe@mzansi.co.za', 'Full-Time', 'Active', 2, 1, 'HR Officer', 'Mid', 4, '2022-01-15', '0821234623', 'Female', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (124, 1, 'EMP124', 'Rethabile', 'Khoele', 'rethabile.khoele@mzansi.co.za', 'Full-Time', 'Active', 2, 1, 'HR Assistant', 'Junior', 4, '2023-04-20', '0821234624', 'Female', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (125, 1, 'EMP125', 'Anele', 'Nxumalo', 'anele.nxumalo@mzansi.co.za', 'Full-Time', 'Active', 2, 1, 'Recruiter', 'Mid', 5, '2022-06-10', '0821234625', 'Male', 'South African', 'African', 0, 45, 420000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now'));

-- SEASONALWORKERS (Temporary/Contract - Mixed Locations)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (126, 1, 'EMP126', 'Siyanda', 'Mthembu', 'siyanda.mthembu@mzansi.co.za', 'Seasonal', 'Active', 14, 6, 'Seasonal Sales Assistant', 'Junior', 30, '2024-11-01', '0821234626', 'Female', 'South African', 'African', 0, 40, 150000, 'ZAR', 'Annual', 5, 10, 1, 1, datetime('now'), datetime('now')),
  (127, 1, 'EMP127', 'Thulisile', 'Dube', 'thulisile.dube@mzansi.co.za', 'Seasonal', 'Active', 14, 6, 'Seasonal Sales Assistant', 'Junior', 30, '2024-11-05', '0821234627', 'Female', 'South African', 'African', 0, 40, 150000, 'ZAR', 'Annual', 5, 10, 1, 1, datetime('now'), datetime('now')),
  (128, 1, 'EMP128', 'Mpho', 'Sibiya', 'mpho.sibiya@mzansi.co.za', 'Seasonal', 'Active', 15, 7, 'Seasonal Sales Assistant', 'Junior', 85, '2024-11-10', '0821234628', 'Male', 'South African', 'African', 0, 40, 150000, 'ZAR', 'Annual', 5, 10, 1, 1, datetime('now'), datetime('now')),
  (129, 1, 'EMP129', 'Lerato', 'Tshabalala', 'lerato.tshabalala@mzansi.co.za', 'Seasonal', 'Active', 15, 7, 'Seasonal Sales Assistant', 'Junior', 85, '2024-11-12', '0821234629', 'Female', 'South African', 'African', 0, 40, 150000, 'ZAR', 'Annual', 5, 10, 1, 1, datetime('now'), datetime('now')),
  (130, 1, 'EMP130', 'Thabang', 'Mokoena', 'thabang.mokoena@mzansi.co.za', 'Seasonal', 'Active', 19, 11, 'Seasonal Warehouse Assistant', 'Junior', 101, '2024-10-15', '0821234630', 'Male', 'South African', 'African', 0, 40, 160000, 'ZAR', 'Annual', 5, 10, 1, 1, datetime('now'), datetime('now'));

-- INTERNS & GRADUATES (Entry Level - Head Office)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (131, 1, 'EMP131', 'Nolwazi', 'Mkhize', 'nolwazi.mkhize@mzansi.co.za', 'Entry', 'Active', 2, 1, 'HR Intern', 'Entry', 4, '2025-01-05', '0821234631', 'Female', 'South African', 'African', 0, 40, 100000, 'ZAR', 'Annual', 5, 10, 1, 1, datetime('now'), datetime('now')),
  (132, 1, 'EMP132', 'Katlego', 'Setshedi', 'katlego.setshedi@mzansi.co.za', 'Entry', 'Active', 3, 1, 'Finance Intern', 'Entry', 7, '2025-01-05', '0821234632', 'Male', 'South African', 'African', 0, 40, 100000, 'ZAR', 'Annual', 5, 10, 1, 1, datetime('now'), datetime('now')),
  (133, 1, 'EMP133', 'Khanyisile', 'Ngubane', 'khanyisile.ngubane@mzansi.co.za', 'Entry', 'Active', 4, 1, 'IT Intern', 'Entry', 55, '2025-01-05', '0821234633', 'Female', 'South African', 'African', 0, 40, 100000, 'ZAR', 'Annual', 5, 10, 1, 1, datetime('now'), datetime('now')),
  (134, 1, 'EMP134', 'Bokamoso', 'Phiri', 'bokamoso.phiri@mzansi.co.za', 'Entry', 'Active', 6, 2, 'Engineering Intern', 'Entry', 10, '2025-01-05', '0821234634', 'Male', 'South African', 'African', 0, 40, 100000, 'ZAR', 'Annual', 5, 10, 1, 1, datetime('now'), datetime('now')),
  (135, 1, 'EMP135', 'Lesedi', 'Mabena', 'lesedi.mabena@mzansi.co.za', 'Entry', 'Active', 8, 2, 'QC Intern', 'Entry', 66, '2025-01-05', '0821234635', 'Female', 'South African', 'African', 0, 40, 100000, 'ZAR', 'Annual', 5, 10, 1, 1, datetime('now'), datetime('now'));

-- ADMIN & SUPPORT STAFF (Various Locations)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (136, 1, 'EMP136', 'Nosipho', 'Madonsela', 'nosipho.madonsela@mzansi.co.za', 'Full-Time', 'Active', 1, 1, 'Executive Assistant', 'Mid', 1, '2019-02-10', '0821234636', 'Female', 'South African', 'African', 0, 45, 380000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (137, 1, 'EMP137', 'Andiswa', 'Mngomezulu', 'andiswa.mngomezulu@mzansi.co.za', 'Full-Time', 'Active', 1, 1, 'Receptionist', 'Junior', 1, '2022-05-15', '0821234637', 'Female', 'South African', 'African', 0, 45, 240000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (138, 1, 'EMP138', 'Sibusiso', 'Mthembu', 'sibusiso.mthembu@mzansi.co.za', 'Full-Time', 'Active', 2, 2, 'Admin Officer', 'Junior', 10, '2022-09-20', '0821234638', 'Male', 'South African', 'African', 0, 45, 260000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (139, 1, 'EMP139', 'Yolanda', 'Sithole', 'yolanda.sithole@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'Site Administrator', 'Junior', 20, '2021-04-10', '0821234639', 'Female', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (140, 1, 'EMP140', 'Gloria', 'Nkosi', 'gloria.nkosi@mzansi.co.za', 'Full-Time', 'Active', 13, 5, 'Site Administrator', 'Junior', 80, '2021-10-15', '0821234640', 'Female', 'South African', 'African', 0, 45, 280000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now'));

-- SECURITY & FACILITIES (Support Services)
INSERT OR REPLACE INTO employees (id, organization_id, employee_number, first_name, last_name, email, employment_type, employment_status, department_id, location_id, job_title, job_level, manager_id, hire_date, phone_mobile, gender, nationality, race, disability_status, contracted_hours_per_week, salary_amount, salary_currency, salary_frequency, leave_annual_balance, leave_sick_balance, leave_family_balance, is_active, created_at, updated_at) VALUES 
  (141, 1, 'EMP141', 'Moses', 'Kgomo', 'moses.kgomo@mzansi.co.za', 'Full-Time', 'Active', 1, 1, 'Security Manager', 'Manager', 2, '2019-07-20', '0821234641', 'Male', 'South African', 'African', 0, 45, 420000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (142, 1, 'EMP142', 'Patrick', 'Malatji', 'patrick.malatji@mzansi.co.za', 'Full-Time', 'Active', 1, 1, 'Security Officer', 'Junior', 141, '2021-03-10', '0821234642', 'Male', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (143, 1, 'EMP143', 'Vincent', 'Mohlala', 'vincent.mohlala@mzansi.co.za', 'Full-Time', 'Active', 2, 2, 'Security Officer', 'Junior', 141, '2021-06-15', '0821234643', 'Male', 'South African', 'African', 0, 45, 220000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (144, 1, 'EMP144', 'Petrus', 'Mathebula', 'petrus.mathebula@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'Safety Officer', 'Mid', 20, '2019-12-10', '0821234644', 'Male', 'South African', 'African', 0, 45, 480000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (145, 1, 'EMP145', 'Samuel', 'Nyathi', 'samuel.nyathi@mzansi.co.za', 'Full-Time', 'Active', 13, 5, 'Safety Officer', 'Mid', 80, '2020-04-15', '0821234645', 'Male', 'South African', 'African', 0, 45, 480000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (146, 1, 'EMP146', 'Frans', 'Mahlangu', 'frans.mahlangu@mzansi.co.za', 'Full-Time', 'Active', 1, 1, 'Facilities Manager', 'Manager', 2, '2019-09-20', '0821234646', 'Male', 'South African', 'African', 0, 45, 520000, 'ZAR', 'Annual', 18, 30, 3, 1, datetime('now'), datetime('now')),
  (147, 1, 'EMP147', 'Mpumelelo', 'Zondo', 'mpumelelo.zondo@mzansi.co.za', 'Full-Time', 'Active', 1, 1, 'Cleaner', 'Junior', 146, '2022-08-10', '0821234647', 'Male', 'South African', 'African', 0, 45, 180000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (148, 1, 'EMP148', 'Patience', 'Mahlangu', 'patience.mahlangu@mzansi.co.za', 'Full-Time', 'Active', 1, 1, 'Cleaner', 'Junior', 146, '2022-09-05', '0821234648', 'Female', 'South African', 'African', 0, 45, 180000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (149, 1, 'EMP149', 'Beauty', 'Mnisi', 'beauty.mnisi@mzansi.co.za', 'Full-Time', 'Active', 6, 2, 'Cleaner', 'Junior', 146, '2023-01-15', '0821234649', 'Female', 'South African', 'African', 0, 45, 180000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now')),
  (150, 1, 'EMP150', 'Alfred', 'Skhosana', 'alfred.skhosana@mzansi.co.za', 'Full-Time', 'Active', 11, 4, 'Cleaner', 'Junior', 146, '2023-03-20', '0821234650', 'Male', 'South African', 'African', 0, 45, 180000, 'ZAR', 'Annual', 15, 30, 3, 1, datetime('now'), datetime('now'));

-- ============================================================================
-- SHIFTS - Multi-Location, Multi-Type
-- ============================================================================

-- Today's shifts across different locations
INSERT OR REPLACE INTO shifts (id, organization_id, employee_id, location_id, department_id, shift_date, start_time, end_time, duration_hours, shift_type, status, created_at)
VALUES 
  -- Head Office (Day Shift)
  (1, 1, 4, 1, 2, DATE('now'), DATETIME('now', 'start of day', '+8 hours'), DATETIME('now', 'start of day', '+17 hours'), 9, 'Regular', 'In Progress', datetime('now')),
  (2, 1, 5, 1, 2, DATE('now'), DATETIME('now', 'start of day', '+8 hours'), DATETIME('now', 'start of day', '+17 hours'), 9, 'Regular', 'Scheduled', datetime('now')),
  
  -- Manufacturing (3 Shifts - 24/7 Operation)
  (3, 1, 10, 2, 6, DATE('now'), DATETIME('now', 'start of day', '+6 hours'), DATETIME('now', 'start of day', '+14 hours'), 8, 'Regular', 'Completed', datetime('now')),
  (4, 1, 11, 2, 6, DATE('now'), DATETIME('now', 'start of day', '+14 hours'), DATETIME('now', 'start of day', '+22 hours'), 8, 'Regular', 'In Progress', datetime('now')),
  (5, 1, 12, 2, 6, DATE('now'), DATETIME('now', 'start of day', '+22 hours'), DATETIME('now', '+1 day', 'start of day', '+6 hours'), 8, 'Night Shift', 'Scheduled', datetime('now')),
  
  -- Mining (Underground - 12hr shifts)
  (6, 1, 20, 4, 11, DATE('now'), DATETIME('now', 'start of day', '+6 hours'), DATETIME('now', 'start of day', '+18 hours'), 12, 'Regular', 'In Progress', datetime('now')),
  (7, 1, 21, 4, 11, DATE('now'), DATETIME('now', 'start of day', '+6 hours'), DATETIME('now', 'start of day', '+18 hours'), 12, 'Regular', 'In Progress', datetime('now')),
  (8, 1, 22, 4, 11, DATE('now'), DATETIME('now', 'start of day', '+18 hours'), DATETIME('now', '+1 day', 'start of day', '+6 hours'), 12, 'Night Shift', 'Scheduled', datetime('now')),
  
  -- Retail (Mall Hours)
  (9, 1, 30, 6, 14, DATE('now'), DATETIME('now', 'start of day', '+9 hours'), DATETIME('now', 'start of day', '+18 hours'), 9, 'Regular', 'In Progress', datetime('now')),
  (10, 1, 31, 6, 14, DATE('now'), DATETIME('now', 'start of day', '+12 hours'), DATETIME('now', 'start of day', '+17 hours'), 5, 'Regular', 'Scheduled', datetime('now')),
  
  -- Construction (Early Start)
  (11, 1, 40, 9, 17, DATE('now'), DATETIME('now', 'start of day', '+6 hours'), DATETIME('now', 'start of day', '+16 hours'), 10, 'Regular', 'In Progress', datetime('now')),
  (12, 1, 41, 9, 17, DATE('now'), DATETIME('now', 'start of day', '+6 hours'), DATETIME('now', 'start of day', '+16 hours'), 10, 'Regular', 'In Progress', datetime('now')),
  
  -- Logistics (Early Morning)
  (13, 1, 51, 11, 20, DATE('now'), DATETIME('now', 'start of day', '+5 hours'), DATETIME('now', 'start of day', '+13 hours'), 8, 'Regular', 'Completed', datetime('now')),
  (14, 1, 52, 11, 20, DATE('now'), DATETIME('now', 'start of day', '+5 hours'), DATETIME('now', 'start of day', '+13 hours'), 8, 'Regular', 'Completed', datetime('now'));

-- ============================================================================
-- TIME ENTRIES - With Geolocation Data
-- ============================================================================

INSERT OR REPLACE INTO time_entries (id, employee_id, shift_id, location_id, clock_in_time, clock_in_latitude, clock_in_longitude, clock_in_method, clock_in_verified, clock_out_time, clock_out_latitude, clock_out_longitude, total_hours, is_approved, created_at)
VALUES 
  -- Head Office Check-ins
  (1, 4, 1, 1, DATETIME('now', 'start of day', '+8 hours', '+3 minutes'), -26.1076, 28.0567, 'Mobile', 1, NULL, NULL, NULL, NULL, 0, datetime('now')),
  
  -- Manufacturing (Completed Shift)
  (2, 10, 3, 2, DATETIME('now', 'start of day', '+6 hours', '-2 minutes'), -25.6833, 28.0833, 'Biometric', 1, DATETIME('now', 'start of day', '+14 hours', '+1 minute'), -25.6833, 28.0833, 8.05, 1, datetime('now')),
  
  -- Mining (Currently underground - no GPS)
  (3, 20, 6, 4, DATETIME('now', 'start of day', '+6 hours', '+5 minutes'), -26.8500, 26.6667, 'Kiosk', 1, NULL, NULL, NULL, NULL, 0, datetime('now')),
  (4, 21, 7, 4, DATETIME('now', 'start of day', '+6 hours', '+8 minutes'), -26.8500, 26.6667, 'Kiosk', 1, NULL, NULL, NULL, NULL, 0, datetime('now')),
  
  -- Retail
  (5, 30, 9, 6, DATETIME('now', 'start of day', '+9 hours', '-5 minutes'), -33.9028, 18.4194, 'Mobile', 1, NULL, NULL, NULL, NULL, 0, datetime('now')),
  
  -- Construction Site
  (6, 40, 11, 9, DATETIME('now', 'start of day', '+6 hours', '+10 minutes'), -29.7278, 31.0819, 'Mobile', 1, NULL, NULL, NULL, NULL, 0, datetime('now')),
  (7, 41, 12, 9, DATETIME('now', 'start of day', '+6 hours', '+12 minutes'), -29.7278, 31.0819, 'Mobile', 1, NULL, NULL, NULL, NULL, 0, datetime('now')),
  
  -- Logistics (Mobile workers - different locations)
  (8, 51, 13, 11, DATETIME('now', 'start of day', '+5 hours'), -25.9953, 28.1250, 'Mobile', 1, DATETIME('now', 'start of day', '+13 hours'), -26.0453, 28.1750, 8, 1, datetime('now')),
  (9, 52, 14, 11, DATETIME('now', 'start of day', '+5 hours'), -25.9953, 28.1250, 'Mobile', 1, DATETIME('now', 'start of day', '+13 hours'), -25.9353, 28.0850, 8, 1, datetime('now'));

-- ============================================================================
-- SKILLS - Industry Specific
-- ============================================================================

INSERT OR REPLACE INTO skills (id, organization_id, name, category, description, requires_certification, created_at)
VALUES 
  -- White Collar
  (1, 1, 'Financial Reporting (IFRS)', 'Technical', 'International Financial Reporting Standards', 1, datetime('now')),
  (2, 1, 'HR Business Partnering', 'Soft', 'Strategic HR alignment with business', 0, datetime('now')),
  (3, 1, 'Project Management (PMP)', 'Technical', 'Project Management Professional', 1, datetime('now')),
  
  -- Manufacturing
  (10, 1, 'CNC Machine Operation', 'Technical', 'Computer Numerical Control machines', 1, datetime('now')),
  (11, 1, 'Quality Assurance ISO 9001', 'Compliance', 'ISO quality standards', 1, datetime('now')),
  (12, 1, 'Lean Manufacturing', 'Technical', 'Waste reduction methodologies', 0, datetime('now')),
  
  -- Mining
  (20, 1, 'Rock Drill Operation', 'Technical', 'Underground drilling equipment', 1, datetime('now')),
  (21, 1, 'Blasting Certificate', 'Safety', 'Explosives handling license', 1, datetime('now')),
  (22, 1, 'Mine Health & Safety', 'Safety', 'SA Mine Health & Safety Act compliance', 1, datetime('now')),
  
  -- Construction
  (30, 1, 'Scaffolding', 'Technical', 'Scaffold erection and inspection', 1, datetime('now')),
  (31, 1, 'Construction Safety', 'Safety', 'SACPCMP safety requirements', 1, datetime('now')),
  (32, 1, 'Concrete Work', 'Technical', 'Formwork and concrete finishing', 0, datetime('now')),
  
  -- Logistics
  (40, 1, 'Forklift Operation', 'Technical', 'Forklift license (Code 14)', 1, datetime('now')),
  (41, 1, 'Heavy Vehicle License', 'Compliance', 'Code 10/14 drivers license', 1, datetime('now')),
  (42, 1, 'Dangerous Goods Transport', 'Compliance', 'Transport of hazardous materials', 1, datetime('now'));

-- ============================================================================
-- LEAVE REQUESTS - Various Statuses
-- ============================================================================

INSERT OR REPLACE INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, balance_before, balance_after, created_at)
VALUES 
  (1, 4, 1, DATE('now', '+7 days'), DATE('now', '+11 days'), 5, 'Family holiday to Kruger National Park', 'Approved', 22, 17, datetime('now', '-3 days')),
  (2, 11, 2, DATE('now', '+1 day'), DATE('now', '+2 days'), 2, 'Flu symptoms - doctor's note attached', 'Pending', 30, 28, datetime('now', '-1 hour')),
  (3, 30, 1, DATE('now', '+14 days'), DATE('now', '+21 days'), 6, 'Annual December holiday', 'Pending', 18, 12, datetime('now', '-6 hours')),
  (4, 41, 3, DATE('now'), DATE('now'), 1, 'Child school meeting', 'Approved', 2, 1, datetime('now', '-2 days'));

-- ============================================================================
-- SOCIAL POSTS - Company-Wide Engagement
-- ============================================================================

INSERT OR REPLACE INTO social_posts (id, organization_id, author_id, post_type, content, visibility, likes_count, comments_count, created_at)
VALUES 
  (1, 1, 1, 'Announcement', '🎉 Excited to announce Mzansi Industrial Group has achieved B-BBEE Level 1 status! This is a testament to our commitment to transformation. Thank you to every team member for making this possible! 🇿🇦', 'Public', 45, 12, datetime('now', '-2 days')),
  (2, 1, 10, 'Achievement', '💪 Production Line A achieved ZERO safety incidents for 100 consecutive days! Proud of the team in Rosslyn! Keep up the excellent work! #SafetyFirst', 'Public', 38, 8, datetime('now', '-1 day')),
  (3, 1, 30, 'Knowledge Share', '📚 Pro tip for retail team: When dealing with difficult customers, remember to LISTEN first, EMPATHIZE second, SOLVE third. Works every time! What are your customer service tips?', 'Public', 22, 15, datetime('now', '-8 hours')),
  (4, 1, 20, 'Question', 'Does anyone know when the new PPE equipment will arrive at the Klerksdorp site? We need to update our safety gear inventory. @HR', 'Department', 5, 3, datetime('now', '-3 hours'));

-- ============================================================================
-- INCIDENTS - Safety & Compliance
-- ============================================================================

INSERT OR REPLACE INTO incidents (id, organization_id, incident_number, incident_type, severity, incident_date, location_id, department_id, title, description, reported_by, status, created_at)
VALUES 
  (1, 1, 'INC001', 'Safety', 'Low', DATETIME('now', '-5 days'), 2, 6, 'Minor cut on production floor', 'Employee cut finger on sharp metal edge. First aid administered immediately. No stitches required.', 10, 'Closed', datetime('now', '-5 days')),
  (2, 1, 'INC002', 'Equipment Failure', 'Medium', DATETIME('now', '-2 days'), 4, 11, 'Rock drill malfunction', 'Drill #4 overheated and shut down. Maintenance team called. Production delayed 2 hours.', 20, 'Actions in Progress', datetime('now', '-2 days')),
  (3, 1, 'INC003', 'Customer Complaint', 'Low', DATETIME('now', '-1 day'), 6, 14, 'Product quality complaint', 'Customer reported defective item. Refund issued. QC team investigating batch.', 30, 'Under Investigation', datetime('now', '-1 day'));

-- ============================================================================
-- KPI RESULTS - Multi-Department Performance
-- ============================================================================

INSERT OR REPLACE INTO kpi_results (id, kpi_id, employee_id, department_id, period_start_date, period_end_date, actual_value, target_value, percentage_achieved, status, created_at)
VALUES 
  (1, 1, 4, 2, DATE('now', 'start of month'), DATE('now'), 4.6, 4.5, 102, 'Above Target', datetime('now')),
  (2, 2, 30, 14, DATE('now', 'start of month'), DATE('now'), 105000, 100000, 105, 'Above Target', datetime('now')),
  (3, 3, 10, 6, DATE('now', 'start of month'), DATE('now'), 98, 95, 103, 'Above Target', datetime('now')),
  (4, 5, 6, 2, DATE('now', 'start of month'), DATE('now'), 92, 85, 108, 'Outstanding', datetime('now'));

-- ============================================================================
-- COMPLIANCE CHECKS
-- ============================================================================

INSERT OR REPLACE INTO compliance_checks (id, organization_id, check_type, check_name, frequency, status, score, last_check_date, next_check_date, created_at)
VALUES 
  (1, 1, 'BCEA', 'Working Hours Compliance - All Sites', 'Weekly', 'Compliant', 96, DATE('now', '-1 day'), DATE('now', '+6 days'), datetime('now')),
  (2, 1, 'BBEE', 'B-BBEE Scorecard Level 1 Verification', 'Annual', 'Compliant', 100, DATE('now', '-30 days'), DATE('now', '+335 days'), datetime('now')),
  (3, 1, 'Skills Development', 'SETA Training Budget Utilization', 'Monthly', 'Compliant', 94, DATE('now', '-2 days'), DATE('now', '+28 days'), datetime('now')),
  (4, 1, 'COIDA', 'Injury on Duty Reporting', 'Monthly', 'Compliant', 100, DATE('now'), DATE('now', '+30 days'), datetime('now'));

-- Update organization employee count to 150
UPDATE organizations SET employee_count = 150 WHERE id = 1;
