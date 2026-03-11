'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, sso_provider: 'local' }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('userRole', data.data.user.role?.name || data.data.user.role || 'employee');
        router.push('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('demo');
    setTimeout(() => {
      const form = document.getElementById('loginForm') as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pastel-blue-300 via-pastel-blue-400 to-pastel-blue-200">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <i className="fas fa-briefcase text-4xl text-pastel-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">ZuZaWorks</h1>
          <p className="text-white/90 text-sm">Enterprise Workforce Operating System</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="px-3 py-1 bg-white/20 text-white text-xs rounded-full font-bold">Proudly South African</span>
            <span className="px-3 py-1 bg-white/20 text-white text-xs rounded-full font-bold">B-BBEE Level 1</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Sign In to Your Account</h2>

          {/* Demo Info */}
          <div className="mb-6 p-4 bg-pastel-blue-400/10 border border-pastel-blue-400/30 rounded-xl">
            <div className="flex items-start gap-2">
              <i className="fas fa-info-circle text-pastel-blue-400 mt-1" />
              <div className="text-sm text-gray-700">
                <p className="font-bold mb-1">Demo Access:</p>
                <p className="text-xs">Use any demo email below to login</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form id="loginForm" onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pastel-blue-400 focus:border-transparent"
                  placeholder="your.email@company.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pastel-blue-400 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pastel-blue-400 to-pastel-blue-200 text-white font-bold rounded-xl hover:scale-105 transition disabled:opacity-50"
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin mr-2" /> Signing In...</>
              ) : (
                <><i className="fas fa-sign-in-alt mr-2" /> Sign In with Password</>
              )}
            </button>
          </form>

          {/* SSO Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>

          {/* SSO Buttons */}
          <div className="space-y-3">
            {['Google', 'Microsoft', 'LinkedIn'].map((provider) => (
              <button
                key={provider}
                onClick={() => alert(`${provider} OAuth Integration\n\nTo enable this:\n1. Register OAuth app with ${provider}\n2. Add credentials to environment variables\n3. Configure redirect URLs\n\nFor demo, use email/password login.`)}
                className="w-full py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:border-pastel-blue-400 transition flex items-center justify-center gap-3"
              >
                <i className={`fab fa-${provider.toLowerCase()} text-lg`} />
                Sign in with {provider}
              </button>
            ))}
          </div>

          {/* Quick Demo */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3 font-semibold">Quick Demo Access:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Super Admin', email: 'thabo.motsepe@mzansi.co.za' },
                { label: 'HR Manager', email: 'nosipho.madonsela@mzansi.co.za' },
                { label: 'Dept Manager', email: 'johannes.mabuza@mzansi.co.za' },
                { label: 'Employee', email: 'alfred.mashego@mzansi.co.za' },
              ].map((demo) => (
                <button
                  key={demo.email}
                  onClick={() => quickLogin(demo.email)}
                  className="p-2 bg-gray-50 hover:bg-pastel-blue-400/10 rounded-lg border border-gray-200 text-left transition"
                >
                  <div className="font-semibold text-gray-700">{demo.label}</div>
                  <div className="text-gray-500 truncate">{demo.email.split('@')[0]}@...</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>&copy; 2025 ZuZaWorks. POPIA Compliant.</p>
        </div>
      </div>
    </div>
  );
}
