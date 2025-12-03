import { API_URL } from './config';
import { SavedQuery, PredefinedQuery, QueryExecution, QueryResult, QueryFormData } from '../../types/reporting';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const reportingApi = {
  // Saved queries
  getSavedQueries: async (): Promise<SavedQuery[]> => {
    const response = await fetch(`${API_URL}/reporting/saved-queries`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch saved queries');
    }
    return response.json();
  },

  createSavedQuery: async (query: QueryFormData): Promise<SavedQuery> => {
    const response = await fetch(`${API_URL}/reporting/saved-queries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(query)
    });
    if (!response.ok) {
      throw new Error('Failed to create query');
    }
    return response.json();
  },

  updateSavedQuery: async (id: string, updates: Partial<QueryFormData>): Promise<SavedQuery> => {
    const response = await fetch(`${API_URL}/reporting/saved-queries/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error('Failed to update query');
    }
    return response.json();
  },

  deleteSavedQuery: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/reporting/saved-queries/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to delete query');
    }
  },

  // Predefined queries
  getPredefinedQueries: async (): Promise<PredefinedQuery[]> => {
    const response = await fetch(`${API_URL}/reporting/predefined-queries`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch predefined queries');
    }
    return response.json();
  },

  // Execute queries
  executeSavedQuery: async (id: string, parameters: Record<string, any>): Promise<QueryResult> => {
    const response = await fetch(`${API_URL}/reporting/execute/saved/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ parameters })
    });
    if (!response.ok) {
      throw new Error('Failed to execute query');
    }
    return response.json();
  },

  executePredefinedQuery: async (id: string, parameters: Record<string, any>): Promise<QueryResult> => {
    const response = await fetch(`${API_URL}/reporting/execute/predefined/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ parameters })
    });
    if (!response.ok) {
      throw new Error('Failed to execute query');
    }
    return response.json();
  },

  executeCustomQuery: async (sql_query: string, parameters: Record<string, any>): Promise<QueryResult> => {
    const response = await fetch(`${API_URL}/reporting/execute/custom`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sql_query, parameters })
    });
    if (!response.ok) {
      throw new Error('Failed to execute query');
    }
    return response.json();
  },

  // Execution history
  getExecutionHistory: async (limit?: number): Promise<QueryExecution[]> => {
    const url = limit
      ? `${API_URL}/reporting/execution-history?limit=${limit}`
      : `${API_URL}/reporting/execution-history`;

    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch execution history');
    }
    return response.json();
  },

  // Export
  exportCSV: async (data: any[]): Promise<Blob> => {
    const response = await fetch(`${API_URL}/reporting/export/csv`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ data })
    });
    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }
    return response.blob();
  },

  exportJSON: async (data: any[]): Promise<Blob> => {
    const response = await fetch(`${API_URL}/reporting/export/json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ data })
    });
    if (!response.ok) {
      throw new Error('Failed to export JSON');
    }
    return response.blob();
  },

  // Cache management
  clearCache: async (): Promise<void> => {
    const response = await fetch(`${API_URL}/reporting/cache/clear`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to clear cache');
    }
  }
};
