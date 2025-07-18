'use client';

import { useState, useRef } from 'react';

export default function DragDropArea({ onFileUpload, slot, title, sub }) {
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
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    } else {
      alert('Please drop a PDF file');
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      handleFileUpload(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    
    try {
      // Create a blob URL for the PDF file
      const pdfUrl = URL.createObjectURL(file);
      
      // Create report object
      const report = {
        id: `manual_${Date.now()}`,
        name: file.name.replace('.pdf', ''),
        type: 'Manual Upload',
        pdfUrl: pdfUrl,
        fetchedFromSWMS: false,
        isManualUpload: true,
        file: file
      };
      
      console.log('Manual report uploaded:', report);
      onFileUpload(report, slot);
      
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

  return (
    <div className="h-full flex flex-col">
      <div className={`px-3 py-2 rounded-t-lg border-b-2 mb-3 ${
        slot === 0 
          ? 'bg-gradient-to-r from-blue-900/30 to-blue-800/20 border-blue-700' 
          : 'bg-gradient-to-r from-yellow-800/30 to-yellow-600/20 border-yellow-500'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              slot === 0 
                ? 'bg-blue-600/20 border border-blue-500/30' 
                : 'bg-yellow-400/20 border border-yellow-400/30'
            }`}>
              <svg className={`w-4 h-4 ${
                slot === 0 ? 'text-blue-400' : 'text-yellow-300'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
          {/* <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              slot === 0 
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
            }`}>
              {slot === 0 ? 'Report A' : 'Report B'}
            </span>
          </div> */}
        </div>
      </div>

      <div 
        className={`flex-1 border-2 border-dashed rounded-lg transition-all duration-200 flex flex-col items-center justify-center p-6 cursor-pointer ${
          isDragOver 
            ? (slot === 0 
                ? 'border-blue-400 bg-blue-900/20' 
                : 'border-yellow-400 bg-yellow-600/10')
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
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="text-center">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${slot === 0 ? 'border-blue-400' : 'border-yellow-400'} mx-auto mb-3`}></div>
            <p className="text-sm text-gray-300">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <h4 className="text-sm font-medium text-white mb-2">Drop PDF here</h4>
            <p className="text-xs text-gray-400 text-center mb-3">
              Select from the report list, drag and drop your PDF file here, or click to browse
            </p>
            
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg border border-gray-600 transition-colors">
              Browse Files
            </button>
            
            <p className="text-xs text-gray-500 mt-3">PDF files only</p>
          </>
        )}
      </div>
    </div>
  );
}
