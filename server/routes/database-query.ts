import { Router } from 'express';
import Database from 'better-sqlite3';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const dbPath = path.join(__dirname, '..', 'db', 'media.db');

const queryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many queries from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

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

function sanitizeQuery(query: string): { valid: boolean; error?: string } {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { valid: false, error: 'Query cannot be empty' };
  }

  if (trimmedQuery.length > 50000) {
    return { valid: false, error: 'Query is too long (maximum 50,000 characters)' };
  }

  const dangerousPatterns = [
    /ATTACH\s+DATABASE/i,
    /PRAGMA\s+(?!table_info|database_list|foreign_keys|index_list|table_list)/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedQuery)) {
      return { valid: false, error: 'Query contains potentially dangerous operations' };
    }
  }

  return { valid: true };
}

function detectQueryType(query: string): string {
  const trimmed = query.trim().toUpperCase();

  if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
    return 'SELECT';
  } else if (trimmed.startsWith('INSERT')) {
    return 'INSERT';
  } else if (trimmed.startsWith('UPDATE')) {
    return 'UPDATE';
  } else if (trimmed.startsWith('DELETE')) {
    return 'DELETE';
  } else if (trimmed.startsWith('CREATE')) {
    return 'CREATE';
  } else if (trimmed.startsWith('DROP')) {
    return 'DROP';
  } else if (trimmed.startsWith('ALTER')) {
    return 'ALTER';
  } else if (trimmed.startsWith('PRAGMA')) {
    return 'PRAGMA';
  }

  return 'OTHER';
}

router.post('/query', queryLimiter, (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Query parameter is required and must be a string',
    } as QueryResult);
  }

  const validation = sanitizeQuery(query);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error,
    } as QueryResult);
  }

  let db: Database.Database | null = null;

  try {
    db = new Database(dbPath, { readonly: false, fileMustExist: true });
    db.pragma('busy_timeout = 5000');

    const startTime = Date.now();
    const queryType = detectQueryType(query);

    let result: QueryResult;

    if (queryType === 'SELECT' || queryType === 'PRAGMA') {
      const stmt = db.prepare(query);
      const rows = stmt.all() as any[];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      result = {
        success: true,
        data: rows,
        columns,
        rowCount: rows.length,
        executionTime: Date.now() - startTime,
        queryType,
      };
    } else if (['INSERT', 'UPDATE', 'DELETE'].includes(queryType)) {
      const stmt = db.prepare(query);
      const info = stmt.run();

      result = {
        success: true,
        affectedRows: info.changes,
        executionTime: Date.now() - startTime,
        queryType,
      };
    } else {
      db.exec(query);

      result = {
        success: true,
        executionTime: Date.now() - startTime,
        queryType,
      };
    }

    return res.json(result);

  } catch (error: any) {
    console.error('Database query error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while executing the query',
    } as QueryResult);

  } finally {
    if (db) {
      try {
        db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
});

router.get('/schema', queryLimiter, (req, res) => {
  let db: Database.Database | null = null;

  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all() as { name: string }[];

    const schema: any = {};

    for (const table of tables) {
      const tableInfo = db.prepare(`PRAGMA table_info(${table.name})`).all();
      schema[table.name] = tableInfo;
    }

    return res.json({
      success: true,
      tables: tables.map(t => t.name),
      schema,
    });

  } catch (error: any) {
    console.error('Schema fetch error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while fetching the schema',
    });

  } finally {
    if (db) {
      try {
        db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
});

export default router;
