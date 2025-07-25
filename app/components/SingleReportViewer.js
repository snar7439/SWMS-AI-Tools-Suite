'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });

export default function SingleReportViewer({ report, slot, title, comparisonResult, showDifferences = false, onReportReplace }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [pdfjs, setPdfjs] = useState(null);
  const [showDiffOverlay, setShowDiffOverlay] = useState(showDifferences);
  const [isDragOver, setIsDragOver] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  
  // Simple PDF document options for react-pdf 10.x
  const documentOptions = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@4.4.168/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@4.4.168/standard_fonts/`,
  }), []);
  
  // Initialize PDF.js worker on client side only
  useEffect(() => {
    let mounted = true;
    
    const initializePdfjs = async () => {
      try {
        if (!mounted) return;
        
        // Simple PDF.js initialization for react-pdf 10.x
        const { pdfjs } = await import('react-pdf');
        
        if (mounted && typeof window !== 'undefined') {
          // For react-pdf 10.x, use CDN worker
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
          
          setPdfjs(pdfjs);
          console.log('PDF.js initialized successfully', pdfjs.version);
        }
      } catch (error) {
        console.error('PDF.js initialization failed:', error);
        if (mounted) {
          setError('PDF viewer unavailable');
        }
      }
    };

    initializePdfjs();

    return () => {
      mounted = false;
    };
  }, []) // Empty dependency array - only run once

  // Load markdown content when report changes
  useEffect(() => {
    const loadMarkdownContent = async () => {
      if (!report || !isMarkdownFile(report)) {
        setMarkdownContent('');
        return;
      }

      try {
        let content = '';
        
        if (report.file && report.file instanceof File) {
          // Read from uploaded file
          content = await report.file.text();
        } else if (report.content) {
          // Use existing content property
          content = report.content;
        } else if (report.markdownUrl) {
          // Fetch from URL if available
          const response = await fetch(report.markdownUrl);
          content = await response.text();
        }
        
        setMarkdownContent(content);
      } catch (error) {
        console.error('Error loading markdown content:', error);
        setError('Failed to load markdown content');
      }
    };

    loadMarkdownContent();
  }, [report]);

  // Check if the report is a markdown file
  const isMarkdownFile = (report) => {
    if (!report) return false;
    
    // Check file extension
    const fileName = report.name || report.file?.name || '';
    const isMarkdownExtension = fileName.toLowerCase().endsWith('.md') || fileName.toLowerCase().endsWith('.markdown');
    
    // Check MIME type if available
    const isMimeTypeMarkdown = report.file?.type === 'text/markdown' || report.file?.type === 'text/x-markdown';
    
    // Check if it's explicitly marked as markdown
    const isExplicitMarkdown = report.type === 'markdown' || report.isMarkdown;
    
    return isMarkdownExtension || isMimeTypeMarkdown || isExplicitMarkdown;
  };

  // Enhanced markdown to HTML converter
  const markdownToHtml = (markdown) => {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Convert headers
    html = html.replace(/^###### (.*$)/gm, '<h6 class="text-sm font-semibold mb-2 mt-3 text-gray-100">$1</h6>');
    html = html.replace(/^##### (.*$)/gm, '<h5 class="text-sm font-semibold mb-2 mt-3 text-gray-100">$1</h5>');
    html = html.replace(/^#### (.*$)/gm, '<h4 class="text-lg font-semibold mb-3 mt-4 text-gray-100">$1</h4>');
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-3 mt-4 text-gray-100">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-4 mt-6 text-gray-100">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-6 text-white">$1</h1>');
    
    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-100">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-semibold text-gray-100">$1</strong>');
    
    // Convert italic text
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-200">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="italic text-gray-200">$1</em>');
    
    // Convert inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Convert code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-4 overflow-x-auto"><code class="text-green-300 text-sm font-mono whitespace-pre">$1</code></pre>');
    
    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert unordered lists
    html = html.replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1 text-gray-300 list-disc">$1</li>');
    html = html.replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 text-gray-300 list-disc">$1</li>');
    
    // Convert ordered lists
    html = html.replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-1 text-gray-300 list-decimal">$1</li>');
    
    // Wrap consecutive list items
    html = html.replace(/(<li[^>]*>.*<\/li>\s*)+/g, (match) => {
      return `<ul class="mb-4 ml-4 space-y-1">${match}</ul>`;
    });
    
    // Convert blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-gray-800 text-gray-300 italic">$1</blockquote>');
    
    // Convert horizontal rules
    html = html.replace(/^---$/gm, '<hr class="border-gray-600 my-6">');
    html = html.replace(/^\*\*\*$/gm, '<hr class="border-gray-600 my-6">');
    
    // Convert line breaks and paragraphs
    html = html.split('\n\n').map(paragraph => {
      if (paragraph.trim() === '') return '';
      if (paragraph.includes('<h1') || paragraph.includes('<h2') || paragraph.includes('<h3') || 
          paragraph.includes('<ul') || paragraph.includes('<pre') || paragraph.includes('<blockquote') ||
          paragraph.includes('<hr')) {
        return paragraph;
      }
      return `<p class="mb-4 text-gray-300 leading-relaxed">${paragraph.replace(/\n/g, '<br>')}</p>`;
    }).join('');
    
    return html;
  };

  // Drag and drop handlers for replacing reports
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only hide overlay if we're leaving the main container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => 
      file.type === 'application/pdf' || 
      file.type === 'text/markdown' || 
      file.type === 'text/x-markdown' || 
      file.name.toLowerCase().endsWith('.md') || 
      file.name.toLowerCase().endsWith('.markdown')
    );
    
    if (validFile && onReportReplace) {
      handleFileUpload(validFile);
    } else if (!validFile) {
      alert('Please drop a PDF or Markdown file');
    }
  };

  const handleFileUpload = async (file) => {
    try {
      const isMarkdown = file.type === 'text/markdown' || 
                        file.type === 'text/x-markdown' || 
                        file.name.toLowerCase().endsWith('.md') || 
                        file.name.toLowerCase().endsWith('.markdown');
      
      let newReport;
      
      if (isMarkdown) {
        // Handle markdown file
        const content = await file.text();
        newReport = {
          id: `manual_${Date.now()}`,
          name: file.name.replace(/\.(md|markdown)$/i, ''),
          type: 'markdown',
          content: content,
          fetchedFromSWMS: false,
          isManualUpload: true,
          isMarkdown: true,
          file: file
        };
      } else {
        // Handle PDF file
        const pdfUrl = URL.createObjectURL(file);
        newReport = {
          id: `manual_${Date.now()}`,
          name: file.name.replace('.pdf', ''),
          type: 'Manual Upload',
          pdfUrl: pdfUrl,
          fetchedFromSWMS: false,
          isManualUpload: true,
          file: file
        };
      }
      
      console.log('Replacing report with manual upload:', newReport);
      onReportReplace(newReport, slot);
      
    } catch (error) {
      console.error('Error uploading replacement file:', error);
      alert('Error uploading file. Please try again.');
    }
  };
  
  const borderColor = slot === 0 ? 'border-blue-700' : 'border-yellow-500';
  const headerColor = slot === 0 ? 'bg-blue-900/20' : 'bg-yellow-600/20';
  const labelColor = slot === 0 ? 'text-blue-300' : 'text-yellow-400';

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
  const resetZoom = () => setScale(1.0);

  // Memoize PDF URL generation to prevent unnecessary recalculations
  const pdfUrl = useMemo(() => {
    if (!report || isMarkdownFile(report)) return null;
    
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

  // Determine if we should show markdown content
  const shouldShowMarkdown = report && isMarkdownFile(report);

  return (
    <div 
      className={`flex flex-col h-full max-h-screen border-2 rounded-lg ${borderColor} bg-gray-800 relative`}
      onDragEnter={onReportReplace ? handleDragEnter : undefined}
      onDragOver={onReportReplace ? handleDragOver : undefined}
      onDragLeave={onReportReplace ? handleDragLeave : undefined}
      onDrop={onReportReplace ? handleDrop : undefined}
    >
      {/* Drag and Drop Overlay */}
      {isDragOver && onReportReplace && (
        <div className="absolute inset-0 z-50 bg-blue-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center border-2 border-blue-400 border-dashed">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Replace Document</h4>
            <p className="text-sm text-blue-200">Drop PDF or Markdown file to replace current document</p>
          </div>
        </div>
      )}
      {/* Header - Ultra Compact */}
      <div className={`px-3 py-2 ${headerColor} border-b border-gray-600 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          {/* Title and Subtitle */}
          <div className="flex flex-col gap-y-0.5">
            <h3 className={`text-sm font-semibold ${labelColor}`}>
              {title}
            </h3>
            {report && (
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-white truncate">
                  {report.name}
                </p>
                {shouldShowMarkdown && (
                  <span className="px-1.5 py-0.5 bg-green-700 text-green-200 text-xs rounded font-medium">
                    MD
                  </span>
                )}
                {!shouldShowMarkdown && report && (
                  <span className="px-1.5 py-0.5 bg-red-700 text-red-200 text-xs rounded font-medium">
                    PDF
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Clear Button with Icon */}
          {report && onReportReplace && (
            <button
              type="button"
              onClick={() => onReportReplace(null, slot)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white border border-gray-600 hover:border-red-700 transition-colors shadow-sm"
              title="Clear this document"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {report ? (
          <div className="flex flex-col h-full">
            {/* PDF Navigation - Ultra Compact - Only show for PDF files */}
            {numPages && !shouldShowMarkdown && (
              <div className="flex items-center justify-between px-2 py-1 bg-gray-700 border-b border-gray-600">
                <div className="flex items-center gap-1">
                  <button
                    onClick={previousPage}
                    disabled={pageNumber <= 1}
                    className="flex items-center gap-1 px-2 py-0.5 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 border border-gray-500 disabled:border-gray-600 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>
                  
                  <div className="flex items-center bg-gray-600 rounded px-2 py-0.5 border border-gray-500">
                    <span className="text-xs font-medium text-gray-300">
                      {pageNumber} / {numPages}
                    </span>
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={pageNumber >= numPages}
                    className="flex items-center gap-1 px-2 py-0.5 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 border border-gray-500 disabled:border-gray-600 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Zoom:</span>
                  <div className="flex items-center bg-gray-600 rounded border border-gray-500">
                    <button
                      onClick={zoomOut}
                      className="p-0.5 hover:bg-gray-500 rounded-l transition-colors"
                      title="Zoom Out"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <div className="px-1.5 py-0.5 border-x border-gray-500 min-w-[2.5rem] text-center">
                      <span className="text-xs font-medium text-gray-300">
                        {Math.round(scale * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={zoomIn}
                      className="p-0.5 hover:bg-gray-500 transition-colors"
                      title="Zoom In"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={resetZoom}
                      className="px-1.5 py-0.5 hover:bg-gray-500 rounded-r border-l border-gray-500 text-xs font-medium transition-colors"
                      title="Reset Zoom"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Document Display */}
            <div className="flex-1 min-h-0 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
              <div className="absolute inset-0 overflow-auto scrollbar-thin">
                <div className="p-3 min-h-full min-w-full">
                  {shouldShowMarkdown ? (
                    // Markdown Content Display
                    <div className="bg-gray-800 rounded-lg shadow-md p-6 mx-auto max-w-full">
                      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 max-h-96 overflow-auto">
                        <div 
                          className="prose prose-sm prose-invert max-w-none leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(markdownContent) }}
                        />
                      </div>
                    </div>
                  ) : !pdfjs && !error ? (
                    <div className="flex flex-col items-center justify-center p-6 h-64 bg-gray-800 rounded-lg shadow-sm max-w-md mx-auto">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-blue-600 mb-2"></div>
                      <span className="text-sm text-gray-400">Initializing PDF viewer...</span>
                      <span className="text-xs text-gray-400 mt-1">Loading PDF.js worker</span>
                    </div>
                  ) : pdfUrl && pdfjs && !error ? (
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="flex flex-col items-center justify-center p-6 h-64 bg-gray-800 rounded-lg shadow-sm max-w-md mx-auto">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-blue-600 mb-2"></div>
                          <span className="text-sm text-gray-400">Loading PDF...</span>
                        </div>
                      }
                      options={documentOptions}
                    >
                      {numPages && pdfjs && (
                        <Page
                          pageNumber={pageNumber}
                          scale={scale}
                          className="shadow-lg border border-gray-200 rounded-lg bg-white mx-auto block relative"
                          loading={
                            <div className="flex items-center justify-center p-6 bg-gray-700 rounded-lg border border-gray-600 shadow-lg mx-auto" style={{ width: '400px', height: '500px' }}>
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <span className="text-gray-400 text-xs">Rendering page...</span>
                              </div>
                            </div>
                          }
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      )}
                    </Document>
                  ) : pdfUrl && !pdfjs && !error ? (
                    // PDF.js is still loading or not properly initialized
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-lg shadow-lg mx-auto max-w-md">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                      <span className="text-lg text-gray-400 font-medium mb-2">Initializing PDF viewer...</span>
                      <span className="text-sm text-gray-400">Setting up the document reader</span>
                      <span className="text-xs text-gray-500 mt-2">PDF: {pdfUrl}</span>
                    </div>
                  ) : (
                    // Fallback to text content
                    <div className="bg-gray-800 rounded-lg shadow-md p-6 mx-auto max-w-full">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-900 to-blue-800 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 00-2 2v1.5h2V5a1 1 0 011-1h2.5V3H4zM14.5 3v1H17a1 1 0 011 1v1.5h2V5a2 2 0 00-2-2h-3.5zM2 8.5V17a2 2 0 002 2h3.5v-2H4a1 1 0 01-1-1V8.5H2zM18 8.5V17a1 1 0 01-1 1h-3.5v2H17a2 2 0 002-2V8.5h-1z"/>
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {error ? 'PDF Viewer Error' : 'Document Preview'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {error ? 'Showing text content instead' : 'Add PDF file for full viewer'}
                        </p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 max-h-80 overflow-auto">
                        <div 
                          className="prose prose-sm prose-invert max-w-none leading-relaxed text-sm"
                          dangerouslySetInnerHTML={{ __html: formatContent(report.content) }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {error && pdfUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-95 rounded-lg">
                      <div className="text-center p-8 max-w-md">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-900/30 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Unable to Load PDF</h3>
                        <p className="text-red-400 mb-3">{error}</p>
                        <p className="text-sm text-gray-400">
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
          <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="text-center max-w-sm">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                slot === 0 
                  ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/30' 
                  : 'bg-gradient-to-br from-green-900/30 to-green-800/30'
              }`}>
                <svg className={`w-8 h-8 ${
                  slot === 0 ? 'text-blue-400' : 'text-green-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                No Document Selected
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Select a PDF report from the navigation panel, or drag & drop a PDF or Markdown file to view its content here.
              </p>
              <div className="flex items-center justify-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  slot === 0 
                    ? 'bg-blue-900/30 text-blue-300' 
                    : 'bg-green-900/30 text-green-300'
                }`}>
                  {slot === 0 ? 'Report A' : 'Analysis Document'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}