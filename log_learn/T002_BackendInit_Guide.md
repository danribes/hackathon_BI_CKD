# T002: Express.js + TypeScript Backend - Learn & Guide

**Guide Type**: Backend Development Fundamentals
**Technology Stack**: Node.js + Express.js + TypeScript
**Skill Level**: Intermediate
**Estimated Reading Time**: 20 minutes
**Last Updated**: 2025-11-08

---

## Table of Contents

1. [Introduction](#introduction)
2. [Express.js Fundamentals](#expressjs-fundamentals)
3. [TypeScript in Backend Development](#typescript-in-backend-development)
4. [Middleware Architecture](#middleware-architecture)
5. [Environment Variables & Security](#environment-variables--security)
6. [CORS Configuration](#cors-configuration)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Code Walkthrough](#code-walkthrough)
9. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
10. [Best Practices](#best-practices)
11. [Testing Strategies](#testing-strategies)
12. [Performance Optimization](#performance-optimization)
13. [Security Considerations](#security-considerations)
14. [Further Learning](#further-learning)

---

## Introduction

This guide explains the backend initialization for a production-ready Express.js application with TypeScript. You'll learn how to set up a robust, type-safe web server with proper middleware configuration, error handling, and security best practices.

### What You'll Learn

- How to initialize a Node.js project with TypeScript
- Express.js middleware patterns and request flow
- Type safety in backend development
- Environment variable management
- CORS configuration for frontend integration
- Error handling and logging strategies
- Testing backend applications

### Prerequisites

- Basic JavaScript/TypeScript knowledge
- Understanding of HTTP protocol
- Node.js installed (v20+ recommended)
- npm or yarn package manager

---

## Express.js Fundamentals

### What is Express.js?

Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It's the de facto standard for building REST APIs in Node.js.

**Key Features**:
- Routing system for handling different HTTP methods and URLs
- Middleware architecture for request processing
- Template engine support
- Robust error handling
- Large ecosystem of plugins

### Why Express.js?

```typescript
// Without Express (raw Node.js http module)
import http from 'http';

const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else if (req.url === '/api' && req.method === 'GET') {
    // ... more manual routing
  }
  // This gets messy quickly!
});

// With Express (clean and organized)
import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api', (req, res) => {
  res.json({ name: 'My API' });
});
```

**Benefits**:
- ✅ Cleaner, more readable code
- ✅ Built-in JSON parsing and response helpers
- ✅ Easy middleware integration
- ✅ Better error handling
- ✅ Route parameter extraction
- ✅ Large community and ecosystem

### Express Application Structure

```
Backend Application
├── Request arrives → Port 3000
├── Middleware Stack (executes in order)
│   ├── CORS middleware → Adds security headers
│   ├── express.json() → Parses JSON body
│   ├── express.urlencoded() → Parses form data
│   └── Custom logging → Logs request info
├── Route Handlers (first match wins)
│   ├── GET /health → Health check response
│   ├── GET /api → API information
│   └── ... more routes
├── 404 Handler → Catches unmatched routes
└── Error Handler → Catches all errors
```

---

## TypeScript in Backend Development

### Why TypeScript for Backend?

**Problem without TypeScript**:
```javascript
// JavaScript - No type safety
function createUser(name, age, email) {
  // What types are these parameters? Who knows!
  return database.insert({ name, age, email });
}

createUser("John", "25", "john@example.com"); // Bug! Age is string
createUser("Jane"); // Bug! Missing required fields
```

**Solution with TypeScript**:
```typescript
// TypeScript - Full type safety
interface User {
  name: string;
  age: number;
  email: string;
}

function createUser(name: string, age: number, email: string): User {
  return database.insert({ name, age, email });
}

createUser("John", "25", "john@example.com"); // ❌ Error: age must be number
createUser("Jane"); // ❌ Error: missing parameters
createUser("John", 25, "john@example.com"); // ✅ Correct!
```

### TypeScript Strict Mode

Our `tsconfig.json` uses strict mode for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,              // Enable all strict checks
    "noUnusedLocals": true,      // Error on unused variables
    "noUnusedParameters": true,  // Error on unused parameters
    "noImplicitAny": true,       // Error on implicit 'any' type
    "strictNullChecks": true,    // Null safety
    "noImplicitReturns": true    // All code paths must return
  }
}
```

**Benefits of Strict Mode**:

1. **Catch Bugs Early**:
```typescript
// Without strictNullChecks
function getUser(id: string) {
  const user = database.find(id); // Could be undefined
  return user.name; // ❌ Runtime error if user not found
}

// With strictNullChecks
function getUser(id: string) {
  const user = database.find(id); // Type: User | undefined
  return user.name; // ✅ Error: Object is possibly undefined

  // Forces you to handle null case
  if (!user) throw new Error('User not found');
  return user.name; // ✅ Safe access
}
```

2. **Better IDE Support**:
- Autocomplete for properties and methods
- Inline documentation
- Refactoring tools
- Import suggestions

3. **Self-Documenting Code**:
```typescript
// Types serve as documentation
interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
  version: string;
  environment: 'development' | 'production' | 'test';
}

// Anyone reading this knows exactly what it returns
app.get('/health', (req, res): HealthCheckResponse => {
  // ...
});
```

### Handling Unused Parameters

**The Problem**:
```typescript
// Express requires this signature, but we don't use 'req'
app.get('/health', (req, res) => {
  res.json({ status: 'ok' }); // ❌ Error: 'req' is declared but never used
});
```

**Solution 1: Prefix with underscore** (our approach):
```typescript
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' }); // ✅ TypeScript knows this is intentional
});
```

**Solution 2: Disable the rule** (not recommended):
```json
{
  "compilerOptions": {
    "noUnusedParameters": false // ❌ Loses type safety benefits
  }
}
```

**Why underscore prefix is better**:
- Keeps strict mode enabled
- Explicit intent (parameter intentionally unused)
- Standard TypeScript convention
- Helps code reviewers understand the code

---

## Middleware Architecture

### What is Middleware?

Middleware functions are functions that have access to the request object (`req`), response object (`res`), and the next middleware function in the application's request-response cycle.

**Request Flow**:
```
Client Request
    ↓
[CORS Middleware] → Adds headers, validates origin
    ↓
[express.json()] → Parses JSON body
    ↓
[Logging Middleware] → Logs request details
    ↓
[Route Handler] → Processes request, sends response
    ↓ (if error occurs)
[Error Handler] → Catches and formats errors
    ↓
Response to Client
```

### Middleware Types

#### 1. Application-Level Middleware

Applies to all requests:

```typescript
// CORS middleware - allows frontend to communicate with backend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// JSON parsing middleware - converts JSON string to JavaScript object
app.use(express.json());

// URL-encoded parsing - handles form submissions
app.use(express.urlencoded({ extended: true }));
```

#### 2. Custom Middleware

Our logging middleware:

```typescript
app.use((req: Request, _res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next(); // CRITICAL: Must call next() to continue to next middleware
});
```

**Key Points**:
- `req` - Read request data (method, path, headers, body)
- `_res` - Could modify response (we don't here)
- `next` - **MUST** call to continue to next middleware
- Executes for **every** request

**Common Mistake**:
```typescript
// ❌ WRONG - Forgot to call next()
app.use((req, res, next) => {
  console.log(req.method);
  // Request hangs! Never proceeds to route handler
});

// ✅ CORRECT
app.use((req, res, next) => {
  console.log(req.method);
  next(); // Continues to next middleware
});
```

#### 3. Route-Level Middleware

Applies to specific routes:

```typescript
// Middleware that only runs for /admin routes
const adminAuth = (req: Request, res: Response, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.get('/admin/users', adminAuth, (req, res) => {
  // This only runs if adminAuth calls next()
  res.json({ users: [] });
});
```

#### 4. Error-Handling Middleware

Has **4 parameters** (not 3):

```typescript
// Note: MUST have 4 parameters (err, req, res, next) or Express won't recognize it
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});
```

**Why 4 parameters matter**:
- Express recognizes error handlers by the 4-parameter signature
- Even if you don't use `next`, it must be included
- Error handlers run when:
  - A route handler throws an error
  - `next(error)` is called
  - A promise rejects (with express-async-errors)

---

## Environment Variables & Security

### Why Environment Variables?

**Bad Practice** (hardcoded secrets):
```typescript
// ❌ NEVER DO THIS
const API_KEY = 'sk-ant-api03-qYGRMHXV3sOgwa...'; // Exposed in git!
const DB_PASSWORD = 'healthcare_pass'; // Anyone can see this
const PORT = 3000; // Can't change without modifying code
```

**Good Practice** (environment variables):
```typescript
// ✅ Correct - secrets in .env file
const API_KEY = process.env.ANTHROPIC_API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;
const PORT = process.env.PORT || 3000; // Fallback to 3000
```

### The .env File Pattern

**Structure**:
```
project/
├── .env                 # Real secrets (NEVER commit)
├── .env.example         # Template (safe to commit)
└── .gitignore          # Contains '.env'
```

**backend/.env** (gitignored):
```bash
# Real values - NEVER commit this file
ANTHROPIC_API_KEY=sk-ant-api03-qYGRMHXV3sOgwa...
DB_PASSWORD=healthcare_pass
PORT=3000
```

**backend/.env.example** (committed):
```bash
# Template - safe to commit
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_API_KEY_HERE
DB_PASSWORD=your_password_here
PORT=3000
```

**backend/.gitignore**:
```
.env          # Prevents .env from being committed
node_modules
dist
```

### Loading Environment Variables

Using `dotenv` package:

```typescript
import dotenv from 'dotenv';

// Load .env file at application startup
dotenv.config();

// Now all variables are available
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

// Validate required variables
if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is required');
  process.exit(1); // Exit if critical env var is missing
}
```

### Environment-Specific Configuration

```typescript
const environment = process.env.NODE_ENV || 'development';

const config = {
  development: {
    logLevel: 'debug',
    corsOrigin: 'http://localhost:5173',
    databaseUrl: 'postgresql://localhost:5432/dev_db'
  },
  production: {
    logLevel: 'error',
    corsOrigin: 'https://yourdomain.com',
    databaseUrl: process.env.DATABASE_URL
  }
};

const currentConfig = config[environment];
```

---

## CORS Configuration

### What is CORS?

CORS (Cross-Origin Resource Sharing) is a security feature that controls which domains can make requests to your API.

**The Problem**:
```
Frontend (localhost:5173)  →  Backend (localhost:3000)
        ↓
   ❌ BLOCKED by browser!

Error: "Access to fetch at 'http://localhost:3000/api' from origin
'http://localhost:5173' has been blocked by CORS policy"
```

**Without CORS enabled**:
- Browser blocks requests from different origins (domain/port)
- This is a security feature to prevent malicious sites from accessing your API
- Even though both are on localhost, different ports = different origins

**The Solution**:
```typescript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173',  // Allow frontend origin
  credentials: true                  // Allow cookies/auth headers
}));
```

### CORS Configuration Options

#### 1. Basic (Allow Single Origin)
```typescript
app.use(cors({
  origin: 'http://localhost:5173'
}));
```

#### 2. Multiple Origins
```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
```

#### 3. Dynamic Origin (from environment)
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

#### 4. Allow All Origins (⚠️ Not Recommended for Production)
```typescript
app.use(cors({
  origin: '*' // ❌ Dangerous - any website can access your API
}));
```

#### 5. Function-Based Origin Validation
```typescript
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5173', 'https://yourdomain.com'];

    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### CORS Headers Explained

When CORS is configured, these headers are added:

```http
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

**What each header does**:
- `Allow-Origin`: Which domains can access the API
- `Allow-Credentials`: Whether cookies/auth can be sent
- `Allow-Methods`: Which HTTP methods are allowed
- `Allow-Headers`: Which request headers are allowed

---

## Error Handling Patterns

### Layered Error Handling

Our backend uses a 3-layer error handling approach:

#### Layer 1: Route Handler Errors

```typescript
app.get('/api/patient/:id', async (req, res) => {
  try {
    const patient = await database.findPatient(req.params.id);

    if (!patient) {
      // Explicit error response
      return res.status(404).json({
        error: 'Not Found',
        message: 'Patient not found'
      });
    }

    res.json(patient);
  } catch (error) {
    // Let error handler middleware catch this
    throw error;
  }
});
```

#### Layer 2: 404 Handler

Catches routes that don't exist:

```typescript
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: ['/health', '/api']
  });
});
```

**How it works**:
- Placed **after** all route handlers
- Only runs if no route matched
- Provides helpful error message with available endpoints

#### Layer 3: Global Error Handler

Catches all unhandled errors:

```typescript
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});
```

**Security Note**: In production, don't expose `err.message` to clients:

```typescript
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err); // Log full error server-side

  res.status(500).json({
    error: 'Internal Server Error',
    // Only send generic message to client
    message: process.env.NODE_ENV === 'production'
      ? 'An error occurred'
      : err.message
  });
});
```

### Error Handling Best Practices

#### 1. Use Specific Status Codes

```typescript
// ❌ Bad - always 500
res.status(500).json({ error: 'Something went wrong' });

// ✅ Good - specific codes
res.status(400).json({ error: 'Invalid input' });      // Client error
res.status(401).json({ error: 'Unauthorized' });       // Auth required
res.status(404).json({ error: 'Not found' });          // Resource missing
res.status(500).json({ error: 'Server error' });       // Server error
```

#### 2. Include Helpful Context

```typescript
// ❌ Bad - vague error
res.status(400).json({ error: 'Invalid data' });

// ✅ Good - specific context
res.status(400).json({
  error: 'Validation Error',
  message: 'Patient age must be between 0 and 150',
  field: 'age',
  receivedValue: 200
});
```

#### 3. Log Errors Server-Side

```typescript
app.use((err: Error, req: Request, res: Response, _next: any) => {
  // Log with context
  console.error({
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({ error: 'Internal Server Error' });
});
```

---

## Code Walkthrough

Let's walk through our complete server implementation:

### 1. Imports and Configuration

```typescript
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
```

**What's happening**:
1. Import Express framework and TypeScript types
2. Import CORS for cross-origin requests
3. Import dotenv to load .env file
4. Load environment variables (must be before using process.env)
5. Create Express application instance
6. Get port from environment or default to 3000

### 2. Middleware Setup

```typescript
// CORS - allow frontend to call our API
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parsing - convert JSON strings to JavaScript objects
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**Execution order matters**:
- CORS first → validates request origin
- JSON parser second → parses request body
- URL encoder third → handles form data

### 3. Request Logging

```typescript
app.use((req: Request, _res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next(); // Continue to next middleware
});
```

**Output example**:
```
[2025-11-08T10:30:45.123Z] GET /health
[2025-11-08T10:30:47.456Z] POST /api/patients
```

### 4. Health Check Endpoint

```typescript
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Healthcare AI Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});
```

**Purpose**:
- Verify server is running
- Used by monitoring tools (Docker, Kubernetes)
- Frontend can check backend availability
- Returns current timestamp and environment info

**Example response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T10:30:45.123Z",
  "service": "Healthcare AI Backend",
  "version": "1.0.0",
  "environment": "development"
}
```

### 5. API Info Endpoint

```typescript
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'Healthcare AI Clinical Data Analyzer API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      patients: '/api/patients (coming soon)',
      analysis: '/api/analyze (coming soon)'
    }
  });
});
```

**Purpose**:
- API documentation entry point
- Shows available endpoints
- Helps developers discover API features

### 6. 404 Handler

```typescript
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: ['/health', '/api']
  });
});
```

**When it runs**: Only if no previous route matched the request

### 7. Error Handler

```typescript
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});
```

**When it runs**: When any route throws an error or calls `next(error)`

### 8. Server Startup

```typescript
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🏥 Healthcare AI Clinical Data Analyzer - Backend');
  console.log('='.repeat(60));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API info: http://localhost:${PORT}/api`);
  console.log('='.repeat(60));
  console.log('Ready to accept requests...\n');
});
```

**What happens**:
1. Server binds to port (default 3000)
2. Starts listening for incoming connections
3. Prints startup banner with useful information
4. Callback executes once server is ready

### 9. Graceful Shutdown

```typescript
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT signal received: closing HTTP server');
  process.exit(0);
});
```

**Purpose**:
- Handle Ctrl+C gracefully
- Close connections properly
- Prevent data corruption
- Clean shutdown in Docker containers

---

## Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Call `next()`

```typescript
// ❌ WRONG - request hangs
app.use((req, res, next) => {
  console.log(req.method);
  // Forgot next() - request never reaches route handler
});

// ✅ CORRECT
app.use((req, res, next) => {
  console.log(req.method);
  next(); // Continues to next middleware
});
```

### Pitfall 2: Middleware Order Matters

```typescript
// ❌ WRONG - logging happens after route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res, next) => {
  console.log(req.method); // Never runs for /health
  next();
});

// ✅ CORRECT - logging before routes
app.use((req, res, next) => {
  console.log(req.method);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

### Pitfall 3: Missing Error Handler Parameters

```typescript
// ❌ WRONG - only 3 parameters, Express won't recognize it
app.use((err, req, res) => {
  res.status(500).json({ error: err.message });
});

// ✅ CORRECT - must have 4 parameters
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

### Pitfall 4: Not Validating Environment Variables

```typescript
// ❌ WRONG - crashes if API_KEY is undefined
const API_KEY = process.env.ANTHROPIC_API_KEY;
const client = new Anthropic({ apiKey: API_KEY }); // Error!

// ✅ CORRECT - validate on startup
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is required');
  process.exit(1);
}
const client = new Anthropic({ apiKey: API_KEY });
```

### Pitfall 5: CORS After Routes

```typescript
// ❌ WRONG - CORS won't work
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(cors()); // Too late! Request already handled

// ✅ CORRECT - CORS before routes
app.use(cors());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

### Pitfall 6: Exposing Sensitive Data in Errors

```typescript
// ❌ WRONG - exposes internal details
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,           // ❌ Shows code structure
    databaseUrl: process.env.DB // ❌ Exposes credentials
  });
});

// ✅ CORRECT - generic error message
app.use((err, req, res, next) => {
  console.error(err); // Log full error server-side
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An error occurred' // Generic message
  });
});
```

---

## Best Practices

### 1. Use TypeScript Strict Mode

Enables all type safety features:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2. Environment-Based Configuration

```typescript
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Validate required variables on startup
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required');
}
```

### 3. Structured Logging

```typescript
// ❌ Bad - inconsistent format
console.log('User logged in');
console.log('Error occurred');

// ✅ Good - structured format
const log = {
  info: (message: string, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...meta,
      timestamp: new Date().toISOString()
    }));
  },
  error: (message: string, error: Error) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));
  }
};

log.info('User logged in', { userId: 123 });
log.error('Database connection failed', error);
```

### 4. Separate Route Files

As your API grows, split routes into files:

```typescript
// routes/patients.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ patients: [] });
});

router.post('/', (req, res) => {
  // Create patient
});

export default router;

// index.ts
import patientRoutes from './routes/patients';
app.use('/api/patients', patientRoutes);
```

### 5. Input Validation

```typescript
import { z } from 'zod'; // Popular validation library

const PatientSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(150),
  email: z.string().email()
});

app.post('/api/patients', (req, res) => {
  try {
    const validatedData = PatientSchema.parse(req.body);
    // Data is now type-safe and validated
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});
```

---

## Testing Strategies

### Unit Testing Routes

```typescript
// Using supertest library
import request from 'supertest';
import app from './index';

describe('GET /health', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('GET /nonexistent', () => {
  it('should return 404', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.status).toBe(404);
  });
});
```

### Integration Testing

Test the entire request flow:

```typescript
describe('Patient API', () => {
  it('should create and retrieve patient', async () => {
    // Create patient
    const createRes = await request(app)
      .post('/api/patients')
      .send({ name: 'John Doe', age: 30 });

    expect(createRes.status).toBe(201);
    const patientId = createRes.body.id;

    // Retrieve patient
    const getRes = await request(app).get(`/api/patients/${patientId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe('John Doe');
  });
});
```

### Shell Script Testing

Our approach for hackathon speed:

```bash
#!/bin/bash

echo "Test 1: Verify package.json exists"
test -f backend/package.json && echo "✅ PASS" || echo "❌ FAIL"

echo "Test 2: Verify TypeScript compiles"
cd backend && npx tsc --noEmit && echo "✅ PASS" || echo "❌ FAIL"
```

**Pros**: Fast to write, no dependencies
**Cons**: Less detailed than unit tests

---

## Performance Optimization

### 1. Enable Compression

```typescript
import compression from 'compression';

app.use(compression()); // Gzip response bodies
```

### 2. Rate Limiting

Prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per window
});

app.use('/api/', limiter);
```

### 3. Caching Headers

```typescript
app.get('/api/static-data', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.json({ data: 'Static data' });
});
```

### 4. Database Connection Pooling

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum 20 connections
  idleTimeoutMillis: 30000
});
```

---

## Security Considerations

### 1. Helmet for Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet()); // Sets various HTTP headers for security
```

### 2. Environment Variable Validation

```typescript
const requiredEnvVars = ['ANTHROPIC_API_KEY', 'DATABASE_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ${envVar} is required`);
    process.exit(1);
  }
}
```

### 3. SQL Injection Prevention

```typescript
// ❌ DANGEROUS - SQL injection vulnerability
const userId = req.params.id;
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ SAFE - parameterized query
db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### 4. HTTPS in Production

```typescript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## Further Learning

### Recommended Resources

**Express.js**:
- Official Docs: https://expressjs.com/
- Express.js Guide: https://expressjs.com/en/guide/routing.html
- MDN Express Tutorial: https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs

**TypeScript**:
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- TypeScript Deep Dive: https://basarat.gitbook.io/typescript/

**Node.js**:
- Node.js Docs: https://nodejs.org/en/docs/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices

**Testing**:
- Jest: https://jestjs.io/
- Supertest: https://github.com/visionmedia/supertest

**Security**:
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Helmet.js: https://helmetjs.github.io/

### Next Steps

1. **Add Database Integration** (H012)
   - Connect to PostgreSQL
   - Create database models
   - Implement queries

2. **Add Authentication** (Future)
   - JWT tokens
   - Password hashing
   - Session management

3. **Add AI Integration** (H030)
   - Anthropic Claude client
   - Prompt engineering
   - Response streaming

4. **Add Testing** (Future)
   - Unit tests with Jest
   - Integration tests
   - E2E tests

---

## Summary

You've learned how to build a production-ready Express.js backend with TypeScript:

✅ Express.js fundamentals and routing
✅ TypeScript strict mode for type safety
✅ Middleware architecture and request flow
✅ Environment variable management
✅ CORS configuration for frontend integration
✅ Error handling patterns
✅ Security best practices
✅ Testing strategies
✅ Performance optimization techniques

**Key Takeaways**:
1. **TypeScript strict mode** catches bugs before runtime
2. **Middleware order matters** - CORS and parsing before routes
3. **Environment variables** keep secrets out of code
4. **Layered error handling** provides better debugging
5. **Graceful shutdown** prevents data corruption
6. **Testing validates** that everything works

Now you're ready to build robust, scalable backend APIs! 🚀

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
**Author**: Healthcare AI Team
**Related Docs**: T002_BackendInit_Log.md, T002_BackendInit_TestLog.md
