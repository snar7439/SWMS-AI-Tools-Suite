'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline';

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ username: '', password: '', environment: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    if (!credentials.username || !credentials.password || !credentials.environment) {
      setError('Please enter username, password, and environment');
      setLoading(false);
      return;
    }

    // Basic validation for environment format
    const envPattern = /^[a-z0-9]+$/i;
    if (!envPattern.test(credentials.environment)) {
      setError('Environment should contain only letters and numbers (e.g., lx739q21)');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.message || 'Login failed');
      }

      sessionStorage.setItem('swms-auth', JSON.stringify({
        username: credentials.username,
        environment: credentials.environment,
        authenticated: true,
        loginTime: new Date().toISOString()
      }));

      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

    // // Bypass SWMS authentication: accept any credentials
    // sessionStorage.setItem('swms-auth', JSON.stringify({
    //   username: credentials.username,
    //   authenticated: true,
    //   loginTime: new Date().toISOString()
    // }));
  };

  const inputClass = "block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0690cf] focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500 text-sm lg:text-base";

  const containerStyle = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.02) 100%)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)',
    border: '1px solid rgba(255,255,255,0.2)'
  };

  return (
    <div className="min-h-screen flex items-center justify-start px-2 sm:px-4 md:px-8 lg:px-12 xl:px-16 relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="/LoginBG.png" alt="Login Background" className="w-full h-full object-cover object-center" style={{ filter: 'brightness(0.7) blur(1px)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-blue-700/15 to-indigo-900/30" />
      </div>

      {/* Login Card */}
      <div className="rounded-3xl w-full max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl z-10 ml-1 sm:ml-3 md:ml-5 lg:ml-6 xl:ml-8 overflow-hidden" style={containerStyle}>
        {/* Header */}
        <div className="px-6 py-4 sm:px-8 sm:py-4 lg:px-10 lg:py-5 xl:px-12 xl:py-6 bg-[#0690cf] text-white text-center">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold">SWMS AI Tools Suite</h1>
          <p className="mt-2 text-sm lg:text-base xl:text-lg text-[#b3e3fa]">Sign in to access SWMS AI Tools</p>
        </div>

        {/* Form */}
        <div className="px-6 py-4 sm:px-8 sm:py-4 lg:px-10 lg:py-5 xl:px-12 xl:py-6 bg-white bg-opacity-95">
          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
            {/* Environment Selection */}
            <div>
              <label htmlFor="environment" className="block text-sm lg:text-base xl:text-lg font-medium text-gray-700 mb-2">Environment</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 lg:h-6 lg:w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <input
                  id="environment"
                  autoFocus
                  type="text"
                  required
                  value={credentials.environment}
                  onChange={(e) => setCredentials({ ...credentials, environment: e.target.value.toLowerCase() })}
                  className={inputClass}
                  placeholder="Enter environment (e.g., lx739q21, lx739q60)"
                />
              </div>
              <p className="mt-1 text-xs lg:text-sm text-gray-500">
                Enter the SWMS environment (e.g., lx739q21, lx739q60, lx739q70)
              </p>
            </div>

            {/* User ID */}
            <div>
              <label htmlFor="username" className="block text-sm lg:text-base xl:text-lg font-medium text-gray-700 mb-2">User ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 lg:h-6 lg:w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value.toUpperCase() })}
                  className={inputClass}
                  placeholder="Enter your user ID (e.g., TEST0100)"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className={inputClass}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm text-red-700">
                    <h3 className="font-medium text-red-800 mb-1">Authentication Failed</h3>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 lg:py-4 xl:py-5 px-4 border border-transparent rounded-lg shadow-sm text-sm lg:text-base xl:text-lg font-medium text-white bg-[#0690cf] hover:bg-[#0570a6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b3e3fa] transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 lg:h-6 lg:w-6 text-white" fill="none" viewBox="0 0 24 24">
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
          <div className="mt-4 lg:mt-5 text-center">
            <p className="text-xs lg:text-sm text-gray-500">Secure connection to SWMS Service Layer</p>
            <div className="mt-2 flex items-center justify-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs lg:text-sm text-gray-400">
                Connected to {credentials.environment.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}