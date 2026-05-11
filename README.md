# Smart Schedule Assistant

An AI-powered smart scheduling application that helps users manage their calendar events, get intelligent suggestions, and optimize their schedule using OpenAI.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Project Architecture](#project-architecture)
- [Troubleshooting](#troubleshooting)

## 📦 Prerequisites

Before you begin, make sure you have the following installed on your system:

- **Node.js** (v18 or higher)
- **pnpm** (v9 or higher) - Fast, disk space efficient package manager
- **PostgreSQL** (v14 or higher) - Database
- **Git** - Version control

### Install pnpm

If you don't have pnpm installed, install it globally:

```bash
npm install -g pnpm
```

Verify installation:

```bash
pnpm --version
```

## 📁 Project Structure

This is a **monorepo** managed by pnpm with the following structure:

```
.
├── artifacts/                    # Application packages
│   ├── api-server/              # Express.js backend API server
│   ├── smart-scheduler/         # React frontend application
│   └── mockup-sandbox/          # Development sandbox for UI components
├── lib/                         # Shared libraries
│   ├── api-client-react/        # React API client (generated from OpenAPI spec)
│   ├── api-spec/                # OpenAPI specification and code generation
│   ├── api-zod/                 # Zod schemas for API validation
│   ├── db/                      # Database schemas and Drizzle ORM configuration
│   └── integrations-openai-ai-server/  # OpenAI integration
├── scripts/                     # Build and utility scripts
├── package.json                 # Root package configuration
└── pnpm-workspace.yaml         # Monorepo workspace configuration
```

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Smart-Schedule-Assistant
```

### Step 2: Install Dependencies

Install all dependencies for the entire monorepo:

```bash
pnpm install
```

This command installs dependencies for:
- Root workspace
- All packages in `artifacts/`
- All libraries in `lib/`
- Scripts

## 🔧 Environment Setup

### Step 1: Create `.env` File

Copy the `.env` file already present in the root directory. If it doesn't exist, create one with the following variables:

```bash
# Server Configuration
PORT=5000

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/smart_schedule_assistance?sslmode=require"

# JWT Configuration
JWT_SECRET="your-secret-key-change-in-production"

# Web Push Notifications (VAPID keys)
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_EMAIL="mailto:admin@smartscheduler.app"

# OpenAI Integration
OPENAI_API_KEY="your-openai-api-key"
AI_INTEGRATIONS_OPENAI_BASE_URL="https://api.openai.com/v1"
AI_INTEGRATIONS_OPENAI_API_KEY="your-openai-api-key"

# TLS Configuration (development only)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Step 2: Set Up Local PostgreSQL Database (Optional)

If using a local PostgreSQL database:

```bash
# Create a new database
createdb smart_schedule_assistance

# Update DATABASE_URL in .env with your local credentials
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_schedule_assistance"
```

For development, the project is configured to use Neon PostgreSQL (cloud database) by default.

### Step 3: Generate VAPID Keys for Push Notifications

If you need to generate new VAPID keys:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Copy the generated keys to your `.env` file.

## 📦 Database Setup

### Initialize Database Schema

The project uses Drizzle ORM for database management. To push the schema to your database:

```bash
# From the root directory
pnpm run -r --filter=@workspace/db push
```

Or navigate to the db package and run:

```bash
cd lib/db
pnpm push
```

**Warning**: This will create tables in your database. If you need to force-push (reset schema):

```bash
pnpm run -r --filter=@workspace/db push-force
```

## ▶️ Running the Application

### Option 1: Run All Services (Recommended for Development)

```bash
# From the root directory

# Terminal 1: Start the backend API server
cd artifacts/api-server
pnpm dev

# Terminal 2: Start the frontend application
cd artifacts/smart-scheduler
pnpm dev
```

### Option 2: Using pnpm Workspaces

From the root directory, you can run services individually:

```bash
# Start API server
pnpm --filter=@workspace/api-server dev

# Start frontend
pnpm --filter=@workspace/smart-scheduler dev
```

### Access the Application

Once both services are running:

- **Frontend**: http://localhost:5173 (or configured port)
- **API Server**: http://localhost:5000
- **WebSocket Server**: ws://localhost:5000 (for real-time updates)

### Services Running

After `pnpm dev`, the following services should be available:

1. **React Frontend** (Vite Dev Server)
   - Hot module replacement (HMR) enabled
   - Progressive Web App (PWA) support
   - Service Worker enabled

2. **Express API Server**
   - REST API endpoints
   - WebSocket server for real-time communication
   - Authentication middleware (Clerk)
   - Push notification support

## 🏗️ Building for Production

### Build All Packages

```bash
# From the root directory
pnpm build
```

This runs:
1. TypeScript type checking
2. Builds all workspace packages

### Build Specific Package

```bash
# Build frontend
pnpm --filter=@workspace/smart-scheduler build

# Build API server
pnpm --filter=@workspace/api-server build
```

### Serve Production Build

After building, you can preview the production build:

```bash
# Frontend
pnpm --filter=@workspace/smart-scheduler serve

# API server (manually start)
cd artifacts/api-server
node ./dist/index.mjs
```

## 🏛️ Project Architecture

### Backend (API Server)

**Location**: `artifacts/api-server/`

- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: Clerk (JWT-based)
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket support
- **Features**:
  - Authentication routes
  - Event management
  - Chat API
  - Push notifications
  - Health checks

### Frontend (Smart Scheduler)

**Location**: `artifacts/smart-scheduler/`

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: TanStack React Query
- **Authentication**: Clerk
- **Features**:
  - Calendar view
  - Event management
  - AI chat suggestions
  - Statistics dashboard
  - PWA support

### Shared Libraries

- **@workspace/api-client-react**: Generated OpenAPI client for React
- **@workspace/api-zod**: Zod schemas for type-safe API validation
- **@workspace/db**: Database schemas and ORM configuration
- **@workspace/integrations-openai-ai-server**: OpenAI integration layer

## 📝 Common Commands

```bash
# Install dependencies
pnpm install

# Type checking
pnpm typecheck

# Development server (individual packages)
pnpm --filter=@workspace/api-server dev
pnpm --filter=@workspace/smart-scheduler dev

# Build all packages
pnpm build

# Push database schema
pnpm run -r --filter=@workspace/db push
```

## 🔍 Troubleshooting

### Issue: Dependencies not installing

**Solution**: Clear pnpm cache and reinstall:

```bash
pnpm store prune
pnpm install
```

### Issue: Database connection error

**Solution**: Verify `.env` file contains valid `DATABASE_URL`:

```bash
# Check connection string format
echo $DATABASE_URL
```

For Neon PostgreSQL, ensure:
- Connection URL includes `?sslmode=require`
- API key is valid and not expired

### Issue: Port already in use

**Solution**: Change the port in `.env` or kill the process:

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue: TypeScript compilation errors

**Solution**: Clear build cache and rebuild:

```bash
# Remove dist directories
pnpm clean  # if script exists, or manually delete dist/ folders

# Rebuild
pnpm build
```

### Issue: WebSocket connection fails

**Solution**: Ensure API server is running on the correct port and URL is configured in frontend:

```bash
# Check API server is accessible
curl http://localhost:5000/health
```

### Issue: Clerk authentication not working

**Solution**: Verify Clerk configuration:
- Check if Clerk API keys are set in environment
- Ensure frontend can reach Clerk endpoints
- Verify callback URLs in Clerk dashboard

## 📚 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [OpenAPI/OpenAPI Spec](https://www.openapis.org/)
- [pnpm Documentation](https://pnpm.io/)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please ensure:

1. Code follows TypeScript best practices
2. All tests pass
3. Types are properly defined
4. Environmental configurations are documented

---

**Last Updated**: May 2026

For questions or issues, please open an issue in the repository.
