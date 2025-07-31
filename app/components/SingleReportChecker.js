"use client";

import { useState, useEffect } from 'react';
import NavigationPanel from './NavigationPanel';
import DragDropArea from './DragDropArea';
import SingleReportResultsTab from './CheckResultsTab';
import SingleReportViewer from './SingleReportViewer';
import SQLQueryTester from './SQLQueryTester'; 

export default function SingleReportCheck() {
  // State for navigation panel visibility
  const [isNavPanelVisible, setIsNavPanelVisible] = useState(true);
  
  // State for analysis document visibility
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(true);
  
  // State for resizable analysis document width
  const [analysisWidth, setAnalysisWidth] = useState(50); // percent, default 50%
  const [isResizing, setIsResizing] = useState(false);

  // State for inline results visibility
  const [showInlineResults, setShowInlineResults] = useState(false);

  // Toggle navigation panel
  const toggleNavPanel = () => {
    setIsNavPanelVisible(!isNavPanelVisible);
  };

  // Keyboard shortcut for navigation panel toggle
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

  // Mouse event handlers for resizing
  const handleResizeStart = (e) => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };

  const handleResize = (e) => {
    if (!isResizing) return;
    // Calculate new width based on mouse position
    const container = document.getElementById('analysis-resize-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    let percent = ((rect.right - e.clientX) / rect.width) * 100;
    percent = Math.max(20, Math.min(80, percent)); // Clamp between 20% and 80%
    setAnalysisWidth(percent);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
  };

  // Attach mousemove and mouseup listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    } else {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);
  
  const [activeTab, setActiveTab] = useState('check');
  const [selectedReport, setSelectedReport] = useState(null);
  const [analysisDocument, setAnalysisDocument] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Handles report selection from NavigationPanel
  const handleReportSelect = (report, slot) => {
    setSelectedReport(report);
    console.log('Report selected:', report);
  };

  // Handles analysis document loading from NavigationPanel
  const handleAnalysisDocumentLoad = (analysisDoc) => {
    setAnalysisDocument(analysisDoc);
    console.log('Analysis document loaded from NavigationPanel:', analysisDoc);
  };

  const handleFileUpload = (reportOrFile, slot) => {
    // Handle both cases: direct file from DragDropArea or report object
    if (reportOrFile instanceof File) {
      // Direct file upload case
      const file = reportOrFile;
      
      if (slot === 'analysis') {
        // Check if it's a markdown file
        const isMarkdown = file.type === 'text/markdown' || 
                          file.type === 'text/x-markdown' || 
                          file.name.toLowerCase().endsWith('.md') || 
                          file.name.toLowerCase().endsWith('.markdown');
        
        if (isMarkdown) {
          // Handle markdown file
          const analysisDoc = {
            id: `analysis_${Date.now()}`,
            name: file.name.replace(/\.(md|markdown)$/i, ''),
            type: 'markdown',
            isManualUpload: true,
            isMarkdown: true,
            file: file
          };
          
          setAnalysisDocument(analysisDoc);
          console.log('Analysis document uploaded:', analysisDoc);
        } else if (file.type === 'application/pdf') {
          // Handle PDF file
          const pdfUrl = URL.createObjectURL(file);
          const analysisDoc = {
            id: `analysis_${Date.now()}`,
            name: file.name.replace('.pdf', ''),
            type: 'PDF Analysis',
            pdfUrl: pdfUrl,
            isManualUpload: true,
            file: file
          };
          
          setAnalysisDocument(analysisDoc);
          console.log('Analysis document uploaded:', analysisDoc);
        } else {
          alert('Please upload a PDF or Markdown file for the analysis document');
          return;
        }
      } else {
        // Handle report upload (PDF only)
        if (file.type !== 'application/pdf') {
          alert('Please upload a PDF file for the report');
          return;
        }
        
        const pdfUrl = URL.createObjectURL(file);
        const reportDoc = {
          id: `report_${Date.now()}`,
          name: file.name.replace('.pdf', ''),
          type: 'Manual Upload',
          pdfUrl: pdfUrl,
          fetchedFromSWMS: false,
          isManualUpload: true,
          file: file
        };
        
        setSelectedReport(reportDoc);
        console.log('Report uploaded:', reportDoc);
      }
    } else {
      // Report object from DragDropArea component
      const report = reportOrFile;
      
      if (slot === 'analysis') {
        setAnalysisDocument(report);
        console.log('Analysis document uploaded:', report);
      } else {
        setSelectedReport(report);
        console.log('Report uploaded:', report);
      }
    }
  };

  const handleRunCheck = async () => {
    if (!selectedReport || !analysisDocument) {
      alert('Please select both a report and an analysis document');
      return;
    }

    setIsChecking(true);

    // Helper to get a File from file, pdfUrl, or content
    async function getFileFromSource(doc, fallbackName) {
      if (doc.file) return doc.file;
      if (doc.pdfUrl) {
        const res = await fetch(doc.pdfUrl);
        const blob = await res.blob();
        return new File([blob], doc.name || fallbackName, { type: blob.type || 'application/pdf' });
      }
      if (doc.content) {
        // Assume content is a string (e.g. markdown)
        return new File([doc.content], doc.name || fallbackName, { type: 'text/markdown' });
      }
      return null;
    }

    try {
      const formData = new FormData();
      // Report
      const reportFile = await getFileFromSource(selectedReport, 'report.pdf');
      if (!reportFile) {
        alert('Could not get report file or content.');
        setIsChecking(false);
        return;
      }
      formData.append('report', reportFile, selectedReport.name || 'report.pdf');
      // Analysis
      const analysisFile = await getFileFromSource(analysisDocument, 'analysis.pdf');
      if (!analysisFile) {
        alert('Could not get analysis document file or content.');
        setIsChecking(false);
        return;
      }
      formData.append('analysis', analysisFile, analysisDocument.name || 'analysis.pdf');

      // Call backend API
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await response.json();
      if (!data.result) throw new Error('No result returned from backend');

      setCheckResult(data.result);
      setShowInlineResults(true);
      setActiveTab('results');

    } catch (error) {
      console.error('Error running check:', error);
      alert(error.message || 'Error running check. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleBackToCheck = () => {
    setActiveTab('check');
  };

  const handleClearAll = () => {
    setSelectedReport(null);
    setAnalysisDocument(null);
    setCheckResult(null);
    setActiveTab('check');
    setShowInlineResults(false);
  };

  const handleToggleAnalysis = () => {
    setIsAnalysisVisible(!isAnalysisVisible);
  };

  const handleToggleInlineResults = () => {
    setShowInlineResults(!showInlineResults);
  };

  const tabs = [
    { id: 'check', name: 'Report Check', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'sql', name: 'Query Testing', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
    { id: 'results', name: 'Results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-gray-900 overflow-y-auto relative">
      {/* Navigation Panel - Fixed height, no scrolling */}
      <div 
        className={`flex-shrink-0 bg-gray-800 border-r border-gray-700 h-full transition-all duration-300 ease-in-out ${
          isNavPanelVisible ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="h-full flex flex-col w-64">
          {/* Navigation Content - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <NavigationPanel
              selectedReports={selectedReport}
              onReportSelect={handleReportSelect}
              onAnalysisDocumentLoad={handleAnalysisDocumentLoad}
              mode="single"
              isVisible={isNavPanelVisible}
              onToggleVisibility={toggleNavPanel}
            />
          </div>
        </div>
      </div>

      {/* Show Navigation Button - When panel is hidden */}
      {!isNavPanelVisible && (
        <div className="fixed left-2 z-50" style={{ top: 'calc(50vh - 20px)' }}>
          <button
            onClick={toggleNavPanel}
            className="p-1.5 rounded-lg bg-gray-800 border-2 border-gray-600 hover:bg-gray-700 shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
            title="Show Navigation Panel (Ctrl+B)"
          >
            <svg 
              className="w-3 h-3 text-gray-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Content Area - Fixed height with internal scrolling */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-x-auto">
        {/* Compact Header */}
        <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">
                {activeTab === 'sql' 
                  ? 'Test SQL queries from analysis documents'
                  : activeTab === 'results'
                  ? 'View analysis results and compliance check details'
                  : 'Upload a report and analysis document to validate compliance'
                }
              </p>
            </div>
            
            {/* Tab Navigation - inline */}
            <nav className="flex bg-gray-700 rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Tab Content Container - All tabs are rendered but hidden/shown with CSS */}
        <div className="flex-1 relative min-h-0">
          {/* Report Check Tab */}
          <div 
            className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${
              activeTab === 'check' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className="flex flex-col flex-1 min-h-0 overflow-x-auto min-w-0">
              {/* Main Content Area - Now uses all available space */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-3 h-full">
                  {/* Upload Areas - Now uses full height available */}
                  <div className="h-full overflow-x-auto min-w-0 relative"> 
                    <div id="analysis-resize-container" className="flex gap-1.5 h-full min-w-[600px]">
                      {/* Report Section */}
                      <div 
                        style={{ 
                          width: isAnalysisVisible ? `${100 - analysisWidth}%` : '100%' 
                        }} 
                        className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg transition-all duration-300 flex flex-col min-w-0"
                      >
                        <div className="flex-1 p-2 min-h-0">
                          {selectedReport ? (
                            <div className="h-full flex flex-col">
                              <div className="flex-1 min-h-0 border border-gray-600 rounded overflow-hidden">
                                <SingleReportViewer
                                  report={selectedReport}
                                  slot={0}
                                  title=""
                                  onReportReplace={handleReportSelect}
                                  compact={true}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="h-full">
                              <DragDropArea
                                onFileUpload={handleFileUpload}
                                slot={0}
                                title="SWMS Report"
                                sub="Select from list or drop report here"
                                mode="single"
                                compact={true}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Resize Handle */}
                      {isAnalysisVisible && (
                        <div
                          className="w-1 cursor-col-resize flex items-center justify-center hover:bg-gray-300 transition-colors rounded"
                          onMouseDown={handleResizeStart}
                          style={{ zIndex: 10 }}
                          title="Drag to resize"
                        >
                          <div className="w-0.5 h-8 bg-gray-500 rounded" />
                        </div>
                      )}

                      {/* Analysis Section */}
                      <div 
                        style={{ 
                          width: isAnalysisVisible ? `${analysisWidth}%` : '0%',
                          opacity: isAnalysisVisible ? 1 : 0
                        }} 
                        className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg transition-all duration-300 flex flex-col min-w-0 overflow-hidden"
                      >
                        <div className="flex-1 p-2 min-h-0">
                          {analysisDocument ? (
                            <div className="h-full flex flex-col">
                              <div className="flex-1 min-h-0 border border-gray-600 rounded overflow-hidden">
                                <SingleReportViewer
                                  report={analysisDocument}
                                  slot="analysis"
                                  title=""
                                  onReportReplace={(doc) => handleFileUpload(doc, 'analysis')}
                                  onToggleVisibility={handleToggleAnalysis}
                                  isVisible={isAnalysisVisible}
                                  compact={true}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="h-full">
                              <DragDropArea
                                onFileUpload={handleFileUpload}
                                slot="analysis"
                                title="Analysis Document"
                                sub="Drop analysis document here"
                                mode="single"
                                onToggleVisibility={handleToggleAnalysis}
                                isVisible={isAnalysisVisible}
                                compact={true}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Show Analysis Button */}
                    {!isAnalysisVisible && (
                      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
                        <button
                          onClick={handleToggleAnalysis}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-l-lg shadow-lg transition-all duration-200 flex items-center gap-2"
                          title="Show Analysis Document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Results Section - Overlay style when visible */}
                  {showInlineResults && checkResult && (
                    <div className="border border-gray-600 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                      {/* Results Header */}
                      <div className="bg-gray-750 border-b border-gray-600 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <h3 className="text-lg font-semibold text-white">Check Results</h3>
                            </div>
                            <span className="px-3 py-1 bg-green-900/30 text-green-300 text-sm font-medium rounded-full">
                              Analysis Complete
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleToggleInlineResults}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white rounded transition-colors"
                              title="Hide inline results"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Hide
                            </button>
                            <button
                              onClick={() => setActiveTab('results')}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Full View
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Results Content - Takes remaining height */}
                      <div className="flex-1 min-h-0 overflow-hidden">
                        <SingleReportResultsTab
                          selectedReport={selectedReport}
                          analysisDocument={analysisDocument}
                          checkResult={checkResult}
                          onBackToCheck={handleBackToCheck}
                          inline={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar - Fixed at bottom */}
              <div className="flex-shrink-0 border-t border-gray-700 px-4 py-3 bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedReport && analysisDocument ? 
                        'Ready to run compliance check' : 
                        'Upload both documents to continue'
                      }
                    </div>
                    
                    {/* Show Results Toggle Button */}
                    {checkResult && (
                      <button
                        onClick={handleToggleInlineResults}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          showInlineResults 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white'
                        }`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showInlineResults ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                        </svg>
                        {showInlineResults ? 'Hide Results' : 'Show Results'}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                    >
                      Clear All
                    </button>
                    
                    <button
                      onClick={handleRunCheck}
                      disabled={!selectedReport || !analysisDocument || isChecking}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                    >
                      {isChecking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Checking...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Run Check
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SQL Query Testing Tab */}
          <div 
            className={`absolute inset-0 transition-opacity duration-200 ${
              activeTab === 'sql' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className="flex-1 min-h-0 p-4 h-full">
              {!analysisDocument ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Analysis Document Required</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Load an analysis document first to extract and test SQL queries. The document should contain SQL queries in code blocks or with sql-- comments.
                    </p>
                    <button
                      onClick={() => setActiveTab('check')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Go to Report Check
                    </button>
                  </div>
                </div>
              ) : (
                <SQLQueryTester
                  analysisDocument={analysisDocument}
                  report={selectedReport}
                />
              )}
            </div>
          </div>

          {/* Results Tab */}
          <div 
            className={`absolute inset-0 transition-opacity duration-200 ${
              activeTab === 'results' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className="flex-1 min-h-0 h-full">
              <SingleReportResultsTab
                selectedReport={selectedReport}
                analysisDocument={analysisDocument}
                checkResult={checkResult}
                onBackToCheck={handleBackToCheck}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}