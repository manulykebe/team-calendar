import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportingApi } from '../../lib/api/reporting';
import { QueryBuilder } from './QueryBuilder';
import { QueryLibrary } from './QueryLibrary';
import { QueryResults } from './QueryResults';
import { ExecutionHistory } from './ExecutionHistory';
import { SavedQuery, PredefinedQuery, QueryExecution, QueryFormData } from '../../types/reporting';
import { AlertCircle, BarChart3, History, Library, Code } from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'library' | 'builder' | 'history';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [predefinedQueries, setPredefinedQueries] = useState<PredefinedQuery[]>([]);
  const [executions, setExecutions] = useState<QueryExecution[]>([]);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [executionTime, setExecutionTime] = useState<number | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [savedQueriesData, predefinedQueriesData, executionHistory] = await Promise.all([
        reportingApi.getSavedQueries(),
        reportingApi.getPredefinedQueries(),
        reportingApi.getExecutionHistory(50)
      ]);

      setSavedQueries(savedQueriesData);
      setPredefinedQueries(predefinedQueriesData);
      setExecutions(executionHistory);
    } catch (err: any) {
      console.error('Error loading reporting data:', err);
      setError(err.message || 'Failed to load reporting data');
      toast.error('Failed to load reporting data');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCustomQuery = async (sql: string, parameters: Record<string, any>) => {
    if (!isAdmin) {
      toast.error('Only admins can execute custom queries');
      return;
    }

    try {
      setIsExecuting(true);
      setError(null);

      const result = await reportingApi.executeCustomQuery(sql, parameters);
      setQueryResults(result.data);
      setExecutionTime(result.executionTime);

      toast.success(`Query executed successfully (${result.rowCount} rows)`);

      await reportingApi.getExecutionHistory(50).then(setExecutions);
    } catch (err: any) {
      console.error('Error executing custom query:', err);
      setError(err.message || 'Failed to execute query');
      toast.error(err.message || 'Failed to execute query');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteQuery = async (query: SavedQuery | PredefinedQuery) => {
    try {
      setIsExecuting(true);
      setError(null);

      const isSaved = 'created_by' in query;
      const result = isSaved
        ? await reportingApi.executeSavedQuery(query.id, {})
        : await reportingApi.executePredefinedQuery(query.id, {});

      setQueryResults(result.data);
      setExecutionTime(result.executionTime);

      toast.success(`Query executed successfully (${result.rowCount} rows)`);

      await reportingApi.getExecutionHistory(50).then(setExecutions);
    } catch (err: any) {
      console.error('Error executing query:', err);
      setError(err.message || 'Failed to execute query');
      toast.error(err.message || 'Failed to execute query');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveQuery = async (query: QueryFormData) => {
    try {
      await reportingApi.createSavedQuery(query);
      toast.success('Query saved successfully');

      const updatedQueries = await reportingApi.getSavedQueries();
      setSavedQueries(updatedQueries);
    } catch (err: any) {
      console.error('Error saving query:', err);
      toast.error(err.message || 'Failed to save query');
    }
  };

  const handleDeleteQuery = async (id: string) => {
    if (!confirm('Are you sure you want to delete this query?')) {
      return;
    }

    try {
      await reportingApi.deleteSavedQuery(id);
      toast.success('Query deleted successfully');

      setSavedQueries(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      console.error('Error deleting query:', err);
      toast.error(err.message || 'Failed to delete query');
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!queryResults) {
      toast.error('No results to export');
      return;
    }

    try {
      const blob = format === 'csv'
        ? await reportingApi.exportCSV(queryResults)
        : await reportingApi.exportJSON(queryResults);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      console.error('Error exporting:', err);
      toast.error(err.message || 'Failed to export');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reporting system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Reporting Dashboard</h1>
          </div>
          <p className="text-gray-600">
            {isAdmin
              ? 'Execute custom queries, manage saved queries, and view execution history'
              : 'Execute predefined queries and view results'}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 flex items-center gap-2 font-medium transition-colors ${
              activeTab === 'library'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Library size={18} />
            Query Library
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-2 flex items-center gap-2 font-medium transition-colors ${
                activeTab === 'builder'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code size={18} />
              Query Builder
            </button>
          )}

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 flex items-center gap-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History size={18} />
            Execution History
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {activeTab === 'library' && (
              <QueryLibrary
                savedQueries={savedQueries}
                predefinedQueries={predefinedQueries}
                onExecute={handleExecuteQuery}
                onDelete={isAdmin ? handleDeleteQuery : undefined}
                isAdmin={isAdmin}
                currentUserId={user?.id || ''}
              />
            )}

            {activeTab === 'builder' && isAdmin && (
              <QueryBuilder
                onExecute={handleExecuteCustomQuery}
                onSave={handleSaveQuery}
                isExecuting={isExecuting}
              />
            )}

            {activeTab === 'history' && (
              <ExecutionHistory executions={executions} />
            )}
          </div>

          <div>
            <QueryResults
              data={queryResults || []}
              executionTime={executionTime}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
