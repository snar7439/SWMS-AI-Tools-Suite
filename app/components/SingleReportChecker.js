"use client";

import { useState, useEffect } from 'react';
import NavigationPanel from './NavigationPanel';
import DragDropArea from './DragDropArea';
import SingleReportResultsTab from './CheckResultsTab';
import SingleReportViewer from './SingleReportViewer';

export default function SingleReportCheck() {
  // State for navigation panel visibility
  const [isNavPanelVisible, setIsNavPanelVisible] = useState(true);
  
  // State for analysis document visibility
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(true);
  
  // State for resizable analysis document width
  const [analysisWidth, setAnalysisWidth] = useState(50); // percent, default 50%
  const [isResizing, setIsResizing] = useState(false);

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

  const handleReportSelect = (report, slot) => {
    setSelectedReport(report);
    console.log('Report selected:', report);
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
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock results
      const mockResult = {
        accuracy: Math.floor(Math.random() * 20) + 80, // 80-100%
        alignment: Math.floor(Math.random() * 15) + 85, // 85-100%
        coverage: Math.floor(Math.random() * 25) + 75, // 75-100%
        issues: Math.floor(Math.random() * 8) + 2, // 2-10 issues
        recommendations: Math.floor(Math.random() * 5) + 3, // 3-8 recommendations
        contentMatches: Math.floor(Math.random() * 10) + 15, // 15-25 matches
        missingElements: Math.floor(Math.random() * 5) + 1, // 1-6 missing
        reportName: selectedReport.name,
        analysisName: analysisDocument.name,
        timestamp: new Date().toISOString()
      };
      
      setCheckResult(mockResult);
      setActiveTab('results');
      
    } catch (error) {
      console.error('Error running check:', error);
      alert('Error running check. Please try again.');
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
  };

  const handleToggleAnalysis = () => {
    setIsAnalysisVisible(!isAnalysisVisible);
  };

  const tabs = [
    { id: 'check', name: 'Report Check', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'results', name: 'Results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-gray-900 overflow-hidden relative">
      {/* Navigation Panel - Collapsible sidebar */}
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

      {/* Main Content Area - Fixed height */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Compact Header */}
        <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Upload a report and analysis document to validate compliance</p>
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

        {/* Tab Content - Takes remaining height */}
        {activeTab === 'check' && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Upload Areas - Fixed height container */}
            <div className="flex-shrink-0 p-3 h-96">
              <div id="analysis-resize-container" className="flex gap-1.5 h-full">
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

            {/* Action Bar - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gray-700 px-4 py-3 bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {selectedReport && analysisDocument ? 
                    'Ready to run compliance check' : 
                    'Upload both documents to continue'
                  }
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
        )}

        {activeTab === 'results' && (
          <div className="flex-1 min-h-0">
            <SingleReportResultsTab
              selectedReport={selectedReport}
              analysisDocument={analysisDocument}
              checkResult={checkResult}
              onBackToCheck={handleBackToCheck}
            />
          </div>
        )}
      </div>
    </div>
  );
}