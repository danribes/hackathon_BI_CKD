# T001: Monorepo Project Structure - Learning Guide

**Topic**: Creating a Well-Organized Monorepo for Full-Stack Applications
**Level**: Beginner to Intermediate
**Date**: 2025-11-08

---

## What is a Monorepo?

A **monorepo** (monolithic repository) is a software development strategy where code for multiple projects is stored in a single repository. In our case, we're storing both **backend** and **frontend** code in one Git repository.

### Monorepo vs Multi-Repo

| Aspect | Monorepo | Multi-Repo |
|--------|----------|------------|
| **Code Location** | All projects in one repo | Each project in separate repo |
| **Dependencies** | Easier to share code | Must publish packages |
| **Versioning** | Single version number | Independent versions |
| **CI/CD** | Coordinated builds | Independent pipelines |
| **Best For** | Small teams, rapid dev | Large teams, microservices |

For our **hackathon project**, a monorepo is ideal because:
- ✅ Easier to coordinate frontend/backend changes
- ✅ Shared TypeScript types between frontend/backend
- ✅ Simpler deployment (one repo to clone)
- ✅ Better for 1-2 person teams

---

## Why This Structure?

### Backend Organization (`backend/`)

```
backend/
├── src/
│   ├── api/          # Route handlers (thin layer)
│   ├── services/     # Business logic (fat layer)
│   ├── models/       # Data access layer
│   ├── config/       # Configuration files
│   ├── ai/           # AI integration (Claude/GPT-4)
│   ├── types/        # TypeScript definitions
│   └── middleware/   # Express middleware
└── tests/           # Test suites
```

**Principle**: **Separation of Concerns**

Each directory has a single responsibility:

1. **`api/`** - HTTP layer
   - Handles incoming requests
   - Validates input
   - Calls services
   - Returns responses
   - **Example**: `api/patients.ts` defines `GET /api/patients`

2. **`services/`** - Business logic
   - Core application logic
   - Orchestrates multiple operations
   - Testable without HTTP layer
   - **Example**: `services/ai-service.ts` calls AI and formats results

3. **`models/`** - Data layer
   - Database queries
   - Data validation
   - Schema definitions
   - **Example**: `models/patient-model.ts` has `findPatientById()`

4. **`ai/`** - Third-party integrations
   - AI client wrappers
   - Isolated for easy swapping
   - **Example**: `ai/claude-client.ts` can be swapped for `ai/gpt4-client.ts`

5. **`config/`** - Configuration
   - Environment variables
   - Database connections
   - API keys
   - **Example**: `config/database.ts` sets up PostgreSQL pool

6. **`types/`** - Type definitions
   - Shared TypeScript interfaces
   - Request/response types
   - **Example**: `types/patient.ts` defines `Patient` interface

7. **`middleware/`** - Request processing
   - Authentication
   - Logging
   - Error handling
   - **Example**: `middleware/auth.ts` verifies JWT tokens

---

### Frontend Organization (`frontend/`)

```
frontend/
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page-level components
│   ├── api/          # API client functions
│   ├── types/        # TypeScript definitions
│   ├── hooks/        # Custom React hooks
│   └── services/     # Frontend business logic
└── public/          # Static assets (images, fonts)
```

**Principle**: **Component-Based Architecture**

1. **`components/`** - Reusable building blocks
   - Small, focused components
   - Styled with Tailwind CSS
   - **Example**: `RiskIndicator.tsx` (shows LOW/MODERATE/HIGH)

2. **`pages/`** - Full page views
   - Combines multiple components
   - Handles page-level state
   - **Example**: `Dashboard.tsx` (main patient view)

3. **`api/`** - Backend communication
   - Fetch wrappers
   - Type-safe API calls
   - **Example**: `api/patients.ts` has `fetchPatients()`

4. **`hooks/`** - Custom React hooks
   - Reusable stateful logic
   - Follows React conventions
   - **Example**: `usePatientData(patientId)`

5. **`services/`** - Frontend logic
   - Data transformation
   - Calculations
   - **Example**: `services/risk-calculator.ts`

6. **`types/`** - Type definitions
   - Matches backend types
   - Frontend-specific types
   - **Example**: `types/ui.ts` for component props

---

## How It Works: The Request Flow

Let's trace a request from user click to database and back:

### Example: User clicks "AI Risk Analysis" button

```
1. USER ACTION
   └─> clicks button in frontend/src/components/RiskAnalysisButton.tsx

2. FRONTEND API CALL
   └─> frontend/src/api/patients.ts::analyzePatient()
       └─> POST http://localhost:3000/api/analyze

3. BACKEND ROUTE (api/)
   └─> backend/src/api/analyze.ts
       └─> Validates request
       └─> Calls service layer

4. BUSINESS LOGIC (services/)
   └─> backend/src/services/ai-service.ts::performRiskAnalysis()
       └─> Fetches patient data from models/
       └─> Calls AI client

5. AI INTEGRATION (ai/)
   └─> backend/src/ai/claude-client.ts::analyzePatientRisk()
       └─> Sends prompt to Claude API
       └─> Returns structured response

6. DATA LAYER (models/)
   └─> backend/src/models/patient-model.ts::getPatientData()
       └─> Queries PostgreSQL
       └─> Returns patient + observations + conditions

7. RESPONSE FLOWS BACK
   └─> services/ returns formatted data
   └─> api/ sends HTTP response
   └─> frontend/api/ receives JSON
   └─> frontend/components/ updates UI
```

This separation means:
- ✅ Each layer can be tested independently
- ✅ Easy to swap AI providers (Claude → GPT-4)
- ✅ Frontend can work with mock data while backend is built
- ✅ Clear responsibilities = easier debugging

---

## Best Practices Applied

### 1. **Separation of Concerns**
**What**: Each directory has one job
**Why**: Easier to find, test, and modify code
**Example**: AI logic in `ai/`, not mixed with routes in `api/`

### 2. **Dependency Flow**
**What**: Dependencies flow inward
```
api/ → services/ → models/
     ↘  ai/     ↗
```
**Why**: Business logic (services) doesn't know about HTTP, making it reusable
**Example**: `ai-service.ts` can be called from API, CLI, or background job

### 3. **Shared Types**
**What**: TypeScript types defined in `types/`
**Why**: Same `Patient` interface used in frontend and backend
**Example**:
```typescript
// backend/src/types/patient.ts
export interface Patient {
  patient_id: string;
  patient_name: string;
  age: number;
  gender: string;
}

// frontend/src/types/patient.ts (can import from backend)
import { Patient } from '../../backend/src/types/patient';
```

### 4. **Test Proximity**
**What**: Tests live close to code (`backend/tests/`)
**Why**: Easy to find related tests
**Example**: `backend/tests/api/patients.test.ts` tests `backend/src/api/patients.ts`

---

## Infrastructure Separation

```
infrastructure/
├── postgres/     # Database scripts
└── docker/       # Docker configs
```

**Why separate from application code?**
- ✅ Different lifecycle (infra changes less often)
- ✅ Different ownership (DevOps vs developers)
- ✅ Easier to deploy (can grab just `infrastructure/` for deployment)

**What goes in `infrastructure/postgres/`?**
- SQL schema files (`init.sql`)
- Database migrations
- Seed data for development

**What goes in `infrastructure/docker/`?**
- Custom Dockerfiles
- Docker Compose overrides
- Build scripts

---

## Common Pitfalls to Avoid

### ❌ **DON'T**: Mix concerns
```javascript
// BAD: API route with business logic
app.post('/api/analyze', async (req, res) => {
  const patient = await db.query('SELECT * FROM patients WHERE id = $1', [req.body.id]);
  const ai_result = await claude.analyze(patient);  // Business logic in route!
  res.json(ai_result);
});
```

### ✅ **DO**: Separate layers
```javascript
// GOOD: Route delegates to service
app.post('/api/analyze', async (req, res) => {
  const result = await aiService.analyzePatient(req.body.patientId);
  res.json(result);
});

// Service handles business logic
async function analyzePatient(patientId) {
  const patient = await patientModel.findById(patientId);
  return await claudeClient.analyze(patient);
}
```

### ❌ **DON'T**: Deep nesting
```
backend/src/features/patient/api/routes/analysis/risk/diabetes.ts
```
**Why bad**: Hard to navigate, too many folders

### ✅ **DO**: Shallow structure
```
backend/src/api/patient-analysis.ts
```
**Why good**: Easy to find, clear path

---

## When to Modify This Structure

### Add directories when:
- ✅ You have 5+ files doing the same thing
  - Example: 5 different AI clients → create `ai/providers/`
- ✅ A clear new concern emerges
  - Example: Add `validators/` for input validation logic

### DON'T add directories for:
- ❌ Just one file ("future-proofing")
- ❌ Organizational preferences without functional reason
- ❌ Copying another project's structure blindly

---

## Key Takeaways

1. **Monorepos work well for small teams** - Easier coordination, shared code
2. **Separate concerns into directories** - api/, services/, models/ have different jobs
3. **Keep structure shallow** - Max 3 levels deep for easy navigation
4. **Infrastructure separate from application** - Different lifecycle, different ownership
5. **Test proximity matters** - Tests close to code they test
6. **Types can be shared** - One `Patient` interface for frontend + backend

---

## Further Reading

**Monorepo Tools**:
- **Turborepo** - Fast build system for monorepos
- **Nx** - Smart monorepo toolkit
- **Lerna** - Package management for monorepos

**Architecture Patterns**:
- **Clean Architecture** (Robert C. Martin) - Dependency inversion
- **Hexagonal Architecture** - Ports and adapters pattern
- **Domain-Driven Design** - Organizing code by business domains

**Our Approach**:
We're using a **simplified layered architecture** optimized for:
- Hackathon speed (2-3 days)
- Small team (1-2 developers)
- Clear separation without over-engineering

---

## Next Steps

Now that the structure is in place:
1. **H002**: Initialize backend with Express + TypeScript
2. **H003**: Initialize frontend with React + Vite + Tailwind
3. Start filling these directories with actual code!

**Remember**: Structure serves the code, not the other way around. If something doesn't fit, it's okay to adjust!
