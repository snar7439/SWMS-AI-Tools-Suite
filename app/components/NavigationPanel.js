'use client';

import { useState, useEffect } from 'react';
import { swmsReports } from '../lib/reportsConfig';

export default function NavigationPanel({ selectedReports, onReportSelect, currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSlotSelector, setShowSlotSelector] = useState(null); // Track which report's selector is open
  const [loading, setLoading] = useState(false);

  // Use reports directly from config file
  const reports = swmsReports;

  const filteredReports = (reports || [])
    .filter(report => {
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

  const getFileIcon = (type) => {
    return (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a2 2 0 00-2 2v1.5h2V5a1 1 0 011-1h2.5V3H4zM14.5 3v1H17a1 1 0 011 1v1.5h2V5a2 2 0 00-2-2h-3.5zM2 8.5V17a2 2 0 002 2h3.5v-2H4a1 1 0 01-1-1V8.5H2zM18 8.5V17a1 1 0 01-1 1h-3.5v2H17a2 2 0 002-2V8.5h-1z"/>
      </svg>
    );
  };

  const isSelected = (report) => {
    return selectedReports && selectedReports.includes(report);
  };

  const handleSlotSelect = async (report, slot) => {
    try {
      setLoading(true);
      
      console.log('Loading payload directly from report config...');
      
      // Use the authenticated currentUser instead of sessionStorage
      const formattedUserId = currentUser.startsWith('OPS$') ? currentUser : `OPS$${currentUser}`;
      
      // Find the report in config to get the exact payload
      const configReport = swmsReports.find(r => r.id === report.id);
      if (!configReport) {
        throw new Error(`Report configuration not found for: ${report.id}`);
      }
      
      console.log('Direct config payload:', {
        reportName: configReport.name,
        reportId: configReport.id,
        reportPath: configReport.reportPath,
        configPayload: configReport.payload
      });
      
      // Send the SWMS payload with authenticated user ID
      const requestPayload = {
        ...configReport.payload, // Start with config payload
        userId: formattedUserId    // Override with formatted authenticated user ID
      };

      console.log('Final request payload sent to API (with authenticated user ID):', requestPayload);

      const response = await fetch('/api/fetchReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        // Try to get error details from the API response
        let errorDetails = `${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.details) {
            errorDetails += `: ${errorData.details}`;
          }
        } catch (e) {
          // If we can't parse the error response, just use the status
        }
        throw new Error(`Failed to fetch report: ${errorDetails}`);
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      
      // Create the report object with the fetched PDF
      const fetchedReport = {
        ...report,
        pdfUrl: pdfUrl,
        fetchedFromSWMS: true
      };
      
      console.log('Successfully fetched SWMS report');
      onReportSelect(fetchedReport, slot);
      
    } catch (error) {
      console.error('Error fetching SWMS report:', error);
      
      // Show detailed error message to user
      const errorMessage = error.message.includes('Failed to fetch report') 
        ? `SWMS API Error: ${error.message}. Please check SWMS connectivity and try again.`
        : `Report fetch failed: ${error.message}`;
        
      alert(errorMessage);
    } finally {
      setLoading(false);
      setShowSlotSelector(null);
    }
  };

  const toggleSlotSelector = (e, reportId) => {
    e && e.stopPropagation();
    setShowSlotSelector(showSlotSelector === reportId ? null : reportId);
  };

  // Close selector when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSlotSelector(null);
    };

    if (showSlotSelector) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSlotSelector]);

  return (
    <div className="flex-1 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* Panel Header - Compact */}
      <div className="flex-shrink-0 p-3 border-b border-gray-600 bg-gray-900">
        <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          SWMS Reports
          {loading && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          )}
        </h2>

        {/* Current User Display */}
        <div className="mb-3 border border-gray-600 rounded-md p-2 bg-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-medium text-gray-300">Current User</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 bg-gray-700 px-1 py-0.5 rounded text-center min-w-[32px]">
              OPS$
            </span>
            <span className="text-xs font-medium text-white bg-blue-900/30 px-2 py-0.5 rounded border border-blue-700">
              {currentUser}
            </span>
            <div className="flex-1"></div>
            <span className="text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded">
              ✓ Authenticated
            </span>
          </div>
        </div>
        
        {/* Search - Compact */}
        <div className="relative">
          <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Report List - Compact */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-800 min-h-0">
        <div className="p-1.5">
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-white mb-1 text-sm">No reports found</h3>
              <p className="text-xs text-gray-400">Try adjusting your search or filter</p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const selected = isSelected(report);
              
              return (
                <div
                  key={report.id}
                  className={`group relative p-2 rounded-md border cursor-pointer transition-all duration-200 mb-1.5 hover:shadow-sm ${
                    selected 
                      ? 'border-blue-500 bg-blue-900/30 shadow-sm' 
                      : 'border-gray-600 hover:border-blue-500 hover:bg-gray-700/50'
                  }`}
                  onClick={() => toggleSlotSelector(null, report.id)}
                >
                  {/* Print to Screen Button */}
                  <div className="absolute top-1.5 right-1.5 z-10">
                    <button
                      onClick={(e) => toggleSlotSelector(e, report.id)}
                      className={`px-1.5 py-0.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
                        showSlotSelector === report.id 
                          ? 'bg-green-600 text-white shadow-md scale-105' 
                          : `bg-green-500 text-white hover:bg-green-600 hover:shadow-sm ${
                              showSlotSelector === null ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                            }`
                      }`}
                      title="Load Report"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="whitespace-nowrap text-xs">Print to screen</span>
                    </button>

                    {/* Slot Selector Popup - Compact */}
                    {showSlotSelector === report.id && (
                      <div 
                        className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-2 min-w-[160px] z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-xs text-gray-400 mb-2 font-medium">
                          Choose viewer:
                        </div>
                        <div className="space-y-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSlotSelect(report, 0);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-blue-900/20 transition-all duration-200"
                          >
                            <div className="w-3 h-3 bg-blue-500 rounded-sm flex-shrink-0"></div>
                            <span className="text-blue-400 font-medium">Left</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSlotSelect(report, 1);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-green-900/20 transition-all duration-200"
                          >
                            <div className="w-3 h-3 bg-green-500 rounded-sm flex-shrink-0"></div>
                            <span className="text-green-400 font-medium">Right</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Report Info - Compact Layout with Dynamic Padding */}
                  <div className="pr-2 group-hover:pr-29 transition-all duration-200 overflow-hidden">
                    <div className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                          <path d="M6 8h8v2H6V8zM6 12h5v2H6v-2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1">
                          <h3 className="font-medium text-white text-xs whitespace-nowrap overflow-hidden text-ellipsis" title={report.name}>
                            {report.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-300">
                            {report.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
