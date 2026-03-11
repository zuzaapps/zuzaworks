// ZuZaWorksOS TypeScript Types - Next.js Edition

export interface Organization {
  id: number;
  name: string;
  bbee_level?: string;
  tax_number?: string;
  company_registration?: string;
  industry?: string;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: number;
  organization_id: number;
  name: string;
  location_name?: string;
  province: string;
  city?: string;
  address?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: number;
  organization_id: number;
  location_id?: number;
  name: string;
  code?: string;
  manager_id?: number;
  budget_annual?: number;
  headcount_target?: number;
  created_at: string;
}

export interface Employee {
  id: number;
  organization_id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  id_number?: string;
  passport_number?: string;
  date_of_birth?: string;
  gender?: string;
  nationality: string;
  race?: string;
  disability_status: boolean;
  email: string;
  phone_mobile?: string;
  phone_home?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  employment_type: string;
  employment_status: string;
  department_id?: number;
  location_id?: number;
  job_title: string;
  job_level?: string;
  manager_id?: number;
  hire_date: string;
  probation_end_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  termination_date?: string;
  salary_amount?: number;
  salary_currency: string;
  salary_frequency: string;
  contracted_hours_per_week: number;
  shift_pattern?: string;
  leave_annual_balance: number;
  leave_annual_accrued: number;
  leave_sick_balance: number;
  leave_family_balance: number;
  user_id?: number;
  profile_photo_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: number;
  organization_id: number;
  shift_template_id?: number;
  employee_id?: number;
  location_id: number;
  department_id?: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  break_duration_minutes: number;
  shift_type: string;
  pay_multiplier: number;
  status: string;
  required_skills?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: number;
  employee_id: number;
  shift_id?: number;
  location_id?: number;
  clock_in_time: string;
  clock_in_latitude?: number;
  clock_in_longitude?: number;
  clock_in_method: string;
  clock_out_time?: string;
  clock_out_latitude?: number;
  clock_out_longitude?: number;
  break_duration_minutes: number;
  total_hours?: number;
  regular_hours?: number;
  overtime_hours?: number;
  is_approved: boolean;
  is_late: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: string;
  requested_at: string;
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: number;
  organization_id: number;
  incident_number: string;
  incident_type: string;
  severity: string;
  incident_date: string;
  location_id?: number;
  department_id?: number;
  title: string;
  description: string;
  reported_by: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: number;
  organization_id: number;
  author_id: number;
  post_type: string;
  content: string;
  visibility: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_photo?: string;
  author_title?: string;
}

export interface SocialComment {
  id: number;
  post_id: number;
  author_id: number;
  content: string;
  likes_count: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_photo?: string;
}

export interface DashboardStats {
  total_employees: number;
  active_employees: number;
  on_leave_today: number;
  shifts_today: number;
  open_shifts: number;
  pending_leave_requests: number;
  compliance_score: number;
  training_completion_rate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}
