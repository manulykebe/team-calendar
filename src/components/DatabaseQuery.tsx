import React, { useState, useEffect, useRef } from 'react';
import { Database, Play, Download, Clock, AlertCircle, CheckCircle, Table, Trash2, Copy } from 'lucide-react';

interface QueryResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowCount?: number;
  affectedRows?: number;
  executionTime?: number;
  error?: string;
  queryType?: string;
}

interface QueryHistory {
  query: string;
  timestamp: number;
  success: boolean;
}

const SAMPLE_QUERIES = [
  {
    label: 'List all tables',
    query: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
  },
  {
    label: 'Show table structure',
    query: "PRAGMA table_info(table_name);"
  },
  {
    label: 'Select first 10 rows',
    query: "SELECT * FROM table_name LIMIT 10;"
  },
  {
    label: 'Count all rows',
    query: "SELECT COUNT(*) as total FROM table_name;"
  },
  {
    label: 'Get database info',
    query: "PRAGMA database_list;"
  }
];

export default function DatabaseQuery() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [schema, setSchema] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('queryHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const response = await fetch('/api/db/schema');
      const data = await response.json();
      if (data.success) {
        setSchema(data);
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/db/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data: QueryResult = await response.json();
      setResult(data);

      const newHistory: QueryHistory = {
        query,
        timestamp: Date.now(),
        success: data.success,
      };

      const updatedHistory = [newHistory, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('queryHistory', JSON.stringify(updatedHistory));

    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Network error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  const loadQueryFromHistory = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
    textareaRef.current?.focus();
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('queryHistory');
  };

  const exportToCSV = () => {
    if (!result?.data || result.data.length === 0) return;

    const headers = result.columns || Object.keys(result.data[0]);
    const csvContent = [
      headers.join(','),
      ...result.data.map(row =>
        headers.map(header => {
          const value = row[header];
          const stringValue = value === null ? '' : String(value);
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-result-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (!result?.data) return;

    const json = JSON.stringify(result.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">SQLite Database Query Interface</h1>
                <p className="text-blue-100 text-sm mt-1">Connected to media.db</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      SQL Query
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        {showHistory ? 'Hide History' : 'Show History'}
                      </button>
                      <select
                        onChange={(e) => setQuery(e.target.value)}
                        value=""
                        className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <option value="">Sample Queries</option>
                        {SAMPLE_QUERIES.map((sample, idx) => (
                          <option key={idx} value={sample.query}>
                            {sample.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your SQL query here... (Ctrl+Enter to execute)"
                    className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none transition-all"
                    spellCheck={false}
                  />

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-500">
                      Press Ctrl+Enter to execute
                    </p>
                    <button
                      onClick={executeQuery}
                      disabled={loading || !query.trim()}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          <span>Executing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          <span>Execute Query</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {showHistory && history.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-700 flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Query History</span>
                      </h3>
                      <button
                        onClick={clearHistory}
                        className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {history.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => loadQueryFromHistory(item.query)}
                          className="p-3 bg-white rounded border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-start justify-between">
                            <code className="text-xs text-gray-600 flex-1 break-all">
                              {item.query.length > 100
                                ? item.query.substring(0, 100) + '...'
                                : item.query}
                            </code>
                            <div className="flex items-center space-x-2 ml-2">
                              {item.success ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result && (
                  <div className="bg-white rounded-lg border-2 border-gray-200">
                    <div className={`px-6 py-4 border-b ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {result.success ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-semibold text-green-800">Query Successful</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <span className="font-semibold text-red-800">Query Failed</span>
                            </>
                          )}
                        </div>

                        {result.success && result.data && result.data.length > 0 && (
                          <div className="flex space-x-2">
                            <button
                              onClick={exportToCSV}
                              className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 transition-colors flex items-center space-x-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>CSV</span>
                            </button>
                            <button
                              onClick={exportToJSON}
                              className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 transition-colors flex items-center space-x-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>JSON</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {result.success && (
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          {result.rowCount !== undefined && (
                            <span>Rows: {result.rowCount}</span>
                          )}
                          {result.affectedRows !== undefined && (
                            <span>Affected: {result.affectedRows}</span>
                          )}
                          {result.executionTime !== undefined && (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{result.executionTime}ms</span>
                            </span>
                          )}
                          {result.queryType && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {result.queryType}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {result.error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-800 font-mono text-sm">{result.error}</p>
                        </div>
                      ) : result.data && result.data.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {result.columns?.map((column, idx) => (
                                  <th
                                    key={idx}
                                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300"
                                  >
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {result.data.map((row, rowIdx) => (
                                <tr
                                  key={rowIdx}
                                  className={rowIdx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}
                                >
                                  {result.columns?.map((column, colIdx) => (
                                    <td
                                      key={colIdx}
                                      className="px-4 py-3 text-sm text-gray-900 font-mono whitespace-nowrap"
                                    >
                                      {row[column] === null ? (
                                        <span className="text-gray-400 italic">NULL</span>
                                      ) : (
                                        String(row[column])
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {result.rowCount && result.rowCount > 100 && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                              Showing {result.rowCount} rows. Consider using LIMIT for better performance with large result sets.
                            </div>
                          )}
                        </div>
                      ) : result.success ? (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                          <p className="font-medium">Query executed successfully</p>
                          <p className="text-sm mt-1">No data to display</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 sticky top-6">
                  <h3 className="font-semibold text-gray-700 flex items-center space-x-2 mb-4">
                    <Table className="w-5 h-5" />
                    <span>Database Schema</span>
                  </h3>

                  {schema?.tables && schema.tables.length > 0 ? (
                    <div className="space-y-2">
                      {schema.tables.map((table: string, idx: number) => (
                        <div key={idx} className="bg-white rounded p-3 border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-gray-700">{table}</span>
                            <button
                              onClick={() => {
                                setQuery(`SELECT * FROM ${table} LIMIT 10;`);
                                textareaRef.current?.focus();
                              }}
                              className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                            >
                              Query
                            </button>
                          </div>
                          {schema.schema[table] && (
                            <div className="mt-2 text-xs text-gray-500 space-y-1">
                              {schema.schema[table].slice(0, 5).map((col: any, colIdx: number) => (
                                <div key={colIdx} className="flex items-center space-x-1">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                                  <span className="font-mono">{col.name}</span>
                                  <span className="text-gray-400">({col.type})</span>
                                </div>
                              ))}
                              {schema.schema[table].length > 5 && (
                                <div className="text-gray-400 italic">
                                  +{schema.schema[table].length - 5} more...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Loading schema...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-3">Quick Tips</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Use <code className="bg-gray-100 px-2 py-0.5 rounded">Ctrl+Enter</code> to execute queries quickly</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Click on table names in the schema panel to quickly query them</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Export results to CSV or JSON format using the export buttons</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Your last 10 queries are saved in history for quick access</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
