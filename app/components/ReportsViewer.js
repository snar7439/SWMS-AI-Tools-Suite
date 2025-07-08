'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { configurePdfJs, getPdfDocumentOptions } from '../lib/pdfConfig';

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });

export default function ReportsViewer({ report, slot, title, comparisonResult, showDifferences = false }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(0.6);
  const [pdfjs, setPdfjs] = useState(null);
  const [showDiffOverlay, setShowDiffOverlay] = useState(showDifferences);
  
  // Memoize PDF document options to prevent unnecessary reloads
  const documentOptions = useMemo(() => getPdfDocumentOptions(), []);
  
  // Initialize PDF.js worker on client side only
  useEffect(() => {
    let mounted = true;
    
    const initializePdfjs = async () => {
      try {
        if (!mounted) return;
        
        const pdfjs = await configurePdfJs();
        
        if (mounted) {
          setPdfjs(pdfjs);
          console.log('PDF.js initialized successfully');
        }
      } catch (error) {
        console.error('PDF.js initialization failed:', error);
        if (mounted) {
          setError('PDF viewer unavailable, showing text content');
        }
      }
    };

    initializePdfjs();

    return () => {
      mounted = false;
    };
  }, []) // Empty dependency array - only run once
  
  const borderColor = slot === 0 ? 'border-blue-200 dark:border-blue-800' : 'border-green-200 dark:border-green-800';
  const headerColor = slot === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-green-50 dark:bg-green-900/20';
  const labelColor = slot === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300';

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);
    console.log(`PDF loaded successfully with ${numPages} pages`);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error('Error loading PDF:', error);
    const errorMessage = error.message || 'Failed to load PDF';
    setError(`PDF loading failed: ${errorMessage}`);
    setLoading(false);
  }, []);

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.4));
  const resetZoom = () => setScale(0.6);
  
  // Generate mock difference highlights for demonstration
  const getDifferenceHighlights = useMemo(() => {
    if (!comparisonResult || !showDiffOverlay) return [];
    
    // Mock difference areas - in a real implementation, these would come from actual PDF comparison
    const mockDifferences = [
      {
        page: 1,
        x: 50, // x position in pixels (scaled)
        y: 100, // y position in pixels (scaled)
        width: 200,
        height: 30,
        type: 'modification', // 'addition', 'deletion', 'modification'
        description: 'Text content changed'
      },
      {
        page: 1,
        x: 300,
        y: 200,
        width: 150,
        height: 20,
        type: 'addition',
        description: 'New content added'
      },
      {
        page: 1,
        x: 100,
        y: 350,
        width: 180,
        height: 25,
        type: 'deletion',
        description: 'Content removed'
      }
    ];
    
    return mockDifferences.filter(diff => diff.page === pageNumber);
  }, [comparisonResult, showDiffOverlay, pageNumber]);

  const toggleDifferenceOverlay = () => {
    setShowDiffOverlay(!showDiffOverlay);
  };

  // Memoize PDF URL generation to prevent unnecessary recalculations
  const pdfUrl = useMemo(() => {
    if (!report) return null;
    
    // Check if report has base64 PDF data from SWMS API
    if (report.pdfData) {
      console.log('ReportsViewer: Using SWMS PDF data, length:', report.pdfData.length);
      return `data:application/pdf;base64,${report.pdfData}`;
    }
    
    // If report has a pdfUrl (blob URL from SWMS API), use it
    if (report.pdfUrl) {
      // Handle blob URLs directly
      if (report.pdfUrl.startsWith('blob:')) {
        console.log('ReportsViewer: Using blob URL:', report.pdfUrl);
        return report.pdfUrl;
      }
      
      // For any other URL format
      console.log('ReportsViewer: Using provided PDF URL:', report.pdfUrl);
      return report.pdfUrl;
    }
    
    console.log('ReportsViewer: No PDF data available for report');
    return null;
  }, [report]);

  const formatContent = (content) => {
    if (!content) return '';
    
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return `<h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">${line.substring(2)}</h1>`;
        } else if (line.startsWith('## ')) {
          return `<h2 class="text-xl font-semibold mb-3 mt-6 text-gray-800 dark:text-gray-200">${line.substring(3)}</h2>`;
        } else if (line.startsWith('- ')) {
          return `<li class="ml-4 mb-1 text-gray-700 dark:text-gray-300">${line.substring(2)}</li>`;
        } else if (line.trim() === '') {
          return '<br>';
        } else {
          return `<p class="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">${line}</p>`;
        }
      })
      .join('');
  };

  return (
    <div className={`flex flex-col h-full max-h-screen border-2 rounded-lg ${borderColor} bg-white dark:bg-gray-800`}>
      {/* Header - Ultra Compact */}
      <div className={`px-2 py-1 ${headerColor} border-b border-gray-200 dark:border-gray-600 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${labelColor}`}>
            {title}
          </h3>
          {report && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded text-xs font-medium">
                {report.type}
              </span>
            </div>
          )}
        </div>
        
        {report && (
          <div className="mt-0.5">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {report.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Modified: {report.lastModified}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {report ? (
          <div className="flex flex-col h-full">
            {/* PDF Navigation - Ultra Compact */}
            {numPages && (
              <div className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-1">
                  <button
                    onClick={previousPage}
                    disabled={pageNumber <= 1}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-gray-100 disabled:bg-gray-50 dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 border border-gray-300 dark:border-gray-500 disabled:border-gray-200 dark:disabled:border-gray-600 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>
                  
                  <div className="flex items-center bg-white dark:bg-gray-600 rounded px-2 py-0.5 border border-gray-300 dark:border-gray-500">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {pageNumber} / {numPages}
                    </span>
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={pageNumber >= numPages}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-gray-100 disabled:bg-gray-50 dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 border border-gray-300 dark:border-gray-500 disabled:border-gray-200 dark:disabled:border-gray-600 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Zoom:</span>
                  <div className="flex items-center bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                    <button
                      onClick={zoomOut}
                      className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-l transition-colors"
                      title="Zoom Out"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <div className="px-1.5 py-0.5 border-x border-gray-300 dark:border-gray-500 min-w-[2.5rem] text-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {Math.round(scale * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={zoomIn}
                      className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                      title="Zoom In"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={resetZoom}
                      className="px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-r border-l border-gray-300 dark:border-gray-500 text-xs font-medium transition-colors"
                      title="Reset Zoom"
                    >
                      Reset
                    </button>
                  </div>
                  
                  {/* Differences Toggle Button */}
                  {comparisonResult && (
                    <button
                      onClick={toggleDifferenceOverlay}
                      className={`p-0.5 px-2 rounded transition-colors text-xs font-medium ${
                        showDiffOverlay
                          ? 'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-300 dark:border-gray-500'
                      }`}
                      title={showDiffOverlay ? "Hide Differences" : "Show Differences"}
                    >
                      <div className="flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Diffs
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PDF Display - Fixed dimensions with scrollable container */}
            <div className="flex-1 min-h-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
              {/* Differences Legend */}
              {showDiffOverlay && comparisonResult && (
                <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 z-20">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Differences:</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-200 border border-green-400 rounded-sm"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Added</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-200 border border-red-400 rounded-sm"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Removed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-200 border border-orange-400 rounded-sm"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Modified</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 overflow-auto scrollbar-thin">
                <div className="p-3 min-h-full min-w-full">
                  {!pdfjs && !error ? (
                    <div className="flex flex-col items-center justify-center p-6 h-64 bg-white rounded-lg shadow-sm max-w-md mx-auto">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-blue-600 mb-2"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Initializing PDF viewer...</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading PDF.js worker</span>
                    </div>
                  ) : pdfUrl && pdfjs && !error ? (
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="flex flex-col items-center justify-center p-6 h-64 bg-white rounded-lg shadow-sm max-w-md mx-auto">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-blue-600 mb-2"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Loading PDF...</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pdfUrl}</span>
                        </div>
                      }
                      options={documentOptions}
                    >
                      {numPages && (
                        <Page
                          pageNumber={pageNumber}
                          scale={scale}
                          className="shadow-lg border border-gray-200 rounded-lg bg-white mx-auto block relative"
                          loading={
                            <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-lg mx-auto" style={{ width: '400px', height: '500px' }}>
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <span className="text-gray-600 text-xs">Rendering page...</span>
                              </div>
                            </div>
                          }
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      )}
                      
                      {/* Difference Highlights Overlay */}
                      {showDiffOverlay && getDifferenceHighlights.length > 0 && numPages && (
                        <div className="absolute inset-0 pointer-events-none">
                          {getDifferenceHighlights.map((diff, index) => (
                            <div
                              key={index}
                              className={`absolute border-2 rounded-sm pointer-events-auto cursor-pointer group ${
                                diff.type === 'addition' 
                                  ? 'border-green-400 bg-green-200/30 dark:border-green-500 dark:bg-green-500/20'
                                  : diff.type === 'deletion'
                                  ? 'border-red-400 bg-red-200/30 dark:border-red-500 dark:bg-red-500/20'
                                  : 'border-orange-400 bg-orange-200/30 dark:border-orange-500 dark:bg-orange-500/20'
                              }`}
                              style={{
                                left: `${diff.x * scale}px`,
                                top: `${diff.y * scale}px`,
                                width: `${diff.width * scale}px`,
                                height: `${diff.height * scale}px`,
                                transform: 'translate3d(0,0,0)' // Force GPU acceleration
                              }}
                              title={diff.description}
                            >
                              {/* Difference Type Indicator */}
                              <div className={`absolute -top-2 -left-2 w-4 h-4 rounded-full text-xs text-white flex items-center justify-center font-bold ${
                                diff.type === 'addition' 
                                  ? 'bg-green-500 dark:bg-green-600'
                                  : diff.type === 'deletion'
                                  ? 'bg-red-500 dark:bg-red-600'
                                  : 'bg-orange-500 dark:bg-orange-600'
                              }`}>
                                {diff.type === 'addition' ? '+' : diff.type === 'deletion' ? '-' : '~'}
                              </div>
                              
                              {/* Tooltip on Hover */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {diff.description}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Document>
                  ) : pdfUrl && !pdfjs && !error ? (
                    // PDF.js is still loading or not properly initialized
                    <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg mx-auto max-w-md">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                      <span className="text-lg text-gray-600 dark:text-gray-400 font-medium mb-2">Initializing PDF viewer...</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Setting up the document reader</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-2">PDF: {pdfUrl}</span>
                    </div>
                  ) : (
                    // Fallback to text content
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mx-auto max-w-full">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 00-2 2v1.5h2V5a1 1 0 011-1h2.5V3H4zM14.5 3v1H17a1 1 0 011 1v1.5h2V5a2 2 0 00-2-2h-3.5zM2 8.5V17a2 2 0 002 2h3.5v-2H4a1 1 0 01-1-1V8.5H2zM18 8.5V17a1 1 0 01-1 1h-3.5v2H17a2 2 0 002-2V8.5h-1z"/>
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {error ? 'PDF Viewer Error' : 'Document Preview'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {error ? 'Showing text content instead' : 'Add PDF file for full viewer'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 max-h-80 overflow-auto">
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-sm"
                          dangerouslySetInnerHTML={{ __html: formatContent(report.content) }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {error && pdfUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 rounded-lg">
                      <div className="text-center p-8 max-w-md">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unable to Load PDF</h3>
                        <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Please check that the PDF file exists and is accessible.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="text-center max-w-sm">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                slot === 0 
                  ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30' 
                  : 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30'
              }`}>
                <svg className={`w-8 h-8 ${
                  slot === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Report Selected
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select a PDF report from the navigation panel to view its content here.
              </p>
              <div className="flex items-center justify-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  slot === 0 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {slot === 0 ? 'Report A' : 'Report B'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
