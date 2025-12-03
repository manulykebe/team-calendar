import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { QueryExecution } from '../../types/reporting';

interface ExecutionHistoryProps {
  executions: QueryExecution[];
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({ executions }) => {
  if (!executions || executions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Execution History</h2>
        <div className="text-center py-8 text-gray-500">
          No execution history available
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Execution History</h2>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {executions.map(execution => (
          <div
            key={execution.id}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {execution.status === 'success' ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <XCircle size={16} className="text-red-600" />
                  )}
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {execution.query_type}
                  </span>
                  <span className="text-sm text-gray-600">
                    {execution.row_count} rows
                  </span>
                  <span className="text-sm text-gray-600">
                    {execution.execution_time_ms}ms
                  </span>
                </div>

                <div className="mt-2 text-xs font-mono text-gray-700 bg-gray-50 p-2 rounded max-w-full overflow-x-auto">
                  {execution.sql_query}
                </div>

                {execution.error_message && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    {execution.error_message}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>{formatDate(execution.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
