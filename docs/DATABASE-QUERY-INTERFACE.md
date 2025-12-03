# SQLite Database Query Interface

A comprehensive web-based interface for querying and managing the SQLite database (`media.db`).

## Features

### Backend API
- **Express.js REST API** with POST `/api/db/query` endpoint
- **Query execution** with support for SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, and PRAGMA statements
- **Comprehensive error handling** for database connection failures, invalid SQL syntax, and permission errors
- **Security measures**:
  - Input sanitization and validation
  - Query timeout protection
  - Rate limiting (100 requests per minute per IP)
  - Dangerous operation blocking (ATTACH DATABASE, unsafe PRAGMA commands)
- **Performance monitoring** with execution time tracking
- **Schema inspection** via GET `/api/db/schema` endpoint

### Frontend Interface
- **Dual access methods**:
  - React component integrated into the main app at `/database`
  - Standalone HTML page at `/database-query.html`
- **Modern, responsive design** with gradient backgrounds and smooth transitions
- **Query input** with:
  - Large textarea with monospace font
  - Syntax-aware input
  - Keyboard shortcut support (Ctrl+Enter to execute)
  - Sample query dropdown
- **Results display**:
  - Clean, formatted HTML tables
  - Alternating row colors
  - NULL value highlighting
  - Execution metadata (row count, execution time, query type)
- **Query history**:
  - Last 10 queries saved in localStorage
  - Success/failure indicators
  - One-click query reload
  - Clear history option
- **Database schema panel**:
  - Live table list
  - Column information preview
  - Quick query buttons for each table
- **Export functionality**:
  - CSV export with proper escaping
  - JSON export with formatting
- **Error handling**:
  - Clear error messages
  - Visual error indicators
  - Network error detection

## Setup Instructions

### Prerequisites
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher

### Installation

The required dependencies have been installed:
```bash
npm install better-sqlite3 express-rate-limit
```

### Configuration

The database path is automatically configured to:
```
server/db/media.db
```

No additional configuration is needed. The interface will automatically connect to this database.

## Usage

### Starting the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

### Accessing the Interface

#### Option 1: React Component (Recommended)
1. Log in to the application
2. Navigate to: `http://localhost:5173/database`
3. Start querying

#### Option 2: Standalone HTML
1. Open: `http://localhost:3000/database-query.html`
2. Start querying immediately

### API Endpoints

#### Execute Query
```
POST /api/db/query
Content-Type: application/json

{
  "query": "SELECT * FROM table_name LIMIT 10;"
}
```

Response (Success):
```json
{
  "success": true,
  "data": [...],
  "columns": ["col1", "col2"],
  "rowCount": 10,
  "executionTime": 5,
  "queryType": "SELECT"
}
```

Response (Error):
```json
{
  "success": false,
  "error": "Error message here"
}
```

#### Get Schema
```
GET /api/db/schema
```

Response:
```json
{
  "success": true,
  "tables": ["table1", "table2"],
  "schema": {
    "table1": [
      { "name": "id", "type": "INTEGER", "pk": 1 },
      { "name": "name", "type": "TEXT", "pk": 0 }
    ]
  }
}
```

## Security Features

### Input Validation
- Query length limited to 50,000 characters
- Empty queries rejected
- String type validation

### Dangerous Operation Blocking
- ATTACH DATABASE commands blocked
- Unsafe PRAGMA commands blocked
- Configurable pattern-based filtering

### Rate Limiting
- 100 requests per minute per IP address
- Automatic cleanup of expired entries
- Standard headers included in responses

### Database Connection Security
- Read/write access controlled
- Busy timeout set to 5 seconds
- Proper connection cleanup
- Error handling for all operations

## Sample Queries

### List All Tables
```sql
SELECT name FROM sqlite_master
WHERE type='table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;
```

### Show Table Structure
```sql
PRAGMA table_info(table_name);
```

### Select Data with Limit
```sql
SELECT * FROM table_name LIMIT 10;
```

### Count Rows
```sql
SELECT COUNT(*) as total FROM table_name;
```

### Database Information
```sql
PRAGMA database_list;
```

### Foreign Keys
```sql
PRAGMA foreign_key_list(table_name);
```

### Indexes
```sql
PRAGMA index_list(table_name);
```

## Keyboard Shortcuts

- **Ctrl+Enter** (or Cmd+Enter on Mac): Execute current query
- **Tab**: Insert spaces in textarea
- Standard text editing shortcuts (Ctrl+A, Ctrl+C, Ctrl+V, etc.)

## Export Options

### CSV Export
- Automatic header row generation
- Proper comma escaping for values containing commas
- NULL values exported as empty strings
- Filename: `query-result-{timestamp}.csv`

### JSON Export
- Pretty-printed with 2-space indentation
- Array of objects format
- NULL values preserved as JSON null
- Filename: `query-result-{timestamp}.json`

## Error Handling

### Common Errors

**Empty Query**
```
Query cannot be empty
```

**Query Too Long**
```
Query is too long (maximum 50,000 characters)
```

**Dangerous Operation**
```
Query contains potentially dangerous operations
```

**Syntax Error**
```
SQLITE_ERROR: near "SELCT": syntax error
```

**Table Not Found**
```
SQLITE_ERROR: no such table: table_name
```

**Rate Limit Exceeded**
```
Too many queries from this IP, please try again after a minute
```

## Performance Considerations

### Large Result Sets
- Tables with 100+ rows show a warning message
- Consider using LIMIT clauses for better performance
- Pagination recommended for production use with large datasets

### Query Optimization
- Use indexes for frequently queried columns
- LIMIT results when testing queries
- Use COUNT(*) for row counting instead of SELECT *
- Avoid SELECT * in production queries

### Memory Management
- Results cached in memory temporarily
- Automatic cleanup after export
- Browser localStorage used for query history (limited to 10 queries)

## Troubleshooting

### Database Connection Fails
- Check that `server/db/media.db` exists
- Verify file permissions
- Ensure no other process has locked the database

### Queries Timing Out
- Simplify complex queries
- Add indexes to improve query performance
- Check for table locks or long-running transactions

### Rate Limit Issues
- Wait 1 minute before retrying
- Reduce query frequency
- Contact administrator if limit is too restrictive

### Export Not Working
- Check browser popup blocker settings
- Ensure query has returned data
- Try a different browser if issues persist

## File Structure

```
server/
├── db/
│   └── media.db                    # SQLite database
└── routes/
    └── database-query.ts           # Backend API routes

src/
└── components/
    └── DatabaseQuery.tsx           # React component

public/
└── database-query.html             # Standalone HTML interface

docs/
└── DATABASE-QUERY-INTERFACE.md     # This file
```

## Technology Stack

### Backend
- **Express.js**: Web server framework
- **better-sqlite3**: SQLite database driver (synchronous, faster than node-sqlite3)
- **express-rate-limit**: Rate limiting middleware
- **TypeScript**: Type-safe development

### Frontend
- **React 18**: UI framework (for integrated component)
- **Lucide React**: Icon library
- **Vanilla JavaScript**: Standalone HTML version
- **CSS3**: Modern styling with gradients, transitions, and grid/flexbox layouts

## Best Practices

### Query Writing
1. Always test queries with LIMIT first
2. Use explicit column names instead of SELECT *
3. Add proper WHERE clauses to avoid full table scans
4. Use transactions for multiple related writes
5. Create indexes for frequently queried columns

### Security
1. Never share database credentials in queries
2. Use read-only access when possible
3. Validate query results before using in application
4. Be cautious with DELETE and DROP commands
5. Keep backups before running destructive operations

### Performance
1. Use EXPLAIN QUERY PLAN to optimize queries
2. Create appropriate indexes
3. Limit result sets to necessary data
4. Use query history to track slow queries
5. Monitor execution times

## Future Enhancements

Potential improvements for future versions:
- [ ] Query result pagination for large datasets
- [ ] Syntax highlighting in textarea
- [ ] Query formatter and beautifier
- [ ] Visual query builder
- [ ] Saved query templates
- [ ] User authentication and permissions
- [ ] Query execution plans and optimization hints
- [ ] Database backup and restore functionality
- [ ] Multiple database connection support
- [ ] SQL autocomplete and IntelliSense

## Support

For issues or questions:
1. Check this documentation first
2. Review server logs for error details
3. Test queries in the standalone HTML version
4. Verify database file integrity
5. Contact your system administrator

## License

This interface is part of the Team Calendar Application project.
