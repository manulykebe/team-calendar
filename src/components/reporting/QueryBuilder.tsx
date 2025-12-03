import React, { useState } from 'react';
import { Save, Play, AlertCircle } from 'lucide-react';
import { QueryFormData, QueryParameter } from '../../types/reporting';

interface QueryBuilderProps {
  onExecute: (sql: string, parameters: Record<string, any>) => void;
  onSave: (query: QueryFormData) => void;
  isExecuting: boolean;
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({ onExecute, onSave, isExecuting }) => {
  const [sql, setSql] = useState('');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [queryCategory, setQueryCategory] = useState('general');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = () => {
    if (!sql.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setError(null);
    onExecute(sql, parameters);
  };

  const handleSave = () => {
    if (!queryName.trim()) {
      setError('Please enter a query name');
      return;
    }

    if (!sql.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setError(null);
    onSave({
      name: queryName,
      description: queryDescription,
      sql_query: sql,
      parameters: [],
      is_public: isPublic,
      category: queryCategory
    });

    setShowSaveModal(false);
    setQueryName('');
    setQueryDescription('');
    setQueryCategory('general');
    setIsPublic(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Query Builder</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={!sql.trim() || isExecuting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={16} />
            Save Query
          </button>
          <button
            onClick={handleExecute}
            disabled={!sql.trim() || isExecuting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play size={16} />
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          SQL Query
        </label>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="SELECT * FROM table_name WHERE condition"
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-500">
          Only SELECT queries are allowed. Write your SQL query above.
        </p>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Save Query</h3>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Query Name*
              </label>
              <input
                type="text"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Custom Query"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={queryDescription}
                onChange={(e) => setQueryDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this query does..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={queryCategory}
                onChange={(e) => setQueryCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="users">Users</option>
                <option value="analytics">Analytics</option>
                <option value="audit">Audit</option>
                <option value="reports">Reports</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this query available to all users
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
