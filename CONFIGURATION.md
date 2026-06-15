# Configuration Guide

Complete reference for configuring `@fasunle/orca` with `orca.json`.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Pipeline Configuration](#tasks-configuration)
- [Task Configuration](#task-configuration)
- [Advanced Features](#advanced-features)
- [Configuration Examples](#configuration-examples)
- [Best Practices](#best-practices)

## Basic Configuration

### Minimal orca.json

The smallest working configuration:

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"]
    }
  }
}
```

This tells orca:

- There's a `build` task
- Cache outputs in `dist/` folder

### Root-Level Options

```json
{
  "tasks": { ... },
  "globalDependencies": [
    "tsconfig.json",
    ".eslintrc.json",
    "package-lock.json"
  ]
}
```

**globalDependencies**: Files at repository root that affect all tasks. When these change, all caches are invalidated.

## Pipeline Configuration

The tasks defines all available tasks:

```json
{
  "tasks": {
    "build": { ... },
    "test": { ... },
    "lint": { ... },
    "dev": { ... },
    "deploy": { ... }
  }
}
```

Each task can have different configurations.

## Task Configuration

### Complete Task Schema

```json
{
  "build": {
    "dependsOn": ["^build"],
    "outputs": ["dist/**"],
    "cache": true,
    "inputs": ["src/**", "package.json"],
    "persistent": false,
    "hashAlgorithm": "sha256"
  }
}
```

### Task Options

#### `dependsOn` (string[])

Tasks that must complete before this task runs.

**Types:**

1. **Same task in dependencies** - Prefix with `^`

```json
{
  "build": {
    "dependsOn": ["^build"] // "Depends on ^build"
  }
}
```

For `apps/web/package.json`:

- If web depends on utils
- Then web:build waits for utils:build first

2. **Another task** - Just the task name

```json
{
  "test": {
    "dependsOn": ["build"] // "Depends on build"
  }
}
```

For each workspace, test waits for that workspace's build first.

3. **Specific workspace task** - Use `workspace#task`

```json
{
  "deploy": {
    "dependsOn": ["build", "web#test", "api#test"]
  }
}
```

4. **Multiple dependencies**

```json
{
  "deploy": {
    "dependsOn": ["^build", "test", "lint"]
  }
}
```

Runs in this order:

1. Dependencies' builds (parallel if independent)
2. This workspace's test (waits for build first)
3. This workspace's lint (runs after test)
4. Then deploy

#### `outputs` (string[])

Glob patterns for files/folders to cache.

**Examples:**

```json
{
  "build": {
    "outputs": [
      "dist/**", // Everything in dist/
      "build/**", // Everything in build/
      ".next/**", // Next.js output
      "lib/**" // Compiled output
    ]
  }
}
```

**Cache behavior:**

- Files matching these patterns are stored in cache
- On cache hit, files are restored to original location
- Only these files are considered for cache validation

**Important:** Specify all output locations or cache won't work properly!

#### `cache` (boolean, default: true)

Enable or disable caching for this task.

```json
{
  "build": {
    "cache": true // Caching enabled (default)
  },
  "lint": {
    "cache": false // Don't cache lint results
  },
  "test": {
    "cache": true // Cache test results
  }
}
```

**When to disable:**

- Lint/format tasks (side effects)
- Random tests
- Tasks with file system side effects
- Tasks that shouldn't be cached

**When to enable:**

- Build/compile tasks
- Tests (with deterministic results)
- Code generation
- Any task with pure input→output mapping

#### `inputs` (string[])

Files to consider when generating cache hash.

**Default:** All source files in workspace

**Explicit specification:**

```json
{
  "build": {
    "inputs": ["src/**", "public/**", "package.json", "tsconfig.json", "webpack.config.js"]
  }
}
```

**Cache invalidation:**
When any file matching these patterns changes, cache is invalidated.

**Performance tip:**
Specify inputs explicitly to avoid unnecessary cache invalidation.

#### `persistent` (boolean, default: false)

Keep process running after task (for dev servers).

```json
{
  "dev": {
    "cache": false,
    "persistent": true
  }
}
```

#### `hashAlgorithm` (string, default: "sha256")

Algorithm for cache key generation.

```json
{
  "build": {
    "hashAlgorithm": "sha256" // Options: "sha1", "sha256", "md5"
  }
}
```

## Advanced Features

### Conditional Task Configuration

Different configs per environment:

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"],
      "cache": true
    },
    "ci": {
      "dependsOn": ["build", "test", "lint"],
      "cache": false
    }
  }
}
```

### Workspace-Specific Outputs

Handle different output directories:

```json
{
  "build": {
    "outputs": ["dist/**", "build/**", ".next/**", "coverage/**", "lib/**"]
  }
}
```

orca automatically handles each workspace's own output directory.

### Global Dependencies

Files affecting all tasks:

```json
{
  "globalDependencies": [
    "tsconfig.json",
    ".eslintrc.json",
    ".prettierrc",
    "package-lock.json",
    "bun.lockb"
  ]
}
```

When these files change:

- All task caches are invalidated
- All tasks rebuild on next run
- Perfect for configuration files

### Fine-Grained Inputs

```json
{
  "build": {
    "inputs": [
      "src/**",
      "!src/**/*.test.ts", // Exclude tests
      "!src/**/*.stories.ts", // Exclude storybook
      "public/**",
      "package.json",
      "tsconfig.json"
    ]
  }
}
```

## Configuration Examples

### React Monorepo

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"],
      "inputs": ["src/**", "public/**", "package.json"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "storybook": {
      "outputs": ["storybook-static/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "cache": false
    }
  },
  "globalDependencies": ["tsconfig.json", ".eslintrc.json", "package-lock.json"]
}
```

### Node.js Monorepo

```json
{
  "tasks": {
    "compile": {
      "outputs": ["lib/**", "dist/**"],
      "inputs": ["src/**", "tsconfig.json"]
    },
    "test": {
      "dependsOn": ["compile"],
      "outputs": ["coverage/**"]
    },
    "build": {
      "dependsOn": ["^build", "test"],
      "outputs": ["dist/**"]
    },
    "start": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Full-Stack Monorepo

```json
{
  "tasks": {
    "generate": {
      "outputs": ["src/generated/**"],
      "inputs": ["schema/**", "gql/**"]
    },
    "build": {
      "dependsOn": ["^build", "generate"],
      "outputs": ["dist/**", ".next/**"],
      "inputs": ["src/**", "public/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**", "test/**"]
    },
    "type-check": {
      "cache": false,
      "inputs": ["src/**", "types/**"]
    },
    "lint": {
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "deploy": {
      "dependsOn": ["^build", "test"],
      "cache": false
    }
  },
  "globalDependencies": ["tsconfig.json", ".eslintrc.json", ".prettierrc", "package-lock.json"]
}
```

### Monorepo with Shared Build Tasks

```json
{
  "tasks": {
    "prebuild": {
      "outputs": ["generated/**"]
    },
    "build": {
      "dependsOn": ["^build", "prebuild"],
      "outputs": ["dist/**", "lib/**"]
    },
    "postbuild": {
      "dependsOn": ["build"],
      "cache": false
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## Best Practices

### 1. Always Specify Outputs

```json
{
  "build": {
    "outputs": ["dist/**"] // ✅ Good
  }
}
```

Without outputs, caching is ineffective.

### 2. Be Explicit with Inputs

```json
{
  "build": {
    "inputs": ["src/**", "package.json", "tsconfig.json"] // ✅ Good
  }
}
```

Instead of relying on defaults.

### 3. Use dependsOn for Order

```json
{
  "test": {
    "dependsOn": ["build"] // ✅ Good - ensures build first
  }
}
```

### 4. Disable Cache for Non-Deterministic Tasks

```json
{
  "test-random": {
    "cache": false // ✅ Good - random seed each run
  }
}
```

### 5. Use ^ for Monorepo Dependencies

```json
{
  "build": {
    "dependsOn": ["^build"] // ✅ Good - waits for package deps
  }
}
```

### 6. Exclude Test Files from Cache Inputs

```json
{
  "build": {
    "inputs": [
      "src/**",
      "!src/**/*.test.ts" // ✅ Good - tests don't affect build
    ]
  }
}
```

### 7. Document Your Pipeline

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"],
      "inputs": ["src/**"],
      "cache": true
      // Builds the application bundles
    }
  }
}
```

### 8. Validate Configuration

```bash
# Check for common issues
npx @fasunle/orca validate

# Or manually test
orca run build --verbose
```

## Troubleshooting Configuration

### Cache Not Working

**Check:**

1. `outputs` defined?
2. Files actually created in output folder?
3. Cache directory exists: `ls .orca`

### Tasks Running Sequentially When They Should Be Parallel

**Check:**

1. Unnecessary `dependsOn` entries?
2. Circular dependencies?
3. Use `--verbose` to see execution order

### Inputs Too Broad

**Problem:** Cache invalidates too often

**Solution:**

```json
{
  "inputs": ["src/**", "!src/**/*.test.ts", "!src/**/*.stories.ts"]
}
```

### Outputs Not Cached

**Check:**

```bash
# Verify outputs match folder structure
ls apps/web/dist/
ls packages/utils/dist/

# Check cache
ls .orca/
```

## Migration from Orca

orca uses the same `orca.json` format, so migration is simple!

### Convert Orca Config

```json
{
  "orca": {
    "tasks": { ... }
  }
}
```

Change to:

```json
{
  "tasks": { ... }
}
```

That's it! Most configs work as-is.

## Quick Reference

```json
{
  "tasks": {
    "taskName": {
      "dependsOn": ["^taskName"], // String array
      "outputs": ["dist/**"], // Glob patterns
      "cache": true, // Boolean
      "inputs": ["src/**"], // Glob patterns
      "persistent": false, // Boolean
      "hashAlgorithm": "sha256" // String
    }
  },
  "globalDependencies": ["tsconfig.json"]
}
```

---

**For more examples, see [EXAMPLES.md](./EXAMPLES.md)**
