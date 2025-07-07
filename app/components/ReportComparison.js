'use client';

import { useState, useEffect } from 'react';
import NavigationPanel from './NavigationPanel';
import ReportsViewer from './ReportsViewer';
import CompareControls from './CompareControls';
import ComparisonResultsTab from './ComparisonResultsTab';

// Sample reports data
const sampleReports = [
  {
    id: 1,
    name: 'Report_v1.0.pdf',
    type: 'PDF',
    size: '2.4 MB',
    lastModified: '2025-06-30',
    pdfUrl: '/reports/SOS Configuration.pdf',
    content: `# Financial Report Q2 2025

## Executive Summary
This quarter has shown significant growth in our key metrics...

## Revenue Analysis
- Total Revenue: $2.4M (+15% YoY)
- Recurring Revenue: $1.8M (+22% YoY)
- New Customer Acquisition: 245 customers

## Key Metrics
- Customer Satisfaction: 94%
- Net Promoter Score: 67
- Churn Rate: 3.2%

## Market Analysis
The market conditions have been favorable with increased demand...`
  },
  {
    id: 2,
    name: 'Report_v1.1.pdf',
    type: 'PDF',
    size: '2.6 MB',
    lastModified: '2025-07-01',
    pdfUrl: '/reports/Equipment Overview.pdf',
    content: `# Financial Report Q2 2025 (Revised)

## Executive Summary
This quarter has shown exceptional growth in our key metrics...

## Revenue Analysis
- Total Revenue: $2.6M (+18% YoY)
- Recurring Revenue: $1.9M (+25% YoY)
- New Customer Acquisition: 267 customers

## Key Metrics
- Customer Satisfaction: 96%
- Net Promoter Score: 71
- Churn Rate: 2.8%

## Market Analysis
The market conditions have been highly favorable with increased demand...

## Future Outlook
Based on current trends, we project continued growth...`
  },
  {
    id: 3,
    name: 'Monthly_Report_June.pdf',
    type: 'PDF',
    size: '1.8 MB',
    lastModified: '2025-06-28',
    pdfUrl: '/reports/Equipment Overview.pdf',
    content: `# Monthly Report - June 2025

## Overview
This monthly report summarizes our key activities and achievements...

## Performance Metrics
- Revenue Growth: 12% MoM
- Customer Acquisition: 89 new customers
- Customer Retention: 95.2%

## Key Achievements
- Launched new product feature
- Expanded team by 3 members
- Improved system performance by 25%

## Challenges & Solutions
Identified and resolved scalability issues...`
  },
  {
    id: 4,
    name: 'Quarterly_Analysis_Q2.pdf',
    type: 'PDF',
    size: '2.1 MB',
    lastModified: '2025-06-29',
    pdfUrl: '/reports/SOS Configuration.pdf',
    content: `# Quarterly Analysis - Q2 2025

## Executive Summary
Q2 has been a period of significant transformation...

## Financial Performance
- Revenue: $3.2M (+20% QoQ)
- Profit Margin: 18.5%
- Operating Costs: $2.6M

## Market Analysis
Market conditions have been favorable with strong demand...

## Strategic Initiatives
- Digital transformation project
- Customer experience improvements
- Supply chain optimization

## Future Projections
Based on current trends, Q3 outlook is positive...`
  },
  {
    id: 5,
    name: 'Policy_Document.pdf',
    type: 'PDF',
    size: '890 KB',
    lastModified: '2025-06-25',
    pdfUrl: null, // Will be replaced with actual PDF path later
    content: `# Company Policy Manual

## Code of Conduct
All employees must adhere to the highest standards...

## Work Hours
- Standard hours: 9 AM - 5 PM
- Flexible arrangements available
- Remote work: 2 days per week maximum

## Benefits
- Health insurance
- 401k matching
- Paid time off: 15 days annually

## Performance Reviews
Conducted quarterly with direct supervisor.`
  }
];

export default function ReportComparison() {
  const [selectedReports, setSelectedReports] = useState([null, null]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'results'
  const [isNavPanelVisible, setIsNavPanelVisible] = useState(true); // Navigation panel visibility

  const handleReportSelect = (report, slot) => {
    const newSelected = [...selectedReports];
    newSelected[slot] = report;
    setSelectedReports(newSelected);
    setComparisonResult(null);
    setIsComparing(false);
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Navigation Panel - Conditionally Rendered */}
      {isNavPanelVisible && (
        <div className="w-60 flex-shrink-0 transition-all duration-300 ease-in-out">
          <NavigationPanel 
            reports={sampleReports}
            selectedReports={selectedReports}
            onReportSelect={handleReportSelect}
          />
        </div>
      )}
      
      {/* Navigation Panel Toggle Button - On the dividing line */}
      <div className={`absolute top-1/16 transform -translate-y-1/2 z-50 transition-all duration-300 ease-in-out ${
        isNavPanelVisible ? 'left-60' : 'left-0'
      }`}>
        <button
          onClick={toggleNavPanel}
          className="p-1 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md transition-all duration-200 hover:scale-110"
          title={`${isNavPanelVisible ? "Hide" : "Show"} Navigation Panel (Ctrl+B)`}
        >
          <svg 
            className={`w-3 h-3 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
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
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-2">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  PDF Report Test Automation Tool
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Select two PDF reports to compare their content and identify differences
                </p>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="px-6 pb-2">
            <nav className="flex justify-center space-x-8">
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-1 px-2 border-b-2 font-medium text-xs transition-colors ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
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
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : comparisonResult 
                      ? 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      : 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Results
                  {comparisonResult && (
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-1 py-0.5 rounded-full ml-1">
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
                <ReportsViewer 
                  report={selectedReports[0]}
                  slot={0}
                  title="Left Section"
                  comparisonResult={comparisonResult}
                  showDifferences={!!comparisonResult}
                />
              </div>
              <div className="w-1/2 flex-shrink-0 h-full">
                <ReportsViewer 
                  report={selectedReports[1]}
                  slot={1}
                  title="Right Section"
                  comparisonResult={comparisonResult}
                  showDifferences={!!comparisonResult}
                />
              </div>
            </div>

            {/* Compare Controls */}
            <CompareControls 
              selectedReports={selectedReports}
              isComparing={isComparing}
              comparisonResult={comparisonResult}
              onCompare={handleCompare}
              onClear={handleClearComparison}
              onViewResults={() => setActiveTab('results')}
            />
          </>
        ) : (
          <ComparisonResultsTab
            selectedReports={selectedReports}
            comparisonResult={comparisonResult}
            onBackToReports={handleBackToReports}
          />
        )}
      </div>
    </div>
  );
}
