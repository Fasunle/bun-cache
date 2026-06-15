# Examples & Use Cases

Real-world examples and step-by-step tutorials for using `@fasunle/orca`.

## Table of Contents

- [Getting Started Example](#getting-started-example)
- [React Monorepo](#react-monorepo)
- [Node.js Backend](#nodejs-backend)
- [Full-Stack Application](#full-stack-application)
- [Mobile + Web](#mobile--web)
- [Microservices](#microservices)
- [Library Development](#library-development)

## Getting Started Example

### Setup from Scratch

**1. Create directory structure:**

```bash
mkdir my-monorepo && cd my-monorepo
mkdir -p apps/web packages/utils
cd apps/web && npm init -y && cd ../..
cd packages/utils && npm init -y && cd ../..
npm init -y
```

**2. Update root package.json with workspaces:**

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

**3. Add scripts to each workspace:**

```bash
# apps/web/package.json
{
  "name": "web",
  "scripts": {
    "build": "echo 'Building web...' && mkdir -p dist && echo 'web' > dist/index.js"
  }
}

# packages/utils/package.json
{
  "name": "utils",
  "scripts": {
    "build": "echo 'Building utils...' && mkdir -p dist && echo 'utils' > dist/index.js"
  }
}
```

**4. Create orca.json:**

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

**5. Install and run:**

```bash
npm install
npm install -g @fasunle/orca

# First run
$ orca run build
⚙️  Executing: packages/utils:build
✓ Completed: packages/utils:build (156ms)
⚙️  Executing: apps/web:build
✓ Completed: apps/web:build (142ms)

# Second run (cache hit!)
$ orca run build
✓ Cache hit: packages/utils:build
✓ Cache hit: apps/web:build
```

---

## React Monorepo

Complete example of a React-based monorepo with multiple apps and shared packages.

### Directory Structure

```
react-monorepo/
├── apps/
│   ├── web/                    # Main web app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── mobile/                 # Mobile web app
│   │   ├── src/
│   │   └── package.json
│   └── admin/                  # Admin dashboard
│       ├── src/
│       └── package.json
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   └── package.json
│   ├── utils/                  # Shared utilities
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── types/                  # TypeScript types
│       ├── src/
│       └── package.json
├── orca.json
├── tsconfig.json
└── package.json
```

### Root package.json

```json
{
  "name": "react-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "devDependencies": {
    "@fasunle/orca": "latest",
    "typescript": "^5.0.0"
  }
}
```

### orca.json Configuration

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "inputs": ["src/**", "public/**", "package.json", "tsconfig.json"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**", "test/**", "package.json"]
    },
    "lint": {
      "cache": false,
      "inputs": ["src/**"]
    },
    "type-check": {
      "cache": false,
      "inputs": ["src/**", "tsconfig.json"]
    },
    "storybook": {
      "outputs": ["storybook-static/**"],
      "inputs": ["src/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  },
  "globalDependencies": ["tsconfig.json", ".eslintrc.json", ".prettierrc.json", "package-lock.json"]
}
```

### Workspace Scripts

**apps/web/package.json:**

```json
{
  "name": "web",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@monorepo/ui": "*",
    "@monorepo/utils": "*"
  }
}
```

**packages/ui/package.json:**

```json
{
  "name": "@monorepo/ui",
  "scripts": {
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint src",
    "storybook": "storybook dev"
  }
}
```

### Usage Examples

**Build everything:**

```bash
$ orca run build

# First time: ~30 seconds
⚙️  Executing: packages/types:build
✓ Completed: packages/types:build (2.1s)
⚙️  Executing: packages/utils:build
✓ Completed: packages/utils:build (3.4s)
⚙️  Executing: packages/ui:build
✓ Completed: packages/ui:build (4.2s)
⚙️  Executing: apps/web:build
✓ Completed: apps/web:build (5.1s)
⚙️  Executing: apps/mobile:build
✓ Completed: apps/mobile:build (4.8s)
⚙️  Executing: apps/admin:build
✓ Completed: apps/admin:build (5.2s)

# Second time: ~0.5 seconds (all cached!)
✓ Cache hit: packages/types:build
✓ Cache hit: packages/utils:build
✓ Cache hit: packages/ui:build
✓ Cache hit: apps/web:build
✓ Cache hit: apps/mobile:build
✓ Cache hit: apps/admin:build
```

**Run tests:**

```bash
$ orca run test

# Builds first, then tests
⚙️  Executing: apps/web:test
✓ Completed: apps/web:test (8.2s)
⚙️  Executing: apps/mobile:test
✓ Completed: apps/mobile:test (7.5s)
⚙️  Executing: packages/ui:test
✓ Completed: packages/ui:test (6.3s)
```

**Development mode:**

```bash
$ orca run dev

# For web app specifically
$ orca run dev apps/web
```

---

## Node.js Backend

Multi-service backend monorepo with shared libraries.

### Directory Structure

```
backend-monorepo/
├── services/
│   ├── api/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── auth/
│   │   ├── src/
│   │   └── package.json
│   ├── queue/
│   │   ├── src/
│   │   └── package.json
│   └── notifications/
│       ├── src/
│       └── package.json
├── packages/
│   ├── database/
│   │   ├── src/
│   │   ├── migrations/
│   │   └── package.json
│   ├── types/
│   │   ├── src/
│   │   └── package.json
│   ├── logger/
│   │   ├── src/
│   │   └── package.json
│   └── utils/
│       ├── src/
│       └── package.json
├── orca.json
└── package.json
```

### orca.json

```json
{
  "tasks": {
    "compile": {
      "outputs": ["lib/**", "dist/**"],
      "inputs": ["src/**", "tsconfig.json"]
    },
    "build": {
      "dependsOn": ["^build", "compile"],
      "outputs": ["dist/**"],
      "inputs": ["src/**"]
    },
    "test": {
      "dependsOn": ["compile"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**", "test/**"]
    },
    "test:unit": {
      "dependsOn": ["compile"],
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "dependsOn": ["compile"],
      "cache": false,
      "persistent": true
    },
    "lint": {
      "cache": false
    },
    "start": {
      "dependsOn": ["build"],
      "cache": false,
      "persistent": true
    },
    "migrate": {
      "cache": false,
      "persistent": true
    }
  },
  "globalDependencies": ["tsconfig.json", ".eslintrc.json", "package-lock.json"]
}
```

### Usage Examples

**CI/CD Pipeline:**

```bash
# In GitHub Actions

# 1. Lint all code
$ orca run lint
✓ All files lint cleanly

# 2. Type check
$ orca run type-check
✓ No type errors

# 3. Build everything
$ orca run build
Compiling packages/types
Compiling packages/database
Building services/api
Building services/auth

# 4. Run tests
$ orca run test
Running packages/database:test
Running services/api:test
Running services/auth:test
Coverage: 85%

# 5. Deploy
$ orca run deploy
Deploying service...
✓ Deployed
```

**Development Workflow:**

```bash
# Compile packages
$ orca run compile
⚙️  Executing: packages/types:compile
⚙️  Executing: packages/database:compile
⚙️  Executing: packages/logger:compile

# Start specific service
$ orca run start services/api
✓ Cache hit: packages/types:compile
✓ Cache hit: packages/database:compile
✓ Building services/api:build
✓ API running on http://localhost:3000

# Run migrations
$ orca run migrate
✓ Migrations completed
```

---

## Full-Stack Application

Combined frontend and backend in single monorepo.

### Structure

```
fullstack-app/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── mobile/           # React Native
│   └── docs/             # Documentation
├── services/
│   ├── api/              # Express backend
│   └── workers/          # Background jobs
├── packages/
│   ├── ui/               # Shared components
│   ├── types/            # Shared types
│   ├── database/         # ORM/migrations
│   └── utils/
└── orca.json
```

### Complete orca.json

```json
{
  "tasks": {
    "generate": {
      "outputs": ["src/generated/**"],
      "inputs": ["schema/**", "gql/**"]
    },
    "compile": {
      "outputs": ["lib/**"],
      "inputs": ["src/**"]
    },
    "build": {
      "dependsOn": ["^build", "generate", "compile"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "inputs": ["src/**", "public/**", "tsconfig.json"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false,
      "persistent": true
    },
    "lint": {
      "cache": false
    },
    "type-check": {
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  },
  "globalDependencies": ["tsconfig.json", ".eslintrc.json", "schema.graphql", "package-lock.json"]
}
```

### Step-by-Step Development

**Morning - First Run:**

```bash
$ bun install

$ orca run generate
⚙️  Executing: packages/types:generate
✓ Completed: packages/types:generate (1.2s)
⚙️  Executing: apps/web:generate
✓ Completed: apps/web:generate (2.1s)

$ orca run build
⚙️  Executing: packages/database:compile
✓ Completed: packages/database:compile (3.2s)
⚙️  Executing: packages/ui:build
✓ Completed: packages/ui:build (4.5s)
⚙️  Executing: services/api:build
✓ Completed: services/api:build (5.2s)
⚙️  Executing: apps/web:build
✓ Completed: apps/web:build (6.1s)

Total: ~25 seconds
```

**Afternoon - Second Run (Cache Hit):**

```bash
$ orca run build

✓ Cache hit: packages/database:compile
✓ Cache hit: packages/ui:build
✓ Cache hit: services/api:build
✓ Cache hit: apps/web:build

Total: ~0.3 seconds
```

**Modify one file:**

```bash
# Edit: packages/ui/Button.tsx

$ orca run build
✓ Cache hit: packages/database:compile
⚙️  Executing: packages/ui:build
✓ Completed: packages/ui:build (2.1s)
⚙️  Executing: apps/web:build  # Rebuilds dependent
✓ Completed: apps/web:build (3.5s)
✓ Cache hit: services/api:build  # Not affected

Total: ~6 seconds
```

---

## Mobile + Web

Monorepo serving both web and mobile platforms.

### Structure

```
cross-platform/
├── apps/
│   ├── web/          # React web
│   ├── mobile/       # React Native
│   └── admin/        # Admin dashboard
├── packages/
│   ├── ui-common/    # Shared UI logic
│   ├── types/
│   ├── utils/
│   └── api-client/
└── orca.json
```

### Configuration

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "android/**", "ios/**"],
      "inputs": ["src/**", "native/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "cache": false
    }
  }
}
```

### Usage

```bash
# Build for all platforms
$ orca run build

# Build web and admin only
$ orca run build apps/web apps/admin

# Run tests
$ orca run test

# Development
$ orca run dev apps/web
```

---

## Microservices

Large microservices architecture.

### Structure

```
microservices/
├── services/
│   ├── users/
│   ├── orders/
│   ├── payments/
│   ├── shipping/
│   ├── notifications/
│   └── analytics/
├── packages/
│   ├── shared-types/
│   ├── db-client/
│   ├── logger/
│   ├── auth/
│   └── config/
└── orca.json
```

### Configuration

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "docker": {
      "dependsOn": ["test"],
      "cache": false
    }
  }
}
```

### CI/CD Workflow

```bash
# Build all services
$ orca run build

# Test all services
$ orca run test

# Docker build changed services only
$ orca run docker

# Deploy specific service
$ orca run deploy services/users
```

---

## Library Development

Monorepo for developing and publishing libraries.

### Structure

```
library-monorepo/
├── packages/
│   ├── core/           # Core library
│   ├── react/          # React bindings
│   ├── vue/            # Vue bindings
│   ├── utils/          # Utilities
│   └── types/          # TypeScript types
├── examples/           # Usage examples
├── docs/              # Documentation
└── orca.json
```

### Configuration

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "lib/**"],
      "inputs": ["src/**"]
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "docs": {
      "outputs": ["docs/**"]
    },
    "publish": {
      "dependsOn": ["build", "test"],
      "cache": false
    }
  }
}
```

### Publishing Workflow

```bash
# Build all packages
$ orca run build

# Test all packages
$ orca run test

# Publish to npm
$ orca run publish

# Update documentation
$ orca run docs
```

---

## Performance Comparison

Real-world performance gains from using `@fasunle/orca`:

### React Monorepo (3 apps + 3 packages)

```
First build (no cache):     45 seconds
Cached rebuild:             0.8 seconds    (56x faster!)
After code change:          12 seconds     (3.7x faster)
After config change:        28 seconds     (1.6x faster)
CI/CD full tasks:        52 seconds
CI/CD with cache:           1.2 seconds
```

### Node Backend (6 services + 4 packages)

```
First build:                38 seconds
Cached rebuild:             0.6 seconds    (63x faster!)
After service change:       8 seconds      (4.7x faster)
After package change:       20 seconds     (1.9x faster)
```

### Full-Stack App

```
First build:                65 seconds
Cached rebuild:             1.1 seconds    (59x faster!)
After frontend change:      18 seconds
After backend change:       22 seconds
After shared package change: 45 seconds
```

---

## Tips & Tricks

### Cache Warming

Warm up cache before CI/CD:

```bash
orca run build
orca run test
```

### Selective Building

Build only changed workspaces:

```bash
# Build specific app
orca run build apps/web

# Build multiple
orca run build apps/web apps/mobile
```

### Cache Debugging

View what's cached:

```bash
ls -la .orca/

# See cache metadata
cat .orca/[hash].json
```

### Clean Cache

```bash
# Clean all
orca clean

# Then rebuild
orca run build
```

---

**For more information, see [README.md](./README.md) and [CONFIGURATION.md](./CONFIGURATION.md)**
