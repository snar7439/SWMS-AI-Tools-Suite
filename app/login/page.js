'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate credentials before sending
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    console.log('Sending login request with credentials:', {
      username: credentials.username,
      password: '***' // Don't log password
    });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (!response.ok) {
        // Show specific error message from the API
        throw new Error(result.details || result.message || 'Login failed');
      }

      // Store auth info in sessionStorage
      sessionStorage.setItem('swms-auth', JSON.stringify({
        username: credentials.username,
        authenticated: true,
        loginTime: new Date().toISOString()
      }));

      console.log('Login successful, redirecting to dashboard...');
      
      // Redirect to components selection page
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-start p-1 relative">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img src="/LoginBG.png" alt="Login Background" className="w-full h-full object-cover object-center" style={{ filter: 'brightness(0.7) blur(1px)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-blue-700/15 to-indigo-900/30" />
      </div>
      <div
        className="rounded-2xl w-full max-w-md overflow-hidden z-10 border border-white/30 ml-2 sm:ml-4 md:ml-10 lg:ml-16"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 60%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)'
        }}
      >
        {/* Header */}
        <div className="px-8 py-6" style={{ background: 'linear-gradient(to right, #0690cf, #0690cf)' }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              SWMS AI Tools Suite
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#b3e3fa' }}>
              Sign in to access SWMS AI Tools
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="px-8 py-6" style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '0 0 1rem 1rem' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value.toUpperCase()})}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0690cf] focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your user ID (e.g., TEST0100)"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0690cf] focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800 mb-1">
                      Authentication Failed
                    </h3>
                    <p className="text-sm text-red-700">{error}</p>
                    {error.includes('SWMS Authentication failed') && (
                      <div className="mt-2 text-xs text-red-600">
                        <p>• Verify your SWMS username and password</p>
                        <p>• Ensure you have access to the LX739Q21 environment</p>
                        <p>• Try again or contact your system administrator</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white"
              style={{ background: '#0690cf', color: '#fff' }}
              onMouseOver={e => e.currentTarget.style.background = '#0570a6'}
              onMouseOut={e => e.currentTarget.style.background = '#0690cf'}
              onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #b3e3fa'}
              onBlur={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Secure connection to SWMS Service Layer
            </p>
            <div className="mt-2 flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400">Connected to LX739Q21</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
