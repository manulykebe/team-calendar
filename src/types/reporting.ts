export interface QueryParameter {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  label: string;
  required: boolean;
  defaultValue?: any;
}

export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  sql_query: string;
  parameters: QueryParameter[];
  created_by: string;
  site: string;
  is_public: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface PredefinedQuery {
  id: string;
  name: string;
  description: string;
  sql_query: string;
  parameters: QueryParameter[];
  category: string;
  site: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QueryExecution {
  id: string;
  query_id?: string;
  query_type: 'saved' | 'predefined' | 'custom';
  executed_by: string;
  site: string;
  sql_query: string;
  parameters: Record<string, any>;
  row_count: number;
  execution_time_ms: number;
  status: 'success' | 'error';
  error_message?: string;
  created_at: string;
}

export interface QueryResult {
  data: any[];
  executionTime: number;
  rowCount: number;
}

export interface QueryFormData {
  name: string;
  description: string;
  sql_query: string;
  parameters: QueryParameter[];
  is_public: boolean;
  category: string;
}
