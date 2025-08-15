'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, CheckCircle, Clock, AlertCircle, Zap, Database, Search, Brain, FileText, Server, ChevronDown, ChevronUp, Download, Target, Wrench, BookOpen, Cloud, Shield, Eye, Play, Pause, CheckCircle2, Trash } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { getEnvironmentsByType, ENVIRONMENT_TYPES } from '../config/environments.js';
import SSHFileTransfer from './SSHFileTransfer.js';
import { RefreshIcon } from '@heroicons/react/outline';

// Professional Markdown Renderer Component
const ProfessionalMarkdown = ({ content, className = "" }) => {
  if (!content) return null;
  
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Headings
          h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 border-b border-gray-200 pb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-gray-900 mb-3 mt-5 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold text-gray-900 mb-2 mt-4 first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-bold text-gray-900 mb-2 mt-3 first:mt-0">{children}</h4>,
          h5: ({ children }) => <h5 className="text-sm font-semibold text-gray-900 mb-1 mt-2 first:mt-0">{children}</h5>,
          h6: ({ children }) => <h6 className="text-xs font-semibold text-gray-900 mb-1 mt-2 first:mt-0">{children}</h6>,
          
          // Paragraphs
          p: ({ children }) => <p className="mb-3 leading-relaxed text-sm">{children}</p>,
          
          // Lists
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
          
          // Code
          code: ({ inline, children }) => 
            inline 
              ? <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
              : <code className="block bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto">{children}</code>,
          
          pre: ({ children }) => <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-x-auto mb-3">{children}</pre>,
          
          // Tables
          table: ({ children }) => <table className="min-w-full border-collapse border border-gray-300 mb-3 text-sm">{children}</table>,
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-gray-200">{children}</tr>,
          th: ({ children }) => <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900">{children}</th>,
          td: ({ children }) => <td className="border border-gray-300 px-3 py-2">{children}</td>,
          
          // Links
          a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
          
          // Emphasis
          strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
          
          // Quotes
          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 py-2 mb-3 bg-gray-50 italic text-gray-700">{children}</blockquote>,
          
          // Horizontal Rule
          hr: () => <hr className="border-t border-gray-300 my-4" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Helper function to clean confidence level text
const cleanConfidenceLevel = (confidence) => {
  if (!confidence) return 'Unknown';
  // Remove markdown formatting like **Low** or *Medium*
  return confidence.replace(/\*\*/g, '').replace(/\*/g, '').trim();
};

export default function RootRippleMain({ headerHeight }) {
  const [environmentType, setEnvironmentType] = useState(''); // 'production' or 'development'
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [showEnvDropdown, setShowEnvDropdown] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [timeOccurred, setTimeOccurred] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showStepModal, setShowStepModal] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  
  // SSH Transfer related state
  const [showSSHTransfer, setShowSSHTransfer] = useState(false);
  const [sshTransferComplete, setSSHTransferComplete] = useState(false);
  const [sshResults, setSSHResults] = useState(null);
  const [skipSSHTransfer, setSkipSSHTransfer] = useState(false);
  
  // UI state for showing detailed log information
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, rootcause, solution
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  
  // New progress tracking state
  const [showProgressScreen, setShowProgressScreen] = useState(false);
  const [currentRootCauseStep, setCurrentRootCauseStep] = useState(0);
  const [currentSolutionStep, setCurrentSolutionStep] = useState(0);
  const [rootCauseStepsStatus, setRootCauseStepsStatus] = useState({});
  const [solutionStepsStatus, setSolutionStepsStatus] = useState({});
  const [analysisPhase, setAnalysisPhase] = useState('root-cause'); // 'root-cause' or 'solution'
  
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const timeInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEnvDropdown(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEnvironmentTypeChange = (type) => {
    setEnvironmentType(type);
    setSelectedEnvironment(null); // Reset selected environment when type changes
    setShowEnvDropdown(false);
  };

  // Cleanup effect when component unmounts - removed auto cleanup
  useEffect(() => {
    return () => {
      // Auto-cleanup removed - user will manually cleanup via button
    };
  }, [analysisResults]);

  const getCurrentEnvironments = () => {
    return getEnvironmentsByType(environmentType);
  };

  // Root Cause Analysis Steps
  const rootCauseSteps = [
    { id: 'received-issue', title: 'Received Issue Description', icon: AlertCircle, description: 'Processing the issue description and initial parameters...', status: 'pending' },
    { id: 'analyzing-issue', title: 'Analyzing Issue', icon: Search, description: 'Analyzing the issue context and gathering initial insights...', status: 'pending' },
    { id: 'retrieving-db-logs', title: 'Retrieving DB Logs', icon: Database, description: 'Connecting to database and retrieving relevant log entries...', status: 'pending' },
    { id: 'retrieving-system-logs', title: 'Retrieving System Logs', icon: Server, description: 'Collecting system logs via SSH connection...', status: 'pending' },
    { id: 'retrieving-datadog-logs', title: 'Retrieving DataDog Logs', icon: Cloud, description: 'Fetching monitoring logs from DataDog (Future Implementation)...', status: 'pending' },
    { id: 'finding-root-cause', title: 'Finding Root Cause', icon: Target, description: 'AI is analyzing all collected data to identify the root cause...', status: 'pending' }
  ];

  // Solution Analysis Steps
  const solutionSteps = [
    { id: 'identifying-db-tables', title: 'Identifying DB Tables', icon: Database, description: 'Mapping affected database tables and relationships...', status: 'pending' },
    { id: 'identifying-source-codes', title: 'Identifying Source Codes', icon: FileText, description: 'Locating relevant source code files and components...', status: 'pending' },
    { id: 'finding-fixes', title: 'Finding Fixes', icon: Wrench, description: 'Generating targeted solutions and fixes for the identified issues...', status: 'pending' }
  ];

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId) => {
    setAttachedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const cleanupLogs = async (sessionId) => {
    if (!sessionId) return;
    
    try {
      // Use the enhanced cleanup that finds related SSH sessions by timestamp
      const response = await fetch(`/api/retrieve-logs?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('Cleanup result:', result.message);
        
        if (result.deletedDirectories > 0) {
          alert(`Successfully cleaned up ${result.deletedDirectories} session directory(ies)`);
        } else {
          alert(`No temporary files found to clean up`);
        }
      } else {
        console.warn('Failed to cleanup temporary files:', result.error);
        alert(`Error during cleanup: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      alert(`Error during cleanup: ${error.message}`);
    }
  };

  // SSH Transfer handlers
  const handleSSHTransferSuccess = (data) => {
    console.log('SSH transfer successful:', data);
    setSSHResults(data);
    setSSHTransferComplete(true);
    setShowSSHTransfer(false);
    // Update analysisResults with SSH data
    setAnalysisResults(prev => ({
      ...prev,
      sshLogs: data,
      sshSkipped: false
    }));
    // Update progress status
    updateStepStatus('root-cause', 3, 'completed');
    // Continue with the analysis flow
    if (window.sshResolver) {
      window.sshResolver();
    }
  };

  const handleSSHTransferError = (error) => {
    console.error('SSH transfer failed:', error);
    setShowSSHTransfer(false);
    // Mark as completed even if failed, to continue the flow
    setAnalysisResults(prev => ({
      ...prev,
      sshLogs: null,
      sshSkipped: false
    }));
    updateStepStatus('root-cause', 3, 'completed');
    // Continue with analysis without SSH logs
    if (window.sshResolver) {
      window.sshResolver();
    }
  };

  const handleSkipSSHTransfer = () => {
    console.log('SSH transfer skipped by user');
    setSkipSSHTransfer(true);
    setShowSSHTransfer(false);
    // Mark as skipped and update analysisResults
    setAnalysisResults(prev => ({
      ...prev,
      sshLogs: null,
      sshSkipped: true
    }));
    updateStepStatus('root-cause', 3, 'skipped');
    // Continue with analysis without SSH logs
    if (window.sshResolver) {
      window.sshResolver();
    }
  };

  const startAnalysis = async () => {
    if (!environmentType || !selectedEnvironment || !issueDescription || !timeOccurred) return;
    
    setIsAnalyzing(true);
    setCurrentStep(0);
    setAnalysisComplete(false);
    setSSHTransferComplete(false);
    setSSHResults(null);
    setSkipSSHTransfer(false);
    
    // Reset progress tracking
    setCurrentRootCauseStep(0);
    setCurrentSolutionStep(0);
    setRootCauseStepsStatus({});
    setSolutionStepsStatus({});
    setAnalysisPhase('root-cause');
    
    // Show the new progress screen
    setShowProgressScreen(true);
    
    // Start the root cause analysis flow
    await executeRootCauseAnalysis();
  };

  const executeRootCauseAnalysis = async () => {
    try {
      // Step 1: Received Issue Description
      updateStepStatus('root-cause', 0, 'active');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStepStatus('root-cause', 0, 'completed');
      
      // Step 2: Analyzing Issue
      updateStepStatus('root-cause', 1, 'active');
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateStepStatus('root-cause', 1, 'completed');
      
      // Step 3: Retrieving DB Logs
      updateStepStatus('root-cause', 2, 'active');
      await retrieveDatabaseLogs();
      updateStepStatus('root-cause', 2, 'completed');
      
      // Step 4: Retrieving System Logs (SSH)
      updateStepStatus('root-cause', 3, 'active');
      await handleSystemLogsRetrieval();
      
      // Step 5: DataDog Logs (Future - just visual)
      updateStepStatus('root-cause', 4, 'active');
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStepStatus('root-cause', 4, 'completed');
      
      // Step 6: Finding Root Cause
      updateStepStatus('root-cause', 5, 'active');
      await performRootCauseAnalysis();
      updateStepStatus('root-cause', 5, 'completed');
      
      // Switch to solution analysis phase
      setAnalysisPhase('solution');
      await executeSolutionAnalysis();
      
    } catch (error) {
      console.error('Error in root cause analysis:', error);
      // Handle error appropriately
    }
  };

  const executeSolutionAnalysis = async () => {
    try {
      // Step 1: Identifying DB Tables
      updateStepStatus('solution', 0, 'active');
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateStepStatus('solution', 0, 'completed');
      
      // Step 2: Identifying Source Codes
      updateStepStatus('solution', 1, 'active');
      await new Promise(resolve => setTimeout(resolve, 2500));
      updateStepStatus('solution', 1, 'completed');
      
      // Step 3: Finding Fixes
      updateStepStatus('solution', 2, 'active');
      await new Promise(resolve => setTimeout(resolve, 3000));
      updateStepStatus('solution', 2, 'completed');
      
      // Complete analysis
      setShowProgressScreen(false);
      setAnalysisComplete(true);
      setIsAnalyzing(false);
      
    } catch (error) {
      console.error('Error in solution analysis:', error);
    }
  };

  const updateStepStatus = (phase, stepIndex, status) => {
    if (phase === 'root-cause') {
      setCurrentRootCauseStep(stepIndex);
      setRootCauseStepsStatus(prev => ({
        ...prev,
        [stepIndex]: status
      }));
    } else {
      setCurrentSolutionStep(stepIndex);
      setSolutionStepsStatus(prev => ({
        ...prev,
        [stepIndex]: status
      }));
    }
  };

  const retrieveDatabaseLogs = async () => {
    try {
      const response = await fetch('/api/retrieve-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environment: selectedEnvironment,
          environmentType: environmentType,
          issueTimeFrom: timeOccurred,
          issueTimeTo: null,
          sessionId: `session_${Date.now()}_${selectedEnvironment.id || selectedEnvironment}`
        }),
      });

      const logResult = await response.json();
      
      if (logResult.success) {
        console.log('Database logs retrieved successfully:', logResult.summary);
        setAnalysisResults(prev => ({
          ...prev,
          logSummary: {
            ...logResult.summary,
            timeRange: logResult.timeRange
          },
          sessionId: logResult.sessionId,
          environment: logResult.environment
        }));
      } else {
        throw new Error(logResult.error || 'Failed to retrieve logs');
      }
    } catch (error) {
      console.error('Error retrieving database logs:', error);
      // Continue with analysis even if DB logs fail
    }
  };

  const handleSystemLogsRetrieval = async () => {
    return new Promise((resolve) => {
      // Show the proper SSH file transfer modal
      setShowSSHTransfer(true);
      
      // Store the resolver so it can be called when SSH transfer completes
      window.sshResolver = resolve;
    });
  };

  const performRootCauseAnalysis = async () => {
    try {
      const formData = new FormData();
      formData.append('issueDescription', issueDescription);
      formData.append('timeOccurred', timeOccurred);
      formData.append('environmentType', environmentType);
      formData.append('environment', JSON.stringify(selectedEnvironment));
      formData.append('logSummary', JSON.stringify(analysisResults?.logSummary || {}));
      formData.append('sessionId', analysisResults?.sessionId || `session_${Date.now()}`);
      
      // Add attached images to form data
      attachedImages.forEach((image, index) => {
        if (image.file) {
          formData.append(`image_${index}`, image.file);
        }
      });

      const response = await fetch('/api/root-cause-analysis', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success && result.analysis) {
        setAnalysisResults(prev => ({
          ...prev,
          rootCauseAnalysis: result.analysis.rootCauseAnalysis,
          solutionAnalysis: result.analysis.solutionAnalysis,
          metadata: result.analysis.metadata,
          analysisMetadata: result.metadata
        }));
      }
      
    } catch (error) {
      console.error('Error in AI analysis:', error);
    }
  };

  const resetForm = async () => {
    setEnvironmentType('');
    setSelectedEnvironment(null);
    setIssueDescription('');
    setTimeOccurred('');
    setAttachedImages([]);
    setIsAnalyzing(false);
    setCurrentStep(0);
    setShowStepModal(false);
    setShowEnvDropdown(false);
    setAnalysisComplete(false);
    setAnalysisResults(null);
    setActiveTab('overview');
    
    // Reset SSH transfer state
    setShowSSHTransfer(false);
    setSSHTransferComplete(false);
    setSSHResults(null);
    setSkipSSHTransfer(false);
    
    // Reset new progress tracking state
    setShowProgressScreen(false);
    setCurrentRootCauseStep(0);
    setCurrentSolutionStep(0);
    setRootCauseStepsStatus({});
    setSolutionStepsStatus({});
    setAnalysisPhase('root-cause');
  };

  const exportAnalysisReport = () => {
    if (!analysisResults) return;
    
    // Create a comprehensive report object
    const report = {
      title: "Root Cause Analysis Report",
      timestamp: new Date().toLocaleString(),
      environment: {
        type: environmentType,
        name: selectedEnvironment?.name || 'Unknown',
        description: selectedEnvironment?.description || ''
      },
      issue: {
        description: issueDescription,
        timeOccurred: timeOccurred,
        reportedAt: new Date(timeOccurred).toLocaleString(),
        attachedImages: attachedImages.map(img => ({
          name: img.name,
          size: img.file?.size || 0
        }))
      },
      rootCauseAnalysis: {
        raw: analysisResults?.rootCauseAnalysis?.raw || '',
        parsed: analysisResults?.rootCauseAnalysis?.parsed || {},
        confidence: analysisResults?.rootCauseAnalysis?.parsed?.confidence_level || 'Unknown'
      },
      solutionAnalysis: {
        raw: analysisResults?.solutionAnalysis?.raw || '',
        parsed: analysisResults?.solutionAnalysis?.parsed || {},
        confidence: analysisResults?.solutionAnalysis?.parsed?.confidence_level || 'Unknown'
      },
      systemLogs: {
        database: analysisResults?.logSummary || null,
        ssh: analysisResults?.sshLogs || null,
        sshSkipped: analysisResults?.sshSkipped || false
      },
      metadata: analysisResults?.metadata || analysisResults?.analysisMetadata || {},
      sessionId: analysisResults?.sessionId,
      analysisError: analysisResults?.analysisError || null
    };

    // Convert to JSON string with formatting
    const reportJson = JSON.stringify(report, null, 2);
    
    // Create blob and download
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `root-cause-analysis-${analysisResults?.sessionId || Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      style={{ paddingTop: `${headerHeight + 16}px` }}
      className="min-h-screen px-6 sm:px-8 lg:px-12 xl:px-16 py-8 relative z-10 bg-gray-50"
    >
      {/* Comprehensive Progress Screen */}
      {showProgressScreen && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 z-50 overflow-y-auto">
          <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto" style={{ marginTop: `${headerHeight || 20}px` }}>
              {/* Main Progress Container */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Root Cause Analysis Section */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-lg mr-3">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Detecting Root Cause</h2>
                      <p className="text-blue-200 text-sm">Analyzing system data and logs</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {rootCauseSteps.map((step, index) => {
                      const status = rootCauseStepsStatus[index] || 'pending';
                      const isActive = currentRootCauseStep === index && analysisPhase === 'root-cause';
                      const isCompleted = status === 'completed';
                      const isSkipped = status === 'skipped';
                      
                      return (
                        <div key={step.id} className="flex items-center space-x-4">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            isCompleted ? 'bg-green-500 border-green-500' :
                            isSkipped ? 'bg-yellow-500 border-yellow-500' :
                            isActive ? 'bg-blue-500 border-blue-500 animate-pulse' :
                            'bg-transparent border-white/30'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : isSkipped ? (
                              <X className="w-5 h-5 text-white" />
                            ) : isActive ? (
                              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                            ) : (
                              <div className="w-3 h-3 bg-white/30 rounded-full" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className={`font-medium ${
                                isCompleted || isActive ? 'text-white' : 'text-white/60'
                              }`}>
                                {step.title}
                              </h3>
                              {isActive && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                              )}
                            </div>
                            <p className={`text-sm ${
                              isCompleted || isActive ? 'text-blue-200' : 'text-white/40'
                            }`}>
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Solution Analysis Section */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-500 rounded-lg mr-3">
                      <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Finding Possible Fixes</h2>
                      <p className="text-blue-200 text-sm">Generating targeted solutions</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {solutionSteps.map((step, index) => {
                      const status = solutionStepsStatus[index] || 'pending';
                      const isActive = currentSolutionStep === index && analysisPhase === 'solution';
                      const isCompleted = status === 'completed';
                      const isDisabled = analysisPhase === 'root-cause';
                      
                      return (
                        <div key={step.id} className="flex items-center space-x-4">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            isCompleted ? 'bg-green-500 border-green-500' :
                            isActive ? 'bg-purple-500 border-purple-500 animate-pulse' :
                            isDisabled ? 'bg-transparent border-white/20' :
                            'bg-transparent border-white/30'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : isActive ? (
                              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                            ) : (
                              <div className={`w-3 h-3 rounded-full ${
                                isDisabled ? 'bg-white/20' : 'bg-white/30'
                              }`} />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className={`font-medium ${
                                isCompleted || isActive ? 'text-white' : 
                                isDisabled ? 'text-white/40' : 'text-white/60'
                              }`}>
                                {step.title}
                              </h3>
                              {isActive && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                              )}
                            </div>
                            <p className={`text-sm ${
                              isCompleted || isActive ? 'text-blue-200' : 
                              isDisabled ? 'text-white/30' : 'text-white/40'
                            }`}>
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {Object.values(rootCauseStepsStatus).filter(s => s === 'completed').length}
                    </div>
                    <div className="text-sm text-blue-200">Root Cause Steps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {Object.values(solutionStepsStatus).filter(s => s === 'completed').length}
                    </div>
                    <div className="text-sm text-blue-200">Solution Steps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round(((Object.values(rootCauseStepsStatus).filter(s => s === 'completed').length + 
                                   Object.values(solutionStepsStatus).filter(s => s === 'completed').length) / 
                                   (rootCauseSteps.length + solutionSteps.length)) * 100)}%
                    </div>
                    <div className="text-sm text-blue-200">Total Progress</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!analysisComplete && !showProgressScreen ? (
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Environment Type Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Environment Type</h3>
            <p className="text-gray-600 mb-6">Select the environment where the issue occurred</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleEnvironmentTypeChange(ENVIRONMENT_TYPES.PRODUCTION)}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                  environmentType === ENVIRONMENT_TYPES.PRODUCTION
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                    environmentType === ENVIRONMENT_TYPES.PRODUCTION
                      ? 'bg-red-600'
                      : 'bg-gray-400'
                  }`}>
                    <span className="text-xl text-white">🔴</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Production Environment</h4>
                    <p className="text-sm text-gray-600">Live production systems</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleEnvironmentTypeChange(ENVIRONMENT_TYPES.DEVELOPMENT)}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                  environmentType === ENVIRONMENT_TYPES.DEVELOPMENT
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                    environmentType === ENVIRONMENT_TYPES.DEVELOPMENT
                      ? 'bg-green-600'
                      : 'bg-gray-400'
                  }`}>
                    <span className="text-xl text-white">🟢</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Development Environment</h4>
                    <p className="text-sm text-gray-600">Testing and development systems</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Specific Environment Selection - Only show after environment type is selected */}
          {environmentType && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Specific Environment</h3>
              <p className="text-gray-600 mb-6">Choose the specific environment where the issue occurred</p>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => environmentType && setShowEnvDropdown(!showEnvDropdown)}
                  disabled={!environmentType}
                  className={`w-full p-4 bg-white border-2 rounded-lg text-left transition-all duration-200 ${
                    !environmentType 
                      ? 'cursor-not-allowed opacity-60' 
                      : 'cursor-pointer'
                  } ${
                    selectedEnvironment ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedEnvironment ? (
                        <>
                          <span className="text-lg">
                            {getCurrentEnvironments().find(env => env.id === selectedEnvironment.id)?.icon}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {getCurrentEnvironments().find(env => env.id === selectedEnvironment.id)?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {getCurrentEnvironments().find(env => env.id === selectedEnvironment.id)?.description}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 font-medium">
                          {environmentType 
                            ? "Select a specific environment..." 
                            : "Please select environment type above first"}
                        </p>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        showEnvDropdown ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showEnvDropdown && environmentType && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-80 overflow-y-auto">
                    {getCurrentEnvironments().map((env) => (
                      <button
                        key={env.id}
                        onClick={() => {
                          setSelectedEnvironment(env);
                          setShowEnvDropdown(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0 ${
                          selectedEnvironment?.id === env.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{env.icon}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{env.name}</p>
                            <p className="text-sm text-gray-600">{env.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Issue Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Issue Details</h3>
            <p className="text-gray-600 mb-6">Provide comprehensive information about the issue</p>
              
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Issue Description *
                </label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the issue in detail. Include error messages, user actions, and relevant context..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Time When Issue Occurred *
                </label>
                <div className="relative">
                  <input
                    ref={timeInputRef}
                    type="datetime-local"
                    value={timeOccurred}
                    onChange={(e) => setTimeOccurred(e.target.value)}
                    onClick={() => timeInputRef.current?.showPicker?.()}
                    max={new Date().toISOString().slice(0, 16)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                    placeholder="Click to select date and time"
                  />
                </div>
                {timeOccurred && (
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Issue occurred: {new Date(timeOccurred).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Supporting Screenshots (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {attachedImages.length === 0 ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <Upload className="w-10 h-10 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                      <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                        Upload Screenshots
                      </p>
                      <p className="text-sm text-gray-600">
                        Click to select images or drag and drop
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {attachedImages.map((image) => (
                        <div key={image.id} className="relative bg-white rounded-lg p-3 border border-gray-200">
                          <button
                            onClick={() => removeImage(image.id)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg transition-colors z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <img 
                            src={image.preview} 
                            alt="Preview" 
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                          <p className="text-sm font-medium text-gray-900 truncate">{image.name}</p>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add More Screenshots
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Button */}
          <div className="text-center">
            <button
                onClick={startAnalysis}
                disabled={!environmentType || !selectedEnvironment || !issueDescription || !timeOccurred || isAnalyzing}
                className={`px-10 py-4 rounded-lg text-white font-semibold text-lg transition-all duration-200 ${
                  environmentType && selectedEnvironment && issueDescription && timeOccurred && !isAnalyzing
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isAnalyzing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Analyzing Issue...
                  </div>
                ) : (
                  <>
                    <span>Start Root Cause Analysis</span>
                  </>
                )}
              </button>
              
              {(!environmentType || !selectedEnvironment || !issueDescription || !timeOccurred) && !isAnalyzing && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm font-medium">
                    Please complete all required fields:
                  </p>
                  <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                    {!environmentType && <li>• Environment Type</li>}
                    {!selectedEnvironment && <li>• Specific Environment</li>}
                    {!issueDescription && <li>• Issue Description</li>}
                    {!timeOccurred && <li>• Time Occurred</li>}
                  </ul>
                </div>
              )}
            </div>
        </div>
      ) : (
        /* Professional Results Section */
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-lg mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Analysis Complete
            </h2>
            <p className="text-lg text-gray-600">
              AI-powered root cause analysis with targeted solutions
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'overview'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('rootcause')}
                className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'rootcause'
                    ? 'bg-red-50 text-red-700 border-b-2 border-red-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Root Cause</span>
              </button>
              <button
                onClick={() => setActiveTab('solution')}
                className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'solution'
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Solution</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Analysis Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Analysis Summary</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Root Cause Confidence */}
                  <div className="p-4 border border-red-500 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Root Cause Analysis Confidence</h4>
                    <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      cleanConfidenceLevel(analysisResults?.rootCauseAnalysis?.parsed?.confidence_level) === 'High'
                        ? 'bg-green-100 text-green-800'
                        : cleanConfidenceLevel(analysisResults?.rootCauseAnalysis?.parsed?.confidence_level) === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {cleanConfidenceLevel(analysisResults?.rootCauseAnalysis?.parsed?.confidence_level)}
                    </div>
                  </div>
                  
                  {/* Solution Confidence */}
                  <div className="p-4 border border-green-600 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Solution Analysis Confidence</h4>
                    <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      cleanConfidenceLevel(analysisResults?.solutionAnalysis?.parsed?.confidence_level) === 'High'
                        ? 'bg-green-100 text-green-800'
                        : cleanConfidenceLevel(analysisResults?.solutionAnalysis?.parsed?.confidence_level) === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {cleanConfidenceLevel(analysisResults?.solutionAnalysis?.parsed?.confidence_level)}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Issue Summary</h4>
                  <div className="text-gray-700">
                    <ProfessionalMarkdown 
                      content={analysisResults?.rootCauseAnalysis?.parsed?.issue_summary || 
                        `**Issue:** ${issueDescription}\n\n**Environment:** ${analysisResults?.environment?.name || 'Unknown'}\n\n**Time Occurred:** ${new Date(timeOccurred).toLocaleString()}`}
                      className="prose-gray"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rootcause' && (
            <div className="space-y-6">
              {/* Root Cause Analysis */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Root Cause Analysis</h3>
                </div>
                
                {/* Confidence Level */}
                <div className="mb-6 text-center">
                  <div className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                    cleanConfidenceLevel(analysisResults?.rootCauseAnalysis?.parsed?.confidence_level) === 'High' 
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : cleanConfidenceLevel(analysisResults?.rootCauseAnalysis?.parsed?.confidence_level) === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    Confidence: {cleanConfidenceLevel(analysisResults?.rootCauseAnalysis?.parsed?.confidence_level)}
                  </div>
                </div>

                {/* Root Cause Details */}
                <div className="space-y-4">
                  {analysisResults?.rootCauseAnalysis?.parsed?.root_cause_analysis && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Identified Root Cause
                      </h4>
                      <div className="text-red-800">
                        <ProfessionalMarkdown 
                          content={analysisResults?.rootCauseAnalysis?.parsed?.root_cause_analysis}
                          className="prose-red"
                        />
                      </div>
                    </div>
                  )}

                  {analysisResults?.rootCauseAnalysis?.parsed?.relevant_evidence && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Supporting Evidence
                      </h4>
                      <div className="text-blue-800">
                        <ProfessionalMarkdown 
                          content={analysisResults?.rootCauseAnalysis?.parsed?.relevant_evidence}
                          className="prose-blue"
                        />
                      </div>
                    </div>
                  )}

                  {analysisResults?.rootCauseAnalysis?.parsed?.additional_data_needed && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Additional Data Needed
                      </h4>
                      <div className="text-yellow-800">
                        <ProfessionalMarkdown 
                          content={analysisResults?.rootCauseAnalysis?.parsed?.additional_data_needed}
                          className="prose-yellow"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Raw Analysis (Collapsible) */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm"
                  >
                    {showDetailedLogs ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                    <span className="font-medium">Show Raw AI Analysis</span>
                  </button>
                  
                  {showDetailedLogs && (
                    <div className="mt-3 p-4 bg-gray-900 rounded-lg">
                      <div className="text-green-400 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                        {analysisResults?.rootCauseAnalysis?.raw || 'No raw analysis available'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'solution' && (
            <div className="space-y-6">
              {/* Solution Analysis */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Recommended Solutions</h3>
                </div>

                {/* Confidence Level */}
                <div className="mb-6 text-center">
                  <div className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                    cleanConfidenceLevel(analysisResults?.solutionAnalysis?.parsed?.confidence_level) === 'High' 
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : cleanConfidenceLevel(analysisResults?.solutionAnalysis?.parsed?.confidence_level) === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    Solution Confidence: {cleanConfidenceLevel(analysisResults?.solutionAnalysis?.parsed?.confidence_level)}
                  </div>
                </div>

                <div className="space-y-4">
                  {analysisResults?.solutionAnalysis?.parsed?.solution_overview && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                        <Wrench className="w-4 h-4 mr-2" />
                        Solution Overview
                      </h4>
                      <div className="text-green-800">
                        <ProfessionalMarkdown 
                          content={analysisResults?.solutionAnalysis?.parsed?.solution_overview}
                          className="prose-green"
                        />
                      </div>
                    </div>
                  )}

                  {analysisResults?.solutionAnalysis?.parsed?.immediate_fix && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Immediate Fix
                      </h4>
                      <div className="text-blue-800">
                        <ProfessionalMarkdown 
                          content={analysisResults?.solutionAnalysis?.parsed?.immediate_fix}
                          className="prose-blue"
                        />
                      </div>
                    </div>
                  )}

                  {analysisResults?.solutionAnalysis?.parsed?.validation_steps && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Validation Steps
                      </h4>
                      <div className="text-purple-800">
                        <ProfessionalMarkdown 
                          content={analysisResults?.solutionAnalysis?.parsed?.validation_steps}
                          className="prose-purple"
                        />
                      </div>
                    </div>
                  )}

                  {analysisResults?.solutionAnalysis?.parsed?.preventive_actions && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Preventive Actions
                      </h4>
                      <div className="text-orange-800">
                        <ProfessionalMarkdown 
                          content={analysisResults?.solutionAnalysis?.parsed?.preventive_actions}
                          className="prose-orange"
                        />
                      </div>
                    </div>
                  )}

                  {analysisResults?.solutionAnalysis?.parsed?.additional_data_needed && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                        <Search className="w-4 h-4 mr-2" />
                        Additional Data Needed for Complete Solution
                      </h4>
                      <div className="text-yellow-800">
                        <ProfessionalMarkdown 
                          content={analysisResults?.solutionAnalysis?.parsed?.additional_data_needed}
                          className="prose-yellow"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Raw Solution Analysis (Collapsible) */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm"
                  >
                    {showDetailedLogs ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                    <span className="font-medium">Show Raw AI Solution Analysis</span>
                  </button>
                  
                  {showDetailedLogs && (
                    <div className="mt-3 p-4 bg-gray-900 rounded-lg">
                      <div className="text-green-400 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
                        {analysisResults?.solutionAnalysis?.raw || 'No raw solution analysis available'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* System Information (Collapsible) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div 
              className="flex items-center justify-between mb-6 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors duration-200"
              onClick={() => setShowSystemInfo(!showSystemInfo)}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">System & Log Information</h3>
              </div>
              {showSystemInfo ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
            
            {showSystemInfo && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Environment Info */}
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <h4 className="font-bold text-indigo-900 mb-3 text-base">Environment</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong className="text-gray-900">Type:</strong> <span className="text-gray-700">{environmentType}</span></div>
                      <div><strong className="text-gray-900">Name:</strong> <span className="text-gray-700">{analysisResults?.environment?.name || 'Unknown'}</span></div>
                      <div><strong className="text-gray-900">Session ID:</strong> <span className="font-mono text-xs text-gray-600">{analysisResults?.sessionId}</span></div>
                    </div>
                  </div>

                  {/* SSH Logs */}
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-bold text-purple-900 mb-3 text-base">System Logs</h4>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        // Check multiple possible locations for SSH data
                        const sshData = analysisResults?.sshLogs || sshResults;
                        const hasSSHData = sshData && (sshData.downloadedFiles || sshData.success);
                        const isSkipped = analysisResults?.sshSkipped || skipSSHTransfer;
                        const isCompleted = sshTransferComplete || hasSSHData;
                        
                        if (hasSSHData) {
                          return (
                            <>
                              <div>
                                <strong className="text-gray-900">Files Retrieved:</strong> 
                                <span className="text-gray-700 ml-1">
                                  {sshData.downloadedFiles?.length || 0}
                                </span>
                              </div>
                              <div>
                                <strong className="text-gray-900">Status:</strong> 
                                <span className="text-green-600 font-medium ml-1">✓ Success</span>
                              </div>
                              {sshData.grepFilteringUsed && (
                                <div>
                                  <strong className="text-gray-900">Filtered:</strong> 
                                  <span className="text-green-600 font-medium ml-1">✓ Yes</span>
                                </div>
                              )}
                              {sshData.totalSize && (
                                <div>
                                  <strong className="text-gray-900">Total Size:</strong> 
                                  <span className="text-gray-700 ml-1">
                                    {(sshData.totalSize / 1024).toFixed(2)} KB
                                  </span>
                                </div>
                              )}
                              {sshData.processedLogs?.files && sshData.processedLogs.files.length > 0 && (
                                <div>
                                  <strong className="text-gray-900">Processed Files:</strong>
                                  <div className="mt-1 ml-4 text-xs">
                                    {sshData.processedLogs.files.map((file, idx) => (
                                      <div key={idx} className="text-gray-600">
                                        • {file.fileName} ({file.relevantEntries || 0} entries)
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        } else if (isSkipped) {
                          return (
                            <div className="text-yellow-600">
                              <span className="font-medium">⚠ Skipped by user</span>
                              <div className="text-xs text-gray-600 mt-1">
                                Analysis continued with database logs only
                              </div>
                            </div>
                          );
                        } else if (isCompleted) {
                          return (
                            <div className="text-orange-600">
                              <span className="font-medium">⚠ Transfer completed but no data</span>
                              <div className="text-xs text-gray-600 mt-1">
                                SSH connection succeeded but no log files retrieved
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-gray-600">
                              <span>Not available</span>
                              <div className="text-xs text-gray-500 mt-1">
                                SSH transfer was not performed or failed
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  {/* Database Logs */}
                  {analysisResults?.logSummary && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-bold text-blue-900 mb-3 text-base">Database Logs</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong className="text-gray-900">SWMS Logs:</strong> <span className="text-gray-700">{analysisResults?.logSummary?.swmsLogCount || 0}</span></div>
                        <div><strong className="text-gray-900">RF Logs:</strong> <span className="text-gray-700">{analysisResults?.logSummary?.rfLogCount || 0}</span></div>
                        <div><strong className="text-gray-900">Total Records:</strong> <span className="text-gray-700">{analysisResults?.logSummary?.totalRecords || 0}</span></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Analysis Errors */}
                {analysisResults?.analysisError && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      <h4 className="font-bold text-red-900 text-base">Analysis Warning</h4>
                    </div>
                    <p className="text-red-800 text-sm">{analysisResults?.analysisError}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium text-sm flex items-center gap-2"
            >
              <RefreshIcon className="w-4 h-4" />
              <span>Analyze Another Issue</span>
            </button>
            <button 
              onClick={exportAnalysisReport}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Analysis Report</span>
            </button>
            <button
              onClick={async () => {
                if (analysisResults && analysisResults.sessionId) {
                  await cleanupLogs(analysisResults.sessionId);
                }
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium text-sm flex items-center gap-2"
            >
              <Trash className="w-4 h-4" />
              <span>Clean Up Logs</span>
            </button>
          </div>
        </div>
      )}

      {/* SSH File Transfer Modal */}
      {showSSHTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ paddingTop: `${headerHeight + 20}px` }}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto border">
            <div className="h-1 bg-blue-600"></div>
            
            <div className="p-6">
              <SSHFileTransfer
                environment={selectedEnvironment}
                timeOccurred={timeOccurred}
                onTransferSuccess={handleSSHTransferSuccess}
                onTransferError={handleSSHTransferError}
                onSkipTransfer={handleSkipSSHTransfer}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}