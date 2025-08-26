# Expense Tracker Backend API

A robust Node.js backend API for the Expense Tracker mobile application, built with Express.js and Prisma ORM, designed to work with PostgreSQL databases (including Neon).

## 🚀 Features

- **User Authentication** - Secure signup/signin with PIN-based authentication
- **JWT Tokens** - Stateless authentication with JSON Web Tokens
- **Database Management** - Prisma ORM with PostgreSQL support
- **RESTful API** - Clean, organized API endpoints
- **CORS Support** - Cross-origin resource sharing enabled
- **Error Handling** - Comprehensive error handling and validation
- **Security** - PIN hashing with bcrypt, JWT verification

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (with Neon support)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Built-in validation
- **CORS**: Express CORS middleware

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (or Neon PostgreSQL)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp env.template .env
```

Edit the `.env` file with your database credentials:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"

# Server Configuration
PORT=3000
NODE_ENV="development"

# CORS Configuration
CORS_ORIGIN="*"
```

### 3. Database Setup

#### Option A: Neon PostgreSQL (Recommended)

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in your `.env` file

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database
3. Update `DATABASE_URL` in your `.env` file

### 4. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 📊 API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/verify` - Verify JWT token

### Health Check

- `GET /health` - Server health status
- `GET /db-test` - Database connection test

### Available Endpoints

- `GET/POST/PUT/DELETE /api/expenses` - Expense management
- `GET/POST/PUT/DELETE /api/income` - Income management
- `GET/POST/PUT/DELETE /api/budgets` - Budget management
- `GET/POST/PUT/DELETE /api/notes` - Notes management
- `GET/POST/PUT/DELETE /api/categories` - Category management
- `GET/POST /api/onboarding` - Onboarding management
- `GET /api/dashboard` - Dashboard analytics and overview
- `GET/PUT/DELETE /api/settings` - User settings and preferences

## 🗄️ Database Schema

### Models

- **User** - User accounts with authentication
- **Expense** - Expense records with categories
- **Income** - Income records with sources
- **Budget** - Budget planning and tracking
- **Note** - User notes and reminders
- **Category** - Expense and income categories

### Key Features

- **Relationships** - Proper foreign key relationships
- **Timestamps** - Automatic created/updated timestamps
- **Cascade Deletes** - Proper cleanup on user deletion
- **Unique Constraints** - Username and email uniqueness

## 🔐 Authentication

### JWT Token Format

```
Authorization: Bearer <token>
```

### Token Payload

```json
{
  "userId": 1,
  "username": "john_doe",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 🚨 Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3000/health
```

### Database Test

```bash
curl http://localhost:3000/db-test
```

## 📝 Development

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run build` - Generate Prisma client
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

### Code Structure

```
backend/
├── index.js              # Main server file
├── package.json          # Dependencies and scripts
├── prisma/
│   └── schema.prisma    # Database schema
├── routes/               # API route handlers
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User management
│   ├── expenses.js      # Expense management
│   ├── income.js        # Income management
│   ├── budgets.js       # Budget management
│   ├── notes.js         # Notes management
│   ├── categories.js    # Category management
│   ├── onboarding.js    # Onboarding management
│   ├── dashboard.js     # Dashboard analytics
│   └── settings.js      # User settings
├── middleware/           # Custom middleware
├── utils/                # Utility functions
└── .env                  # Environment variables
```

## 🚀 Deployment

### Environment Variables

- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure `CORS_ORIGIN` for production
- Use production database URL

### Database

- Run `npm run db:migrate` for production migrations
- Ensure database connection is secure
- Set up proper database backups

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed

- Check `DATABASE_URL` in `.env`
- Verify database is running
- Check network connectivity
- Ensure SSL mode is correct for Neon

#### Prisma Client Not Generated

```bash
npm run db:generate
```

#### Schema Changes Not Applied

```bash
npm run db:push
# or
npm run db:migrate
```

#### Port Already in Use

- Change `PORT` in `.env`
- Kill existing process using the port

### Logs

Check console output for detailed error messages and debugging information.

## 🤝 Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include input validation
4. Test your changes
5. Update documentation

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the API documentation
3. Check console logs for errors
4. Verify environment configuration
