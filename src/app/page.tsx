'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ComplianceSidebar from '@/components/ComplianceSidebar';
import DashboardPage from '@/components/DashboardPage';
import DataPage from '@/components/DataPage';

// Status badge renderer
function StatusBadge(value: any) {
  const colors: Record<string, string> = {
    Active: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
    Declined: 'bg-red-100 text-red-800',
    declined: 'bg-red-100 text-red-800',
    Scheduled: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    Reported: 'bg-orange-100 text-orange-800',
    'On Leave': 'bg-purple-100 text-purple-800',
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    registered: 'bg-blue-100 text-blue-800',
    critical: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    compliant: 'bg-green-100 text-green-800',
    non_compliant: 'bg-red-100 text-red-800',
    new: 'bg-blue-100 text-blue-800',
  };
  const c = colors[value] || 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c}`}>{value || '-'}</span>;
}

// Page configurations
const pageConfigs: Record<string, { title: string; icon: string; apiUrl: string; columns: any[] }> = {
  employees: {
    title: 'Employee Management',
    icon: 'fa-users',
    apiUrl: '/api/employees',
    columns: [
      { key: 'employee_number', label: 'Emp #' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'job_title', label: 'Job Title' },
      { key: 'department_name', label: 'Department' },
      { key: 'location_name', label: 'Location' },
      { key: 'employment_status', label: 'Status', render: StatusBadge },
    ],
  },
  schedule: {
    title: 'Shift Scheduling',
    icon: 'fa-calendar-week',
    apiUrl: '/api/shifts',
    columns: [
      { key: 'shift_date', label: 'Date' },
      { key: 'start_time', label: 'Start' },
      { key: 'end_time', label: 'End' },
      { key: 'employee_name', label: 'Employee' },
      { key: 'location_name', label: 'Location' },
      { key: 'department_name', label: 'Department' },
      { key: 'shift_type', label: 'Type' },
      { key: 'status', label: 'Status', render: StatusBadge },
    ],
  },
  'time-tracking': {
    title: 'Time Tracking',
    icon: 'fa-clock',
    apiUrl: '/api/time-entries',
    columns: [
      { key: 'employee_name', label: 'Employee' },
      { key: 'clock_in_time', label: 'Clock In' },
      { key: 'clock_out_time', label: 'Clock Out' },
      { key: 'clock_in_method', label: 'Method' },
      { key: 'break_duration_minutes', label: 'Break (min)' },
      { key: 'total_hours', label: 'Total Hours' },
    ],
  },
  leave: {
    title: 'Leave Management',
    icon: 'fa-umbrella-beach',
    apiUrl: '/api/leave/requests',
    columns: [
      { key: 'employee_name', label: 'Employee' },
      { key: 'leave_type_name', label: 'Type' },
      { key: 'start_date', label: 'Start' },
      { key: 'end_date', label: 'End' },
      { key: 'total_days', label: 'Days' },
      { key: 'status', label: 'Status', render: StatusBadge },
      { key: 'requested_at', label: 'Requested' },
    ],
  },
  compliance: {
    title: 'Compliance Manager',
    icon: 'fa-shield-alt',
    apiUrl: '/api/compliance/checkpoints',
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'title', label: 'Checkpoint' },
      { key: 'category_name', label: 'Category' },
      { key: 'check_type', label: 'Type' },
      { key: 'frequency', label: 'Frequency' },
      { key: 'responsible_role', label: 'Responsible' },
      { key: 'compliance_status', label: 'Status', render: StatusBadge },
    ],
  },
  interns: {
    title: 'Interns Management',
    icon: 'fa-user-graduate',
    apiUrl: '/api/interns',
    columns: [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'program_name', label: 'Program' },
      { key: 'program_type', label: 'Type' },
      { key: 'intern_status', label: 'Status', render: StatusBadge },
      { key: 'start_date', label: 'Start Date' },
    ],
  },
  'shift-swaps': {
    title: 'Shift Swaps',
    icon: 'fa-exchange-alt',
    apiUrl: '/api/shift-swaps',
    columns: [
      { key: 'requesting_employee_name', label: 'Requesting' },
      { key: 'target_employee_name', label: 'Target' },
      { key: 'shift_date', label: 'Shift Date' },
      { key: 'start_time', label: 'Start' },
      { key: 'end_time', label: 'End' },
      { key: 'swap_type', label: 'Type' },
      { key: 'status', label: 'Status', render: StatusBadge },
    ],
  },
  messaging: {
    title: 'Team Messaging',
    icon: 'fa-comments',
    apiUrl: '/api/messages',
    columns: [
      { key: 'sender_name', label: 'From' },
      { key: 'subject', label: 'Subject' },
      { key: 'message_type', label: 'Type' },
      { key: 'target_type', label: 'Target' },
      { key: 'is_urgent', label: 'Urgent', render: (v: any) => v ? <span className="text-red-500 font-bold">Yes</span> : 'No' },
      { key: 'created_at', label: 'Date' },
    ],
  },
  documents: {
    title: 'Documents',
    icon: 'fa-folder-open',
    apiUrl: '/api/documents',
    columns: [
      { key: 'document_name', label: 'Name' },
      { key: 'document_type', label: 'Type' },
      { key: 'employee_name', label: 'Employee' },
      { key: 'is_confidential', label: 'Confidential', render: (v: any) => v ? 'Yes' : 'No' },
      { key: 'created_at', label: 'Uploaded' },
    ],
  },
  payroll: {
    title: 'Payroll Export',
    icon: 'fa-dollar-sign',
    apiUrl: '/api/payroll',
    columns: [
      { key: 'batch_number', label: 'Batch #' },
      { key: 'pay_period_start', label: 'Period Start' },
      { key: 'pay_period_end', label: 'Period End' },
      { key: 'status', label: 'Status', render: StatusBadge },
      { key: 'created_at', label: 'Created' },
    ],
  },
  budgets: {
    title: 'Budget Tracking',
    icon: 'fa-chart-pie',
    apiUrl: '/api/budgets',
    columns: [
      { key: 'department_name', label: 'Department' },
      { key: 'location_name', label: 'Location' },
      { key: 'period_start', label: 'Period Start' },
      { key: 'labor_budget', label: 'Budget' },
      { key: 'actual_labor_cost', label: 'Actual' },
    ],
  },
  forecasting: {
    title: 'Labor Forecasting',
    icon: 'fa-brain',
    apiUrl: '/api/forecasts',
    columns: [
      { key: 'location_name', label: 'Location' },
      { key: 'department_name', label: 'Department' },
      { key: 'forecast_date', label: 'Date' },
      { key: 'predicted_headcount', label: 'Predicted' },
      { key: 'actual_headcount', label: 'Actual' },
    ],
  },
  'attendance-rules': {
    title: 'Attendance Rules',
    icon: 'fa-gavel',
    apiUrl: '/api/attendance/rules',
    columns: [
      { key: 'rule_name', label: 'Rule' },
      { key: 'rule_type', label: 'Type' },
      { key: 'department_name', label: 'Department' },
      { key: 'location_name', label: 'Location' },
      { key: 'is_active', label: 'Active', render: (v: any) => v ? 'Yes' : 'No' },
    ],
  },
  incidents: {
    title: 'Incident Reports',
    icon: 'fa-exclamation-triangle',
    apiUrl: '/api/incidents',
    columns: [
      { key: 'incident_number', label: 'Incident #' },
      { key: 'title', label: 'Title' },
      { key: 'incident_type', label: 'Type' },
      { key: 'severity', label: 'Severity', render: StatusBadge },
      { key: 'reported_by_name', label: 'Reported By' },
      { key: 'status', label: 'Status', render: StatusBadge },
    ],
  },
  social: {
    title: 'Social Feed',
    icon: 'fa-comments',
    apiUrl: '/api/social/posts',
    columns: [
      { key: 'author_name', label: 'Author' },
      { key: 'post_type', label: 'Type' },
      { key: 'content', label: 'Content', render: (v: any) => <span className="truncate max-w-xs block">{v?.substring(0, 100)}...</span> },
      { key: 'likes_count', label: 'Likes' },
      { key: 'comments_count', label: 'Comments' },
      { key: 'created_at', label: 'Posted' },
    ],
  },
};

// Placeholder pages
function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="glass-card p-8 text-center">
      <i className={`fas ${icon} text-5xl text-pastel-blue-300 mb-4`} />
      <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500">This module is available. Data will populate once the database is seeded.</p>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
    setChecking(false);
  }, [router]);

  if (checking || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-white" />
      </div>
    );
  }

  function renderPage() {
    if (currentPage === 'dashboard') {
      return <DashboardPage />;
    }

    const config = pageConfigs[currentPage];
    if (config) {
      return (
        <DataPage
          title={config.title}
          icon={config.icon}
          apiUrl={config.apiUrl}
          columns={config.columns}
        />
      );
    }

    // Remaining pages with placeholders
    const placeholders: Record<string, { title: string; icon: string }> = {
      locations: { title: 'Multi-Location Management', icon: 'fa-map-marker-alt' },
      onboarding: { title: 'Employee Onboarding', icon: 'fa-user-plus' },
      analytics: { title: 'Analytics & Business Intelligence', icon: 'fa-chart-line' },
      'user-management': { title: 'User Management', icon: 'fa-user-cog' },
      'my-compliance': { title: 'My Compliance Dashboard', icon: 'fa-clipboard-check' },
      engagement: { title: 'Engagement & Gamification', icon: 'fa-trophy' },
    };

    const ph = placeholders[currentPage];
    if (ph) return <PlaceholderPage title={ph.title} icon={ph.icon} />;

    return <DashboardPage />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Header onNavigate={setCurrentPage} />

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
          <div className="mt-6">
            <ComplianceSidebar />
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-9">
          {renderPage()}
        </div>
      </div>

      {/* Digital Twin FAB */}
      <button
        className="fixed bottom-5 right-5 w-16 h-16 rounded-full bg-gradient-to-br from-pastel-blue-300 to-pastel-blue-400 flex items-center justify-center shadow-lg hover:scale-110 transition z-50"
        onClick={() => alert('AI Digital Twin Chat\n\nYour personal AI workplace assistant is ready to help with scheduling, compliance, and more!')}
      >
        <i className="fas fa-robot text-white text-2xl" />
      </button>
    </div>
  );
}
