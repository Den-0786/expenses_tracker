# 🚀 Backend Setup & Frontend Connection Guide

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database (for production) or SQLite (for development)

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
cd expenses-tracker/backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker"
# or for SQLite: DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Server Configuration
PORT=3000
CORS_ORIGIN="*"

# Optional: Logging
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Optional: Run migrations
npm run db:migrate

# Optional: Seed database with sample data
npm run db:seed

# Optional: Open Prisma Studio to view/edit data
npm run db:studio
```

### 4. Start Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 5. Test Backend Endpoints

Once running, test these endpoints:

- **Health Check**: `http://localhost:3000/health`
- **Database Test**: `http://localhost:3000/db-test`

## 🔗 Frontend Connection

### 1. Switch to API Mode

In `frontend/src/config/app.js`, ensure:

```javascript
DATA_SOURCE: "api";
```

### 2. Update API Base URL (if needed)

If your backend runs on a different port or host:

```javascript
API: {
  BASE_URL: 'http://localhost:3000/api', // Update this
  TIMEOUT: 10000,
}
```

### 3. Replace Database Context

In your main App.js or where you wrap your app, replace:

```javascript
// OLD: Mock database
import { DatabaseProvider } from "./src/context/DatabaseContext";

// NEW: API database
import { ApiDatabaseProvider } from "./src/context/ApiDatabaseContext";
```

### 4. Update Screen Imports

In each screen, replace:

```javascript
// OLD: Mock database
import { useDatabase } from "../context/DatabaseContext";

// NEW: API database
import { useApiDatabase } from "../context/ApiDatabaseContext";
```

## 🧪 Testing the Connection

### 1. Test Authentication

- Try to sign up a new user
- Try to sign in with the created user
- Check if JWT token is stored

### 2. Test CRUD Operations

- Create an expense
- Create an income
- Create a note
- Create a budget
- Edit and delete items

### 3. Test Search & Analytics

- Use the search functionality
- Check dashboard analytics
- View budget progress

## 🐛 Troubleshooting

### Common Issues:

#### 1. CORS Errors

- Ensure backend CORS is configured correctly
- Check if frontend URL is allowed in CORS_ORIGIN

#### 2. Database Connection Issues

- Verify DATABASE_URL in .env
- Check if database is running
- Ensure Prisma client is generated

#### 3. Authentication Issues

- Check JWT_SECRET in .env
- Verify token is being sent in headers
- Check if user exists in database

#### 4. API Endpoint Errors

- Verify backend is running on correct port
- Check API_BASE_URL in frontend config
- Ensure all routes are properly registered

### Debug Steps:

1. Check backend console for errors
2. Check frontend console for API errors
3. Verify network requests in browser dev tools
4. Test endpoints directly with Postman/curl

## 📱 Production Deployment

### Backend:

1. Set NODE_ENV="production"
2. Use production database
3. Set secure JWT_SECRET
4. Configure proper CORS_ORIGIN
5. Use environment variables for all secrets

### Frontend:

1. Update API_BASE_URL to production backend
2. Build and deploy to hosting service
3. Ensure HTTPS for production

## 🔄 Switching Between Mock and API

To switch back to mock data for development:

1. Change `DATA_SOURCE: 'mock'` in `app.js`
2. Use `DatabaseProvider` instead of `ApiDatabaseProvider`
3. Use `useDatabase` instead of `useApiDatabase`

## 📚 API Documentation

The backend provides these main endpoints:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Expenses**: `/api/expenses/*`
- **Income**: `/api/income/*`
- **Notes**: `/api/notes/*`
- **Budgets**: `/api/budgets/*`
- **Categories**: `/api/categories/*`
- **Dashboard**: `/api/dashboard/*`
- **Settings**: `/api/settings/*`
- **Search**: `/api/search/*`
- **Analytics**: `/api/analytics/*`

All endpoints require authentication via JWT token in Authorization header.

## 🎯 Next Steps

1. ✅ Test backend endpoints
2. ✅ Connect frontend to backend
3. ✅ Test all CRUD operations
4. ✅ Test authentication flow
5. ✅ Test search and analytics
6. 🚀 Deploy to production!

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Check backend and frontend console logs
4. Ensure database is properly configured
5. Test endpoints individually with Postman


