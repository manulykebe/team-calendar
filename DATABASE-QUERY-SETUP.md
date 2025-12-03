# SQLite Database Query Interface - Quick Setup Guide

## What Was Installed

A complete web-based SQLite database query interface for the `media.db` database with:

1. **Backend API** (`server/routes/database-query.ts`)
   - Query execution endpoint
   - Schema inspection endpoint
   - Rate limiting and security features

2. **React Component** (`src/components/DatabaseQuery.tsx`)
   - Integrated into main application
   - Accessible at `/database` route

3. **Standalone HTML** (`public/database-query.html`)
   - Independent web interface
   - No React dependencies

4. **Documentation** (`docs/DATABASE-QUERY-INTERFACE.md`)
   - Comprehensive guide
   - API documentation
   - Security features
   - Troubleshooting

## Quick Start

### 1. Dependencies Installed
```bash
✓ better-sqlite3 - SQLite database driver
✓ express-rate-limit - Rate limiting middleware
✓ @types/better-sqlite3 - TypeScript type definitions
```

### 2. Start the Application

Development mode:
```bash
npm run dev
```

The server will start on `http://localhost:3000` and the client on `http://localhost:5173`

### 3. Access the Interface

**Option A: Integrated React Component (Recommended)**
1. Navigate to: `http://localhost:5173`
2. Log in with your credentials
3. Go to: `http://localhost:5173/database`

**Option B: Standalone HTML Page**
1. Open directly: `http://localhost:3000/database-query.html`
2. Start querying immediately (no login required)

## Features at a Glance

### Query Execution
- Execute any SQL query against media.db
- Real-time results with execution time
- Support for SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, PRAGMA

### Security
- Rate limiting: 100 queries per minute
- Input validation and sanitization
- Dangerous operation blocking
- Query timeout protection

### User Interface
- Large SQL textarea with Ctrl+Enter shortcut
- Sample queries dropdown
- Query history (last 10 queries)
- Database schema browser
- Export to CSV/JSON
- Responsive design

### Results Display
- Formatted HTML tables
- Alternating row colors
- NULL value highlighting
- Execution metadata
- Error messages with details

## Sample Usage

### List All Tables
```sql
SELECT name FROM sqlite_master
WHERE type='table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;
```

### Query a Table
```sql
SELECT * FROM table_name LIMIT 10;
```

### Table Structure
```sql
PRAGMA table_info(table_name);
```

### Count Rows
```sql
SELECT COUNT(*) as total FROM table_name;
```

## API Endpoints

### Execute Query
```bash
POST /api/db/query
Content-Type: application/json

{
  "query": "SELECT * FROM table_name LIMIT 10;"
}
```

### Get Schema
```bash
GET /api/db/schema
```

## File Changes

### New Files Created
- `server/routes/database-query.ts` - Backend API
- `src/components/DatabaseQuery.tsx` - React component
- `public/database-query.html` - Standalone interface
- `docs/DATABASE-QUERY-INTERFACE.md` - Full documentation
- `DATABASE-QUERY-SETUP.md` - This file

### Modified Files
- `server/index.ts` - Added route registration
- `src/App.tsx` - Added /database route
- `package.json` - Added dependencies

## Keyboard Shortcuts

- **Ctrl+Enter** (Cmd+Enter on Mac): Execute query
- Standard text editing shortcuts supported

## Security Notes

### Protected Operations
- ATTACH DATABASE commands are blocked
- Unsafe PRAGMA commands are blocked
- Query length limited to 50,000 characters
- Rate limiting prevents abuse

### Best Practices
1. Test queries with LIMIT first
2. Be careful with DELETE and DROP
3. Keep database backups
4. Monitor query execution times
5. Use indexes for better performance

## Troubleshooting

### Cannot Connect to Database
- Verify `server/db/media.db` exists
- Check file permissions
- Restart the server

### Rate Limit Error
- Wait 1 minute before retrying
- Reduce query frequency
- Check for automated scripts

### Query Timeout
- Simplify complex queries
- Add appropriate indexes
- Check for table locks

## Production Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

The interface will be available at your production domain:
- React component: `https://yourdomain.com/database`
- Standalone: `https://yourdomain.com/database-query.html`

## Next Steps

1. **Explore the Database**
   - Use the schema panel to see available tables
   - Click "Query" buttons for quick access
   - Try sample queries from the dropdown

2. **Save Useful Queries**
   - Use query history to recall previous queries
   - Export results for analysis
   - Build complex queries incrementally

3. **Read Full Documentation**
   - See `docs/DATABASE-QUERY-INTERFACE.md`
   - Learn about advanced features
   - Review security best practices

## Support

For detailed information, refer to:
- Full documentation: `docs/DATABASE-QUERY-INTERFACE.md`
- Server logs for errors
- Browser console for frontend issues

## Testing the Installation

Try these test queries to verify everything works:

```sql
-- 1. Check database connection
PRAGMA database_list;

-- 2. List all tables
SELECT name FROM sqlite_master
WHERE type='table'
ORDER BY name;

-- 3. Check a specific table (replace with actual table name)
SELECT * FROM your_table_name LIMIT 5;

-- 4. Get table structure
PRAGMA table_info(your_table_name);
```

If all queries execute successfully, your installation is complete!

---

**Congratulations!** Your SQLite Database Query Interface is ready to use.
