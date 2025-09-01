'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReportTestingModal from '../components/ReportTestingSelection'; 

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(null); // Track which component is being launched
  const [showReportTestingModal, setShowReportTestingModal] = useState(false);

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

  const components = [
    {
      id: 'report-testing',
      title: 'Report Test Automation',
      description: 'Compare SWMS reports with automated testing capabilities',
      icon: '📋 ',
      route: '/report-testing',
      status: 'Available'
    },
    {
      id: 'ask-swms',
      title: 'Ask SWMS',
      description: 'AI-powered assistant for SWMS queries and operations',
      icon: '🤖',
      route: '/ask-swms',
      status: 'Available'
    },
    {
      id: 'knowledge-graph',
      title: 'SWMS Knowledge Graph Visualization',
      description: 'Explore SWMS tables and relationships with an interactive graph',
      icon: '🧠',
      route: '/knowledge-graph',
      status: 'Available'
    },
    {
      id: 'root-ripple',
      title: 'Root Ripple',
      description: 'AI-driven root cause analysis for faster operational troubleshooting',
      icon: '🔍',
      route: '/root-ripple',
      status: 'Available'
    },
    {
      id: 'warehouse-simulation',
      title: 'Warehouse Simulation',
      description: "Run What-Ifs and Unlock What's Next",
      icon: '🏭',
      route: '/simulation',
      status: 'Coming Soon'
    },
    {
      id: 'coming-soon',
      title: 'More Tools Coming',
      description: 'Additional SWMS tools and features will be available soon',
      icon: '🚀',
      route: '',
      status: 'Coming Soon'
    }
  ];

  const handleComponentSelect = (component) => {
    if (component.status === 'Available') {
      // Special handling for report testing - show selection popup instead of direct navigation
      if (component.id === 'report-testing') {
        setShowReportTestingModal(true);
      } else {
        setNavigating(component.title);
        setTimeout(() => {
          router.push(component.route);
        }, 800); // Consistent delay with modal selection
      }
    }
  };

  // Handle modal selection
  const handleReportTestingSelect = (option) => {
    // Set specific navigation state for better loading message
    const toolName = option.id === 'single-report' ? 'Single Report Checker' : 'Report Comparison';
    setNavigating(toolName);
    
    setTimeout(() => {
      setShowReportTestingModal(false); // Close modal before navigation
      router.push(option.route);
    }, 800); // Slightly longer delay for better UX
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowReportTestingModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Loading Overlay */}
      {navigating && (
        <div className="fixed inset-0 z-[70] bg-white/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-700 mb-2">Launching {navigating}...</p>
            <p className="text-gray-500">Please wait while we prepare your workspace</p>
          </div>
        </div>
      )}
      
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* SWMS Header SVG with Hover Glow */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/15 via-blue-500/20 to-blue-400/15 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <img 
                    src="/SWMSHeader.svg" 
                    alt="SWMS Logo" 
                    className="relative h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                
                <div className="border-l border-gray-500 pl-3">
                  <div className="relative group">
                    {/* Background Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/15 via-blue-500/20 to-blue-400/15 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    
                    {/* Main Content Container */}
                    <div className="relative bg-gradient-to-r from-slate-50 to-blue-50/20 rounded px-1.5 py-1 border border-blue-100/30 shadow-sm transition-transform duration-300 group-hover:scale-105">
                      {/* Logo Title */}
                      <div className="flex items-center">
                        <div className="flex-1">
                          {/* Main Title */}
                          <h1 className="text-xl font-bold tracking-tight leading-tight" style={{ color: '#0690cf' }}>
                            SWMS AI Tools Suite
                          </h1>
                          
                          {/* Subtitle */}
                          <div className="flex items-center space-x-1 mt-0.5">
                            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#114D69', fontSize: '11px' }}>
                              Intelligent Operations Platform
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-4 py-2 border border-gray-300">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentUser}</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Main Content */}
      <div className="pt-20 overflow-y-auto">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            {/* Main Title with Gradient Text */}
            <div className="relative mb-4">
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-800 bg-clip-text text-transparent mb-3 leading-tight">
                SWMS AI Tools
              </h2>
              {/* Decorative underline */}
              <div className="flex justify-center">
                <div className="w-32 h-1 bg-gradient-to-r from-blue-800 to-indigo-800 rounded-full"></div>
              </div>
            </div>
          
          {/* Enhanced Description */}
          <div className="max-w-4xl mx-auto mb-8">
              <p className="text-xl lg:text-2xl text-gray-700 mb-4 font-medium leading-relaxed">
                Enhance your workflow with <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent font-semibold">AI-powered tools</span> built for SWMS operations.
              </p>
              <p className="text-lg lg:text-xl text-gray-600 mb-6">
                Select a tool below to get started.
              </p>
          </div>
        </div>

        {/* Components Grid - Responsive layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 lg:gap-10 max-w-7xl mx-auto">
          {components.map((component) => (
            <div
              key={component.id}
              className={`group relative rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full ${
                component.id === 'coming-soon'
                  ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 border-dashed'
                  : 'bg-white border-gray-100 hover:border-blue-200'
              } p-8`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  component.status === 'Available' 
                    ? 'bg-green-100 text-green-700 shadow-sm' 
                    : 'bg-amber-100 text-amber-700 shadow-sm'
                }`}>
                  {component.status === 'Available' 
                    ? '✓ Available' 
                    : '⏳ Coming Soon'}
                </span>
              </div>

              {/* Icon */}
              <div className={`flex items-center justify-center w-20 h-20 rounded-xl mb-6 transition-all duration-300 mx-auto ${
                component.id === 'coming-soon'
                  ? 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-gray-150 group-hover:to-gray-250'
                  : 'bg-gradient-to-br from-blue-50 to-indigo-100 group-hover:from-blue-100 group-hover:to-indigo-200'
              }`}>
                <span className={`text-4xl ${component.id === 'coming-soon' ? 'opacity-60' : ''}`}>
                  {component.icon}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-grow text-center">
                <div className="flex-grow">
                  <h3 className={`text-lg font-bold leading-tight mb-3 ${
                    component.id === 'coming-soon' ? 'text-gray-600' : 'text-gray-900'
                  }`}>
                    {component.title}
                  </h3>
                  
                  <p className={`text-sm leading-relaxed mb-6 ${
                    component.id === 'coming-soon' ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    {component.description}
                  </p>
                </div>

                {/* Action */}
                <div className="mt-auto">
                  {component.status === 'Available' ? (
                    <div 
                      onClick={() => handleComponentSelect(component)}
                      className={`flex items-center justify-center py-3 px-6 rounded-lg text-sm font-semibold transition-colors cursor-pointer hover:cursor-pointer ${
                        navigating === component.title 
                          ? 'bg-blue-700 text-white' 
                          : 'bg-blue-600 text-white group-hover:bg-blue-700'
                      }`}
                    >
                      {navigating === component.title ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span>Launching...</span>
                        </>
                      ) : (
                        <>
                          <span>Launch Tool</span>
                          <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center py-3 px-6 rounded-lg text-sm font-semibold ${
                      component.id === 'coming-soon'
                        ? 'bg-gray-100 text-gray-500 border border-dashed border-gray-300'
                        : 'bg-amber-100 text-amber-700 cursor-not-allowed'
                    }`}>
                      <span>Coming Soon</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-100 py-3 px-6 max-w-sm mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">SWMS Service Layer Connected</span>
            </div>
          </div>
        </div>
        </div>
      </div>
      {/* Report Selection Modal */}
      <ReportTestingModal
        isOpen={showReportTestingModal}
        onClose={handleModalClose}
        onSelect={handleReportTestingSelect}
      />
    </div>
  );
}
