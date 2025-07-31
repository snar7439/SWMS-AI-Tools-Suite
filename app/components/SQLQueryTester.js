import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Play, Database, CheckCircle, XCircle, AlertCircle, Copy, Download, Eye, EyeOff } from 'lucide-react';

export default function SQLQueryTester({ analysisDocument, report }) {
  const [extractedQueries, setExtractedQueries] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [expandedQueries, setExpandedQueries] = useState(new Set());
  const [queryResults, setQueryResults] = useState({});
  const [executingQueries, setExecutingQueries] = useState(new Set());
  const [customQuery, setCustomQuery] = useState('');
  const [showCustomQuery, setShowCustomQuery] = useState(false);
  const [currentTab, setCurrentTab] = useState('extracted');

  // Clear all results and state when analysis document changes
  useEffect(() => {
    if (analysisDocument) {
      // Clear all previous state
      setQueryResults({});
      setExecutingQueries(new Set());
      setExpandedQueries(new Set());
      setCustomQuery('');
      setCurrentTab('extracted');
      
      // Reset query statuses to pending
      setExtractedQueries(prev => prev.map(query => ({
        ...query,
        status: 'pending'
      })));
    }
  }, [analysisDocument?.id, analysisDocument?.name]); // Trigger when document ID or name changes

  // Extract SQL queries from analysis document content
  useEffect(() => {
    if (!analysisDocument) {
      setExtractedQueries([]);
      return;
    }

    const extractQueriesFromContent = (content) => {
      if (!content) return [];

      const queries = [];
      
      // Multiple regex patterns to catch different SQL formats
      const patterns = [
        // Pattern 1: sql-- comment format (your example)
        /sql--[^\n]*\n((?:(?!sql--|```)[^\n]*\n?)*)/gi,
        // Pattern 2: Standard SQL code blocks
        /```sql\n([\s\S]*?)```/gi,
        // Pattern 3: SQL followed by semicolon
        /(?:^|\n)(?:SELECT|WITH|EXPLAIN)[\s\S]*?;/gmi,
        // Pattern 4: Inline SQL in documentation
        /`(SELECT[\s\S]*?)`/gi
      ];

      patterns.forEach((pattern, patternIndex) => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          let queryText = match[1] || match[0];
          
          // Clean up the query
          queryText = queryText
            .replace(/^sql--.*$/gm, '') // Remove sql-- comments
            .replace(/```sql|```/g, '') // Remove code block markers
            .replace(/`/g, '') // Remove backticks
            .trim()
            .trim().replace(/;$/, ''); // Remove trailing semicolon

          if (queryText && queryText.length > 10) { // Filter out very short matches
            // Extract description from preceding text
            const beforeMatch = content.substring(0, match.index);
            const lines = beforeMatch.split('\n');
            let description = '';
            
            // Look for description in the last few lines before the query
            for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
              const line = lines[i].trim();
              if (line && !line.match(/^(sql--|```|SELECT|WITH|FROM)/i)) {
                description = line.replace(/^[#*-]\s*/, ''); // Remove markdown markers
                break;
              }
            }

            queries.push({
              id: `query_${queries.length + 1}`,
              description: description || `SQL Query ${queries.length + 1}`,
              query: queryText,
              patternUsed: patternIndex + 1,
              status: 'pending'
            });
          }
        }
      });

      // Remove duplicates based on query content
      const uniqueQueries = queries.filter((query, index, self) => 
        index === self.findIndex(q => q.query.trim() === query.query.trim())
      );

      return uniqueQueries;
    };

    let content = '';
    if (analysisDocument.content) {
      content = analysisDocument.content;
    } else if (analysisDocument.file) {
      // If it's a file, we need to read it
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target.result;
        const queries = extractQueriesFromContent(fileContent);
        setExtractedQueries(queries);
      };
      reader.readAsText(analysisDocument.file);
      return;
    }

    const queries = extractQueriesFromContent(content);
    setExtractedQueries(queries);
  }, [analysisDocument]);

  // Test database connection
  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/db');
      const result = await response.json();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: 'Failed to connect to database API',
        details: error.message
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Execute a single query
  const executeQuery = async (query) => {
    const queryId = query.id;
    setExecutingQueries(prev => new Set([...prev, queryId]));
    
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.query })
      });
      
      const result = await response.json();
      
      setQueryResults(prev => ({
        ...prev,
        [queryId]: {
          ...result,
          executedAt: new Date().toISOString(),
          query: query.query
        }
      }));

      // Update query status in extractedQueries
      setExtractedQueries(prev => prev.map(q => 
        q.id === queryId 
          ? { ...q, status: result.success ? 'success' : 'error' }
          : q
      ));

    } catch (error) {
      setQueryResults(prev => ({
        ...prev,
        [queryId]: {
          success: false,
          error: 'Network error: ' + error.message,
          executedAt: new Date().toISOString(),
          query: query.query
        }
      }));

      setExtractedQueries(prev => prev.map(q => 
        q.id === queryId 
          ? { ...q, status: 'error' }
          : q
      ));
    } finally {
      setExecutingQueries(prev => {
        const newSet = new Set(prev);
        newSet.delete(queryId);
        return newSet;
      });
    }
  };

  // Execute custom query
  const executeCustomQuery = async () => {
    if (!customQuery.trim()) return;
    
    const customQueryObj = {
      id: 'custom_query',
      query: customQuery.trim(),
      description: 'Custom Query'
    };
    
    await executeQuery(customQueryObj);
  };

  // Toggle query expansion
  const toggleQueryExpansion = (queryId) => {
    setExpandedQueries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(queryId)) {
        newSet.delete(queryId);
      } else {
        newSet.add(queryId);
      }
      return newSet;
    });
  };

  // Copy query to clipboard
  const copyQuery = async (query) => {
    try {
      await navigator.clipboard.writeText(query);
    } catch (error) {
      console.error('Failed to copy query:', error);
    }
  };

  // Export results as JSON
  const exportResults = () => {
    const exportData = {
      reportName: report?.name || 'Unknown Report',
      analysisDocument: analysisDocument?.name || 'Unknown Analysis',
      executedAt: new Date().toISOString(),
      connectionStatus: connectionStatus,
      queries: extractedQueries.map(query => ({
        ...query,
        result: queryResults[query.id] || null
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sql-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear all results manually
  const clearAllResults = () => {
    setQueryResults({});
    setExecutingQueries(new Set());
    setExpandedQueries(new Set());
    setCustomQuery('');
    setExtractedQueries(prev => prev.map(query => ({
      ...query,
      status: 'pending'
    })));
  };

  const getStatusIcon = (status, isExecuting = false) => {
    if (isExecuting) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>;
    }
    
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Check if connection is ready
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">SQL Query Tester</h2>
            {analysisDocument && (
              <span className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs font-medium rounded">
                {analysisDocument.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Clear Results Button */}
            {/* {(Object.keys(queryResults).length > 0 || customQuery.trim()) && (
              <button
                onClick={clearAllResults}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm rounded-lg transition-colors"
              >
                <XCircle className="w-3 h-3" />
                Clear All Results
              </button>
            )} */}

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <button
                onClick={testConnection}
                disabled={isTestingConnection}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {isTestingConnection ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <Database className="w-3 h-3" />
                )}
                Test Connection
              </button>
              
              {connectionStatus && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  connectionStatus.success 
                    ? 'bg-green-900/30 text-green-300' 
                    : 'bg-red-900/30 text-red-300'
                }`}>
                  {getStatusIcon(connectionStatus.success ? 'success' : 'error')}
                  {connectionStatus.success ? 'Connected' : 'Failed'}
                </div>
              )}
            </div>

            {/* Export Button */}
            {Object.keys(queryResults).length > 0 && (
              <button
                onClick={exportResults}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
              >
                <Download className="w-3 h-3" />
                Export Results
              </button>
            )}
          </div>
        </div>

        {/* Connection Error */}
        {connectionStatus && !connectionStatus.success && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-300 text-sm font-medium">Database Connection Failed</p>
            <p className="text-red-400 text-xs mt-1">{connectionStatus.error}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 bg-gray-750 border-b border-gray-700">
        <div className="flex">
          <button
            onClick={() => setCurrentTab('extracted')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              currentTab === 'extracted'
                ? 'bg-gray-800 text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            Extracted Queries ({extractedQueries.length})
          </button>
          <button
            onClick={() => setCurrentTab('custom')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              currentTab === 'custom'
                ? 'bg-gray-800 text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            Custom Query
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {currentTab === 'extracted' && (
          <div className="p-4 space-y-4">
            {extractedQueries.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No SQL Queries Found</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  No SQL queries were detected in the analysis document. Queries should be in code blocks or follow the sql-- comment format.
                </p>
              </div>
            ) : (
              extractedQueries.map((query, index) => (
                <div key={query.id} className="bg-gray-700 rounded-lg border border-gray-600">
                  {/* Query Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleQueryExpansion(query.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button className="text-gray-400 hover:text-white">
                        {expandedQueries.has(query.id) ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {query.description}
                        </h4>
                        <p className="text-xs text-gray-400 truncate">
                          Pattern {query.patternUsed} • {query.query.length} chars
                        </p>
                      </div>
                      
                      {getStatusIcon(query.status, executingQueries.has(query.id))}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyQuery(query.query); }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                        title="Copy query"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); executeQuery(query); }}
                        disabled={!connectionStatus?.success || executingQueries.has(query.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Run
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedQueries.has(query.id) && (
                    <div className="border-t border-gray-600 p-4 space-y-4">
                      {/* Query Code */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">SQL Query:</h5>
                        <pre className="bg-gray-800 border border-gray-600 rounded p-3 text-sm text-green-300 overflow-x-auto">
                          <code>{query.query}</code>
                        </pre>
                      </div>

                      {/* Results */}
                      {queryResults[query.id] && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Results:</h5>
                          {queryResults[query.id].success ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>Rows returned: {queryResults[query.id].rowCount}</span>
                                <span>Executed: {new Date(queryResults[query.id].executedAt).toLocaleString()}</span>
                              </div>
                              
                              {queryResults[query.id].data && queryResults[query.id].data.length > 0 ? (
                                <div className="bg-gray-800 border border-gray-600 rounded overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-750">
                                      <tr>
                                        {Object.keys(queryResults[query.id].data[0]).map((column) => (
                                          <th key={column} className="px-3 py-2 text-left font-medium text-gray-300 border-b border-gray-600">
                                            {column}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {queryResults[query.id].data.slice(0, 10).map((row, rowIndex) => (
                                        <tr key={rowIndex} className="border-b border-gray-700 last:border-b-0">
                                          {Object.values(row).map((value, colIndex) => (
                                            <td key={colIndex} className="px-3 py-2 text-gray-300">
                                              {value !== null ? String(value) : 'NULL'}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  
                                  {queryResults[query.id].data.length > 10 && (
                                    <div className="p-2 text-center text-xs text-gray-500 bg-gray-750">
                                      ... and {queryResults[query.id].data.length - 10} more rows
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-gray-800 border border-gray-600 rounded p-4 text-center">
                                  <p className="text-gray-400 text-sm">No data returned</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-red-900/20 border border-red-800 rounded p-3">
                              <p className="text-red-300 text-sm font-medium">Query Failed</p>
                              <p className="text-red-400 text-xs mt-1">{queryResults[query.id].error}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {currentTab === 'custom' && (
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom SQL Query
                </label>
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="SELECT * FROM your_table WHERE condition = 'value';"
                  className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg p-3 text-green-300 font-mono text-sm resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Only SELECT queries are allowed for security reasons
                </div>
                
                <button
                  onClick={executeCustomQuery}
                  disabled={!connectionStatus?.success || !customQuery.trim() || executingQueries.has('custom_query')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {executingQueries.has('custom_query') ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Execute Query
                </button>
              </div>

              {/* Custom Query Results */}
              {queryResults['custom_query'] && (
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-gray-300 mb-3">Query Results:</h5>
                  {queryResults['custom_query'].success ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Rows returned: {queryResults['custom_query'].rowCount}</span>
                        <span>Executed: {new Date(queryResults['custom_query'].executedAt).toLocaleString()}</span>
                      </div>
                      
                      {queryResults['custom_query'].data && queryResults['custom_query'].data.length > 0 ? (
                        <div className="bg-gray-800 border border-gray-600 rounded overflow-x-auto max-h-96">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-750 sticky top-0">
                              <tr>
                                {Object.keys(queryResults['custom_query'].data[0]).map((column) => (
                                  <th key={column} className="px-3 py-2 text-left font-medium text-gray-300 border-b border-gray-600">
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {queryResults['custom_query'].data.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-gray-700 last:border-b-0">
                                  {Object.values(row).map((value, colIndex) => (
                                    <td key={colIndex} className="px-3 py-2 text-gray-300">
                                      {value !== null ? String(value) : 'NULL'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-gray-800 border border-gray-600 rounded p-4 text-center">
                          <p className="text-gray-400 text-sm">No data returned</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-800 rounded p-4">
                      <p className="text-red-300 text-sm font-medium">Query Failed</p>
                      <p className="text-red-400 text-xs mt-2">{queryResults['custom_query'].error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}