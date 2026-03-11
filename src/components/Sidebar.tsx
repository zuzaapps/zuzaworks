'use client';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

type NavItem =
  | { id: string; icon: string; label: string; color: string; badge?: string | null; divider?: never }
  | { id: string; divider: true; icon?: never; label?: never; color?: never; badge?: never };

const navItems: NavItem[] = [
  { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'Executive Dashboard', color: 'text-pastel-blue-400' },
  { id: 'schedule', icon: 'fa-calendar-week', label: 'Scheduling', color: 'text-pastel-blue-400' },
  { id: 'employees', icon: 'fa-users', label: 'Employee Management', color: 'text-pastel-blue-400' },
  { id: 'interns', icon: 'fa-user-graduate', label: 'Interns (SETA/YES/NYS)', color: 'text-pastel-blue-200' },
  { id: 'compliance', icon: 'fa-shield-alt', label: 'Compliance Manager', color: 'text-pastel-blue-300', badge: '!' },
  { id: 'my-compliance', icon: 'fa-clipboard-check', label: 'My Compliance', color: 'text-pastel-blue-200' },
  { id: 'time-tracking', icon: 'fa-clock', label: 'Time Tracking', color: 'text-pastel-blue-400' },
  { id: 'locations', icon: 'fa-map-marker-alt', label: 'Multi-Location', color: 'text-pastel-blue-200' },
  { id: 'leave', icon: 'fa-umbrella-beach', label: 'Leave Management', color: 'text-pastel-blue-300' },
  { id: 'onboarding', icon: 'fa-user-plus', label: 'Employee Onboarding', color: 'text-pastel-blue-400' },
  { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics & BI', color: 'text-pastel-blue-200' },
  { id: 'user-management', icon: 'fa-user-cog', label: 'User Management', color: 'text-pastel-blue-400' },
  { id: 'divider1', divider: true },
  { id: 'shift-swaps', icon: 'fa-exchange-alt', label: 'Shift Swaps', color: 'text-pastel-blue-200', badge: 'NEW' },
  { id: 'messaging', icon: 'fa-comments', label: 'Team Messaging', color: 'text-pastel-blue-400', badge: '3' },
  { id: 'documents', icon: 'fa-folder-open', label: 'Documents', color: 'text-pastel-blue-300' },
  { id: 'payroll', icon: 'fa-dollar-sign', label: 'Payroll Export', color: 'text-pastel-blue-200' },
  { id: 'forecasting', icon: 'fa-brain', label: 'Labor Forecasting', color: 'text-pastel-blue-300', badge: 'AI' },
  { id: 'attendance-rules', icon: 'fa-gavel', label: 'Attendance Rules', color: 'text-pastel-blue-300' },
  { id: 'budgets', icon: 'fa-chart-pie', label: 'Budget Tracking', color: 'text-pastel-blue-200' },
  { id: 'divider2', divider: true },
  { id: 'social', icon: 'fa-comments', label: 'Social Feed', color: 'text-gray-400' },
  { id: 'engagement', icon: 'fa-trophy', label: 'Engagement', color: 'text-gray-400' },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="glass-card p-4">
      <nav className="space-y-1">
        {navItems.map((item) => {
          if ('divider' in item && item.divider) {
            return <div key={item.id} className="border-t border-gray-200 my-2" />;
          }
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item w-full text-left ${
                isActive ? 'active bg-pastel-blue-400 text-white font-semibold' : ''
              }`}
            >
              <i className={`fas ${item.icon} w-6 ${isActive ? 'text-white' : item.color}`} />
              <span className="ml-3">{item.label}</span>
              {'badge' in item && item.badge && (
                <span className="ml-auto text-xs bg-pastel-blue-300 text-white px-2 py-1 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
