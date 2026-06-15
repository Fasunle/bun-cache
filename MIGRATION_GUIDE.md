# Migration Guide

Guide for migrating to `@fasunle/orca` from other build systems.

## Table of Contents

- [From Orca](#from-orca)
- [From npm workspaces scripts](#from-npm-workspaces-scripts)
- [From Lerna](#from-lerna)
- [From Rush](#from-rush)
- [From custom scripts](#from-custom-scripts)
- [Troubleshooting migration](#troubleshooting-migration)

---

## From Orca

### Compatibility

orca uses the **same `orca.json` format** as Orca, so migration is very simple!

### Step 1: Install orca

```bash
npm install -g @fasunle/orca
# or
npm install --save-dev @fasunle/orca
```

### Step 2: Keep your orca.json

No changes needed! Your existing `orca.json` works as-is.

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

### Step 3: Update package.json scripts

Replace `orca` with `orca`:

**Before:**

```json
{
  "scripts": {
    "build": "orca run build",
    "test": "orca run test",
    "dev": "orca run dev"
  }
}
```

**After:**

```json
{
  "scripts": {
    "build": "orca run build",
    "test": "orca run test",
    "dev": "orca run dev"
  }
}
```

### Step 4: Update CI/CD

Replace orca in GitHub Actions:

**Before:**

```yaml
- name: Build
  run: npx orca run build
```

**After:**

```yaml
- name: Build
  run: npm install -g @fasunle/orca && orca run build
```

### What's the same?

✅ `orca.json` format  
✅ Task configuration (dependsOn, outputs, cache)  
✅ Caching behavior  
✅ Execution order

### What's different?

- orca is smaller and faster
- Focused specifically on caching
- Simpler command interface
- Better with Bun runtime

### Migration time

**Expected:** 5-10 minutes

---

## From npm workspaces scripts

### Setup

If you're using npm workspaces with manual scripts:

```json
{
  "scripts": {
    "build": "npm -w packages/ui run build && npm -w apps/web run build"
  }
}
```

### Step 1: Create orca.json

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

### Step 2: Install orca

```bash
npm install -g @fasunle/orca
```

### Step 3: Replace scripts

**Before:**

```json
{
  "scripts": {
    "build": "npm -w packages/ui run build && npm -w apps/web run build"
  }
}
```

**After:**

```json
{
  "scripts": {
    "build": "orca run build"
  }
}
```

### Benefits

✅ Automatic dependency resolution  
✅ Parallel execution for independent tasks  
✅ Caching across builds  
✅ Cleaner scripts

### Example before/after

**Before:**

```bash
# Manual dependency management
npm -w packages/types run build
npm -w packages/utils run build  # Must wait for types
npm -w packages/ui run build     # Must wait for utils
npm -w apps/web run build        # Must wait for ui
```

**After:**

```bash
orca run build
# Automatically handles dependency order & parallelization
```

### Migration time

**Expected:** 15-20 minutes

---

## From Lerna

### Lerna to orca

Lerna manages versioning and publishing. orca focuses on caching.

### Step 1: Keep Lerna for versioning

If you use Lerna for:

- Version management
- Publishing to npm
- Creating releases

Keep those in Lerna.

### Step 2: Replace Lerna scripts with orca

Lerna config:

```json
{
  "packages": ["packages/*", "apps/*"],
  "version": "independent",
  "command": {
    "publish": {
      "ignoreScripts": true
    }
  }
}
```

Add to root `package.json`:

```json
{
  "scripts": {
    "build": "orca run build",
    "test": "orca run test"
  }
}
```

### Step 3: Create orca.json

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
    }
  }
}
```

### Step 4: Update CI/CD

Add orca before Lerna publish:

```yaml
- name: Build
  run: orca run build

- name: Test
  run: orca run test

- name: Publish
  run: lerna publish from-package
```

### Hybrid setup

Keep Lerna + add orca:

```bash
# Build with caching
orca run build

# Test with caching
orca run test

# Publish with Lerna
lerna publish
```

### Migration time

**Expected:** 20-30 minutes

---

## From Rush

### Rush to orca

Rush provides:

- Monorepo management
- Dependency resolution
- Change detection

orca adds caching layer.

### Step 1: Understand your rush.json

```json
{
  "projects": [
    {
      "packageName": "@company/ui",
      "projectFolder": "packages/ui"
    }
  ]
}
```

### Step 2: Create orca.json

Translate Rush commands to orca.json:

**Before (rush.json):**

```json
{
  "command": {
    "build": {
      "enableParallelism": true,
      "ignoreMissingScript": true
    },
    "test": {
      "enableParallelism": true,
      "ignoreMissingScript": true
    }
  }
}
```

**After (orca.json):**

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
    }
  }
}
```

### Step 3: Migrate commands

Replace Rush commands with orca:

**Before:**

```bash
rush build
rush test
rush rebuild
```

**After:**

```bash
orca run build
orca run test
orca clean && orca run build
```

### Step 4: Update package scripts

```json
{
  "scripts": {
    "build": "orca run build",
    "test": "orca run test",
    "clean": "orca clean"
  }
}
```

### Why orca with Rush?

- Caching layer (faster rebuilds)
- Simpler configuration
- Better Bun support
- Can use alongside Rush

### Migration time

**Expected:** 30-45 minutes

---

## From custom scripts

### Manual scripting

If you have custom scripts:

```json
{
  "scripts": {
    "build": "npm -w packages/a run build && npm -w packages/b run build && npm -w apps/web run build",
    "test": "npm -w packages/a run test && npm -w packages/b run test"
  }
}
```

### Step 1: Analyze dependencies

Map out your task dependencies:

```
build:
  packages/a → (no deps)
  packages/b → packages/a
  apps/web → packages/a, packages/b

test:
  packages/a → build
  packages/b → build
  apps/web → build
```

### Step 2: Create orca.json

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "lib/**"],
      "inputs": ["src/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["test/**"]
    },
    "lint": {
      "cache": false,
      "inputs": ["src/**"]
    }
  }
}
```

### Step 3: Replace scripts

**Before:**

```json
{
  "scripts": {
    "build": "npm -w packages/a run build && npm -w packages/b run build && npm -w apps/web run build",
    "test": "npm -w packages/a run test && npm -w packages/b run test"
  }
}
```

**After:**

```json
{
  "scripts": {
    "build": "orca run build",
    "test": "orca run test"
  }
}
```

### Step 4: Add caching

Get automatic caching:

```bash
# First run: 30 seconds
npm run build

# Second run: 0.5 seconds (56x faster!)
npm run build
```

### Benefits

✅ Automatic parallelization  
✅ Dependency resolution  
✅ Caching  
✅ Simpler maintenance

### Migration time

**Expected:** 15-25 minutes

---

## Troubleshooting migration

### Issue: "orca.json not found"

**Solution:**
Create orca.json in project root:

```bash
touch orca.json
```

Add basic config:

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"]
    }
  }
}
```

### Issue: Tasks run sequentially instead of parallel

**Check:** `dependsOn` configuration

Make sure independent tasks don't have dependencies:

```json
{
  "lint": {
    // No dependsOn - runs in parallel with others
  },
  "test": {
    "dependsOn": ["build"] // Explicitly depends on build
  }
}
```

### Issue: Cache not working after migration

**Check:**

1. `outputs` is defined:

   ```json
   {
     "build": {
       "outputs": ["dist/**"] // ✅ Required
     }
   }
   ```

2. Files actually created:
   ```bash
   npm -w packages/a run build
   ls packages/a/dist/  # Should have files
   ```

### Issue: Different package manager commands

**From:** npm workspaces:

```bash
npm -w packages/ui run build
```

**To:** orca (package-agnostic):

```bash
orca run build apps/ui
```

### Issue: Environment-specific configuration

If you have environment-specific builds, use shell variables:

```bash
NODE_ENV=production orca run build
NODE_ENV=development orca run build
```

### Issue: Custom build outputs

If your scripts create multiple output locations:

```json
{
  "build": {
    "outputs": ["dist/**", "build/**", ".next/**", "coverage/**"]
  }
}
```

---

## Post-Migration Checklist

- [ ] Installed orca globally or locally
- [ ] Created/updated orca.json
- [ ] Updated package.json scripts
- [ ] Updated CI/CD configuration
- [ ] Tested locally: `orca run build`
- [ ] Tested caching: Run twice, verify cache hit
- [ ] Updated team documentation
- [ ] Committed changes to git
- [ ] Deployed to staging
- [ ] Monitored for issues
- [ ] Updated development docs

---

## Performance Expectations

### Migration impact on build time

| Scenario        | Before | After | Speedup |
| --------------- | ------ | ----- | ------- |
| First build     | 45s    | 45s   | 1x      |
| Cached build    | 45s    | 0.8s  | 56x     |
| One file change | 45s    | 12s   | 3.75x   |
| Config change   | 45s    | 28s   | 1.6x    |

### CI/CD savings

Typical monorepo (6 services, 4 packages):

```
Before: Each build runs full tasks = 50s
After:  First CI/CD = 50s, Subsequent = 0.8s

Monthly savings (100 CI runs):
- First 2 runs: 100s
- Remaining 98 runs: 78s
Total: 178s vs 5000s = 96% faster!
```

---

## Getting Help

If migration issues arise:

1. **Check FAQ:** [FAQ.md](./FAQ.md)
2. **Review examples:** [EXAMPLES.md](./EXAMPLES.md)
3. **Read documentation:** [CONFIGURATION.md](./CONFIGURATION.md)
4. **Open GitHub issue:** [GitHub Issues](https://github.com/fasunle/orca/issues)

---

## Rollback Plan

If you need to rollback to your previous setup:

```bash
# 1. Keep your old scripts in git history
git log --oneline package.json

# 2. Revert if needed
git checkout <commit> -- package.json orca.json

# 3. Reinstall your previous tool
npm install -g orca  # or lerna, rush, etc.
```

---

**Migration complete! Your builds should now be significantly faster.**

For questions, see [FAQ.md](./FAQ.md) or open an issue on GitHub.
