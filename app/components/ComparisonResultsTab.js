'use client';

export default function ComparisonResultsTab({ 
  selectedDocuments, 
  comparisonResult, 
  onBackToDocuments 
}) {
  if (!comparisonResult || !selectedDocuments?.[0] || !selectedDocuments?.[1]) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h1a3 3 0 003-3zm6-2v-2a3 3 0 013-3h1a3 3 0 013 3v2a3 3 0 01-3 3h-1a3 3 0 01-3-3z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Comparison Results
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Run a comparison between two reports to see detailed results here.
          </p>
          <button
            onClick={onBackToDocuments}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const generateDetailedDifferences = () => {
    // Simulate detailed differences based on the comparison result
    const differences = [];
    
    // Add some sample differences based on the reports
    if (selectedDocuments[0] && selectedDocuments[1]) {
      for (let i = 0; i < comparisonResult.differences; i++) {
        const types = ['addition', 'deletion', 'modification'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        differences.push({
          id: i + 1,
          type,
          section: `Section ${Math.floor(Math.random() * 5) + 1}`,
          lineNumber: Math.floor(Math.random() * 100) + 1,
          description: getRandomDifferenceDescription(type),
          severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
        });
      }
    }
    
    return differences;
  };

  const getRandomDifferenceDescription = (type) => {
    const descriptions = {
      addition: [
        'New paragraph added with financial projections',
        'Additional bullet point in responsibilities section',
        'New subsection added for market analysis',
        'Extra compliance requirement mentioned'
      ],
      deletion: [
        'Previous quarter comparison removed',
        'Old contact information deleted',
        'Outdated policy reference removed',
        'Previous version disclaimer deleted'
      ],
      modification: [
        'Revenue figures updated from $2.4M to $2.6M',
        'Customer satisfaction score changed from 94% to 96%',
        'Contract duration modified from 12 to 18 months',
        'Payment terms adjusted from $5,000 to $5,500'
      ]
    };
    
    const typeDescriptions = descriptions[type] || descriptions.modification;
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
  };

  const getDifferenceIcon = (type) => {
    switch (type) {
      case 'addition':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        );
      case 'deletion':
        return (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'modification':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const differences = generateDetailedDifferences();

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Comparison Results
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Detailed analysis of differences between the selected reports
            </p>
          </div>
          <button
            onClick={onBackToDocuments}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Reports
          </button>
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {comparisonResult.similarity}%
            </div>
            <div className="text-sm text-blue-900 dark:text-blue-300 font-medium">
              Overall Similarity
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {comparisonResult.differences}
            </div>
            <div className="text-sm text-orange-900 dark:text-orange-300 font-medium">
              Total Differences
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {comparisonResult.additions}
            </div>
            <div className="text-sm text-green-900 dark:text-green-300 font-medium">
              Additions
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {comparisonResult.deletions}
            </div>
            <div className="text-sm text-red-900 dark:text-red-300 font-medium">
              Deletions
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {comparisonResult.modifications}
            </div>
            <div className="text-sm text-purple-900 dark:text-purple-300 font-medium">
              Modifications
            </div>
          </div>
        </div>

        {/* Report Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Document A
            </h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {selectedDocuments[0].name}</div>
              <div className="flex justify-between items-start">
                <span className="font-medium">Type:</span> 
                <div className="text-right">
                  <div className="font-normal">{selectedDocuments[0].type}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Modified: {selectedDocuments[0].lastModified}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
              Document B
            </h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {selectedDocuments[1].name}</div>
              <div className="flex justify-between items-start">
                <span className="font-medium">Type:</span>
                <div className="text-right">
                  <div className="font-normal">{selectedDocuments[1].type}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Modified: {selectedDocuments[1].lastModified}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Differences */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detailed Differences ({differences.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {differences.map((diff) => (
              <div key={diff.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getDifferenceIcon(diff.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {diff.section} (Line {diff.lineNumber})
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(diff.severity)}`}>
                        {diff.severity} priority
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        diff.type === 'addition' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        diff.type === 'deletion' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {diff.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {diff.description}
                    </p>
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
