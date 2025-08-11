'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, CheckCircle, Clock, AlertCircle, Zap, Database, Search, Brain, FileText } from 'lucide-react';

export default function RootRippleMain({ headerHeight }) {
  const [environmentType, setEnvironmentType] = useState(''); // 'production' or 'development'
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [showEnvDropdown, setShowEnvDropdown] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [timeOccurred, setTimeOccurred] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showStepModal, setShowStepModal] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  
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

  const productionEnvironments = [
    { id: 'prod-us-east', name: 'Production US East', icon: '🔴', description: 'Primary production environment' },
    { id: 'prod-us-west', name: 'Production US West', icon: '🔴', description: 'West coast production environment' },
    { id: 'prod-eu', name: 'Production EU', icon: '🔴', description: 'European production environment' },
    { id: 'prod-asia', name: 'Production Asia', icon: '🔴', description: 'Asia-Pacific production environment' }
  ];

  const developmentEnvironments = [
    { id: 'dev-main', name: 'Development Main', icon: '🟢', description: 'Main development workspace' },
    { id: 'staging', name: 'Staging Environment', icon: '🟡', description: 'Pre-production testing' },
    { id: 'testing', name: 'Testing Environment', icon: '🔵', description: 'Quality assurance testing' },
    { id: 'uat', name: 'UAT Environment', icon: '🟣', description: 'User acceptance testing' },
    { id: 'integration', name: 'Integration Environment', icon: '🟠', description: 'System integration testing' },
    { id: 'performance', name: 'Performance Environment', icon: '🟤', description: 'Performance and load testing' },
    { id: 'sandbox', name: 'Sandbox Environment', icon: '⚪', description: 'Experimental testing space' }
  ];

  const getCurrentEnvironments = () => {
    return environmentType === 'production' ? productionEnvironments : developmentEnvironments;
  };

  const analysisSteps = [
    { id: 'connect-env', title: 'Connecting to Environment', icon: Zap, description: 'Establishing secure connection to your selected environment...', color: 'from-purple-500 to-pink-500' },
    { id: 'connect-db', title: 'Accessing Database', icon: Database, description: 'Connecting to system databases and retrieving metadata...', color: 'from-blue-500 to-cyan-500' },
    { id: 'retrieve-logs', title: 'Collecting Log Data', icon: FileText, description: 'Gathering relevant log entries from the specified time period...', color: 'from-green-500 to-emerald-500' },
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

  const startAnalysis = () => {
    if (!environmentType || !selectedEnvironment || !issueDescription || !timeOccurred) return;
    
    setIsAnalyzing(true);
    setCurrentStep(0);
    setAnalysisComplete(false);

    // Show first step immediately
    setTimeout(() => {
      setCurrentStep(1);
      setShowStepModal(true);
    }, 500);

    // Progress through steps
    analysisSteps.forEach((_, index) => {
      setTimeout(() => {
        if (index < analysisSteps.length - 1) {
          setCurrentStep(index + 2);
        } else {
          // Complete analysis
          setTimeout(() => {
            setShowStepModal(false);
            setAnalysisComplete(true);
            setAnalysisResults(mockResults);
            setIsAnalyzing(false);
            // Scroll to top of results
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
          }, 2000);
        }
      }, (index + 1) * 3000);
    });
  };

  const resetForm = () => {
    setEnvironmentType('');
    setSelectedEnvironment('');
    setIssueDescription('');
    setTimeOccurred('');
    setAttachedImages([]);
    setIsAnalyzing(false);
    setCurrentStep(0);
    setShowStepModal(false);
    setShowEnvDropdown(false);
    setAnalysisComplete(false);
    setAnalysisResults(null);
  };

  const handleEnvironmentTypeChange = (type) => {
    setEnvironmentType(type);
    setSelectedEnvironment(''); // Reset selected environment when type changes
    setShowEnvDropdown(false);
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
                onClick={() => handleEnvironmentTypeChange('production')}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer ${
                  environmentType === 'production'
                    ? 'border-red-300 bg-red-50 shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white hover:border-red-200 hover:bg-red-25 hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <span className="text-2xl">🔴</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">Production Environments</h4>                  </div>
                </div>
              </button>

              <button
                onClick={() => handleEnvironmentTypeChange('development')}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer ${
                  environmentType === 'development'
                    ? 'border-green-300 bg-green-50 shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white hover:border-green-200 hover:bg-green-25 hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <span className="text-2xl">🟢</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">Development Environments</h4>                  </div>
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
                            {getCurrentEnvironments().find(env => env.id === selectedEnvironment)?.icon}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {getCurrentEnvironments().find(env => env.id === selectedEnvironment)?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {getCurrentEnvironments().find(env => env.id === selectedEnvironment)?.description}
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
                          setSelectedEnvironment(env.id);
                          setShowEnvDropdown(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl border-b border-gray-100 last:border-b-0 cursor-pointer ${
                          selectedEnvironment === env.id ? 'bg-purple-50 border-purple-200' : ''
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
                    Issue Description *
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
                    Time When Issue Occurred *
                  </label>
                  <div className="relative">
                    <input
                      ref={timeInputRef}
                      type="datetime-local"
                      value={timeOccurred}
                      onChange={(e) => setTimeOccurred(e.target.value)}
                      onClick={() => timeInputRef.current?.showPicker?.()}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-gray-900 bg-white/50 cursor-pointer"
                      placeholder="Click to select date and time"
                    />
                  </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Root Cause */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Root Cause Identified</h3>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-2xl">
                  <p className="text-red-900 font-semibold text-lg leading-relaxed">{analysisResults.rootCause}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl">
                    <p className="text-3xl font-bold text-red-700 mb-1">{analysisResults.severity}</p>
                    <p className="text-sm font-medium text-red-600">Severity Level</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl">
                    <p className="text-3xl font-bold text-green-700 mb-1">{analysisResults.confidence}%</p>
                    <p className="text-sm font-medium text-green-600">AI Confidence</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">Affected System Components</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {analysisResults.affectedComponents.map((component, index) => (
                      <span key={index} className="px-4 py-3 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 rounded-xl text-sm font-semibold text-center border border-orange-200">
                        {component}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Solution */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Recommended Solutions</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-3">
                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-bold text-gray-900 text-lg">Immediate Action Required</h4>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-2xl">
                    <p className="text-blue-900 font-semibold leading-relaxed">{analysisResults.solution.immediate}</p>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center mb-3">
                    <Brain className="w-5 h-5 text-purple-600 mr-2" />
                    <h4 className="font-bold text-gray-900 text-lg">Long-term Strategy</h4>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 rounded-2xl">
                    <p className="text-purple-900 font-semibold leading-relaxed">{analysisResults.solution.longTerm}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          {/* Actions */}
          <div className="text-center space-x-6">
            <button
              onClick={resetForm}
              className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold text-lg transform hover:scale-105 cursor-pointer"
            >
              🔄 Analyze Another Issue
            </button>
            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg transform hover:scale-105 shadow-lg cursor-pointer">
              📊 Export Analysis Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}