'use client';

export default function CompareControls({ 
  selectedDocuments, 
  isComparing, 
  comparisonResult, 
  onCompare, 
  onClear,
  onViewResults
}) {
  const canCompare = selectedDocuments?.[0] && selectedDocuments?.[1];

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-3">
      {/* Comparison Results Summary - Compact */}
      {comparisonResult && (
            <div className="mb-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-blue-100 mb-1">
                Comparison Complete
              </h3>
              <p className="text-xs text-blue-200">
                Found {comparisonResult.differences} differences with {comparisonResult.similarity}% similarity
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-blue-300">💡 Use the &quot;Diffs&quot; button in each viewer to highlight differences</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">
                  {comparisonResult.additions}
                </div>
                <div className="text-xs text-gray-400">Added</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">
                  {comparisonResult.deletions}
                </div>
                <div className="text-xs text-gray-400">Deleted</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">
                  {comparisonResult.modifications}
                </div>
                <div className="text-xs text-gray-400">Modified</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons - Compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full ${
              canCompare 
                ? 'bg-green-500' 
                : 'bg-gray-600'
            }"></div>
            <span className="text-xs text-gray-400">
              {canCompare 
                ? 'Ready to compare' 
                : 'Select two reports'
              }
            </span>
          </div>

          {/* Report Names - Smaller */}
          {canCompare && (
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
              <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
                {selectedDocuments[0]?.name}
              </span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-xs">
                {selectedDocuments[1]?.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Clear Button - Compact */}
          <button
            onClick={onClear}
            disabled={!canCompare && !comparisonResult}
            className="px-3 py-1.5 text-sm text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>

          {/* Compare Button - Compact */}
          <button
            onClick={onCompare}
            disabled={!canCompare || isComparing}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            {isComparing ? (
              <>
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Comparing...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Compare
              </>
            )}
          </button>

          {/* View Detailed Results Button - Compact */}
          {comparisonResult && onViewResults && (
            <button
              onClick={onViewResults}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Results
            </button>
          )}

          {/* Export Results Button - Compact */}
          {comparisonResult && (
            <button
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-1"
              onClick={() => {
                // Simulate export functionality
                const exportData = {
                  reports: {
                    reportA: selectedDocuments[0]?.name,
                    reportB: selectedDocuments[1]?.name
                  },
                  results: comparisonResult,
                  timestamp: new Date().toISOString()
                };
                
                const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                  type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'comparison-results.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar - Compact */}
      {isComparing && (
        <div className="mt-2">
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">
            Analyzing reports...
          </p>
        </div>
      )}
    </div>
  );
}
