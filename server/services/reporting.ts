import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface QueryParameter {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  label: string;
  required: boolean;
  defaultValue?: any;
}

interface SavedQuery {
  id?: string;
  name: string;
  description: string;
  sql_query: string;
  parameters: QueryParameter[];
  created_by: string;
  site: string;
  is_public: boolean;
  category: string;
}

interface QueryExecution {
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
}

export class ReportingService {
  // Validate SQL query for safety
  static validateSQL(sql: string): { valid: boolean; error?: string } {
    const normalized = sql.toLowerCase().trim();

    // Block dangerous operations
    const dangerousPatterns = [
      /\b(drop|truncate|delete|insert|update)\b/i,
      /\b(grant|revoke|alter)\b/i,
      /\b(create|exec|execute)\b/i,
      /;.*select/i, // Multiple statements
      /--/,         // SQL comments
      /\/\*/,       // Block comments
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(normalized)) {
        return {
          valid: false,
          error: 'Query contains forbidden operations. Only SELECT queries are allowed.'
        };
      }
    }

    // Must start with SELECT
    if (!normalized.startsWith('select')) {
      return {
        valid: false,
        error: 'Query must start with SELECT'
      };
    }

    return { valid: true };
  }

  // Generate cache key for query + parameters
  static generateCacheKey(sql: string, parameters: Record<string, any>): string {
    const content = JSON.stringify({ sql, parameters });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Execute SQL query with safety checks
  static async executeQuery(
    sql: string,
    parameters: Record<string, any> = {},
    userId: string,
    site: string,
    queryId?: string,
    queryType: 'saved' | 'predefined' | 'custom' = 'custom',
    useCache: boolean = true
  ): Promise<{ success: boolean; data?: any[]; error?: string; executionTime?: number }> {
    const startTime = Date.now();

    try {
      // Validate SQL
      const validation = this.validateSQL(sql);
      if (!validation.valid) {
        await this.logExecution({
          query_id: queryId,
          query_type: queryType,
          executed_by: userId,
          site,
          sql_query: sql,
          parameters,
          row_count: 0,
          execution_time_ms: Date.now() - startTime,
          status: 'error',
          error_message: validation.error
        });

        return { success: false, error: validation.error };
      }

      // Check cache first
      if (useCache) {
        const cacheKey = this.generateCacheKey(sql, parameters);
        const cached = await this.getCachedResult(cacheKey, site);
        if (cached) {
          return {
            success: true,
            data: cached.results,
            executionTime: Date.now() - startTime
          };
        }
      }

      // Replace parameters in SQL
      let processedSQL = sql;
      Object.entries(parameters).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\$${key}\\b`, 'g');
        const safeValue = typeof value === 'string'
          ? `'${value.replace(/'/g, "''")}'`
          : value;
        processedSQL = processedSQL.replace(placeholder, String(safeValue));
      });

      // Execute query (note: this is a simplified version - in production you'd want
      // to execute against your actual data tables)
      const { data, error } = await supabase.rpc('execute_readonly_query', {
        query_sql: processedSQL
      });

      const executionTime = Date.now() - startTime;

      if (error) {
        await this.logExecution({
          query_id: queryId,
          query_type: queryType,
          executed_by: userId,
          site,
          sql_query: sql,
          parameters,
          row_count: 0,
          execution_time_ms: executionTime,
          status: 'error',
          error_message: error.message
        });

        return { success: false, error: error.message, executionTime };
      }

      // Cache result
      if (useCache && data) {
        await this.cacheResult(
          this.generateCacheKey(sql, parameters),
          queryId,
          data,
          site
        );
      }

      // Log successful execution
      await this.logExecution({
        query_id: queryId,
        query_type: queryType,
        executed_by: userId,
        site,
        sql_query: sql,
        parameters,
        row_count: data?.length || 0,
        execution_time_ms: executionTime,
        status: 'success'
      });

      return { success: true, data: data || [], executionTime };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      await this.logExecution({
        query_id: queryId,
        query_type: queryType,
        executed_by: userId,
        site,
        sql_query: sql,
        parameters,
        row_count: 0,
        execution_time_ms: executionTime,
        status: 'error',
        error_message: error.message
      });

      return { success: false, error: error.message, executionTime };
    }
  }

  // Save a new query
  static async saveQuery(query: SavedQuery): Promise<{ success: boolean; data?: any; error?: string }> {
    const validation = this.validateSQL(query.sql_query);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { data, error } = await supabase
      .from('saved_queries')
      .insert({
        name: query.name,
        description: query.description,
        sql_query: query.sql_query,
        parameters: query.parameters,
        created_by: query.created_by,
        site: query.site,
        is_public: query.is_public,
        category: query.category
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  // Get saved queries
  static async getSavedQueries(
    site: string,
    userId: string,
    isAdmin: boolean
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    let query = supabase
      .from('saved_queries')
      .select('*')
      .eq('site', site)
      .order('created_at', { ascending: false });

    // Non-admins can only see public queries or their own
    if (!isAdmin) {
      query = query.or(`is_public.eq.true,created_by.eq.${userId}`);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  }

  // Get predefined queries
  static async getPredefinedQueries(site: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const { data, error } = await supabase
      .from('predefined_queries')
      .select('*')
      .eq('site', site)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  }

  // Update saved query
  static async updateQuery(
    id: string,
    updates: Partial<SavedQuery>,
    userId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (updates.sql_query) {
      const validation = this.validateSQL(updates.sql_query);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    const { data, error } = await supabase
      .from('saved_queries')
      .update(updates)
      .eq('id', id)
      .eq('created_by', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  // Delete saved query
  static async deleteQuery(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('saved_queries')
      .delete()
      .eq('id', id)
      .eq('created_by', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // Get query execution history
  static async getExecutionHistory(
    site: string,
    userId: string,
    isAdmin: boolean,
    limit: number = 50
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    let query = supabase
      .from('query_executions')
      .select('*')
      .eq('site', site)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Non-admins can only see their own history
    if (!isAdmin) {
      query = query.eq('executed_by', userId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  }

  // Log query execution
  private static async logExecution(execution: QueryExecution): Promise<void> {
    await supabase.from('query_executions').insert(execution);
  }

  // Cache query result
  private static async cacheResult(
    cacheKey: string,
    queryId: string | undefined,
    results: any[],
    site: string
  ): Promise<void> {
    await supabase.from('query_results_cache').upsert({
      query_hash: cacheKey,
      query_id: queryId,
      results,
      row_count: results.length,
      site,
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
    }, {
      onConflict: 'query_hash'
    });
  }

  // Get cached result
  private static async getCachedResult(
    cacheKey: string,
    site: string
  ): Promise<any | null> {
    const { data, error } = await supabase
      .from('query_results_cache')
      .select('*')
      .eq('query_hash', cacheKey)
      .eq('site', site)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  }

  // Clear expired cache entries
  static async clearExpiredCache(): Promise<void> {
    await supabase
      .from('query_results_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
  }
}
