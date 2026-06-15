# FAQ & Troubleshooting

Common questions and solutions for `@fasunle/orca`.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Caching Issues](#caching-issues)
- [Performance](#performance)
- [Development](#development)
- [Deployment](#deployment)
- [Error Messages](#error-messages)

---

## Installation & Setup

### Q: How do I install @fasunle/orca?

**A:** Three options:

```bash
# Global installation (recommended)
npm install -g @fasunle/orca

# Local installation
npm install --save-dev @fasunle/orca

# Bun installation
bun install @fasunle/orca
```

### Q: What's the minimum Node.js version?

**A:** Node.js 18.x or higher. We also support Bun 1.0.0+.

Check your version:

```bash
node --version   # Should be v18.x or higher
bun --version    # Should be 1.0.0 or higher
```

### Q: Do I need orca.json to use orca?

**A:** Yes. The `orca.json` file defines your task tasks. Create a minimal one:

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"]
    }
  }
}
```

### Q: Can I use orca with npm/yarn/pnpm?

**A:** Yes! orca works with all package managers. It doesn't care which one you use.

### Q: How do I update orca?

**A:** Use your package manager:

```bash
# npm
npm update @fasunle/orca -g

# Yarn
yarn global upgrade @fasunle/orca

# Bun
bun upgrade @fasunle/orca
```

---

## Configuration

### Q: What should I put in outputs?

**A:** All files/folders your task creates. Use glob patterns:

```json
{
  "build": {
    "outputs": [
      "dist/**", // All files in dist
      "build/**", // All files in build
      ".next/**" // Next.js output
    ]
  }
}
```

Files matching these patterns will be cached.

### Q: What's the difference between inputs and outputs?

**A:**

- **inputs**: Files that affect the task (used to generate cache key)
- **outputs**: Files the task creates (that should be cached)

```json
{
  "build": {
    "inputs": ["src/**", "package.json"], // These affect the task
    "outputs": ["dist/**"] // These are cached
  }
}
```

### Q: How do I define task dependencies?

**A:** Use `dependsOn`:

```json
{
  "test": {
    "dependsOn": ["build"] // Run build first
  }
}
```

For monorepos with dependencies:

```json
{
  "build": {
    "dependsOn": ["^build"] // Depends on dependencies' builds
  }
}
```

### Q: Should I disable caching for my task?

**A:** Yes, for tasks that:

- Produce random output (tests with seed)
- Have side effects (deployment, pushing to database)
- Aren't deterministic

```json
{
  "deploy": {
    "cache": false // Never cache deployment
  }
}
```

### Q: What are globalDependencies?

**A:** Files at repo root that affect all tasks:

```json
{
  "globalDependencies": ["tsconfig.json", ".eslintrc.json", "package-lock.json"]
}
```

When these change, all caches invalidate.

### Q: Can I use environment variables in orca.json?

**A:** Not directly. Use shell expansion:

```bash
# Pass via environment variable
MY_VAR="value" orca run build
```

---

## Caching Issues

### Q: Cache is not working - it always rebuilds

**Check:**

1. **Are outputs defined?**

   ```json
   {
     "build": {
       "outputs": ["dist/**"] // ✅ Must be defined
     }
   }
   ```

2. **Do the outputs actually exist?**

   ```bash
   ls dist/
   # If empty, build isn't creating files
   ```

3. **Is the build command correct?**

   ```bash
   # Test manually
   npm run build
   ls dist/  # Should have files
   ```

4. **Check cache directory:**
   ```bash
   ls -la .orca/
   # Should have cache files
   ```

### Q: Cache invalidates too often

**Likely causes:**

1. **Inputs too broad:**

   ```json
   {
     "inputs": ["**/*"] // Too broad!
   }
   ```

   **Fix:**

   ```json
   {
     "inputs": ["src/**", "package.json"]
   }
   ```

2. **Timestamp changes:**

   ```json
   {
     "inputs": [
       "src/**",
       "!src/**/*.test.ts" // Exclude tests
     ]
   }
   ```

3. **Build output differs:**
   ```bash
   # Check if build produces same output
   npm run build
   npm run build
   # Compare results - should be identical
   ```

### Q: Cache hits but files aren't restored

**Check:**

1. **Cache directory exists:**

   ```bash
   ls -la .orca/
   ```

2. **Output directory exists:**

   ```bash
   mkdir -p dist/
   orca run build
   ```

3. **Permissions:**
   ```bash
   chmod +rw .orca/
   ```

### Q: Different results on different machines

**Likely causes:**

1. **Node.js version differs:**

   ```bash
   # Check versions match
   node --version
   ```

2. **Platform differences (Windows vs Unix):**
   - Use forward slashes in paths
   - Handle line endings

3. **Environment variables:**
   ```bash
   # Clear environment
   env | grep NODE
   ```

### Q: How do I clear the cache?

**A:**

```bash
# Clear all
orca clean

# Then rebuild
orca run build
```

---

## Performance

### Q: Why is my first build still slow?

**A:** First build has no cache. Expected behavior:

- First build: Full compilation
- Cached builds: ~0.3 seconds (56x+ faster)

**Optimize:**

1. Ensure all outputs are specified
2. Check dependencies aren't blocking parallelization
3. Use `^build` for monorepos to parallelize

### Q: How do I see build times?

**A:** Use `--verbose`:

```bash
orca run build --verbose

# Output:
# ⚙️  Executing: packages/utils:build
# ✓ Completed: packages/utils:build (1.2s)
# ⚙️  Executing: apps/web:build
# ✓ Completed: apps/web:build (3.4s)
# ...
```

### Q: Is my cache being used?

**A:** Look for cache hit indicators:

```bash
$ orca run build

# Cache hits look like:
✓ Cache hit: packages/utils:build
✓ Cache hit: packages/ui:build

# Cache misses look like:
⚙️  Executing: packages/utils:build
✓ Completed: packages/utils:build (2.1s)
```

### Q: What's the cache storage location?

**A:**

```bash
# Cache is stored in:
.orca/

# View cache size
du -sh .orca/
```

Typically 10-100MB for most projects.

### Q: Can I exclude files from cache?

**A:** Use input exclusions:

```json
{
  "build": {
    "inputs": [
      "src/**",
      "!src/**/*.test.ts", // Exclude test files
      "!src/**/*.spec.ts", // Exclude specs
      "!src/**/*.stories.tsx" // Exclude storybook
    ]
  }
}
```

---

## Development

### Q: How do I run specific tasks?

**A:**

```bash
# Run build in all workspaces
orca run build

# Run build in specific workspace
orca run build apps/web

# Run build in multiple workspaces
orca run build apps/web apps/mobile

# Run in all matching pattern
orca run build apps/*
```

### Q: Can I see the dependency graph?

**A:** Use `--verbose` to see execution order:

```bash
orca run build --verbose

# Shows:
# Layer 0 (parallel):
#   - packages/types:build
#   - packages/utils:build
# Layer 1 (depends on layer 0):
#   - packages/ui:build
# Layer 2 (depends on layer 1):
#   - apps/web:build
#   - apps/mobile:build
```

### Q: How do I debug a failing task?

**A:**

```bash
# Run task with verbose output
orca run build --verbose

# Run specific workspace
orca run build apps/web

# Run underlying command directly
cd apps/web && npm run build
```

### Q: Can I run tests across workspaces?

**A:**

```bash
# Run test task in all workspaces
orca run test

# Run in specific workspace
orca run test apps/web

# With caching
orca run test  # Second time: cache hit!
```

### Q: How do I handle parallel execution?

**A:** Automatic with independent tasks:

```json
{
  "tasks": {
    "lint": {
      "cache": false
    },
    "test": {
      "cache": false
    }
  }
}
```

If both have no dependencies, they run in parallel.

---

## Deployment

### Q: How do I publish to npm?

**A:** Automated via GitHub Actions:

1. Create GitHub release
2. GitHub Actions publishes to npm
3. Package available at `npm.js.com/@fasunle/orca`

Manual publishing:

```bash
# Ensure authenticated
npm login

# Build and test
bun run build
bun run test:run

# Publish
npm publish --access public
```

### Q: How do I set up CI/CD?

**A:** See [CI_CD_SETUP.md](./CI_CD_SETUP.md) for complete guide.

Quick start:

1. Create NPM token at https://www.npmjs.com/settings/~/tokens
2. Add NPM_TOKEN to GitHub secrets
3. Create GitHub release
4. Actions publish automatically

### Q: Can I use with GitHub Actions?

**A:** Yes! Install in CI:

```yaml
- name: Install orca
  run: npm install -g @fasunle/orca

- name: Build
  run: orca run build
```

### Q: What about Docker?

**A:** Install in Dockerfile:

```dockerfile
FROM node:18-alpine

RUN npm install -g @fasunle/orca

WORKDIR /app
COPY . .
RUN npm install
RUN orca run build

CMD ["node", "dist/server.js"]
```

---

## Error Messages

### Error: "orca.json not found"

**Solution:**
Create orca.json in project root:

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"]
    }
  }
}
```

### Error: "Task not found in tasks"

**Solution:**
Add task to tasks in orca.json:

```json
{
  "tasks": {
    "my-task": {
      "outputs": ["dist/**"]
    }
  }
}
```

### Error: "No workspaces found"

**Solution:**
Ensure package.json has workspaces:

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

Or use single workspace mode (root-level orca.json).

### Error: "Permission denied" on cache directory

**Solution:**
Fix permissions:

```bash
chmod -R +rw .orca/
```

Or clear cache:

```bash
orca clean
```

### Error: "Circular dependency detected"

**Check:**

```json
{
  "a": {
    "dependsOn": ["b"]
  },
  "b": {
    "dependsOn": ["a"] // Circular!
  }
}
```

**Fix:** Remove circular dependency:

```json
{
  "a": {
    "dependsOn": ["b"]
  },
  "b": {
    "dependsOn": [] // Remove circular ref
  }
}
```

### Error: "Command not found: orca"

**Solution:**

```bash
# Install globally
npm install -g @fasunle/orca

# Or use npx
npx @fasunle/orca run build

# Or use local installation
npm install --save-dev @fasunle/orca
npx orca run build
```

### Error: "ENOENT: no such file or directory"

**Check:**

1. Output directory exists
2. Task creates outputs
3. Paths are correct

**Solution:**

```bash
# Create output directory
mkdir -p dist/

# Then run task
orca run build
```

---

## Getting Help

### Resources

- [README.md](./README.md) - Overview and quick start
- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration reference
- [EXAMPLES.md](./EXAMPLES.md) - Real-world examples
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guide

### Support

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and ideas
- **Email**: See package.json for contact info

### Before Opening an Issue

1. Check this FAQ
2. Search existing issues
3. Try with `--verbose`
4. Try with latest version

---

## Tips & Tricks

### Speed Up CI/CD

```bash
# Cache dependencies
npm ci --prefer-offline

# Cache orca
orca run build

# Run tests in parallel
orca run test --parallel
```

### Debug Caching

```bash
# See what's in cache
ls -la .orca/

# View cache metadata
cat .orca/*.json | head -20

# Clear and rebuild
orca clean
orca run build --verbose
```

### Optimize Monorepo

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"], // Wait for deps
      "inputs": ["src/**"], // Specific inputs
      "outputs": ["dist/**"], // Specific outputs
      "cache": true // Enable caching
    }
  },
  "globalDependencies": [
    "tsconfig.json" // Shared config
  ]
}
```

### Local Development Loop

```bash
# Initial setup
bun install
orca run build
orca run test

# Development
# (Edit code)
orca run build    # Uses cache
orca run test     # Uses cache

# When you change shared packages
orca clean
orca run build
```

---

**Still have questions? Open an issue on GitHub or check the documentation!**
