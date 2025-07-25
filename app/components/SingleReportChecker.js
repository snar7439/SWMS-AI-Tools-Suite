"use client";

import { useState, useEffect } from 'react';
import NavigationPanel from './NavigationPanel';
import DragDropArea from './DragDropArea';
import SingleReportResultsTab from './CheckResultsTab';
import SingleReportViewer from './SingleReportViewer';

export default function SingleReportCheck() {
  // State for analysis document visibility
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(true);
  
  // State for resizable analysis document width
  const [analysisWidth, setAnalysisWidth] = useState(50); // percent, default 50%
  const [isResizing, setIsResizing] = useState(false);

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
    <div className="flex h-screen bg-gray-900">
      {/* Navigation Panel */}
      <div className="w-60 flex-shrink-0">
        <NavigationPanel
          selectedReports={selectedReport}
          onReportSelect={handleReportSelect}
          mode="single"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-2">
          <div className="flex space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-1.5 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'check' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Control Bar */}
            <div className="flex-shrink-0 p-4 pb-3">
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-750 border border-gray-700 rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Upload report and analysis document</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClearAll}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Clear All
                  </button>
                  
                  <button
                    onClick={handleRunCheck}
                    disabled={!selectedReport || !analysisDocument || isChecking}
                    className="px-5 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center gap-2"
                  >
                    {isChecking ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
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

            {/* Upload Areas */}
            <div className="flex-1 px-4 pb-4 min-h-0 relative">
              <div id="analysis-resize-container" className="flex h-full w-full min-h-0">
                {/* Report Section (left) */}
                <div 
                  style={{ 
                    width: isAnalysisVisible ? `${100 - analysisWidth}%` : '100%' 
                  }} 
                  className="flex flex-col min-h-0 transition-all duration-300 ease-in-out"
                >
                  {selectedReport ? (
                    <SingleReportViewer
                      report={selectedReport}
                      slot={0}
                      title="Selected Report"
                      onReportReplace={handleReportSelect}
                    />
                  ) : (
                    <div className="h-full min-h-96">
                      <DragDropArea
                        onFileUpload={handleFileUpload}
                        slot={0}
                        title="SWMS Report"
                        sub="Select from list or upload PDF"
                        mode="single"
                      />
                    </div>
                  )}
                </div>

                {/* Resize Handle - only show when analysis is visible */}
                {isAnalysisVisible && (
                  <div
                    className="w-2 cursor-col-resize flex items-center justify-center hover:bg-gray-600 transition-colors"
                    onMouseDown={handleResizeStart}
                    style={{ zIndex: 10 }}
                    title="Drag to resize analysis document"
                  >
                    <div className="w-1 h-12 rounded bg-gray-400" />
                  </div>
                )}

                {/* Analysis Section (right) */}
                <div 
                  style={{ 
                    width: isAnalysisVisible ? `${analysisWidth}%` : '0%',
                    opacity: isAnalysisVisible ? 1 : 0
                  }} 
                  className="flex flex-col min-h-0 transition-all duration-300 ease-in-out overflow-hidden"
                >
                  {analysisDocument ? (
                    <SingleReportViewer
                      report={analysisDocument}
                      slot="analysis"
                      title="Analysis Document"
                      onReportReplace={(doc) => handleFileUpload(doc, 'analysis')}
                      onToggleVisibility={handleToggleAnalysis}
                      isVisible={isAnalysisVisible}
                    />
                  ) : (
                    <div className="h-full min-h-96">
                      <DragDropArea
                        onFileUpload={handleFileUpload}
                        slot="analysis"
                        title="Analysis Document"
                        sub="Upload PDF or Markdown file"
                        mode="single"
                        onToggleVisibility={handleToggleAnalysis}
                        isVisible={isAnalysisVisible}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Show Analysis Arrow - appears when analysis is hidden */}
              {!isAnalysisVisible && (
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-20">
                  <button
                    onClick={handleToggleAnalysis}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-l-lg shadow-lg transition-colors duration-200"
                    title="Show Analysis Document"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <SingleReportResultsTab
            selectedReport={selectedReport}
            analysisDocument={analysisDocument}
            checkResult={checkResult}
            onBackToCheck={handleBackToCheck}
          />
        )}
      </div>
    </div>
  );
}