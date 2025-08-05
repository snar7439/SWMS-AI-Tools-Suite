import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Play, Database, CheckCircle, XCircle, AlertCircle, Copy, Download, Eye, EyeOff, X } from 'lucide-react';

export default function SQLQueryTester({ 
  analysisDocument, 
  report, 
  onToggleVisibility, 
  isVisible = true, 
  compact = false 
}) {
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
      
      // Helper function to clean and validate SQL
      const cleanSQL = (sql) => {
        return sql
          .replace(/^sql--.*$/gm, '') // Remove sql-- comments
          .replace(/^--.*$/gm, '') // Remove regular SQL comments
          .replace(/```sql|```/g, '') // Remove code block markers
          .replace(/`/g, '') // Remove backticks
          .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/[^\x20-\x7E\s]/g, '') // Remove non-printable characters
          .trim();
      };

      // Helper function to check if a query is valid and executable
      const isValidQuery = (queryText) => {
        const cleanQuery = queryText.trim().toUpperCase();
        
        // Must be substantial enough
        if (cleanQuery.length < 20) return false;
        
        // Filter out non-executable patterns
        const nonExecutablePatterns = [
          /^@\w+\.sql/i,  // Script calls
          /^\w+\s+\[\w+\]/i,  // Parameter patterns
          /^DECLARE\s+@/i,  // Variable declarations without main query
          /^SET\s+@/i,      // Variable assignments without main query
          /^PRINT\s+/i,     // Print statements
          /^GO\s*$/im,      // SQL Server batch separators
          /^USE\s+\w+/i,    // Database USE statements
          /^\s*--/,         // Pure comment lines
          /^\s*\/\*/,       // Block comment starts
          /FROM\s*$|WHERE\s*$|SELECT\s*$|,\s*$/i, // Incomplete queries
        ];
        
        // Check for non-executable patterns
        for (const pattern of nonExecutablePatterns) {
          if (pattern.test(cleanQuery)) {
            return false;
          }
        }
        
        // Must start with executable SQL keywords
        const executableKeywords = [
          'SELECT', 'WITH', 'EXPLAIN', 'DESCRIBE', 'SHOW'
        ];
        
        const startsWithKeyword = executableKeywords.some(keyword => 
          cleanQuery.startsWith(keyword + ' ') || cleanQuery.startsWith(keyword + '\n')
        );

        if (!startsWithKeyword) return false;

        // Basic Oracle SQL validation
        // Check for balanced parentheses
        const openParens = (queryText.match(/\(/g) || []).length;
        const closeParens = (queryText.match(/\)/g) || []).length;
        if (openParens !== closeParens) return false;

        // Allow FROM clause for SELECT statements but don't require it for simple queries
        if (cleanQuery.startsWith('SELECT')) {
          // Allow simple SELECT statements without FROM (like SELECT 1, SELECT SYSDATE, etc.)
          const isSimpleSelect = /^SELECT\s+[\w\s\(\),\.'"*+\-/]+$/i.test(cleanQuery) && cleanQuery.length < 100;
          const hasFromClause = cleanQuery.includes(' FROM ');
          
          // Only require FROM clause for complex SELECT statements during extraction
          if (!isSimpleSelect && !hasFromClause && cleanQuery.length > 50) {
            return false;
          }
        }

        // Check for incomplete SELECT lists (more flexible)
        if (cleanQuery.startsWith('SELECT')) {
          let selectMatch = cleanQuery.match(/SELECT\s+(.*?)\s+FROM/i);
          if (!selectMatch) {
            // No FROM clause, check the entire SELECT statement
            selectMatch = cleanQuery.match(/SELECT\s+(.*?)(?:\s*;?\s*$)/i);
          }
          if (selectMatch) {
            const selectList = selectMatch[1].trim();
            if (selectList.endsWith(',') || selectList === '') return false;
          }
        }

        return true;
      };

      // Improved regex patterns with better boundary detection
      const patterns = [
        // Pattern 1: sql-- comment format with better boundary detection
        {
          regex: /sql--[^\n]*\n((?:(?!sql--|```|^[A-Z]+\s*:|\n\s*\n)[^\n]*\n?)*?)(?=\n\s*\n|\n[A-Z]+\s*:|sql--|```|$)/gi,
          name: 'sql-- comment format'
        },
        // Pattern 2: Standard SQL code blocks
        {
          regex: /```sql\s*\n([\s\S]*?)```/gi,
          name: 'SQL code blocks'
        },
        // Pattern 3: SQL code blocks without language specifier
        {
          regex: /```\s*\n((?:SELECT|WITH|EXPLAIN|DESCRIBE|SHOW)[\s\S]*?)```/gmi,
          name: 'Generic code blocks with SQL'
        },
        // Pattern 4: Multi-line SQL queries with proper termination
        {
          regex: /(?:^|\n)((?:SELECT|WITH|EXPLAIN|DESCRIBE|SHOW)(?:\s|\n)+[\s\S]*?)(?=\n\s*(?:SELECT|WITH|EXPLAIN|DESCRIBE|SHOW|\n|$)|;|$)/gmi,
          name: 'Multi-line SQL queries'
        },
        // Pattern 5: Single line SQL with semicolon
        {
          regex: /(?:^|\n)((?:SELECT|WITH|EXPLAIN|DESCRIBE|SHOW)[^;\n]*;)/gmi,
          name: 'Single line SQL with semicolon'
        }
      ];

      patterns.forEach((pattern, patternIndex) => {
        let match;
        while ((match = pattern.regex.exec(content)) !== null) {
          let queryText = match[1] || match[0];
          
          // Clean the query
          const cleanedQuery = cleanSQL(queryText);
          
          if (cleanedQuery && isValidQuery(cleanedQuery)) {
            // Extract description from preceding context
            const beforeMatch = content.substring(Math.max(0, match.index - 500), match.index);
            const lines = beforeMatch.split('\n');
            let description = '';
            
            // Look for description in the last few lines before the query
            for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
              const line = lines[i].trim();
              if (line && 
                  !line.match(/^(sql--|```|SELECT|WITH|FROM|WHERE|@|\[|\/\*)/i) &&
                  !line.match(/^\s*[{}()\[\]]/)) {
                description = line.replace(/^[#*-]\s*/, ''); // Remove markdown markers
                break;
              }
            }

            // Clean and prepare the final query
            let finalQuery = cleanedQuery.trim();
            
            // Remove any existing trailing semicolon and re-add it for consistency
            if (finalQuery.endsWith(';')) {
              finalQuery = finalQuery.slice(0, -1).trim();
            }
            finalQuery += ';';

            queries.push({
              id: `query_${queries.length + 1}`,
              description: description || `SQL Query ${queries.length + 1}`,
              query: finalQuery,
              originalQuery: queryText, // Keep original for debugging
              patternUsed: patternIndex + 1,
              patternName: pattern.name,
              status: 'pending'
            });
          }
        }
      });

      // Remove duplicates based on normalized query content
      const uniqueQueries = queries.filter((query, index, self) => {
        const normalizedQuery = query.query.replace(/\s+/g, ' ').trim().toUpperCase();
        return index === self.findIndex(q => 
          q.query.replace(/\s+/g, ' ').trim().toUpperCase() === normalizedQuery
        );
      });

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

  // Validate query before execution
  const validateQuery = (queryText) => {
    const issues = [];
    const cleanQuery = queryText.trim().toUpperCase();

    // Check for non-printable characters
    if (/[^\x20-\x7E\s]/.test(queryText)) {
      issues.push('Contains non-printable characters');
    }

    // Check for incomplete SELECT lists (more flexible pattern)
    if (cleanQuery.startsWith('SELECT')) {
      // Try to find SELECT list - either before FROM or entire query if no FROM
      let selectListMatch = cleanQuery.match(/SELECT\s+(.*?)\s+FROM/i);
      if (!selectListMatch) {
        // No FROM clause, check the entire SELECT statement
        selectListMatch = cleanQuery.match(/SELECT\s+(.*?)(?:\s*;?\s*$)/i);
      }
      
      if (selectListMatch) {
        const selectList = selectListMatch[1].trim();
        if (selectList.endsWith(',')) {
          issues.push('Incomplete SELECT list (trailing comma)');
        }
        if (selectList === '') {
          issues.push('Empty SELECT list');
        }
      }
    }

    // Optional FROM clause check for SELECT statements (allow simple SELECT without FROM)
    // Skip FROM clause validation for simple SELECT statements like "SELECT 1", "SELECT SYSDATE", etc.
    if (/^SELECT/i.test(queryText.trim())) {
      const selectBody = queryText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Allow simple SELECT statements without FROM (like SELECT 1, SELECT SYSDATE, etc.)
      const isSimpleSelect = /^SELECT\s+[\w\s\(\),\.'"*+\-/]+$/i.test(selectBody) && selectBody.length < 100;
      const hasFromClause = /\bFROM\b/i.test(selectBody);
      
      // Only require FROM clause for complex SELECT statements
      if (!isSimpleSelect && !hasFromClause) {
        issues.push('Missing FROM clause for complex SELECT statement');
      }
    }

    // Check for balanced quotes
    const singleQuotes = (queryText.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      issues.push('Unbalanced single quotes');
    }

    const doubleQuotes = (queryText.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) {
      issues.push('Unbalanced double quotes');
    }

    // Check for Oracle-specific issues (more lenient)
    if (queryText.includes('||')) {
      // Only flag obvious concatenation errors, be more lenient
      const parts = queryText.split('||');
      let hasEmptyParts = false;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        // Check if part is completely empty (not just whitespace)
        if (part === '' || (i > 0 && i < parts.length - 1 && part.replace(/\s/g, '') === '')) {
          hasEmptyParts = true;
          break;
        }
      }
      if (hasEmptyParts) {
        issues.push('Invalid concatenation syntax - empty operand');
      }
    }

    return issues;
  };

  // Execute a single query
  const executeQuery = async (query) => {
    const queryId = query.id;

    // Pre-validate the query
    const validationIssues = validateQuery(query.query);
    if (validationIssues.length > 0) {
      setQueryResults(prev => ({
        ...prev,
        [queryId]: {
          success: false,
          error: 'Query validation failed: ' + validationIssues.join(', '),
          validationIssues: validationIssues,
          executedAt: new Date().toISOString(),
          query: query.query
        }
      }));

      setExtractedQueries(prev => prev.map(q => 
        q.id === queryId 
          ? { ...q, status: 'error' }
          : q
      ));
      return;
    }

    // Split the query into multiple statements if needed
    const statements = splitSQLStatements(query.query);
    
    console.log(`Executing ${statements.length} statement(s) for query ${queryId}:`, statements.map(s => s.substring(0, 100) + '...'));

    setExecutingQueries(prev => new Set([...prev, queryId]));

    try {
      const allResults = [];
      let totalRows = 0;
      
      // Execute each statement separately
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        
        console.log(`Executing statement ${i + 1}/${statements.length}:`, statement.substring(0, 100) + '...');
        
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: statement })
        });

        const result = await response.json();

        if (!result.success) {
          console.error(`Statement ${i + 1} execution failed:`, {
            statement: statement,
            error: result.error,
            details: result.details
          });
          
          // If any statement fails, mark the whole query as failed
          setQueryResults(prev => ({
            ...prev,
            [queryId]: {
              success: false,
              error: `Statement ${i + 1} failed: ${result.error}`,
              executedAt: new Date().toISOString(),
              query: statements.join('; '),
              statementResults: allResults,
              failedStatement: i + 1,
              failedStatementText: statement
            }
          }));

          setExtractedQueries(prev => prev.map(q => 
            q.id === queryId 
              ? { ...q, status: 'error' }
              : q
          ));
          return;
        }

        // Store individual statement result
        allResults.push({
          statement: statement,
          data: result.data || [],
          rowCount: result.data ? result.data.length : 0,
          metadata: result.metadata
        });
        
        totalRows += (result.data ? result.data.length : 0);
      }

      // Combine results if multiple statements were successful
      let combinedData = [];
      let combinedMetadata = null;
      
      if (statements.length === 1) {
        // Single statement - use its data directly
        combinedData = allResults[0].data;
        combinedMetadata = allResults[0].metadata;
      } else {
        // Multiple statements - combine data or show summary
        combinedData = allResults.map((result, index) => ({
          statement_number: index + 1,
          statement: result.statement.substring(0, 100) + (result.statement.length > 100 ? '...' : ''),
          rows_returned: result.rowCount,
          first_row_sample: result.data.length > 0 ? JSON.stringify(result.data[0]) : 'No data'
        }));
      }

      setQueryResults(prev => ({
        ...prev,
        [queryId]: {
          success: true,
          data: combinedData,
          metadata: combinedMetadata,
          rowCount: statements.length === 1 ? totalRows : statements.length,
          executedAt: new Date().toISOString(),
          query: statements.join('; '),
          statementCount: statements.length,
          statementResults: allResults,
          totalRowsAffected: totalRows
        }
      }));

      setExtractedQueries(prev => prev.map(q => 
        q.id === queryId 
          ? { ...q, status: 'success' }
          : q
      ));

    } catch (error) {
      console.error('Network error during query execution:', error);
      
      setQueryResults(prev => ({
        ...prev,
        [queryId]: {
          success: false,
          error: 'Network error: ' + error.message,
          executedAt: new Date().toISOString(),
          query: statements.join('; ')
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

  // Execute custom query with validation
  const executeCustomQuery = async () => {
    if (!customQuery.trim()) return;

    const validationIssues = validateQuery(customQuery.trim());
    if (validationIssues.length > 0) {
      setQueryResults(prev => ({
        ...prev,
        ['custom_query']: {
          success: false,
          error: 'Query validation failed: ' + validationIssues.join(', '),
          validationIssues: validationIssues,
          executedAt: new Date().toISOString(),
          query: customQuery.trim()
        }
      }));
      return;
    }

    // Create a custom query object and let executeQuery handle multiple statements
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

  // Get cleaned query for preview
  const getCleanedQuery = (originalQuery) => {
    let cleaned = originalQuery.trim();
    if (cleaned.endsWith(';')) {
      cleaned = cleaned.slice(0, -1).trim();
    }
    return cleaned
      .replace(/[^\x20-\x7E\s]/g, '') // Remove non-printable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Split multiple SQL statements
  const splitSQLStatements = (sqlText) => {
    // Clean the input
    let cleaned = sqlText.trim()
      .replace(/[^\x20-\x7E\s]/g, '') // Remove non-printable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Split by semicolon, but be careful about semicolons in strings
    const statements = [];
    let currentStatement = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      const prevChar = i > 0 ? cleaned[i - 1] : '';
      
      if (char === "'" && prevChar !== '\\' && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && prevChar !== '\\' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      } else if (char === ';' && !inSingleQuote && !inDoubleQuote) {
        // Found a statement separator
        const statement = currentStatement.trim();
        if (statement && statement.toUpperCase().startsWith('SELECT')) {
          statements.push(statement);
        }
        currentStatement = '';
        continue;
      }
      
      currentStatement += char;
    }
    
    // Add the last statement if it exists
    const lastStatement = currentStatement.trim();
    if (lastStatement && lastStatement.toUpperCase().startsWith('SELECT')) {
      statements.push(lastStatement);
    }
    
    return statements.length > 0 ? statements : [cleaned];
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
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Database className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-white truncate">SQL Query Tester</h2>
                {analysisDocument && (
                  <span className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs font-medium rounded flex-shrink-0">
                    <span 
                      className="hidden sm:inline max-w-[120px] truncate" 
                      title={analysisDocument.name}
                    >
                      {analysisDocument.name}
                    </span>
                    <span className="sm:hidden">Analysis</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <button
                onClick={testConnection}
                disabled={isTestingConnection}
                className="flex items-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                title="Test database connection"
              >
                {isTestingConnection ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <Database className="w-3 h-3" />
                )}
                <span className="hidden md:inline">Test</span>
              </button>
              
              {connectionStatus && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  connectionStatus.success 
                    ? 'bg-green-900/30 text-green-300' 
                    : 'bg-red-900/30 text-red-300'
                }`}>
                  {getStatusIcon(connectionStatus.success ? 'success' : 'error')}
                  <span className="hidden sm:inline">
                    {connectionStatus.success ? 'Connected' : 'Failed'}
                  </span>
                </div>
              )}
            </div>

            {/* Export Button */}
            {Object.keys(queryResults).length > 0 && (
              <button
                onClick={exportResults}
                className="flex items-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg transition-colors"
                title="Export results"
              >
                <Download className="w-3 h-3" />
                <span className="hidden lg:inline">Export</span>
              </button>
            )}

            {/* Hide Panel Button */}
            {onToggleVisibility && (
              <button
                onClick={onToggleVisibility}
                className="flex items-center gap-1 px-2 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                title="Hide query testing panel"
              >
                <X className="w-3 h-3" />
                <span className="hidden xl:inline">Hide</span>
              </button>
            )}
          </div>
        </div>

        {/* Connection Error */}
        {connectionStatus && !connectionStatus.success && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-300 text-sm font-medium">Database Connection Failed</p>
            <div className="text-red-400 text-xs mt-1 break-words whitespace-pre-wrap">
              {connectionStatus.error}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 bg-gray-750 border-b border-gray-700">
        <div className="flex">
          <button
            onClick={() => setCurrentTab('extracted')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              currentTab === 'extracted'
                ? 'bg-gray-800 text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Extracted</span>
            <span className="sm:hidden">Queries</span>
            <span className="bg-gray-600 text-gray-300 px-1 py-0.5 rounded text-xs">
              {extractedQueries.length}
            </span>
          </button>
          <button
            onClick={() => setCurrentTab('custom')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              currentTab === 'custom'
                ? 'bg-gray-800 text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Custom</span>
            <span className="sm:hidden">SQL</span>
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
                <h3 className="text-lg font-medium text-gray-300 mb-2">No Valid SQL Queries Found</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                  No valid executable SQL queries were detected in the analysis document. 
                </p>
                <div className="text-xs text-gray-600 max-w-lg mx-auto text-left bg-gray-750 rounded p-3">
                  <p className="font-medium mb-2">Supported formats:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>```sql code blocks with complete SELECT statements</li>
                    <li>sql-- comment format followed by valid queries</li>
                    <li>Multi-line queries with proper FROM clauses</li>
                  </ul>
                  <p className="font-medium mt-3 mb-1">Requirements:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Complete SELECT list (no trailing commas)</li>
                    <li>Valid FROM clause for SELECT statements</li>
                    <li>Balanced parentheses and quotes</li>
                    <li>Proper Oracle SQL syntax</li>
                  </ul>
                </div>
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
                      <button className="text-gray-400 hover:text-white flex-shrink-0">
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
                          {query.patternName} • {query.query.length} chars
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {getStatusIcon(query.status, executingQueries.has(query.id))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
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
                        <span className="hidden sm:inline">Run</span>
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

                      {/* Validation Issues (if any) */}
                      {queryResults[query.id]?.validationIssues && (
                        <div>
                          <h5 className="text-sm font-medium text-yellow-300 mb-2">Validation Issues:</h5>
                          <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3">
                            <ul className="text-yellow-300 text-xs list-disc list-inside">
                              {queryResults[query.id].validationIssues.map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Results */}
                      {queryResults[query.id] && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Results:</h5>
                          {queryResults[query.id].success ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>
                                  {queryResults[query.id].statementCount > 1 
                                    ? `${queryResults[query.id].statementCount} statements executed • Total rows: ${queryResults[query.id].totalRowsAffected}`
                                    : `Rows returned: ${queryResults[query.id].rowCount}`
                                  }
                                </span>
                                <span>Executed: {new Date(queryResults[query.id].executedAt).toLocaleString()}</span>
                              </div>
                              
                              {/* Multiple Statements Summary */}
                              {queryResults[query.id].statementCount > 1 && queryResults[query.id].statementResults && (
                                <div className="space-y-2">
                                  <h6 className="text-xs font-medium text-blue-300 mb-2">Statement Results:</h6>
                                  {queryResults[query.id].statementResults.map((statementResult, idx) => (
                                    <div key={idx} className="bg-gray-750 border border-gray-600 rounded p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-300">Statement {idx + 1}</span>
                                        <span className="text-xs text-gray-400">{statementResult.rowCount} rows</span>
                                      </div>
                                      <pre className="text-xs text-gray-400 mb-2 font-mono">
                                        <code>{statementResult.statement}</code>
                                      </pre>
                                      
                                      {statementResult.data && statementResult.data.length > 0 && (
                                        <div className="bg-gray-800 border border-gray-600 rounded overflow-x-auto max-h-32">
                                          <table className="w-full text-xs">
                                            <thead className="bg-gray-750">
                                              <tr>
                                                {Object.keys(statementResult.data[0]).map((column) => (
                                                  <th key={column} className="px-2 py-1 text-left font-medium text-gray-300 border-b border-gray-600">
                                                    {column}
                                                  </th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {statementResult.data.slice(0, 3).map((row, rowIndex) => (
                                                <tr key={rowIndex} className="border-b border-gray-700 last:border-b-0">
                                                  {Object.values(row).map((value, colIndex) => (
                                                    <td key={colIndex} className="px-2 py-1 text-gray-300">
                                                      {value !== null ? String(value) : 'NULL'}
                                                    </td>
                                                  ))}
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                          {statementResult.data.length > 3 && (
                                            <div className="p-1 text-center text-xs text-gray-500 bg-gray-750">
                                              ... and {statementResult.data.length - 3} more rows
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Single Statement Result */}
                              {queryResults[query.id].statementCount === 1 && queryResults[query.id].data && queryResults[query.id].data.length > 0 && (
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
                              )}

                              {queryResults[query.id].data && queryResults[query.id].data.length === 0 && (
                                <div className="bg-gray-800 border border-gray-600 rounded p-4 text-center">
                                  <p className="text-gray-400 text-sm">No data returned</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-red-900/20 border border-red-800 rounded p-3">
                              <p className="text-red-300 text-sm font-medium">Query Failed</p>
                              <div className="text-red-400 text-xs mt-1 break-words whitespace-pre-wrap">
                                {queryResults[query.id].error}
                              </div>
                              {queryResults[query.id].failedStatement && (
                                <div className="mt-2">
                                  <p className="text-red-400 text-xs font-medium">Failed Statement {queryResults[query.id].failedStatement}:</p>
                                  <pre className="text-red-300 text-xs mt-1 font-mono break-words whitespace-pre-wrap">
                                    <code>{queryResults[query.id].failedStatementText}</code>
                                  </pre>
                                </div>
                              )}
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
                  placeholder="SELECT column1, column2 FROM your_table WHERE condition = 'value';"
                  className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg p-3 text-green-300 font-mono text-sm resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Query Validation Preview */}
                {customQuery.trim() && (
                  <div className="mt-2">
                    {(() => {
                      const issues = validateQuery(customQuery.trim());
                      return issues.length > 0 ? (
                        <div className="bg-yellow-900/20 border border-yellow-800 rounded p-2">
                          <p className="text-yellow-300 text-xs font-medium mb-1">Validation Issues:</p>
                          <ul className="text-yellow-400 text-xs list-disc list-inside">
                            {issues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-green-900/20 border border-green-800 rounded p-2">
                          <p className="text-green-300 text-xs">✓ Query appears to be valid</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Only SELECT queries are allowed for security reasons. Multiple statements separated by semicolons are supported.
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
                  
                  {/* Validation Issues for Custom Query */}
                  {queryResults['custom_query'].validationIssues && (
                    <div className="mb-4">
                      <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3">
                        <p className="text-yellow-300 text-sm font-medium mb-2">Validation Issues:</p>
                        <ul className="text-yellow-400 text-xs list-disc list-inside">
                          {queryResults['custom_query'].validationIssues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {queryResults['custom_query'].success ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>
                          {queryResults['custom_query'].statementCount > 1 
                            ? `${queryResults['custom_query'].statementCount} statements executed • Total rows: ${queryResults['custom_query'].totalRowsAffected}`
                            : `Rows returned: ${queryResults['custom_query'].rowCount}`
                          }
                        </span>
                        <span>Executed: {new Date(queryResults['custom_query'].executedAt).toLocaleString()}</span>
                      </div>
                      
                      {/* Multiple Statements Summary */}
                      {queryResults['custom_query'].statementCount > 1 && queryResults['custom_query'].statementResults && (
                        <div className="space-y-2">
                          <h6 className="text-xs font-medium text-blue-300 mb-2">Statement Results:</h6>
                          {queryResults['custom_query'].statementResults.map((statementResult, idx) => (
                            <div key={idx} className="bg-gray-750 border border-gray-600 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-300">Statement {idx + 1}</span>
                                <span className="text-xs text-gray-400">{statementResult.rowCount} rows</span>
                              </div>
                              <pre className="text-xs text-gray-400 mb-2 font-mono">
                                <code>{statementResult.statement}</code>
                              </pre>
                              
                              {statementResult.data && statementResult.data.length > 0 && (
                                <div className="bg-gray-800 border border-gray-600 rounded overflow-x-auto max-h-32">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-750">
                                      <tr>
                                        {Object.keys(statementResult.data[0]).map((column) => (
                                          <th key={column} className="px-2 py-1 text-left font-medium text-gray-300 border-b border-gray-600">
                                            {column}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {statementResult.data.slice(0, 5).map((row, rowIndex) => (
                                        <tr key={rowIndex} className="border-b border-gray-700 last:border-b-0">
                                          {Object.values(row).map((value, colIndex) => (
                                            <td key={colIndex} className="px-2 py-1 text-gray-300">
                                              {value !== null ? String(value) : 'NULL'}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {statementResult.data.length > 5 && (
                                    <div className="p-1 text-center text-xs text-gray-500 bg-gray-750">
                                      ... and {statementResult.data.length - 5} more rows
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Single Statement Result */}
                      {queryResults['custom_query'].statementCount === 1 && queryResults['custom_query'].data && queryResults['custom_query'].data.length > 0 && (
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
                      )}

                      {queryResults['custom_query'].data && queryResults['custom_query'].data.length === 0 && (
                        <div className="bg-gray-800 border border-gray-600 rounded p-4 text-center">
                          <p className="text-gray-400 text-sm">No data returned</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-800 rounded p-4">
                      <p className="text-red-300 text-sm font-medium">Query Failed</p>
                      <div className="text-red-400 text-xs mt-2 break-words whitespace-pre-wrap">
                        {queryResults['custom_query'].error}
                      </div>
                      {queryResults['custom_query'].failedStatement && (
                        <div className="mt-2">
                          <p className="text-red-400 text-xs font-medium">Failed Statement {queryResults['custom_query'].failedStatement}:</p>
                          <pre className="text-red-300 text-xs mt-1 font-mono break-words whitespace-pre-wrap">
                            <code>{queryResults['custom_query'].failedStatementText}</code>
                          </pre>
                        </div>
                      )}
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