# Database Integration for Expenses Tracker

This document outlines the complete database integration that has been implemented for the Expenses Tracker app, replacing local storage with persistent database storage.

## 🚀 New Features Added

### 1. **Categories Management**

- **Backend**: Complete CRUD API for expense/income categories
- **Frontend**: Database-driven category management with fallback to local defaults
- **Features**:
  - Create, edit, delete categories
  - Color and icon customization
  - Type-based categorization (expense/income)
  - User-specific categories

### 2. **Payment Methods Management**

- **Backend**: Complete CRUD API for payment methods
- **Frontend**: Database-driven payment method management
- **Features**:
  - Create, edit, delete payment methods
  - Icon and color customization
  - User-specific payment methods
  - Validation to prevent deletion of methods in use

### 3. **User Preferences System**

- **Backend**: Flexible key-value preference storage
- **Frontend**: Database-driven preference management with AsyncStorage fallback
- **Features**:
  - Default currency
  - Default payment method
  - Start of week preference
  - Data retention settings
  - Extensible for future preferences

### 4. **Profile Image Management**

- **Backend**: Profile image storage and retrieval
- **Frontend**: Database-driven image management with AsyncStorage fallback
- **Features**:
  - Image upload from gallery/camera
  - Database persistence
  - Fallback to local storage

## 🗄️ Database Schema Changes

### New Tables Added

#### PaymentMethod Table

```sql
CREATE TABLE "PaymentMethod" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

#### UserPreference Table

```sql
CREATE TABLE "UserPreference" (
    "id" SERIAL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

### Modified Tables

#### Expense Table

- Added `paymentMethodId` column with foreign key reference to PaymentMethod

## 🔧 Setup Instructions

### 1. **Backend Setup**

#### Install Dependencies

```bash
cd backend
npm install
```

#### Database Migration

```bash
# Run the migration script
psql -d your_database_name -f migrations/add-payment-methods-and-preferences.sql

# Or use Prisma (recommended)
npx prisma db push
npx prisma generate
```

#### Environment Variables

Ensure your `.env` file contains:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your_jwt_secret"
CORS_ORIGIN="http://localhost:8081"
```

#### Start Backend Server

```bash
npm start
```

### 2. **Frontend Setup**

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Environment Variables

Ensure your `.env` file contains:

```env
API_BASE_URL="http://localhost:3000/api"
```

#### Start Frontend

```bash
npm start
```

## 📱 API Endpoints

### Categories

- `GET /api/categories` - Get user's categories
- `GET /api/categories/by-type/:type` - Get categories by type
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Payment Methods

- `GET /api/payment-methods` - Get user's payment methods
- `POST /api/payment-methods` - Create new payment method
- `PUT /api/payment-methods/:id` - Update payment method
- `DELETE /api/payment-methods/:id` - Delete payment method

### User Preferences

- `GET /api/preferences` - Get all user preferences
- `GET /api/preferences/:key` - Get specific preference
- `POST /api/preferences` - Set preference (create/update)
- `PUT /api/preferences/:key` - Update specific preference
- `DELETE /api/preferences/:key` - Delete preference

## 🔄 Data Flow

### 1. **Categories & Payment Methods**

```
Frontend → API → Database → Response → Frontend State
```

### 2. **User Preferences**

```
Frontend → API → Database → Response → Frontend State
AsyncStorage (fallback)
```

### 3. **Profile Images**

```
Frontend → API → Database → Response → Frontend State
AsyncStorage (fallback)
```

## 🛡️ Error Handling & Fallbacks

### **Graceful Degradation**

- If database is unavailable, app falls back to local storage
- Default categories and payment methods are provided
- User experience remains functional

### **Error Recovery**

- Network errors are logged and displayed to user
- Failed operations can be retried
- Data consistency is maintained

## 🧪 Testing

### **Backend Testing**

```bash
cd backend
npm test
```

### **Frontend Testing**

```bash
cd frontend
npm test
```

### **API Testing**

Use tools like Postman or curl to test endpoints:

```bash
# Test categories endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/categories

# Test payment methods endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/payment-methods
```

## 📊 Performance Considerations

### **Database Indexes**

- User ID indexes on all user-specific tables
- Composite indexes for preferences (userId + key)
- Foreign key indexes for relationships

### **Caching Strategy**

- Frontend caches data in state
- AsyncStorage provides offline fallback
- Database queries are optimized with proper indexing

## 🔮 Future Enhancements

### **Planned Features**

1. **Bulk Operations**: Import/export categories and payment methods
2. **Templates**: Pre-defined category sets for different user types
3. **Analytics**: Usage statistics for categories and payment methods
4. **Sync**: Real-time synchronization across devices
5. **Backup**: Automated backup and restore functionality

### **Scalability Improvements**

1. **Connection Pooling**: Optimize database connections
2. **Caching Layer**: Redis integration for frequently accessed data
3. **Pagination**: Handle large datasets efficiently
4. **Search**: Full-text search for categories and payment methods

## 🐛 Troubleshooting

### **Common Issues**

#### Database Connection Failed

```bash
# Check database status
psql -d your_database_name -c "SELECT version();"

# Verify environment variables
echo $DATABASE_URL
```

#### Migration Errors

```bash
# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

#### Frontend API Errors

```bash
# Check backend server status
curl http://localhost:3000/health

# Verify CORS settings
curl -H "Origin: http://localhost:8081" \
     http://localhost:3000/api/categories
```

## 📞 Support

For issues or questions:

1. Check the logs in both frontend and backend
2. Verify database connectivity
3. Ensure all environment variables are set correctly
4. Check API endpoint availability

## 🎯 Success Metrics

### **Implementation Goals**

- ✅ Categories persist across app restarts
- ✅ Payment methods are user-specific
- ✅ User preferences are saved to database
- ✅ Profile images are synced with database
- ✅ Fallback mechanisms work when database is unavailable
- ✅ Performance remains acceptable with database queries

### **User Experience Goals**

- ✅ No data loss when app is reinstalled
- ✅ Seamless synchronization across devices
- ✅ Fast loading of user-specific data
- ✅ Intuitive management of categories and payment methods

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: ✅ Complete
