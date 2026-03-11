'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  total_employees: number;
  active_employees: number;
  on_leave_today: number;
  shifts_today: number;
  open_shifts: number;
  pending_leave_requests: number;
  compliance_score: number;
  training_completion_rate: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/dashboard/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {} finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Total Employees', value: stats?.total_employees || 0, icon: 'fa-users', color: 'from-pastel-blue-400 to-pastel-blue-300' },
    { label: 'Active Employees', value: stats?.active_employees || 0, icon: 'fa-user-check', color: 'from-pastel-blue-300 to-pastel-blue-200' },
    { label: 'On Leave Today', value: stats?.on_leave_today || 0, icon: 'fa-umbrella-beach', color: 'from-pastel-blue-200 to-pastel-blue-100' },
    { label: 'Shifts Today', value: stats?.shifts_today || 0, icon: 'fa-calendar-day', color: 'from-pastel-blue-400 to-pastel-blue-200' },
    { label: 'Open Shifts', value: stats?.open_shifts || 0, icon: 'fa-calendar-plus', color: 'from-pastel-blue-300 to-pastel-blue-100' },
    { label: 'Pending Leave', value: stats?.pending_leave_requests || 0, icon: 'fa-hourglass-half', color: 'from-yellow-400 to-yellow-300' },
    { label: 'Compliance Score', value: `${stats?.compliance_score || 0}%`, icon: 'fa-shield-alt', color: 'from-green-400 to-green-300' },
    { label: 'Training Rate', value: `${stats?.training_completion_rate || 0}%`, icon: 'fa-graduation-cap', color: 'from-pastel-blue-400 to-pastel-blue-300' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="fas fa-spinner fa-spin text-4xl text-pastel-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <i className={`fas ${card.icon} text-white text-xl`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Compliance Health & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-4 text-pastel-blue-400 flex items-center">
            <i className="fas fa-shield-alt mr-2" /> Compliance Health
          </h3>
          <div className="space-y-4">
            {[
              { label: 'BCEA Compliance', value: 94, color: 'bg-pastel-blue-200' },
              { label: 'EEA Progress', value: 78, color: 'bg-pastel-blue-400' },
              { label: 'COIDA Coverage', value: 100, color: 'bg-green-400' },
              { label: 'Skills Development', value: 65, color: 'bg-pastel-blue-300' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-bold">{item.value}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} transition-all`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-4 text-pastel-blue-400 flex items-center">
            <i className="fas fa-bolt mr-2" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Clock In', icon: 'fa-clock', color: 'bg-pastel-blue-400' },
              { label: 'Request Leave', icon: 'fa-umbrella-beach', color: 'bg-pastel-blue-300' },
              { label: 'View Schedule', icon: 'fa-calendar', color: 'bg-pastel-blue-200' },
              { label: 'Report Incident', icon: 'fa-exclamation-triangle', color: 'bg-yellow-400' },
              { label: 'Team Messages', icon: 'fa-comments', color: 'bg-pastel-blue-400' },
              { label: 'View Payslip', icon: 'fa-file-invoice-dollar', color: 'bg-green-400' },
            ].map((action) => (
              <button key={action.label} className="p-3 rounded-xl border-2 border-gray-200 hover:border-pastel-blue-400 transition flex items-center gap-2">
                <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                  <i className={`fas ${action.icon} text-white text-sm`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-4 text-pastel-blue-400 flex items-center">
            <i className="fas fa-history mr-2" /> Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              { user: 'Thabo M.', action: 'earned 50 ZuZa Coins', time: '2m ago', icon: 'fa-trophy', color: 'text-yellow-500' },
              { user: 'Lerato K.', action: 'completed a shift', time: '5m ago', icon: 'fa-check-circle', color: 'text-green-500' },
              { user: 'Nomsa N.', action: 'posted an achievement', time: '8m ago', icon: 'fa-star', color: 'text-pastel-blue-300' },
              { user: 'Sipho D.', action: 'finished training module', time: '12m ago', icon: 'fa-graduation-cap', color: 'text-pastel-blue-400' },
              { user: 'Sarah vdM.', action: 'unlocked "5-Day Streak" badge', time: '15m ago', icon: 'fa-medal', color: 'text-pastel-blue-200' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <i className={`fas ${activity.icon} ${activity.color} text-lg`} />
                <div className="flex-1">
                  <span className="font-semibold text-gray-800">{activity.user}</span>{' '}
                  <span className="text-gray-600">{activity.action}</span>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold text-lg mb-4 text-pastel-blue-400 flex items-center">
            <i className="fas fa-crown mr-2" /> Leaderboard
          </h3>
          <div className="space-y-2">
            {[
              { rank: 1, name: 'Thabo Motsepe', points: 4850, trend: 'up' },
              { rank: 2, name: 'Lerato Khumalo', points: 4320, trend: 'up' },
              { rank: 3, name: 'Sipho Dlamini', points: 3980, trend: 'stable' },
              { rank: 4, name: 'Nosipho Madonsela', points: 3650, trend: 'up' },
              { rank: 5, name: 'Johannes Mabuza', points: 3400, trend: 'down' },
            ].map((player) => (
              <div key={player.rank} className={`flex items-center gap-3 p-3 rounded-xl ${
                player.rank <= 3 ? 'bg-gradient-to-r from-pastel-blue-100 to-transparent' : ''
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  player.rank === 1 ? 'bg-pastel-blue-400 text-white' :
                  player.rank === 2 ? 'bg-pastel-blue-300 text-white' :
                  player.rank === 3 ? 'bg-pastel-blue-200 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {player.rank}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{player.name}</div>
                  <div className="text-xs text-gray-500">{player.points.toLocaleString()} points</div>
                </div>
                <i className={`fas fa-arrow-${player.trend === 'up' ? 'up text-green-500' : player.trend === 'down' ? 'down text-red-500' : 'right text-gray-400'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
