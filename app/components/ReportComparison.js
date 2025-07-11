'use client';

import { useState, useEffect } from 'react';
import NavigationPanel from './NavigationPanel';
import ReportViewer from './ReportsViewer';
import CompareControls from './CompareControls';
import ComparisonResultsTab from './ComparisonResultsTab';
import DragDropArea from './DragDropArea';

export default function ReportComparison() {
  const [selectedReports, setSelectedReports] = useState([null, null]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'results'
  const [isNavPanelVisible, setIsNavPanelVisible] = useState(true); // Navigation panel visibility

  const handleReportSelect = (report, slot) => {
    console.log('ReportComparison: handleReportSelect called with:', {
      reportName: report?.name,
      slot: slot,
      hasPdfData: !!report?.pdfData,
      pdfDataLength: report?.pdfData?.length
    });
    
    const newSelected = [...selectedReports];
    newSelected[slot] = report;
    setSelectedReports(newSelected);
    setComparisonResult(null);
    setIsComparing(false);
    
    console.log('ReportComparison: Updated selectedReports:', {
      left: newSelected[0]?.name || 'None',
      right: newSelected[1]?.name || 'None'
    });
  };

  const handleManualUpload = (report, slot) => {
    console.log('Manual upload:', report, 'to slot:', slot);
    handleReportSelect(report, slot);
  };

  const handleCompare = () => {
    if (selectedReports[0] && selectedReports[1]) {
      setIsComparing(true);
      
      // Simulate comparison process
      setTimeout(() => {
        const result = {
          similarity: Math.floor(Math.random() * 40) + 60, // 60-99%
          differences: Math.floor(Math.random() * 20) + 5, // 5-24 differences
          additions: Math.floor(Math.random() * 15) + 2,
          deletions: Math.floor(Math.random() * 10) + 1,
          modifications: Math.floor(Math.random() * 12) + 3
        };
        setComparisonResult(result);
        setIsComparing(false);
        setActiveTab('results'); // Automatically switch to results tab
      }, 2000);
    }
  };

  const handleClearComparison = () => {
    setSelectedReports([null, null]);
    setComparisonResult(null);
    setIsComparing(false);
    setActiveTab('reports'); // Switch back to reports tab
  };

  const handleBackToReports = () => {
    setActiveTab('reports');
  };

  const toggleNavPanel = () => {
    setIsNavPanelVisible(!isNavPanelVisible);
  };

  // Keyboard shortcut to toggle navigation panel (Ctrl+B or Cmd+B)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleNavPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNavPanelVisible]);

  return (
    <div className="flex bg-gray-900 relative" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Navigation Panel - Fixed Position */}
      {isNavPanelVisible && (
        <div className="w-60 flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col h-full">
          <NavigationPanel 
            selectedReports={selectedReports}
            onReportSelect={handleReportSelect}
          />
        </div>
      )}
      
      {/* Navigation Panel Toggle Button - On the dividing line */}
      <div className={`absolute top-1/19 transform -translate-y-1/2 z-50 transition-all duration-300 ease-in-out ${
        isNavPanelVisible ? 'left-60' : 'left-0'
      }`}>
        <button
          onClick={toggleNavPanel}
          className="p-1 rounded-full bg-gray-800 border-2 border-gray-600 hover:bg-gray-700 shadow-md transition-all duration-200 hover:scale-110"
          title={`${isNavPanelVisible ? "Hide" : "Show"} Navigation Panel (Ctrl+B)`}
        >
          <svg 
            className={`w-2.5 h-2.5 text-gray-300 transition-transform duration-200 ${
              isNavPanelVisible ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        {/* Header with Tabs */}
        <header className="bg-gray-800 border-b border-gray-700">          
          {/* Description */}
          <div className="px-4 py-1 text-center">
            <p className="text-gray-300 text-xs">
              Select two SWMS reports to compare their content and identify differences
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="px-4 pb-1">
            <nav className="flex justify-center space-x-4">
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-1 px-2 border-b-2 font-medium text-xs transition-colors ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reports
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('results')}
                disabled={!comparisonResult}
                className={`py-1 px-2 border-b-2 font-medium text-xs transition-colors ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-400'
                    : comparisonResult 
                      ? 'border-transparent text-gray-400 hover:text-gray-300'
                      : 'border-transparent text-gray-600 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Results
                  {comparisonResult && (
                    <span className="bg-blue-900/30 text-blue-300 text-xs px-1 py-0.5 rounded-full ml-1">
                      {comparisonResult.differences}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'reports' ? (
          <>
            {/* Report Viewers - Fixed equal widths and height */}
            <div className="flex-1 flex gap-4 p-6 min-h-0">
              <div className="w-1/2 flex-shrink-0 h-full">
                {selectedReports[0] ? (
                  <ReportViewer 
                    report={selectedReports[0]}
                    slot={0}
                    title="Left Section"
                    comparisonResult={comparisonResult}
                    showDifferences={!!comparisonResult}
                    onReportReplace={handleManualUpload}
                  />
                ) : (
                  <DragDropArea 
                    onFileUpload={handleManualUpload}
                    slot={0}
                    title="Left Section"
                  />
                )}
              </div>
              <div className="w-1/2 flex-shrink-0 h-full">
                {selectedReports[1] ? (
                  <ReportViewer 
                    report={selectedReports[1]}
                    slot={1}
                    title="Right Section"
                    comparisonResult={comparisonResult}
                    showDifferences={!!comparisonResult}
                    onReportReplace={handleManualUpload}
                  />
                ) : (
                  <DragDropArea 
                    onFileUpload={handleManualUpload}
                    slot={1}
                    title="Right Section"
                  />
                )}
              </div>
            </div>

            {/* Compare Controls */}
            <CompareControls 
              selectedDocuments={selectedReports}
              isComparing={isComparing}
              comparisonResult={comparisonResult}
              onCompare={handleCompare}
              onClear={handleClearComparison}
              onViewResults={() => setActiveTab('results')}
            />
          </>
        ) : (
          <ComparisonResultsTab
            selectedDocuments={selectedReports}
            comparisonResult={comparisonResult}
            onBackToDocuments={handleBackToReports}
          />
        )}
      </div>
    </div>
  );
}
