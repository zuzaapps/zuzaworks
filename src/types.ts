// ZuZaWorksOS TypeScript Types
// Comprehensive type definitions for the entire system

export type Bindings = {
  DB: any; // D1Database on Cloudflare, undefined on Vercel
  AI: any; // Cloudflare AI binding
};

export type Variables = {
  user?: Employee;
};

// ============================================================================
// CORE ENTITIES
// ============================================================================

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
  
  // Personal
  first_name: string;
  last_name: string;
  id_number?: string;
  passport_number?: string;
  date_of_birth?: string;
  gender?: string;
  nationality: string;
  race?: string;
  disability_status: boolean;
  
  // Contact
  email: string;
  phone_mobile?: string;
  phone_home?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  
  // Emergency
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Employment
  employment_type: string;
  employment_status: string;
  department_id?: number;
  location_id?: number;
  job_title: string;
  job_level?: string;
  manager_id?: number;
  
  // Dates
  hire_date: string;
  probation_end_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  termination_date?: string;
  
  // Compensation
  salary_amount?: number;
  salary_currency: string;
  salary_frequency: string;
  
  // Working Hours
  contracted_hours_per_week: number;
  shift_pattern?: string;
  
  // Leave Balances
  leave_annual_balance: number;
  leave_annual_accrued: number;
  leave_sick_balance: number;
  leave_family_balance: number;
  
  // System
  user_id?: number;
  profile_photo_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SKILLS & TRAINING
// ============================================================================

export interface Skill {
  id: number;
  organization_id: number;
  name: string;
  category: string;
  description?: string;
  seta_code?: string;
  requires_certification: boolean;
  certification_validity_months?: number;
  created_at: string;
}

export interface EmployeeSkill {
  id: number;
  employee_id: number;
  skill_id: number;
  proficiency_level: string;
  proficiency_score?: number;
  acquired_date?: string;
  last_assessed_date?: string;
  certification_number?: string;
  certification_expiry_date?: string;
  verified_by?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingCourse {
  id: number;
  organization_id: number;
  code: string;
  title: string;
  description?: string;
  provider?: string;
  duration_hours?: number;
  cost_per_person?: number;
  max_participants?: number;
  seta_accredited: boolean;
  seta_code?: string;
  skills_developed?: string;
  certificate_issued: boolean;
  certificate_validity_months?: number;
  is_mandatory: boolean;
  created_at: string;
}

// ============================================================================
// SCHEDULING & SHIFTS
// ============================================================================

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
  assigned_by?: number;
  assigned_at?: string;
  swap_requested_by?: number;
  swap_requested_at?: string;
  swap_approved_by?: number;
  swap_approved_at?: string;
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
  clock_in_photo_url?: string;
  clock_in_verified: boolean;
  clock_out_time?: string;
  clock_out_latitude?: number;
  clock_out_longitude?: number;
  clock_out_method?: string;
  clock_out_photo_url?: string;
  clock_out_verified: boolean;
  break_duration_minutes: number;
  total_hours?: number;
  regular_hours?: number;
  overtime_hours?: number;
  is_approved: boolean;
  approved_by?: number;
  approved_at?: string;
  is_late: boolean;
  is_early_departure: boolean;
  has_location_mismatch: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LEAVE MANAGEMENT
// ============================================================================

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  supporting_document_url?: string;
  document_type?: string;
  status: string;
  requested_at: string;
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  balance_before?: number;
  balance_after?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PERFORMANCE & KPI
// ============================================================================

export interface KPI {
  id: number;
  organization_id: number;
  name: string;
  description?: string;
  category: string;
  measurement_unit?: string;
  target_value?: number;
  weight: number;
  calculation_method?: string;
  calculation_formula?: string;
  frequency: string;
  applicable_to: string;
  is_active: boolean;
  created_at: string;
}

export interface KPIResult {
  id: number;
  kpi_id: number;
  employee_id?: number;
  department_id?: number;
  period_start_date: string;
  period_end_date: string;
  actual_value: number;
  target_value: number;
  percentage_achieved?: number;
  score?: number;
  status: string;
  notes?: string;
  recorded_by?: number;
  recorded_at: string;
  created_at: string;
}

export interface PerformanceReview {
  id: number;
  employee_id: number;
  reviewer_id: number;
  review_type: string;
  review_period_start: string;
  review_period_end: string;
  review_date: string;
  overall_rating?: number;
  strengths?: string;
  areas_for_improvement?: string;
  goals_set?: string;
  technical_skills_rating?: number;
  soft_skills_rating?: number;
  leadership_rating?: number;
  teamwork_rating?: number;
  status: string;
  employee_acknowledged: boolean;
  employee_signature_date?: string;
  reviewer_signature_date?: string;
  recommended_action?: string;
  recommended_salary_increase_percentage?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INCIDENTS & COMPLIANCE
// ============================================================================

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
  immediate_action_taken?: string;
  reported_by: number;
  employees_involved?: string;
  witnesses?: string;
  investigation_required: boolean;
  investigated_by?: number;
  investigation_date?: string;
  root_cause_analysis?: string;
  contributing_factors?: string;
  corrective_actions?: string;
  preventive_actions?: string;
  action_owner?: number;
  action_due_date?: string;
  action_completed_date?: string;
  status: string;
  estimated_cost?: number;
  actual_cost?: number;
  requires_external_reporting: boolean;
  external_report_submitted: boolean;
  external_report_date?: string;
  external_reference_number?: string;
  attachments?: string;
  created_at: string;
  updated_at: string;
}

export interface BCEAViolation {
  id: number;
  organization_id: number;
  employee_id: number;
  violation_type: string;
  violation_date: string;
  description: string;
  severity: string;
  status: string;
  resolution_notes?: string;
  resolved_by?: number;
  resolved_at?: string;
  is_recurring: boolean;
  preventive_action?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SOCIAL COLLABORATION
// ============================================================================

export interface SocialPost {
  id: number;
  organization_id: number;
  author_id: number;
  post_type: string;
  content: string;
  media_urls?: string;
  visibility: string;
  target_department_id?: number;
  target_location_id?: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_pinned: boolean;
  is_flagged: boolean;
  flagged_reason?: string;
  is_approved: boolean;
  moderated_by?: number;
  moderated_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Extended for API responses
  author?: Partial<Employee>;
  has_liked?: boolean;
  comments?: SocialComment[];
}

export interface SocialComment {
  id: number;
  post_id: number;
  author_id: number;
  parent_comment_id?: number;
  content: string;
  likes_count: number;
  is_flagged: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  
  // Extended for API responses
  author?: Partial<Employee>;
  has_liked?: boolean;
  replies?: SocialComment[];
}

export interface SocialReaction {
  id: number;
  employee_id: number;
  target_type: string;
  target_id: number;
  reaction_type: string;
  created_at: string;
}

// ============================================================================
// AI DIGITAL TWIN
// ============================================================================

export interface DigitalTwin {
  id: number;
  employee_id: number;
  twin_name?: string;
  personality_profile?: string;
  work_patterns?: string;
  skill_preferences?: string;
  career_aspirations?: string;
  model_version?: string;
  training_data_summary?: string;
  last_training_date?: string;
  interactions_count: number;
  suggestions_accepted: number;
  suggestions_rejected: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIChatMessage {
  id: number;
  employee_id: number;
  digital_twin_id?: number;
  role: string;
  content: string;
  conversation_id?: string;
  context_type?: string;
  was_helpful?: boolean;
  feedback_notes?: string;
  created_at: string;
}

export interface AISuggestion {
  id: number;
  digital_twin_id: number;
  employee_id: number;
  suggestion_type: string;
  title: string;
  description: string;
  reasoning?: string;
  confidence_score?: number;
  priority: string;
  status: string;
  action_taken_at?: string;
  expires_at?: string;
  created_at: string;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface Notification {
  id: number;
  organization_id: number;
  recipient_id: number;
  type: string;
  category: string;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  is_read: boolean;
  read_at?: string;
  sent_via?: string;
  sent_at?: string;
  delivered: boolean;
  created_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

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

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DashboardStats {
  total_employees: number;
  active_employees: number;
  on_leave_today: number;
  shifts_today: number;
  open_shifts: number;
  pending_leave_requests: number;
  compliance_score: number;
  bcea_violations_this_week: number;
  incidents_this_month: number;
  training_completion_rate: number;
}
