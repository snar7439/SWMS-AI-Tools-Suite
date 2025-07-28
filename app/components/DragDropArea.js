'use client';

import { useState, useRef } from 'react';

export default function DragDropArea({ onFileUpload, slot, title, sub, mode = 'comparison' }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    let targetFile;
    
    if (mode === 'single' && slot === 'analysis') {
      targetFile = files.find(file => 
        file.type === 'application/pdf' || 
        file.type === 'text/markdown' || 
        file.type === 'text/x-markdown' ||
        file.name.toLowerCase().endsWith('.md') ||
        file.name.toLowerCase().endsWith('.markdown')
      );
      if (!targetFile) {
        alert('Please drop a PDF or Markdown file');
        return;
      }
    } else {
      targetFile = files.find(file => file.type === 'application/pdf');
      if (!targetFile) {
        alert('Please drop a PDF file');
        return;
      }
    }
    
    handleFileUpload(targetFile);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let isValidFile = false;
    
    if (mode === 'single' && slot === 'analysis') {
      isValidFile = file.type === 'application/pdf' || 
                   file.type === 'text/markdown' || 
                   file.type === 'text/x-markdown' ||
                   file.name.toLowerCase().endsWith('.md') ||
                   file.name.toLowerCase().endsWith('.markdown');
      if (!isValidFile) {
        alert('Please select a PDF or Markdown file');
        return;
      }
    } else {
      isValidFile = file.type === 'application/pdf';
      if (!isValidFile) {
        alert('Please select a PDF file');
        return;
      }
    }
    
    handleFileUpload(file);
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    
    try {
      // For analysis documents, check if it's markdown
      if (mode === 'single' && slot === 'analysis') {
        const isMarkdown = file.type === 'text/markdown' || 
                          file.type === 'text/x-markdown' ||
                          file.name.toLowerCase().endsWith('.md') ||
                          file.name.toLowerCase().endsWith('.markdown');
        
        if (isMarkdown) {
          // Handle markdown file
          const content = await file.text();
          const report = {
            id: `manual_${Date.now()}`,
            name: file.name.replace(/\.(md|markdown)$/i, ''),
            type: 'markdown',
            content: content,
            isManualUpload: true,
            isMarkdown: true,
            file: file
          };
          
          console.log('Markdown file uploaded:', report);
          onFileUpload(report, slot);
        } else if (file.type === 'application/pdf') {
          // Handle PDF file
          const pdfUrl = URL.createObjectURL(file);
          const report = {
            id: `manual_${Date.now()}`,
            name: file.name.replace('.pdf', ''),
            type: 'PDF Analysis',
            pdfUrl: pdfUrl,
            isManualUpload: true,
            file: file
          };
          
          console.log('PDF analysis file uploaded:', report);
          onFileUpload(report, slot);
        }
      } else {
        // Handle regular PDF report upload
        const pdfUrl = URL.createObjectURL(file);
        const report = {
          id: `manual_${Date.now()}`,
          name: file.name.replace('.pdf', ''),
          type: 'Manual Upload',
          pdfUrl: pdfUrl,
          fetchedFromSWMS: false,
          isManualUpload: true,
          file: file
        };
        
        console.log('PDF report uploaded:', report);
        onFileUpload(report, slot);
      }
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const getAcceptTypes = () => {
    if (mode === 'single' && slot === 'analysis') {
      return '.pdf,.md,.markdown';
    }
    return '.pdf';
  };

  const getSlotColor = () => {
    if (mode === 'single') {
      if (slot === 'analysis') {
        return {
          gradient: 'bg-gradient-to-r from-emerald-900/30 to-emerald-800/20',
          border: 'border-emerald-600',
          icon: 'text-emerald-400',
          bg: 'bg-emerald-600/20 border border-emerald-500/30',
          hover: 'border-emerald-400 bg-emerald-600/10'
        };
      }
      return {
        gradient: 'bg-gradient-to-r from-amber-800/30 to-amber-700/20',
        border: 'border-amber-600',
        icon: 'text-amber-500',
        bg: 'bg-amber-600/20 border border-amber-500/30',
        hover: 'border-amber-400 bg-amber-600/20'
      };
    }
    
    return slot === 0 ? {
      gradient: 'bg-gradient-to-r from-amber-800/30 to-amber-700/20',
      border: 'border-amber-600',
      icon: 'text-amber-500',
      bg: 'bg-amber-600/20 border border-amber-500/30',
      hover: 'border-amber-400 bg-amber-600/20'
    } : {
      gradient: 'bg-gradient-to-r from-emerald-900/30 to-emerald-800/20',
      border: 'border-emerald-600',
      icon: 'text-emerald-400',
      bg: 'bg-emerald-600/20 border border-emerald-500/30',
      hover: 'border-emerald-400 bg-emerald-600/10'
    };
  };

  const colors = getSlotColor();

  return (
    <div className="h-full flex flex-col">
      <div className={`px-3 py-2 rounded-t-lg border-b-2 mb-3 ${colors.gradient} ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.bg}`}>
              <svg className={`w-4 h-4 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mode === 'single' && slot === 'analysis' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                )}
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        </div>
      </div>

      <div 
        className={`flex-1 border-2 border-dashed rounded-lg transition-all duration-200 flex flex-col items-center justify-center p-6 cursor-pointer ${
          isDragOver 
            ? colors.hover
            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? handleBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptTypes()}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="text-center">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
              mode === 'single' && slot === 'analysis' ? 'border-emerald-600' : 
              mode === 'single' ? 'border-amber-600' : 
              slot === 0 ? 'border-amber-600' : 'border-emerald-600'
            } mx-auto mb-3`}></div>
            <p className="text-sm text-gray-300">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <h4 className="text-sm font-medium text-white text-center mb-2">
              {mode === 'single' && slot === 'analysis' ? 'Drop Analysis Document' : 'Drop PDF here'}
            </h4>
            <p className="text-xs text-gray-400 text-center mb-3">
              {mode === 'single' && slot === 'analysis' 
                ? 'Drag and drop your analysis document (PDF or Markdown), or click to browse'
                : 'Select from the report list, drag and drop your PDF file here, or click to browse'
              }
            </p>
            
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg border border-gray-600 transition-colors">
              Browse Files
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              {mode === 'single' && slot === 'analysis' ? 'PDF or Markdown (.md) files' : 'PDF files only'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}