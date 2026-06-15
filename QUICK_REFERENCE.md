# Quick Reference Guide

Quick lookup for common tasks with `@fasunle/orca`.

## Installation

```bash
# Global
npm install -g @fasunle/orca

# Local
npm install --save-dev @fasunle/orca

# Bun
bun install @fasunle/orca
```

## Basic Commands

```bash
# Run task across workspaces
orca run build

# Run in specific workspace
orca run build apps/web

# Clear cache
orca clean

# Show help
orca --help
```

## Minimal orca.json

```json
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

## Task Configuration

```json
{
  "build": {
    "dependsOn": ["^build"], // Wait for dependencies
    "outputs": ["dist/**"], // Files to cache
    "cache": true, // Enable caching
    "inputs": ["src/**", "*.json"], // Files affecting hash
    "persistent": false, // Keep running (dev servers)
    "hashAlgorithm": "sha256" // Hash algorithm
  }
}
```

## Configuration Reference

| Option          | Type     | Purpose                       |
| --------------- | -------- | ----------------------------- |
| `dependsOn`     | string[] | Tasks that must run first     |
| `outputs`       | string[] | Files/folders to cache (glob) |
| `cache`         | boolean  | Enable/disable caching        |
| `inputs`        | string[] | Files that affect cache hash  |
| `persistent`    | boolean  | Keep running after completion |
| `hashAlgorithm` | string   | sha1, sha256, md5             |

## Dependency Patterns

```json
{
  "task": {
    "dependsOn": [
      "^build", // Deps' build
      "lint", // This workspace's lint
      "web#build", // Specific workspace
      "web#test", // Multiple deps
      "lint"
    ]
  }
}
```

## Common Patterns

### React Monorepo

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["src/**", "public/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": { "cache": false },
    "dev": { "cache": false, "persistent": true }
  }
}
```

### Node Backend

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
    "start": {
      "dependsOn": ["build"],
      "persistent": true,
      "cache": false
    }
  }
}
```

### Full-Stack

```json
{
  "tasks": {
    "generate": {
      "outputs": ["src/generated/**"]
    },
    "build": {
      "dependsOn": ["^build", "generate"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## Troubleshooting

| Problem                     | Solution                                     |
| --------------------------- | -------------------------------------------- |
| Cache not working           | Check `outputs` defined + actual files exist |
| Cache invalidates too often | Refine `inputs` pattern                      |
| Circular dependency error   | Check `dependsOn` for circular refs          |
| Command not found           | Install: `npm install -g @fasunle/orca`      |
| Permission denied           | Run `orca clean`                             |

## Useful Commands

```bash
# Verbose output (see execution order)
orca run build --verbose

# Specific workspace
orca run build apps/web

# Multiple workspaces
orca run build apps/web apps/mobile

# Clear cache
orca clean

# Help
orca --help
```

## Package.json Scripts

```json
{
  "scripts": {
    "build": "orca run build",
    "test": "orca run test",
    "lint": "orca run lint",
    "dev": "orca run dev",
    "clean": "orca clean"
  }
}
```

## Glob Patterns

| Pattern                                       | Matches                      |
| --------------------------------------------- | ---------------------------- |
| `dist/**`                                     | Everything in dist           |
| `src/**`                                      | All files in src (recursive) |
| `*.js`                                        | JS files in root             |
| `**/*.ts`                                     | All TS files everywhere      |
| `src/**/*.test.ts`                            | Test files in src            |
| `src/**` but exclude with `!src/**/*.test.ts` | Everything except tests      |

## Global Dependencies

Files affecting all tasks:

```json
{
  "globalDependencies": [
    "tsconfig.json", // Shared TypeScript config
    ".eslintrc.json", // Shared lint config
    "package-lock.json", // Dependency lock
    ".prettierrc" // Shared format config
  ]
}
```

## Cache Location

```bash
# Cache stored at:
.orca/

# Check size:
du -sh .orca/

# Clear:
orca clean  # OR
rm -rf .orca/
```

## GitHub Actions Example

```yaml
- name: Install orca
  run: npm install -g @fasunle/orca

- name: Build
  run: orca run build

- name: Test
  run: orca run test
```

## Performance Tips

1. ✅ Always specify `outputs`
2. ✅ Use explicit `inputs`
3. ✅ Use `^build` for monorepo deps
4. ✅ Disable cache for non-deterministic tasks
5. ❌ Don't use `**/*` as input (too broad)
6. ❌ Don't cache deployments
7. ❌ Don't cache random tests

## Common Mistakes

```javascript
// ❌ Missing outputs - cache won't work
{ "build": { "dependsOn": ["^build"] } }

// ✅ Include outputs
{ "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] } }

// ❌ Too broad inputs - cache invalidates too often
{ "inputs": ["**/*"] }

// ✅ Specific inputs
{ "inputs": ["src/**", "package.json"] }

// ❌ Caching non-deterministic tasks
{ "test": { "cache": true } }  // Random seed each time

// ✅ Disable cache for non-deterministic
{ "test": { "cache": true, "inputs": [...] } }  // Or set cache: false
```

## Documentation

- [README.md](./README.md) - Overview
- [CONFIGURATION.md](./CONFIGURATION.md) - Detailed config
- [EXAMPLES.md](./EXAMPLES.md) - Real-world examples
- [FAQ.md](./FAQ.md) - Q&A
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing
- [CI_CD_SETUP.md](./CI_CD_SETUP.md) - Deployment

## Support

- Issues: GitHub Issues
- Questions: GitHub Discussions
- Package: [@fasunle/orca](https://npmjs.com/package/@fasunle/orca)

---

**Print this page for quick reference!**
