'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, CheckCircle, Clock, AlertCircle, Zap, Database, Search, Brain, FileText, Server, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { getEnvironmentsByType, ENVIRONMENT_TYPES } from '../config/environments.js';
import SSHFileTransfer from './SSHFileTransfer.js';

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

  const analysisSteps = [
    { id: 'connect-db', title: 'Accessing Database', icon: Database, description: 'Connecting to system databases and retrieving metadata...', color: 'from-blue-500 to-cyan-500' },
    { id: 'save-table-logs', title: 'Saving Table Logs', icon: FileText, description: 'Gathering and saving relevant log entries from database tables...', color: 'from-green-500 to-emerald-500' },
    { id: 'ssh-transfer', title: 'Retrieving Remote Log Files', icon: Server, description: 'Connecting via SSH to collect additional log files...', color: 'from-purple-500 to-indigo-500' },
    { id: 'analyze-data', title: 'AI Analysis in Progress', icon: Brain, description: 'Advanced AI algorithms are processing patterns and anomalies...', color: 'from-orange-500 to-red-500' },
    { id: 'generate-insights', title: 'Generating Solutions', icon: Search, description: 'Compiling root cause analysis and solution recommendations...', color: 'from-indigo-500 to-purple-500' }
  ];

  // Mock analysis results
  const mockResults = {
    rootCause: 'Database connection pool exhaustion due to long-running queries in the payment processing service',
    severity: 'High',
    confidence: 94,
    affectedComponents: ['User Authentication', 'Payment Gateway', 'Order Processing', 'Inventory Service'],
    timeline: '2024-01-15 14:23:45 UTC',
    solution: {
      immediate: 'Restart the payment service application server and increase database connection pool size from 20 to 50 connections',
      longTerm: 'Implement query optimization for payment transactions, add connection pool monitoring alerts, and set up automatic scaling for high-load periods'
    },
    relatedLogs: [
      'ERROR: Connection pool exhausted - waiting for available connection (timeout: 30s)',
      'WARN: Query execution time exceeded 30 seconds for payment_transactions table',
      'INFO: Connection pool stats - size: 20, active: 20, idle: 0, waiting: 15',
      'ERROR: Payment processing timeout - unable to acquire database connection',
      'WARN: High memory usage detected in payment service: 89% utilization'
    ]
  };

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
          let message = `Successfully cleaned up ${result.deletedDirectories} session directory(ies)`;
          if (result.sshSessionsDeleted > 0) {
            message += ` including ${result.sshSessionsDeleted} SSH session(s)`;
          }
          alert(message);
        } else {
          alert(`No temporary files found to clean up for session ${sessionId}`);
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
    
    // Continue with AI analysis
    continueAnalysisAfterSSH(data);
  };

  const handleSSHTransferError = (error) => {
    console.error('SSH transfer failed:', error);
    // Still allow user to continue without SSH logs
  };

  const handleSkipSSHTransfer = () => {
    console.log('SSH transfer skipped by user');
    setSkipSSHTransfer(true);
    setShowSSHTransfer(false);
    
    // Continue with AI analysis without SSH logs
    continueAnalysisAfterSSH(null);
  };

  const continueAnalysisAfterSSH = async (sshData) => {
    // Step 4: AI Analysis in Progress
    setTimeout(() => setCurrentStep(4), 1000);
    
    try {
      // Prepare form data for the LLM analysis
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

      // Step 5: Generating Solutions
      setTimeout(() => setCurrentStep(5), 2000);

      console.log('Calling LLM for root cause analysis...');
      
      // Call the root cause analysis API
      const response = await fetch('/api/root-cause-analysis', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success && result.analysis) {
        console.log('LLM Analysis successful:', result.analysis);
        
        // Transform LLM analysis to match our expected format
        const llmAnalysis = result.analysis.issueAnalysis;
        
        // Helper functions for mapping LLM response
        const determineSeverity = (confidenceLevel) => {
          switch(confidenceLevel?.toLowerCase()) {
            case 'high': return 'High';
            case 'medium': return 'Medium';
            case 'low': return 'Low';
            default: return 'Medium';
          }
        };
        
        const mapConfidenceToPercentage = (confidenceLevel) => {
          switch(confidenceLevel?.toLowerCase()) {
            case 'high': return 85;
            case 'medium': return 65;
            case 'low': return 35;
            default: return 50;
          }
        };
        
        const extractLogSummary = (relevantEvidence) => {
          return relevantEvidence.map(evidence => 
            `${evidence.type?.toUpperCase() || 'INFO'}: ${evidence.description} (${evidence.source})`
          ).slice(0, 5); // Limit to 5 entries
        };
        
        // Complete analysis with LLM results
        setTimeout(() => {
          setShowStepModal(false);
          setAnalysisComplete(true);
          setAnalysisResults({
            // Map LLM analysis to our expected structure
            rootCause: llmAnalysis.rootCauseAnalysis?.primaryCause || 'Root cause analysis completed',
            severity: determineSeverity(llmAnalysis.confidenceLevel),
            confidence: mapConfidenceToPercentage(llmAnalysis.confidenceLevel),
            affectedComponents: llmAnalysis.rootCauseAnalysis?.affectedComponents || ['Analysis Service'],
            timeline: llmAnalysis.timeWindow?.issueTime || timeOccurred,
            solution: {
              immediate: llmAnalysis.recommendations?.immediate || 'Review analysis results and take appropriate action',
              longTerm: llmAnalysis.recommendations?.longTerm || 'Implement monitoring and preventive measures'
            },
            relatedLogs: extractLogSummary(llmAnalysis.relevantEvidence || []),
            
            // Additional data from our analysis
            llmAnalysis: llmAnalysis,
            logSummary: analysisResults?.logSummary || {},
            sshLogs: sshData || null,
            sshSkipped: skipSSHTransfer,
            sessionId: analysisResults?.sessionId || `session_${Date.now()}`,
            environment: selectedEnvironment,
            analysisMetadata: result.metadata
          });
          setIsAnalyzing(false);
          
          // Scroll to top of results
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }, 1000);
        
      } else {
        throw new Error(result.error || 'LLM analysis failed');
      }
      
    } catch (error) {
      console.error('LLM Analysis failed:', error);
      
      // Fallback to mock results if LLM fails
      setTimeout(() => {
        setShowStepModal(false);
        setAnalysisComplete(true);
        setAnalysisResults({
          ...mockResults,
          rootCause: `Analysis service temporarily unavailable. Original issue: ${issueDescription}`,
          logSummary: analysisResults?.logSummary || {},
          sshLogs: sshData || null,
          sshSkipped: skipSSHTransfer,
          sessionId: analysisResults?.sessionId || `session_${Date.now()}`,
          environment: selectedEnvironment,
          analysisError: error.message
        });
        setIsAnalyzing(false);
        
        // Scroll to top of results
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }, 2000);
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

    // Show first step immediately
    setTimeout(() => {
      setCurrentStep(1);
      setShowStepModal(true);
    }, 500);

    try {
      // Step 1: Connecting to Environment
      setTimeout(() => setCurrentStep(2), 1000);

      // Step 2: Accessing Database and retrieving logs
      setTimeout(async () => {
        setCurrentStep(3);
        
        try {
          // Call the log retrieval API
          const response = await fetch('/api/retrieve-logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              environment: selectedEnvironment,
              environmentType: environmentType,
              issueTimeFrom: timeOccurred,
              issueTimeTo: null, // You could add an end time field if needed
              sessionId: `session_${Date.now()}_${selectedEnvironment.id || selectedEnvironment}`
            }),
          });

          const logResult = await response.json();
          
          if (logResult.success) {
            console.log('Database logs retrieved successfully:', logResult.summary);
            
            // Store database log results
            setAnalysisResults({
              ...mockResults,
              logSummary: {
                ...logResult.summary,
                timeRange: logResult.timeRange
              },
              sessionId: logResult.sessionId,
              environment: logResult.environment
            });
            
            // Step 3: SSH Transfer - show SSH component
            setTimeout(() => {
              setCurrentStep(3);
              setShowStepModal(false);
              setShowSSHTransfer(true);
            }, 2000);
            
          } else {
            throw new Error(logResult.error || 'Failed to retrieve logs');
          }
          
        } catch (error) {
          console.error('Error during log retrieval:', error);
          // Still show SSH transfer option even if database logs failed
          setAnalysisResults({
            ...mockResults,
            logRetrievalError: error.message,
            note: 'Database log retrieval failed, but SSH transfer is still available'
          });
          
          setTimeout(() => {
            setCurrentStep(3);
            setShowStepModal(false);
            setShowSSHTransfer(true);
          }, 2000);
        }
      }, 3000);

    } catch (error) {
      console.error('Error during analysis:', error);
      setIsAnalyzing(false);
      setShowStepModal(false);
      // You might want to show an error message to the user here
    }
  };

  const resetForm = async () => {
    // Manual cleanup will be done via button - removed auto cleanup from resetForm
    
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
    
    // Reset SSH transfer state
    setShowSSHTransfer(false);
    setSSHTransferComplete(false);
    setSSHResults(null);
    setSkipSSHTransfer(false);
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
      analysis: {
        rootCause: analysisResults.rootCause,
        severity: analysisResults.severity,
        confidence: analysisResults.confidence + '%',
        affectedComponents: analysisResults.affectedComponents,
        timeline: analysisResults.timeline
      },
      solutions: {
        immediate: analysisResults.solution.immediate,
        longTerm: analysisResults.solution.longTerm
      },
      systemLogs: analysisResults.relatedLogs,
      databaseLogs: analysisResults.logSummary || null,
      sshLogs: analysisResults.sshLogs || null,
      sessionId: analysisResults.sessionId,
      
      // Include LLM analysis details if available
      aiAnalysis: analysisResults.llmAnalysis ? {
        summary: analysisResults.llmAnalysis.summary,
        timeWindow: analysisResults.llmAnalysis.timeWindow,
        relevantEvidence: analysisResults.llmAnalysis.relevantEvidence,
        rootCauseAnalysis: analysisResults.llmAnalysis.rootCauseAnalysis,
        confidenceLevel: analysisResults.llmAnalysis.confidenceLevel,
        confidenceReasoning: analysisResults.llmAnalysis.confidenceReasoning,
        recommendations: analysisResults.llmAnalysis.recommendations,
        additionalDataNeeded: analysisResults.llmAnalysis.additionalDataNeeded
      } : null,
      
      // Include analysis metadata
      analysisMetadata: analysisResults.analysisMetadata || null,
      
      // Include any error information
      analysisError: analysisResults.analysisError || null
    };

    // Convert to JSON string with formatting
    const reportJson = JSON.stringify(report, null, 2);
    
    // Create blob and download
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `root-cause-analysis-${analysisResults.sessionId || Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentStepData = analysisSteps[currentStep - 1];

  return (
    <div 
      style={{ paddingTop: `${headerHeight + 16}px` }}
      className="min-h-screen px-6 sm:px-8 lg:px-12 xl:px-16 py-8 relative z-10"
    >
      {/* Progress Modal */}
      {showStepModal && currentStepData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${currentStepData.color}`}></div>
            
            <div className="p-8 text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${currentStepData.color} mb-6 shadow-lg`}>
                <currentStepData.icon className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {currentStepData.title}
              </h3>
              
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                {currentStepData.description}
              </p>
              
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="text-purple-600 font-semibold">Processing...</span>
              </div>
              
              <div className="mt-6 text-center">
                <div className="text-sm text-gray-500">
                  Step {currentStep} of {analysisSteps.length}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`bg-gradient-to-r ${currentStepData.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${(currentStep / analysisSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!analysisComplete ? (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Environment Type Selection */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 relative">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Environment Type</h3>
            <p className="text-gray-600 mb-8">Choose whether this issue occurred in production or development environment</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <button
                onClick={() => handleEnvironmentTypeChange(ENVIRONMENT_TYPES.PRODUCTION)}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer ${
                  environmentType === ENVIRONMENT_TYPES.PRODUCTION
                    ? 'border-red-400 bg-red-50 shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-lg ${
                    environmentType === ENVIRONMENT_TYPES.PRODUCTION
                      ? 'bg-gradient-to-br from-red-400 to-red-500'
                      : 'bg-gradient-to-br from-gray-300 to-gray-400'
                  }`}>
                    <span className="text-2xl">🔴</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">Production Environments</h4>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleEnvironmentTypeChange(ENVIRONMENT_TYPES.DEVELOPMENT)}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer ${
                  environmentType === ENVIRONMENT_TYPES.DEVELOPMENT
                    ? 'border-green-400 bg-green-50 shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-xl shadow-lg ${
                    environmentType === ENVIRONMENT_TYPES.DEVELOPMENT
                      ? 'bg-gradient-to-br from-green-500 to-green-600'
                      : 'bg-gradient-to-br from-gray-300 to-gray-400'
                  }`}>
                    <span className="text-2xl">🟢</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">Development Environments</h4>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Specific Environment Selection - Only show after environment type is selected */}
          {environmentType && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 relative z-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Specific Environment</h3>
              <p className="text-gray-600 mb-8">Choose the specific environment where the issue occurred</p>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => environmentType && setShowEnvDropdown(!showEnvDropdown)}
                  disabled={!environmentType}
                  className={`w-full p-4 bg-white border-2 rounded-2xl text-left transition-all duration-200 hover:shadow-lg ${
                    !environmentType 
                      ? 'cursor-not-allowed opacity-60' 
                      : 'cursor-pointer'
                  } ${
                    selectedEnvironment ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedEnvironment ? (
                        <>
                          <span className="text-xl">
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
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[9999] max-h-80 overflow-y-auto">
                    {getCurrentEnvironments().map((env) => (
                      <button
                        key={env.id}
                        onClick={() => {
                          setSelectedEnvironment(env);
                          setShowEnvDropdown(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl border-b border-gray-100 last:border-b-0 cursor-pointer ${
                          selectedEnvironment?.id === env.id ? 'bg-purple-50 border-purple-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{env.icon}</span>
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
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Issue Details</h3>
              <p className="text-gray-600 mb-8">Provide detailed information about the issue you're experiencing</p>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Issue Description
                  </label>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe the issue you're experiencing in detail. Include error messages, user actions that led to the issue, and any relevant context..."
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 resize-none transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white/50"
                    rows={5}
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Time When Issue Occurred
                  </label>
                  <div className="relative">
                    <input
                      ref={timeInputRef}
                      type="datetime-local"
                      value={timeOccurred}
                      onChange={(e) => setTimeOccurred(e.target.value)}
                      onClick={() => timeInputRef.current?.showPicker?.()}
                      max={new Date().toISOString().slice(0, 16)}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-gray-900 bg-white/50 cursor-pointer"
                      placeholder="Click to select date and time"
                    />
                  </div>
                  {timeOccurred && (
                    <div className="mt-3 flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
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
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Screenshots (Optional)
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
                      className="w-full p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200 group bg-white/30 cursor-pointer"
                    >
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-400 group-hover:text-purple-500 mx-auto mb-4 transition-colors" />
                        <p className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 mb-2">
                          Upload Screenshots
                        </p>
                        <p className="text-gray-600">
                          Click to select multiple images or drag and drop
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {attachedImages.map((image) => (
                          <div key={image.id} className="relative bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
                            <button
                              onClick={() => removeImage(image.id)}
                              className="absolute -top-2 -right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-colors z-10 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <img 
                              src={image.preview} 
                              alt="Preview" 
                              className="w-full h-32 object-cover rounded-xl mb-3"
                            />
                            <p className="text-sm font-medium text-gray-900 truncate">{image.name}</p>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 border-2 border-dashed border-purple-300 rounded-2xl hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200 text-purple-600 hover:text-purple-700 font-semibold bg-white/30 cursor-pointer"
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
                className={`px-12 py-5 rounded-2xl text-white font-bold text-xl transition-all duration-300 transform ${
                  environmentType && selectedEnvironment && issueDescription && timeOccurred && !isAnalyzing
                    ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 shadow-2xl hover:shadow-3xl hover:scale-105 hover:-translate-y-1 cursor-pointer'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isAnalyzing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Analyzing Issue...
                  </div>
                ) : (
                  <>
                    <span>🚀 Start Root Cause Analysis</span>
                  </>
                )}
              </button>
              
              {(!environmentType || !selectedEnvironment || !issueDescription || !timeOccurred) && !isAnalyzing && (
                <p className="text-gray-500 text-sm mt-4">
                  Please complete all required fields: 
                  {!environmentType && " Environment Type"}
                  {!selectedEnvironment && " • Specific Environment"}
                  {!issueDescription && " • Issue Description"}
                  {!timeOccurred && " • Time Occurred"}
                </p>
              )}
            </div>
        </div>
      ) : (
        /* Results Section */
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              Analysis Complete!
            </h2>
            <p className="text-xl text-gray-700">Root cause identified with <span className="font-bold text-green-600">{analysisResults.confidence}% confidence</span></p>
          </div>

          {/* Main Results - Root Cause Card (Full Width) */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-10">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mr-6">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">Root Cause Identified</h3>
                <p className="text-lg text-gray-600 mt-1">Issue analysis and diagnosis</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="p-8 bg-gradient-to-r from-red-50 to-pink-50 border-l-6 border-red-500 rounded-3xl">
                <p className="text-red-900 font-semibold text-xl leading-relaxed">{analysisResults.rootCause}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-8 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl">
                  <p className="text-4xl font-bold text-red-700 mb-2">{analysisResults.severity}</p>
                  <p className="text-base font-medium text-red-600">Severity Level</p>
                </div>
                <div className="text-center p-8 bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl">
                  <p className="text-4xl font-bold text-green-700 mb-2">{analysisResults.confidence}%</p>
                  <p className="text-base font-medium text-green-600">AI Confidence</p>
                </div>
                <div className="text-center p-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl">
                  <p className="text-4xl font-bold text-blue-700 mb-2">{analysisResults.affectedComponents.length}</p>
                  <p className="text-base font-medium text-blue-600">Components Affected</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-6 text-xl">Affected System Components</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysisResults.affectedComponents.map((component, index) => (
                    <span key={index} className="px-6 py-4 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 rounded-2xl text-base font-semibold text-center border border-orange-200 shadow-sm">
                      {component}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Solutions Card (Full Width) */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-10">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">Recommended Solutions</h3>
                <p className="text-lg text-gray-600 mt-1">Action plan and remediation steps</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div>
                <div className="flex items-center mb-4">
                  <Clock className="w-6 h-6 text-blue-600 mr-3" />
                  <h4 className="font-bold text-gray-900 text-xl">Immediate Action Required</h4>
                </div>
                <div className="p-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-6 border-blue-500 rounded-3xl">
                  <p className="text-blue-900 font-semibold text-lg leading-relaxed">{analysisResults.solution.immediate}</p>
                </div>
              </div>
              
              <div>
                <div className="flex items-center mb-4">
                  <Brain className="w-6 h-6 text-purple-600 mr-3" />
                  <h4 className="font-bold text-gray-900 text-xl">Long-term Strategy</h4>
                </div>
                <div className="p-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-6 border-purple-500 rounded-3xl">
                  <p className="text-purple-900 font-semibold text-lg leading-relaxed">{analysisResults.solution.longTerm}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Button for Detailed Logs */}
          <div className="text-center">
            <button
              onClick={() => setShowDetailedLogs(!showDetailedLogs)}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold text-lg transform hover:scale-105 shadow-lg cursor-pointer flex items-center mx-auto"
            >
              {showDetailedLogs ? (
                <ChevronUp className="w-5 h-5 mr-2" />
              ) : (
                <ChevronDown className="w-5 h-5 mr-2" />
              )}
              {showDetailedLogs ? 'Hide' : 'Show'} Database & Log Details
            </button>
          </div>

          {/* Detailed Log Information (Conditional) */}
          {showDetailedLogs && (
            <div className="space-y-8">
              {/* LLM Analysis Details */}
              {analysisResults.llmAnalysis && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">AI Analysis Details</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl">
                        <p className="text-3xl font-bold text-purple-700 mb-1">{analysisResults.llmAnalysis.confidenceLevel}</p>
                        <p className="text-sm font-medium text-purple-600">AI Confidence</p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
                        <p className="text-3xl font-bold text-blue-700 mb-1">{analysisResults.llmAnalysis.relevantEvidence?.length || 0}</p>
                        <p className="text-sm font-medium text-blue-600">Evidence Points</p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl">
                        <p className="text-3xl font-bold text-green-700 mb-1">{analysisResults.llmAnalysis.rootCauseAnalysis?.evidenceTrail?.length || 0}</p>
                        <p className="text-sm font-medium text-green-600">Evidence Trail Steps</p>
                      </div>
                    </div>
                    
                    {/* AI Reasoning */}
                    {analysisResults.llmAnalysis.rootCauseAnalysis?.reasoning && (
                      <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-2xl">
                        <h4 className="font-bold text-purple-900 mb-3">AI Reasoning Process:</h4>
                        <p className="text-purple-800 leading-relaxed">{analysisResults.llmAnalysis.rootCauseAnalysis.reasoning}</p>
                      </div>
                    )}
                    
                    {/* Evidence Timeline */}
                    {analysisResults.llmAnalysis.relevantEvidence && analysisResults.llmAnalysis.relevantEvidence.length > 0 && (
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl">
                        <h4 className="font-bold text-blue-900 mb-4">Evidence Timeline:</h4>
                        <div className="space-y-3">
                          {analysisResults.llmAnalysis.relevantEvidence.map((evidence, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg">
                              <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                                evidence.type === 'error' ? 'bg-red-500' :
                                evidence.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-semibold text-blue-800">{evidence.source}</span>
                                  <span className="text-xs text-blue-600">{evidence.type}</span>
                                </div>
                                <p className="text-blue-900 text-sm mb-1">{evidence.description}</p>
                                <p className="text-blue-700 text-xs italic">{evidence.relevance}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Confidence Reasoning */}
                    {analysisResults.llmAnalysis.confidenceReasoning && (
                      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-2xl">
                        <h4 className="font-bold text-green-900 mb-3">Confidence Assessment:</h4>
                        <p className="text-green-800 leading-relaxed">{analysisResults.llmAnalysis.confidenceReasoning}</p>
                      </div>
                    )}
                    
                    {/* Additional Data Needed */}
                    {analysisResults.llmAnalysis.additionalDataNeeded && analysisResults.llmAnalysis.additionalDataNeeded.length > 0 && (
                      <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-2xl">
                        <h4 className="font-bold text-yellow-900 mb-3">Additional Data Needed:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {analysisResults.llmAnalysis.additionalDataNeeded.map((item, index) => (
                            <li key={index} className="text-yellow-800">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Database Log Details */}
              {analysisResults.logSummary && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Database Log Details</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl">
                        <p className="text-3xl font-bold text-indigo-700 mb-1">{analysisResults.logSummary.swmsLogCount}</p>
                        <p className="text-sm font-medium text-indigo-600">SWMS Log Records</p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl">
                        <p className="text-3xl font-bold text-purple-700 mb-1">{analysisResults.logSummary.rfLogCount}</p>
                        <p className="text-sm font-medium text-purple-600">RF Log Records</p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
                        <p className="text-3xl font-bold text-blue-700 mb-1">{analysisResults.logSummary.totalRecords}</p>
                        <p className="text-sm font-medium text-blue-600">Total Records</p>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong className="text-indigo-900">Environment:</strong>
                          <span className="ml-2 text-indigo-700">{analysisResults.logSummary.environment} ({analysisResults.logSummary.isProd ? 'Production' : 'Development'})</span>
                        </div>
                        {analysisResults.sessionId && (
                          <div>
                            <strong className="text-indigo-900">Session ID:</strong>
                            <span className="ml-2 text-indigo-700 font-mono text-xs">{analysisResults.sessionId}</span>
                          </div>
                        )}
                      </div>
                      {analysisResults.logSummary.timeRange && (
                        <div className="mt-4 pt-4 border-t border-indigo-200">
                          <strong className="text-indigo-900">Time Range Retrieved:</strong>
                          <div className="mt-2 text-indigo-700 text-sm">
                            <div><strong>From:</strong> {new Date(analysisResults.logSummary.timeRange.from).toLocaleString()}</div>
                            <div><strong>To:</strong> {new Date(analysisResults.logSummary.timeRange.to).toLocaleString()}</div>
                            <div className="text-indigo-600 italic mt-1">{analysisResults.logSummary.timeRange.description}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {analysisResults.logRetrievalError && (
                      <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-2xl">
                        <div className="flex items-center mb-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                          <strong className="text-yellow-800">Log Retrieval Warning:</strong>
                        </div>
                        <p className="text-yellow-700 text-sm">{analysisResults.logRetrievalError}</p>
                        {analysisResults.note && (
                          <p className="text-yellow-600 text-sm mt-2 italic">{analysisResults.note}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SSH Log Transfer Results */}
              {(analysisResults.sshLogs || analysisResults.sshSkipped) && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                      <Server className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Remote Log File Details</h3>
                  </div>
                  
                  {analysisResults.sshLogs ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl">
                          <p className="text-3xl font-bold text-purple-700 mb-1">{analysisResults.sshLogs.downloadedFiles?.length || 0}</p>
                          <p className="text-sm font-medium text-purple-600">Log Files Retrieved</p>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl">
                          <p className="text-3xl font-bold text-indigo-700 mb-1">
                            {analysisResults.sshLogs.processedLogs?.totalSize ? 
                              `${(analysisResults.sshLogs.processedLogs.totalSize / 1024 / 1024).toFixed(1)}MB` : 
                              'N/A'
                            }
                          </p>
                          <p className="text-sm font-medium text-indigo-600">Total Size</p>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 rounded-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong className="text-purple-900">SSH Host:</strong>
                            <span className="ml-2 text-purple-700">{analysisResults.sshLogs.environment?.host}</span>
                          </div>
                          <div>
                            <strong className="text-purple-900">Transfer Status:</strong>
                            <span className="ml-2 text-green-700 font-semibold">✓ Successful</span>
                          </div>
                        </div>
                        
                        {analysisResults.sshLogs.downloadedFiles && analysisResults.sshLogs.downloadedFiles.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-purple-200">
                            <strong className="text-purple-900">Retrieved Files:</strong>
                            {analysisResults.sshLogs.grepFilteringUsed && (
                              <div className="text-green-700 text-sm italic mb-2">
                                ✓ Time-based filtering applied using grep command
                              </div>
                            )}
                            <div className="mt-2 space-y-1">
                              {analysisResults.sshLogs.downloadedFiles.map((file, index) => (
                                <div key={index} className="text-purple-700 text-sm flex justify-between">
                                  <span>
                                    {file.fileName} ({file.type})
                                    {file.filtered && <span className="text-green-600 ml-1">*filtered</span>}
                                  </span>
                                  <span className="text-purple-600">{(file.size / 1024).toFixed(1)}KB</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {analysisResults.sshLogs.errors && analysisResults.sshLogs.errors.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-purple-200">
                            <strong className="text-orange-800">Transfer Warnings:</strong>
                            <div className="mt-2 space-y-1">
                              {analysisResults.sshLogs.errors.map((error, index) => (
                                <div key={index} className="text-orange-700 text-sm">
                                  <span className="font-mono">{error.path}</span>: {error.error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-l-4 border-gray-400 rounded-2xl">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="w-5 h-5 text-gray-600 mr-2" />
                        <strong className="text-gray-800">SSH Transfer Skipped</strong>
                      </div>
                      <p className="text-gray-700 text-sm">
                        Remote log files were not retrieved via SSH. Analysis was performed using database logs only.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Related Logs */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center mr-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Relevant System Logs</h3>
                </div>
                
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 font-mono text-sm overflow-x-auto shadow-inner">
                  {analysisResults.relatedLogs.map((log, index) => (
                    <div key={index} className="mb-3 flex">
                      <span className="text-gray-500 mr-4 select-none">[{analysisResults.timeline.split(' ')[1]}]</span>
                      <span className={`flex-1 ${
                        log.includes('ERROR') ? 'text-red-400' :
                        log.includes('WARN') ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="text-center space-y-4 md:space-y-0 md:space-x-6 flex flex-col md:flex-row justify-center items-center">
            <button
              onClick={resetForm}
              className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold text-lg transform hover:scale-105 cursor-pointer flex items-center"
            >
              🔄 Analyze Another Issue
            </button>
            <button 
              onClick={exportAnalysisReport}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg transform hover:scale-105 shadow-lg cursor-pointer flex items-center"
            >
              📊 Export Analysis Report
            </button>
            <button
              onClick={async () => {
                if (analysisResults && analysisResults.sessionId) {
                  await cleanupLogs(analysisResults.sessionId);
                  alert('Analysis logs have been cleaned up successfully.');
                }
              }}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold text-lg transform hover:scale-105 cursor-pointer flex items-center"
            >
              🗑️ Clean Up Logs
            </button>
          </div>
        </div>
      )}

      {/* SSH File Transfer Modal */}
      {showSSHTransfer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ paddingTop: `${headerHeight + 20}px` }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            
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