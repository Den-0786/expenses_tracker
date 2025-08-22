# Neon Database Integration Guide

## Overview

This app is prepared for Neon Postgres database integration. Currently using a mock database until Neon is fully integrated.

## Prerequisites

1. Neon account (https://neon.tech)
2. Node.js and npm installed
3. Environment variables configured

## Installation Steps

### 1. Install Required Packages

```bash
npm install pg @types/pg
```

### 2. Set Environment Variables

Create a `.env` file in your project root:

```env
NEON_DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
```

### 3. Update DatabaseContext.js

The file is already prepared with:

- Postgres-compatible table schemas
- Mock database fallback
- Neon connection setup function (commented out)

### 4. Enable Neon Connection

Uncomment and update the `setupNeonConnection` function in `src/context/DatabaseContext.js`:

```javascript
const setupNeonConnection = async () => {
  try {
    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();

    setDb(pool);
    await createTables(pool);
    setIsReady(true);

    return true;
  } catch (error) {
    console.error("Error setting up Neon connection:", error);
    return false;
  }
};
```

### 5. Update Database Operations

Replace all SQLite operations with Postgres queries. Key changes:

- `db.transaction()` → `pool.query()`
- `?` placeholders → `$1, $2, $3` etc.
- `datetime('now')` → `CURRENT_TIMESTAMP`
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`

## Table Schemas

All tables are already prepared with Postgres-compatible schemas:

- **user_settings**: User payment and tithing preferences
- **expenses**: Expense tracking
- **income**: Income tracking
- **daily_summaries**: Daily spending summaries
- **weekly_summaries**: Weekly spending summaries
- **monthly_summaries**: Monthly spending summaries
- **budgets**: Budget settings

## Testing

1. Test connection with `setupNeonConnection()`
2. Verify tables are created
3. Test basic CRUD operations
4. Check data persistence

## Production Considerations

- Connection pooling configuration
- SSL requirements
- Error handling and retry logic
- Connection monitoring
- Backup strategies

## Current Status

✅ Mock database working  
✅ Postgres schemas prepared  
✅ Connection function ready  
⏳ Neon integration pending  
⏳ Database operations migration  
⏳ Testing and validation

## Next Steps

1. Complete Neon setup
2. Migrate database operations
3. Test all functionality
4. Deploy to production
