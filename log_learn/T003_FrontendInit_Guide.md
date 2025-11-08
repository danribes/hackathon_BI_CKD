# T003: React + Vite + Tailwind Frontend - Learn & Guide

**Guide Type**: Frontend Development Fundamentals
**Technology Stack**: React 19 + Vite + TypeScript + Tailwind CSS
**Skill Level**: Intermediate
**Estimated Reading Time**: 25 minutes
**Last Updated**: 2025-11-08

---

## Table of Contents

1. [Introduction](#introduction)
2. [Why Vite Over Create React App](#why-vite-over-create-react-app)
3. [React 19 Fundamentals](#react-19-fundamentals)
4. [TypeScript in React](#typescript-in-react)
5. [Tailwind CSS Deep Dive](#tailwind-css-deep-dive)
6. [Project Structure Explained](#project-structure-explained)
7. [Configuration Files Walkthrough](#configuration-files-walkthrough)
8. [Component Architecture](#component-architecture)
9. [State Management with Hooks](#state-management-with-hooks)
10. [API Integration Patterns](#api-integration-patterns)
11. [Styling Best Practices](#styling-best-practices)
12. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
13. [Performance Optimization](#performance-optimization)
14. [Testing Strategies](#testing-strategies)
15. [Production Deployment](#production-deployment)
16. [Further Learning](#further-learning)

---

## Introduction

This guide explains how to build a modern React application using Vite as the build tool, TypeScript for type safety, and Tailwind CSS for styling. You'll learn the architecture, best practices, and patterns used in professional frontend development.

### What You'll Learn

- Why Vite is the modern choice for React projects
- How to use React 19 features effectively
- TypeScript integration in React components
- Tailwind CSS utility-first approach
- React Hooks for state management
- API integration and error handling
- Performance optimization techniques
- Production build and deployment

### Prerequisites

- JavaScript ES6+ knowledge
- Basic React understanding (components, props, state)
- Basic TypeScript familiarity
- Understanding of npm/package managers

---

## Why Vite Over Create React App

### The Evolution

**Create React App (CRA)**:
- Released 2016
- Webpack-based bundler
- Slow cold starts (30-60 seconds)
- Slow hot module replacement (HMR)
- Officially deprecated/unmaintained

**Vite**:
- Released 2020
- ES modules + Rollup
- Instant cold starts (<1 second)
- Lightning-fast HMR (<100ms)
- Actively maintained by Vue.js team

### Performance Comparison

```
Development Server Startup:
CRA:   ████████████████████████████ 30s
Vite:  █ <1s

Hot Module Replacement:
CRA:   ████ 2-5s
Vite:  < 100ms

Production Build:
CRA:   ████████████ 60s
Vite:  ███ 15s
```

### How Vite Works

**Development Mode**:
```
Traditional (Webpack/CRA):
Source Files → Bundle Everything → Dev Server → Browser
(30-60s startup, slow updates)

Vite:
Source Files → Native ES Modules → Browser (on demand)
(<1s startup, instant updates)
```

**Key Concepts**:

1. **Native ES Modules**: Browser loads modules directly
2. **On-Demand Compilation**: Only compiles requested files
3. **Pre-bundling**: Dependencies bundled once with esbuild
4. **Smart Caching**: Leverages browser cache for dependencies

**Example**:
```typescript
// When you change this file:
export function MyComponent() {
  return <div>Hello</div>
}

// CRA: Rebundles entire app (2-5s)
// Vite: Only reloads this module (<100ms)
```

### Why This Matters

**Developer Experience**:
- Start coding immediately (no waiting)
- See changes instantly (no context switching)
- Stay in flow state (no interruptions)

**Team Productivity**:
- 100+ saves per day per developer
- 2-5s → <100ms = 3 hours saved per developer per day
- Happier developers = better code

---

## React 19 Fundamentals

### What's New in React 19

**Major Features**:
1. **React Compiler** (Auto-optimization)
2. **Server Components** (Better SSR)
3. **Actions** (Form handling)
4. **use() Hook** (Resource loading)
5. **Better TypeScript support**

### Core Concepts Review

#### 1. Components

Building blocks of React applications:

```typescript
// Functional Component (Modern)
function Welcome({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>
}

// Usage
<Welcome name="Alice" />
```

**Why Functional Components**:
- ✅ Simpler syntax
- ✅ Better performance
- ✅ Hooks support
- ✅ Easier to test
- ✅ Less boilerplate

#### 2. JSX

JavaScript XML - Write HTML-like syntax in JavaScript:

```typescript
// JSX (what you write)
const element = <h1 className="title">Hello</h1>

// Compiled JavaScript (what browser runs)
const element = React.createElement(
  'h1',
  { className: 'title' },
  'Hello'
)
```

**JSX Rules**:
1. Must return single root element
2. Use `className` instead of `class`
3. Use `htmlFor` instead of `for`
4. Expressions in `{curly braces}`
5. Self-closing tags must have `/>`

#### 3. Props

Pass data from parent to child:

```typescript
// Parent component
function App() {
  return <UserCard name="John" age={30} isAdmin={true} />
}

// Child component
interface UserCardProps {
  name: string;
  age: number;
  isAdmin: boolean;
}

function UserCard({ name, age, isAdmin }: UserCardProps) {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      {isAdmin && <span>Admin</span>}
    </div>
  )
}
```

**Props Best Practices**:
- ✅ Always define TypeScript interfaces
- ✅ Destructure in function parameters
- ✅ Provide default values where appropriate
- ✅ Keep props simple (avoid deeply nested objects)

#### 4. Virtual DOM

React's secret sauce for performance:

```
User Changes State
    ↓
React Creates New Virtual DOM
    ↓
React Compares (Diffing)
    ↓
React Updates Only Changed Parts
    ↓
Browser DOM Updated Minimally
```

**Why It's Fast**:
- Direct DOM manipulation: slow (repaints, reflows)
- Virtual DOM: in-memory JavaScript objects (fast)
- Only changed elements updated (minimal work)

---

## TypeScript in React

### Why TypeScript in Frontend?

**Without TypeScript** (Prone to errors):
```javascript
// JavaScript - Runtime errors waiting to happen
function UserCard({ user }) {
  return <div>{user.name}</div>
}

<UserCard user={{ nam: "John" }} /> // Typo! Undefined at runtime
<UserCard user={null} /> // Crash! Cannot read name of null
<UserCard /> // Crash! Cannot read name of undefined
```

**With TypeScript** (Caught at compile time):
```typescript
// TypeScript - Errors caught before running
interface User {
  name: string;
  age: number;
}

function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>
}

<UserCard user={{ nam: "John" }} /> // ❌ Error: Property 'name' missing
<UserCard user={null} /> // ❌ Error: Type 'null' not assignable to 'User'
<UserCard /> // ❌ Error: Property 'user' is missing
<UserCard user={{ name: "John", age: 30 }} /> // ✅ Correct!
```

### React TypeScript Patterns

#### Pattern 1: Component Props

```typescript
// Basic props
interface ButtonProps {
  text: string;
  onClick: () => void;
}

function Button({ text, onClick }: ButtonProps) {
  return <button onClick={onClick}>{text}</button>
}

// Props with children
interface CardProps {
  title: string;
  children: React.ReactNode; // Any valid React element
}

function Card({ title, children }: CardProps) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

// Optional props
interface HeaderProps {
  title: string;
  subtitle?: string; // Optional
  onClose?: () => void; // Optional
}

function Header({ title, subtitle, onClose }: HeaderProps) {
  return (
    <header>
      <h1>{title}</h1>
      {subtitle && <h2>{subtitle}</h2>}
      {onClose && <button onClick={onClose}>X</button>}
    </header>
  )
}
```

#### Pattern 2: State with TypeScript

```typescript
import { useState } from 'react'

// Simple state
const [count, setCount] = useState<number>(0)

// Object state
interface User {
  name: string;
  email: string;
}

const [user, setUser] = useState<User | null>(null)

// Array state
const [items, setItems] = useState<string[]>([])

// Complex state
interface FormData {
  username: string;
  password: string;
  remember: boolean;
}

const [formData, setFormData] = useState<FormData>({
  username: '',
  password: '',
  remember: false
})
```

#### Pattern 3: Event Handlers

```typescript
// Mouse events
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  console.log(event.currentTarget) // The button element
}

// Input events
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log(event.target.value) // Input value
}

// Form events
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  // Handle form submission
}

// Usage
<button onClick={handleClick}>Click</button>
<input onChange={handleChange} />
<form onSubmit={handleSubmit}>...</form>
```

---

## Tailwind CSS Deep Dive

### Utility-First CSS Philosophy

**Traditional CSS** (Component-based):
```css
/* styles.css */
.button {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.button:hover {
  background-color: #2563eb;
}
```

```html
<button class="button">Click me</button>
```

**Tailwind CSS** (Utility-first):
```html
<button class="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600">
  Click me
</button>
```

### Why Utility-First?

**Advantages**:
1. **No Naming**: No need to think of class names
2. **No Switching**: Write styles in HTML, no context switching
3. **No Duplication**: Utilities are reusable
4. **Tree-Shakable**: Unused styles removed automatically
5. **Consistent**: Design system built-in
6. **Fast**: Build exactly what you need

**Disadvantages**:
1. **HTML Clutter**: Many classes in markup
2. **Learning Curve**: Need to learn utility names
3. **Repetition**: Similar components need similar classes

**Solution**: Extract components for reusable patterns

```typescript
// Reusable button component
function PrimaryButton({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600 transition"
    >
      {children}
    </button>
  )
}

// Use everywhere
<PrimaryButton onClick={handleClick}>Save</PrimaryButton>
<PrimaryButton onClick={handleSubmit}>Submit</PrimaryButton>
```

### Tailwind Utility Classes Explained

#### Spacing

```html
<!-- Padding -->
<div class="p-4">     <!-- padding: 1rem (16px) all sides -->
<div class="px-4">    <!-- padding-left and padding-right: 1rem -->
<div class="py-2">    <!-- padding-top and padding-bottom: 0.5rem -->
<div class="pt-8">    <!-- padding-top: 2rem -->

<!-- Margin -->
<div class="m-4">     <!-- margin: 1rem all sides -->
<div class="mx-auto">  <!-- margin-left and margin-right: auto (centering) -->
<div class="mt-2">    <!-- margin-top: 0.5rem -->

<!-- Spacing scale: 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32 -->
```

#### Colors

```html
<!-- Text colors -->
<p class="text-gray-700">     <!-- Dark gray text -->
<p class="text-blue-500">     <!-- Medium blue text -->
<p class="text-red-600">      <!-- Darker red text -->

<!-- Background colors -->
<div class="bg-white">        <!-- White background -->
<div class="bg-gray-50">      <!-- Very light gray background -->
<div class="bg-indigo-900">   <!-- Very dark indigo background -->

<!-- Color scale: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 -->
<!-- 50 = lightest, 500 = medium, 900 = darkest -->
```

#### Sizing

```html
<!-- Width -->
<div class="w-full">      <!-- width: 100% -->
<div class="w-1/2">       <!-- width: 50% -->
<div class="w-64">        <!-- width: 16rem (256px) -->

<!-- Height -->
<div class="h-screen">    <!-- height: 100vh -->
<div class="h-full">      <!-- height: 100% -->
<div class="h-12">        <!-- height: 3rem (48px) -->

<!-- Max width -->
<div class="max-w-xl">    <!-- max-width: 36rem (576px) -->
<div class="max-w-screen-lg"> <!-- max-width: 1024px -->
```

#### Flexbox

```html
<!-- Flex container -->
<div class="flex">                    <!-- display: flex -->
<div class="flex justify-center">     <!-- justify-content: center -->
<div class="flex items-center">       <!-- align-items: center -->
<div class="flex flex-col">           <!-- flex-direction: column -->
<div class="flex gap-4">              <!-- gap: 1rem between children -->

<!-- Flex children -->
<div class="flex-1">                  <!-- flex: 1 (grow to fill space) -->
<div class="flex-shrink-0">           <!-- flex-shrink: 0 (don't shrink) -->
```

#### Responsive Design

```html
<!-- Mobile-first approach -->
<div class="text-sm md:text-base lg:text-lg">
  <!-- Small text on mobile -->
  <!-- Base size on tablets (md) -->
  <!-- Large text on desktops (lg) -->
</div>

<!-- Breakpoints -->
<!-- sm: 640px -->
<!-- md: 768px -->
<!-- lg: 1024px -->
<!-- xl: 1280px -->
<!-- 2xl: 1536px -->

<!-- Example: Responsive layout -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- 1 column on mobile -->
  <!-- 2 columns on tablets -->
  <!-- 3 columns on desktop -->
</div>
```

#### States (Hover, Focus, etc.)

```html
<!-- Hover -->
<button class="bg-blue-500 hover:bg-blue-600">
  <!-- Blue background, darker on hover -->
</button>

<!-- Focus -->
<input class="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
  <!-- Blue border and ring on focus -->
</input>

<!-- Active -->
<button class="bg-blue-500 active:bg-blue-700">
  <!-- Even darker when clicked -->
</button>

<!-- Disabled -->
<button class="bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed">
  Disabled button style
</button>
```

### Tailwind Configuration

#### tailwind.config.js Explained

```javascript
export default {
  // Where to look for classes
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // All source files
  ],

  // Customize theme
  theme: {
    extend: {
      // Add custom colors
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
      },
      // Add custom spacing
      spacing: {
        '128': '32rem',
      },
      // Add custom fonts
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },

  // Add plugins
  plugins: [],
}
```

**How Content Scanning Works**:
```
1. Tailwind scans all files in content array
2. Finds all class names used
3. Generates CSS only for those classes
4. Unused classes removed (tree-shaking)
5. Tiny production bundle
```

---

## Project Structure Explained

### File Organization

```
frontend/
├── index.html              # Entry point HTML
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript root config
├── tsconfig.app.json       # App TypeScript config
├── tsconfig.node.json      # Build script TypeScript config
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
└── src/
    ├── main.tsx            # React bootstrap
    ├── App.tsx             # Root component
    ├── App.css             # Component styles
    ├── index.css           # Global styles + Tailwind
    ├── vite-env.d.ts       # Vite type definitions
    ├── components/         # Reusable components
    ├── pages/              # Page components
    ├── api/                # API client functions
    ├── hooks/              # Custom React hooks
    ├── types/              # TypeScript types
    └── services/           # Business logic
```

### Configuration Files Deep Dive

#### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()], // React JSX + Fast Refresh

  server: {
    port: 5173, // Dev server port
    proxy: {
      // Proxy API calls to backend
      '/api': {
        target: 'http://localhost:3000', // Backend server
        changeOrigin: true, // Change host header
      }
    }
  }
})
```

**Why Proxy?**:
```
Without Proxy:
Frontend (localhost:5173) → Backend (localhost:3000)
                          ↓
                    CORS Error!

With Proxy:
Frontend → Vite Dev Server → Backend
(same origin)  (proxies)    (no CORS issue)
```

#### tsconfig.app.json

```json
{
  "compilerOptions": {
    "target": "ES2022",           // Modern JavaScript features
    "lib": ["ES2022", "DOM"],     // Standard library + Browser APIs
    "jsx": "react-jsx",           // New JSX transform (no import React)
    "strict": true,               // All strict checks
    "noUnusedLocals": true,       // Catch unused variables
    "noUnusedParameters": true,   // Catch unused parameters
    "moduleResolution": "Bundler" // Vite-specific module resolution
  }
}
```

---

## Component Architecture

### Our App Component Breakdown

Let's analyze the App.tsx component:

```typescript
import { useState, useEffect } from 'react'

// 1. Type Definitions
interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  environment: string;
}

function App() {
  // 2. State Management
  const [backendHealth, setBackendHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Side Effects
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/health`);

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        setBackendHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect');
        setBackendHealth(null);
      } finally {
        setLoading(false);
      }
    };

    checkBackendHealth();
  }, []); // Empty dependency array = run once on mount

  // 4. Render Logic
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Component JSX */}
    </div>
  )
}

export default App
```

### Component Structure Best Practices

**1. Import Organization**:
```typescript
// React imports first
import { useState, useEffect } from 'react'

// Third-party libraries
import axios from 'axios'

// Local components
import Button from './components/Button'

// Styles last
import './App.css'
```

**2. Type Definitions**:
```typescript
// Interfaces before component
interface Props {
  // ...
}

// Type aliases for complex types
type Status = 'idle' | 'loading' | 'success' | 'error'
```

**3. Component Order**:
```typescript
function Component() {
  // 1. State declarations
  const [state, setState] = useState()

  // 2. Hooks
  useEffect(() => {})

  // 3. Event handlers
  const handleClick = () => {}

  // 4. Helper functions
  const formatDate = () => {}

  // 5. Render
  return <div>...</div>
}
```

---

## State Management with Hooks

### useState Hook

**Purpose**: Add state to functional components

```typescript
// Basic usage
const [count, setCount] = useState(0)

// Update state
setCount(count + 1)           // Using current state
setCount(prev => prev + 1)    // Using previous state (safer)

// Object state
const [user, setUser] = useState({ name: '', age: 0 })

// Update object (must spread)
setUser({ ...user, name: 'John' })  // Keep age, update name

// Array state
const [items, setItems] = useState<string[]>([])

// Add item
setItems([...items, 'new item'])

// Remove item
setItems(items.filter(item => item !== 'to-remove'))
```

**Common Pitfalls**:

```typescript
// ❌ WRONG - Direct mutation
const [user, setUser] = useState({ name: 'John' })
user.name = 'Jane'  // Doesn't trigger re-render
setUser(user)       // React sees same object reference

// ✅ CORRECT - Create new object
setUser({ ...user, name: 'Jane' })  // New object, triggers re-render
```

### useEffect Hook

**Purpose**: Handle side effects (API calls, subscriptions, timers)

```typescript
// Run once on mount
useEffect(() => {
  console.log('Component mounted')
}, []) // Empty array = run once

// Run on every render
useEffect(() => {
  console.log('Component rendered')
}) // No array = run always

// Run when dependencies change
useEffect(() => {
  console.log(`Count changed to ${count}`)
}, [count]) // Run when count changes

// Cleanup
useEffect(() => {
  const timer = setInterval(() => {
    console.log('Tick')
  }, 1000)

  // Cleanup function
  return () => {
    clearInterval(timer) // Clean up on unmount
  }
}, [])
```

**Dependency Array Rules**:

```typescript
// ❌ WRONG - Missing dependency
useEffect(() => {
  console.log(count)  // Uses count
}, []) // Should include count!

// ✅ CORRECT - Include all dependencies
useEffect(() => {
  console.log(count)
}, [count])

// ❌ WRONG - Object/array in dependencies
useEffect(() => {
  // ...
}, [{ id: 1 }]) // New object every render = infinite loop

// ✅ CORRECT - Primitive values only
useEffect(() => {
  // ...
}, [id]) // Use primitive instead
```

### Custom Hooks

Extract reusable logic:

```typescript
// Custom hook for fetching data
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url)
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return { data, loading, error }
}

// Usage
function MyComponent() {
  const { data, loading, error } = useFetch<User>('/api/user')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  return <div>{data?.name}</div>
}
```

---

## API Integration Patterns

### Fetching Data

#### Pattern 1: Basic Fetch

```typescript
const [data, setData] = useState(null)

useEffect(() => {
  fetch('http://localhost:3000/api/patients')
    .then(res => res.json())
    .then(data => setData(data))
    .catch(err => console.error(err))
}, [])
```

#### Pattern 2: Async/Await (Better)

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/patients')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setData(data)
    } catch (err) {
      console.error(err)
    }
  }

  fetchData()
}, [])
```

#### Pattern 3: With Loading & Error States (Best)

```typescript
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/api/patients')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const json = await response.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [])

// Render
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage message={error} />
if (!data) return null
return <DataDisplay data={data} />
```

### Environment Variables in Vite

```typescript
// .env file
VITE_API_URL=http://localhost:3000
VITE_API_KEY=secret123

// Accessing in code
const apiUrl = import.meta.env.VITE_API_URL
const apiKey = import.meta.env.VITE_API_KEY

// TypeScript types (vite-env.d.ts)
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_KEY: string
}
```

**Important**: Only variables prefixed with `VITE_` are exposed to client!

---

## Styling Best Practices

### Responsive Design with Tailwind

```html
<!-- Mobile-first approach -->
<div class="
  px-4              <!-- 1rem padding on mobile -->
  sm:px-6           <!-- 1.5rem padding on small screens -->
  lg:px-8           <!-- 2rem padding on large screens -->
  max-w-7xl         <!-- Max width constraint -->
  mx-auto           <!-- Center horizontally -->
">
  <h1 class="
    text-2xl        <!-- Large text on mobile -->
    sm:text-3xl     <!-- Larger on tablets -->
    lg:text-4xl     <!-- Largest on desktop -->
    font-bold
  ">
    Responsive Heading
  </h1>
</div>
```

### Component Composition

```typescript
// Base button
function BaseButton({ children, className, ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded font-semibold transition ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Variants
function PrimaryButton(props) {
  return (
    <BaseButton
      className="bg-blue-500 text-white hover:bg-blue-600"
      {...props}
    />
  )
}

function SecondaryButton(props) {
  return (
    <BaseButton
      className="bg-gray-200 text-gray-800 hover:bg-gray-300"
      {...props}
    />
  )
}
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Infinite useEffect Loop

```typescript
// ❌ WRONG - Infinite loop
useEffect(() => {
  setCount(count + 1)  // Triggers re-render
}, [count])            // Re-runs when count changes → infinite loop

// ✅ CORRECT - Remove from dependencies if not needed
useEffect(() => {
  setCount(prev => prev + 1)
}, []) // Run once
```

### Pitfall 2: State Update Timing

```typescript
// ❌ WRONG - State updates are asynchronous
const handleClick = () => {
  setCount(count + 1)
  console.log(count)  // Still shows old value!
}

// ✅ CORRECT - Use callback or next render
const handleClick = () => {
  setCount(prev => {
    const newCount = prev + 1
    return newCount
  })
}

// Or log in useEffect
useEffect(() => {
  console.log(count)  // Shows updated value
}, [count])
```

### Pitfall 3: Object/Array State Mutation

```typescript
// ❌ WRONG - Mutating state directly
const handleAdd = () => {
  items.push('new')  // Mutates array
  setItems(items)    // React won't detect change
}

// ✅ CORRECT - Create new array
const handleAdd = () => {
  setItems([...items, 'new'])  // New array
}
```

### Pitfall 4: Missing Keys in Lists

```typescript
// ❌ WRONG - Using index as key
{items.map((item, index) => (
  <div key={index}>{item}</div>  // Causes issues when reordering
))}

// ✅ CORRECT - Use unique ID
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}
```

---

## Performance Optimization

### React.memo

Prevent unnecessary re-renders:

```typescript
// Without memo - re-renders every time parent renders
function ExpensiveComponent({ data }) {
  return <div>{data}</div>
}

// With memo - only re-renders when props change
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>
})
```

### useMemo

Memoize expensive calculations:

```typescript
function MyComponent({ items }) {
  // ❌ Recalculates on every render
  const total = items.reduce((sum, item) => sum + item.price, 0)

  // ✅ Only recalculates when items change
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  )

  return <div>Total: {total}</div>
}
```

### useCallback

Memoize function references:

```typescript
function Parent() {
  // ❌ New function on every render
  const handleClick = () => {
    console.log('clicked')
  }

  // ✅ Same function reference unless dependencies change
  const handleClick = useCallback(() => {
    console.log('clicked')
  }, [])

  return <ExpensiveChild onClick={handleClick} />
}
```

---

## Testing Strategies

### Component Testing with Vitest

```typescript
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders app title', () => {
  render(<App />)
  expect(screen.getByText(/Healthcare AI/i)).toBeInTheDocument()
})

test('shows loading state initially', () => {
  render(<App />)
  expect(screen.getByText(/Checking backend/i)).toBeInTheDocument()
})
```

### E2E Testing with Playwright

```typescript
import { test, expect } from '@playwright/test'

test('health check displays backend status', async ({ page }) => {
  await page.goto('http://localhost:5173')

  // Wait for health check
  await page.waitForSelector('.bg-green-50')

  // Verify backend connected
  expect(await page.textContent('h3')).toContain('Backend Connected')
})
```

---

## Production Deployment

### Build for Production

```bash
npm run build
```

**Output**:
```
dist/
├── index.html          # Entry HTML
├── assets/
│   ├── index.[hash].css   # Bundled CSS
│   └── index.[hash].js    # Bundled JS
└── vite.svg
```

**Optimizations**:
- Code splitting
- Tree shaking
- Minification
- Gzip compression

### Environment Variables

```bash
# .env.production
VITE_API_URL=https://api.yourdomain.com
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

---

## Further Learning

### Official Documentation
- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### Recommended Courses
- React Official Tutorial
- TypeScript Handbook
- Tailwind CSS from Scratch

### Next Steps
1. Learn React Router for navigation
2. Explore state management (Zustand, Redux)
3. Master form handling (React Hook Form)
4. Add testing (Vitest, Playwright)
5. Learn server-side rendering (Next.js)

---

## Summary

You've learned how to build modern React applications with:

✅ **Vite** - Lightning-fast development
✅ **React 19** - Latest features and patterns
✅ **TypeScript** - Type safety and better DX
✅ **Tailwind CSS** - Rapid styling
✅ **Hooks** - State and effect management
✅ **API Integration** - Fetching and error handling
✅ **Best Practices** - Professional patterns

**Key Takeaways**:
1. Vite provides instant feedback during development
2. TypeScript catches errors before they reach users
3. Tailwind accelerates UI development
4. Hooks enable clean, functional components
5. Proper error handling improves UX
6. Component composition creates maintainable code

Now you're ready to build production-ready React applications! 🚀

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
**Author**: Healthcare AI Team
**Related Docs**: T003_FrontendInit_Log.md, T003_FrontendInit_TestLog.md
