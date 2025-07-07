'use client';

import { useState, useEffect } from 'react';

export default function NavigationPanel({ documents, selectedDocuments, onDocumentSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showSlotSelector, setShowSlotSelector] = useState(null); // Track which report's selector is open

  const filteredReports = (documents || []).filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || report.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getFileIcon = (type) => {
    return (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a2 2 0 00-2 2v1.5h2V5a1 1 0 011-1h2.5V3H4zM14.5 3v1H17a1 1 0 011 1v1.5h2V5a2 2 0 00-2-2h-3.5zM2 8.5V17a2 2 0 002 2h3.5v-2H4a1 1 0 01-1-1V8.5H2zM18 8.5V17a1 1 0 01-1 1h-3.5v2H17a2 2 0 002-2V8.5h-1z"/>
      </svg>
    );
  };

  const isSelected = (report) => {
    return selectedDocuments && selectedDocuments.includes(report);
  };

  const handleSlotSelect = (report, slot) => {
    onDocumentSelect(report, slot);
    setShowSlotSelector(null); // Close the selector
  };

  const toggleSlotSelector = (e, reportId) => {
    e.stopPropagation();
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
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Panel Header - Clean and Modern */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Reports
        </h2>
        
        {/* Search - Modern Design */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Filter - Modern Design */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="all">All Reports</option>
          <option value="pdf">PDF Only</option>
        </select>
      </div>

      {/* Report List - Clean and Organized */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
        <div className="p-3">
          {filteredReports.map((report) => {
            const selected = isSelected(report);
            
            return (
              <div
                key={report.id}
                className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 mb-3 hover:shadow-lg ${
                  selected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => onDocumentSelect(report)}
              >
                {/* Action Button */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={(e) => toggleSlotSelector(e, report.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 shadow-sm flex items-center gap-1.5 ${
                      showSlotSelector === report.id 
                        ? 'bg-blue-600 text-white shadow-lg scale-105' 
                        : `bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md ${
                            showSlotSelector === null ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                          }`
                    }`}
                    title="Add to Viewer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add to Viewer
                  </button>

                  {/* Slot Selector Popup - Modern Design */}
                  {showSlotSelector === report.id && (
                    <div 
                      className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl p-3 min-w-[200px] z-20 backdrop-blur-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Choose viewer section:
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlotSelect(report, 0);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                        >
                          <div className="w-4 h-4 bg-blue-500 rounded-md flex-shrink-0 shadow-sm"></div>
                          <div className="flex flex-col items-start flex-1">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Left Viewer</span>
                            {selectedDocuments && selectedDocuments[0] && (
                              <span className="text-gray-500 dark:text-gray-400 text-xs truncate w-full">
                                Replace: {selectedDocuments[0].name}
                              </span>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlotSelect(report, 1);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 border border-transparent hover:border-green-200 dark:hover:border-green-700"
                        >
                          <div className="w-4 h-4 bg-green-500 rounded-md flex-shrink-0 shadow-sm"></div>
                          <div className="flex flex-col items-start flex-1">
                            <span className="text-green-600 dark:text-green-400 font-medium">Right Viewer</span>
                            {selectedDocuments && selectedDocuments[1] && (
                              <span className="text-gray-500 dark:text-gray-400 text-xs truncate w-full">
                                Replace: {selectedDocuments[1].name}
                              </span>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Report Info - Clean Layout */}
                <div className="pr-32 group-hover:pr-36 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                        <path d="M6 8h8v2H6V8zM6 12h5v2H6v-2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate" title={report.name}>
                        {report.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          {report.type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {report.size}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modified Date - Better Positioning */}
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm">
                  {report.lastModified}
                </div>
              </div>
            );
          })}
          
          {filteredReports.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">No reports found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Selection Summary - Modern Design */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
        <div className="text-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Active Viewers
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <span className="text-blue-700 dark:text-blue-300 font-medium text-xs">Left Viewer</span>
                <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                  {selectedDocuments && selectedDocuments[0] ? selectedDocuments[0].name : 'No report selected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <span className="text-green-700 dark:text-green-300 font-medium text-xs">Right Viewer</span>
                <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                  {selectedDocuments && selectedDocuments[1] ? selectedDocuments[1].name : 'No report selected'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
