'use client';

import { useState, useEffect } from 'react';

interface HeaderProps {
  onNavigate: (page: string) => void;
}

export default function Header({ onNavigate }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  }

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            <span className="sa-gradient bg-clip-text text-transparent">ZuZaWorksOS</span>
          </h1>
          <p className="text-gray-600 font-medium">Building South Africa Together</p>
        </div>

        {/* Gamification Stats */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="glass-card p-3 flex items-center gap-2 streak-fire">
            <i className="fas fa-fire text-pastel-blue-300 text-2xl" />
            <div>
              <div className="text-xs text-gray-600">Streak</div>
              <div className="text-xl font-bold text-pastel-blue-300">15</div>
            </div>
          </div>

          <div className="glass-card p-3 flex items-center gap-2">
            <i className="fas fa-coins text-pastel-blue-300 text-2xl" />
            <div>
              <div className="text-xs text-gray-600">ZuZa Coins</div>
              <div className="text-xl font-bold text-pastel-blue-300">1,250</div>
            </div>
          </div>

          <div className="glass-card p-3 flex items-center gap-2">
            <i className="fas fa-trophy text-pastel-blue-200 text-2xl" />
            <div>
              <div className="text-xs text-gray-600">Level / Rank</div>
              <div className="text-xl font-bold text-pastel-blue-200">12 / #23</div>
            </div>
          </div>

          <button className="glass-card p-3 relative hover:scale-105 transition">
            <i className="fas fa-bell text-2xl text-pastel-blue-400" />
            <span className="absolute top-1 right-1 w-5 h-5 bg-pastel-blue-300 text-white text-xs rounded-full flex items-center justify-center font-bold">3</span>
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="glass-card p-3 hover:scale-105 transition flex items-center gap-2"
            >
              <i className="fas fa-user-circle text-2xl text-pastel-blue-200" />
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-gray-800">{user?.name || 'Loading...'}</div>
                <div className="text-xs text-gray-500">{user?.role?.display_name || user?.role?.name || '...'}</div>
              </div>
              <i className="fas fa-chevron-down text-gray-500 text-sm" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 glass-card rounded-xl shadow-2xl p-4 z-50">
                <div className="border-b border-gray-200 pb-3 mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <i className="fas fa-user-circle text-3xl text-pastel-blue-200" />
                    <div>
                      <div className="font-bold text-gray-800">{user?.name}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-pastel-blue-400 text-white text-xs rounded-full font-bold">
                    {user?.role?.display_name || user?.role?.name || 'Employee'}
                  </span>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => { setShowProfile(false); onNavigate('user-management'); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
                  >
                    <i className="fas fa-cog text-gray-600" /> Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 hover:bg-pastel-blue-300/10 rounded-lg flex items-center gap-2 text-sm text-pastel-blue-400 font-semibold"
                  >
                    <i className="fas fa-sign-out-alt" /> Logout
                  </button>
                </div>
                {user?.permissions?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    <div className="font-bold mb-1">Your Permissions:</div>
                    <div className="max-h-32 overflow-y-auto">
                      {user.permissions.slice(0, 10).map((p: string) => (
                        <span key={p} className="inline-block mr-1 mb-1 px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{p}</span>
                      ))}
                      {user.permissions.length > 10 && <span className="text-gray-400">+{user.permissions.length - 10} more</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Activity Bar */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-pastel-blue-300/10 via-pastel-blue-400/10 to-pastel-blue-200/10 border border-pastel-blue-400/20">
        <div className="flex items-center gap-2 text-sm">
          <div className="activity-dot" />
          <span className="font-semibold text-pastel-blue-400">Live Now:</span>
          <span className="text-gray-700">Thabo M. earned 50 ZuZa Coins &bull; Lerato K. completed a shift &bull; 12 employees clocked in today</span>
        </div>
      </div>
    </div>
  );
}
