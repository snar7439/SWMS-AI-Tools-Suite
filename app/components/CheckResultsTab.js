'use client';

export default function SingleReportResultsTab({ 
  selectedReport, 
  analysisDocument, 
  checkResult, 
  onBackToCheck 
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
          <button
            onClick={onBackToCheck}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to Check
          </button>
        </div>
      </div>
    );
  }

  const generateDetailedFindings = () => {
    const findings = [];
    
    const findingTypes = ['alignment', 'missing', 'inconsistency', 'recommendation'];
    const sections = ['Executive Summary', 'Risk Assessment', 'Control Measures', 'Compliance', 'Procedures'];
    
    for (let i = 0; i < checkResult.issues + checkResult.recommendations; i++) {
      const type = findingTypes[Math.floor(Math.random() * findingTypes.length)];
      const section = sections[Math.floor(Math.random() * sections.length)];
      
      findings.push({
        id: i + 1,
        type,
        section,
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        description: getRandomFindingDescription(type),
        recommendation: type === 'recommendation' ? getRandomRecommendation() : null
      });
    }
    
    return findings;
  };

  const getRandomFindingDescription = (type) => {
    const descriptions = {
      alignment: [
        'Content alignment verified with analysis document requirements',
        'Section structure matches expected format from analysis',
        'Risk assessment methodology aligns with specified approach',
        'Control measures match the recommended framework'
      ],
      missing: [
        'Required section for emergency procedures not found in report',
        'Missing risk probability assessment as specified in analysis',
        'Absence of stakeholder consultation documentation',
        'Required compliance checklist missing from appendix'
      ],
      inconsistency: [
        'Risk rating conflicts between sections and analysis expectations',
        'Control measure numbering inconsistent with reference system',
        'Date references do not match timeline in analysis document',
        'Terminology varies from standardized definitions in analysis'
      ],
      recommendation: [
        'Consider adding detailed implementation timeline',
        'Enhance risk mitigation strategies based on analysis suggestions',
        'Include additional safety protocols as recommended',
        'Expand stakeholder communication plan per analysis guidelines'
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
      default:
        return null;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-900/30 text-red-300';
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-300';
      case 'low':
        return 'bg-green-900/30 text-green-300';
      default:
        return 'bg-gray-900/30 text-gray-300';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'alignment':
        return 'bg-green-900/30 text-green-300';
      case 'missing':
        return 'bg-red-900/30 text-red-300';
      case 'inconsistency':
        return 'bg-orange-900/30 text-orange-300';
      case 'recommendation':
        return 'bg-blue-900/30 text-blue-300';
      default:
        return 'bg-gray-900/30 text-gray-300';
    }
  };

  const findings = generateDetailedFindings();

  return (
    <div className="flex-1 flex flex-col bg-gray-800">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Report Check Results
            </h2>
            <p className="text-gray-300 mt-1">
              Analysis of report alignment with provided analysis document
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

      {/* Results Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">
              {checkResult.accuracy}%
            </div>
            <div className="text-sm text-blue-300 font-medium">
              Overall Accuracy
            </div>
          </div>
          
          <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {checkResult.alignment}%
            </div>
            <div className="text-sm text-purple-300 font-medium">
              Content Alignment
            </div>
          </div>
          
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {checkResult.coverage}%
            </div>
            <div className="text-sm text-green-300 font-medium">
              Requirement Coverage
            </div>
          </div>
          
          <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-400">
              {checkResult.issues}
            </div>
            <div className="text-sm text-orange-300 font-medium">
              Issues Found
            </div>
          </div>
          
          <div className="bg-cyan-900/20 border border-cyan-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-cyan-400">
              {checkResult.contentMatches}
            </div>
            <div className="text-sm text-cyan-300 font-medium">
              Content Matches
            </div>
          </div>
          
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">
              {checkResult.missingElements}
            </div>
            <div className="text-sm text-red-300 font-medium">
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
              <div><span className="font-medium">Type:</span> {selectedReport.type}</div>
              <div><span className="font-medium">Source:</span> {selectedReport.fetchedFromSWMS ? 'SWMS System' : 'Manual Upload'}</div>
            </div>
          </div>
          
          <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-100 mb-3">
              Analysis Document
            </h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {analysisDocument.name}</div>
              <div><span className="font-medium">Type:</span> {analysisDocument.fileType === 'markdown' ? 'Markdown' : 'PDF'}</div>
              <div><span className="font-medium">Source:</span> Manual Upload</div>
            </div>
          </div>
        </div>

        {/* Detailed Findings */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Detailed Findings ({findings.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-700">
            {findings.map((finding) => (
              <div key={finding.id} className="px-6 py-4 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getFindingIcon(finding.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-white">
                        {finding.section}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(finding.severity)}`}>
                        {finding.severity} priority
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(finding.type)}`}>
                        {finding.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {finding.description}
                    </p>
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