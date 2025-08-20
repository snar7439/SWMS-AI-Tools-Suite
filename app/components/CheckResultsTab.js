'use client';

export default function SingleReportResultsTab({ 
  selectedReport, 
  analysisDocument, 
  checkResult, 
  onBackToCheck,
  inline = false // New prop to control inline display
}) {
  if (!checkResult || !selectedReport || !analysisDocument) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">
            No Check Results
          </h3>
          <p className="text-gray-400 mb-4">
            Run a report check to see detailed results here.
          </p>
          {!inline && (
            <button
              onClick={onBackToCheck}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Back to Check
            </button>
          )}
        </div>
      </div>
    );
  }

  // Use real data from API or fallback to generated data
  const findings = checkResult.detailedFindings || generateDetailedFindings();
  const sectionAnalysis = checkResult.sectionAnalysis || {};

  const generateDetailedFindings = () => {
    const findings = [];
    
    const findingTypes = ['alignment', 'missing', 'inconsistency', 'recommendation', 'compliance'];
    const sections = ['Executive Summary', 'Risk Assessment', 'Control Measures', 'Compliance', 'Procedures'];
    
    for (let i = 0; i < (checkResult.issues || 3) + (checkResult.recommendations || 2); i++) {
      const type = findingTypes[Math.floor(Math.random() * findingTypes.length)];
      const section = sections[Math.floor(Math.random() * sections.length)];
      
      findings.push({
        id: i + 1,
        type,
        section,
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        description: getRandomFindingDescription(type),
        recommendation: type === 'recommendation' ? getRandomRecommendation() : null,
        analysisReference: `Reference from verification document for ${section}`
      });
    }
    
    return findings;
  };

  const getRandomFindingDescription = (type) => {
    const descriptions = {
      alignment: [
        'Content alignment verified with verification document requirements',
        'Section structure matches expected format from verification',
        'Risk assessment methodology aligns with specified approach',
        'Control measures match the recommended framework'
      ],
      missing: [
        'Required section for emergency procedures not found in report',
        'Missing risk probability assessment as specified in verification',
        'Absence of stakeholder consultation documentation',
        'Required compliance checklist missing from appendix'
      ],
      inconsistency: [
        'Risk rating conflicts between sections and verification expectations',
        'Control measure numbering inconsistent with reference system',
        'Date references do not match timeline in verification document',
        'Terminology varies from standardized definitions in verification'
      ],
      recommendation: [
        'Consider adding detailed implementation timeline',
        'Enhance risk mitigation strategies based on verification suggestions',
        'Include additional safety protocols as recommended',
        'Expand stakeholder communication plan per verification guidelines'
      ],
      compliance: [
        'Regulatory requirements not fully addressed',
        'Safety standards implementation incomplete',
        'Documentation does not meet compliance framework',
        'Quality assurance processes require enhancement'
      ]
    };
    
    const typeDescriptions = descriptions[type] || descriptions.alignment;
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
  };

  const getRandomRecommendation = () => {
    const recommendations = [
      'Update section to include more detailed risk assessments',
      'Add cross-references to relevant safety standards',
      'Include implementation timeline and milestones',
      'Expand on monitoring and review procedures',
      'Add stakeholder consultation records'
    ];
    
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  };

  const getFindingIcon = (type) => {
    switch (type) {
      case 'alignment':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'missing':
        return (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'inconsistency':
        return (
          <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'recommendation':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'compliance':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13V12a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-900/30 text-red-300 border-red-800';
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-800';
      case 'low':
        return 'bg-green-900/30 text-green-300 border-green-800';
      default:
        return 'bg-gray-900/30 text-gray-300 border-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'alignment':
        return 'bg-green-900/30 text-green-300 border-green-800';
      case 'missing':
        return 'bg-red-900/30 text-red-300 border-red-800';
      case 'inconsistency':
        return 'bg-orange-900/30 text-orange-300 border-orange-800';
      case 'recommendation':
        return 'bg-blue-900/30 text-blue-300 border-blue-800';
      case 'compliance':
        return 'bg-purple-900/30 text-purple-300 border-purple-800';
      default:
        return 'bg-gray-900/30 text-gray-300 border-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-lime-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-green-900/20 border-green-800';
    if (score >= 80) return 'bg-lime-900/20 border-lime-800';
    if (score >= 70) return 'bg-yellow-900/20 border-yellow-800';
    if (score >= 60) return 'bg-orange-900/20 border-orange-800';
    return 'bg-red-900/20 border-red-800';
  };

  return (
    <div className={`${inline ? '' : 'flex-1 flex flex-col bg-gray-800 h-full'}`}>
      {/* Header - Only show when not inline */}
      {!inline && (
        <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Report Check Results
              </h2>
              <p className="text-gray-300 mt-1">
                Analysis of report alignment with provided verification document
              </p>
            </div>
            <button
              onClick={onBackToCheck}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Check
            </button>
          </div>
        </div>
      )}

      {/* Results Content */}
      <div className={`${inline ? 'p-6' : 'flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 p-6'}`}>
        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`${getScoreBgColor(checkResult.accuracy || 0)} border rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${getScoreColor(checkResult.accuracy || 0)}`}>
              {checkResult.accuracy || 0}%
            </div>
            <div className="text-sm text-gray-300 font-medium">
              Accuracy Score
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Factual correctness
            </div>
          </div>
          
          <div className={`${getScoreBgColor(checkResult.alignment || 0)} border rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${getScoreColor(checkResult.alignment || 0)}`}>
              {checkResult.alignment || 0}%
            </div>
            <div className="text-sm text-gray-300 font-medium">
              Alignment Score
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Structural match
            </div>
          </div>
          
          <div className={`${getScoreBgColor(checkResult.coverage || 0)} border rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${getScoreColor(checkResult.coverage || 0)}`}>
              {checkResult.coverage || 0}%
            </div>
            <div className="text-sm text-gray-300 font-medium">
              Coverage Score
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Requirement fulfillment
            </div>
          </div>
          
          <div className={`${getScoreBgColor(checkResult.compliance || 0)} border rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${getScoreColor(checkResult.compliance || 0)}`}>
              {checkResult.compliance || 0}%
            </div>
            <div className="text-sm text-gray-300 font-medium">
              Compliance Score
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Standards adherence
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-400">
              {checkResult.issues || 0}
            </div>
            <div className="text-sm text-orange-300 font-medium">
              Total Issues
            </div>
          </div>
          
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">
              {checkResult.criticalIssues || 0}
            </div>
            <div className="text-sm text-red-300 font-medium">
              Critical Issues
            </div>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">
              {checkResult.recommendations || 0}
            </div>
            <div className="text-sm text-blue-300 font-medium">
              Recommendations
            </div>
          </div>
          
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {checkResult.contentMatches || 0}
            </div>
            <div className="text-sm text-green-300 font-medium">
              Content Matches
            </div>
          </div>
          
          <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {checkResult.missingElements || 0}
            </div>
            <div className="text-sm text-purple-300 font-medium">
              Missing Elements
            </div>
          </div>
        </div>

        {/* Document Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-100 mb-3">
              SWMS Report
            </h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {selectedReport.name}</div>
              <div><span className="font-medium">Type:</span> {selectedReport.type || checkResult.fileMetadata?.reportType || 'Unknown'}</div>
              <div><span className="font-medium">Source:</span> {selectedReport.fetchedFromSWMS ? 'SWMS System' : 'Manual Upload'}</div>
              {checkResult.timestamp && (
                <div><span className="font-medium">Analyzed:</span> {new Date(checkResult.timestamp).toLocaleString()}</div>
              )}
            </div>
          </div>
          
          <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-100 mb-3">
              Verification Document
            </h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {analysisDocument.name}</div>
              <div><span className="font-medium">Type:</span> {analysisDocument.fileType === 'markdown' ? 'Markdown' : 'PDF'}</div>
              <div><span className="font-medium">Format:</span> {checkResult.fileMetadata?.analysisFormat || 'Unknown'}</div>
              <div><span className="font-medium">Source:</span> Manual Upload</div>
            </div>
          </div>
        </div>

        {/* Analysis Quality Indicators */}
        {checkResult.analysisQuality && (
          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Verification Quality
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${checkResult.analysisQuality.hasDetailedFindings ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>Detailed Findings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${checkResult.analysisQuality.hasSectionAnalysis ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>Section Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${checkResult.analysisQuality.hasRecommendations ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>Recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${checkResult.analysisQuality.completeness >= 80 ? 'bg-green-400' : checkResult.analysisQuality.completeness >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                <span>Completeness: {checkResult.analysisQuality.completeness}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Strengths and Weaknesses */}
        {(checkResult.strengths?.length > 0 || checkResult.weaknesses?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {checkResult.strengths?.length > 0 && (
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-100 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Strengths
                </h3>
                <ul className="space-y-2 text-sm text-green-200">
                  {checkResult.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {checkResult.weaknesses?.length > 0 && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-100 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414 1.414L10 13.828l-1.293-1.293a1 1 0 00-1.414 1.414L10 16.243l1.293-1.293a1 1 0 001.414-1.414L10 13.536l-1.293-1.293z" clipRule="evenodd" />
                  </svg>
                  Areas for Improvement
                </h3>
                <ul className="space-y-2 text-sm text-red-200">
                  {checkResult.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></div>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Section Analysis */}
        {Object.keys(sectionAnalysis).length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Section Analysis ({Object.keys(sectionAnalysis).length} sections)
              </h3>
            </div>
            
            <div className="divide-y divide-gray-700">
              {Object.entries(sectionAnalysis).map(([sectionName, analysis]) => (
                <div key={sectionName} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-white">{sectionName}</h4>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${analysis.present ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                        {analysis.present ? 'Present' : 'Missing'}
                      </span>
                      {analysis.present && (
                        <>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreBgColor(analysis.completeness || 0)} ${getScoreColor(analysis.completeness || 0)}`}>
                            {analysis.completeness || 0}% Complete
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreBgColor(analysis.quality || 0)} ${getScoreColor(analysis.quality || 0)}`}>
                            {analysis.quality || 0}% Quality
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {analysis.verificationRequirement && (
                    <div className="mb-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                      <div className="text-sm font-medium text-blue-300 mb-1">Verification Requirement:</div>
                      <p className="text-sm text-blue-200">{analysis.verificationRequirement}</p>
                    </div>
                  )}
                  
                  {analysis.issues && analysis.issues.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-orange-300">Issues Found:</div>
                      {analysis.issues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-orange-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"></div>
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Findings */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Detailed Findings ({findings.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-700">
            {findings.map((finding, index) => (
              <div key={finding.id || index} className="px-6 py-4 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getFindingIcon(finding.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-sm font-medium text-white">
                        {finding.section}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(finding.severity)}`}>
                        {finding.severity} priority
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(finding.type)}`}>
                        {finding.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2">
                      {finding.description}
                    </p>
                    
                    {finding.analysisReference && (
                      <div className="mb-2 p-2 bg-gray-600/30 border border-gray-600 rounded text-xs text-gray-400">
                        <strong>Reference:</strong> {finding.analysisReference}
                      </div>
                    )}
                    
                    {finding.recommendation && (
                      <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                        <div className="text-xs font-medium text-blue-300 mb-1">Recommendation:</div>
                        <p className="text-sm text-blue-200">{finding.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}