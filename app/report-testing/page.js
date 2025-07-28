'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReportComparison from '../components/ReportComparison';

export default function ReportTestingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);

  // Update header height on mount and resize
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    // Initial measurement
    updateHeaderHeight();

    // Update on resize
    window.addEventListener('resize', updateHeaderHeight);
    
    // Update after fonts load (in case font loading affects height)
    document.fonts?.ready?.then(updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [currentUser]); // Re-run when user data changes

  useEffect(() => {
    // Check authentication status
    const authData = sessionStorage.getItem('swms-auth');
    if (!authData) {
      router.push('/login');
      return;
    }

    try {
      const authInfo = JSON.parse(authData);
      if (!authInfo.authenticated) {
        router.push('/login');
        return;
      }
      setCurrentUser(authInfo.username);
    } catch (error) {
      console.error('Error parsing auth data:', error);
      router.push('/login');
      return;
    }
    
    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    sessionStorage.removeItem('swms-auth');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading Report Testing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Fixed Header */}
      <div 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700"
      >
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 sm:py-3 gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto min-w-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Back to tools</span>
              </button>
              <div className="border-l border-gray-600 pl-2 sm:pl-4 min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white truncate">
                  SWMS Report Testing
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 truncate">
                  Compare and validate reports
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
              {/* User Info */}
              <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg max-w-[120px] sm:max-w-none">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-white font-medium truncate">{currentUser}</span>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Logout"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden xs:inline sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with dynamic top padding */}
      <div 
        style={{ 
          paddingTop: `${headerHeight + 8}px` // 8px extra buffer
        }}
        className="min-h-screen"
      >
        <ReportComparison />
      </div>
    </div>
  );
}