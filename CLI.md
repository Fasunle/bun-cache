# CLI Documentation

## Overview

`orca` is a powerful command-line tool for task orchestration and caching in monorepos. It provides a Orca-inspired interface with zero-configuration caching support.

**Version**: 0.1.1  
**Runtime**: Bun (JavaScript/TypeScript)  
**Package Manager**: npm/yarn/bun

## Installation

### Global Installation (Recommended)

```bash
# Using npm
npm install -g @fasunle/orca

# Using yarn
yarn global add @fasunle/orca

# Using bun
bun install -g @fasunle/orca
```

### Local Installation

```bash
# Using npm
npm install --save-dev @fasunle/orca

# Using yarn
yarn add --dev @fasunle/orca

# Using bun
bun add --dev @fasunle/orca
```

## Getting Started

### 1. Initialize Configuration

Create a `orca.json` file in your monorepo root:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "cache": true
    }
  }
}
```

### 2. Run Your First Command

```bash
# Run build task across all workspaces
orca run build

# Run tests in specific workspaces
orca run test apps/web apps/api
```

## Commands

### `orca run`

Execute a task across workspaces with intelligent caching.

#### Syntax

```bash
orca run <task> [targets...] [options]
```

#### Arguments

- `<task>` **required** - Name of the task defined in orca.json
- `[targets...]` **optional** - Specific workspaces to run the task in

#### Options

| Flag                 | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| `--filter <pattern>` | Filter workspaces by name or glob pattern (legacy, use targets instead) |
| `--parallel`         | Run tasks in parallel _(enabled by default)_                            |
| `--no-cache`         | Disable caching for this run                                            |
| `--verbose`          | Show detailed execution information                                     |
| `-h, --help`         | Display command help                                                    |

#### Examples

```bash
# Run build task in all workspaces
orca run build

# Run test task only in apps/web and apps/api
orca run test apps/web apps/api

# Run lint task without using cache
orca run lint --no-cache

# Run with detailed output
orca run build --verbose

# Run build task in workspaces matching pattern
orca run build --filter "packages/*"
```

#### How It Works

1. **Load Configuration**: Reads `orca.json` to find task definition
2. **Build Dependency Graph**: Resolves task dependencies across workspaces
3. **Check Cache**: Computes input hash and checks if output is cached
4. **Execute or Restore**:
   - Cache hit → Restore cached outputs (~100ms)
   - Cache miss → Execute task and save outputs
5. **Parallel Execution**: Runs independent tasks concurrently

#### Performance

- **Cache Hit**: ~100-200ms _(outputs already exist)_
- **Cache Miss**: ~5-30s _(depends on task complexity)_
- **Speedup**: 10-100x faster with cache on rebuild

---

### `orca clean`

Clear the build cache for your monorepo.

#### Syntax

```bash
orca clean [options]
```

#### Options

| Flag                  | Description                                 |
| --------------------- | ------------------------------------------- |
| `--scope <workspace>` | Clear cache for specific workspace only     |
| `--dry-run`           | Show what would be deleted without deleting |
| `-h, --help`          | Display command help                        |

#### Examples

```bash
# Clear all cached files
orca clean

# Clear cache for specific workspace
orca clean --scope apps/web

# Preview what would be deleted
orca clean --dry-run

# Clear cache with detailed output
orca clean --verbose
```

#### What Gets Deleted

- Cached task outputs (defined in `outputs` field)
- Task metadata and hashes
- Cache index files

**Note**: Source code and workspace files are never deleted.

---

### `orca info`

Display monorepo configuration and task information.

#### Syntax

```bash
orca info [options]
```

#### Options

| Flag         | Description          |
| ------------ | -------------------- |
| `--json`     | Output as JSON       |
| `-h, --help` | Display command help |

#### Examples

```bash
# Show current configuration
orca info

# Output as JSON for scripting
orca info --json
```

#### Output Example

```
@fasunle/orca v0.1.1
Root directory: /home/user/my-monorepo
```

---

### `orca help`

Display help information for any command.

#### Syntax

```bash
orca help [command]
```

#### Examples

```bash
# Show general help
orca help

# Show help for run command
orca help run

# Show help for clean command
orca help clean
```

---

## Global Options

These options work with all commands:

| Flag            | Description              |
| --------------- | ------------------------ |
| `-v, --version` | Display current version  |
| `-h, --help`    | Display help for command |

#### Examples

```bash
# Show version
orca --version

# Show help
orca --help

# Show help for specific command
orca run --help
```

---

## Configuration Guide

### orca.json Format

The `orca.json` file follows the Orca monorepo standard:

```json
{
  "tasks": {
    "taskName": {
      "dependsOn": ["^taskName", "otherTask"],
      "outputs": ["dist/**", "build/**"],
      "cache": true,
      "env": ["ENVIRONMENT_VAR"]
    }
  }
}
```

#### Fields

| Field       | Type       | Description                                                       |
| ----------- | ---------- | ----------------------------------------------------------------- |
| `dependsOn` | `string[]` | Tasks that must complete first. `^` prefix = dependency workspace |
| `outputs`   | `string[]` | Glob patterns of files to cache                                   |
| `cache`     | `boolean`  | Enable output caching                                             |
| `env`       | `string[]` | Environment variables that affect task                            |

#### Examples

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "cache": true
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "cache": true
    },
    "dev": {
      "cache": false
    }
  }
}
```

---

## Common Workflows

### Full Build from Scratch

```bash
# Clear any existing cache
orca clean

# Run build (will run all tasks)
orca run build
```

### Rebuild Specific Workspace

```bash
# Run only for apps/web
orca run build apps/web
```

### Skip Cache for Debugging

```bash
# Run without cache to ensure fresh execution
orca run build --no-cache
```

### Parallel Task Execution

```bash
# Automatically runs independent tasks in parallel
orca run build

# You can also explicitly run multiple tasks
orca run test
orca run lint
```

### Check Configuration

```bash
# View current setup
orca info

# Output for automation
orca info --json
```

---

## Error Handling

### Common Errors

#### "Please specify a task to run"

```bash
# ❌ Missing task
orca run

# ✅ Specify task
orca run build
```

#### "Unknown Command"

```bash
# ❌ Invalid command
orca execute build

# ✅ Use correct command
orca run build
```

#### "Task not found in orca.json"

Ensure the task is defined in your `orca.json` configuration.

```bash
# Check available tasks
orca info --json | grep tasks
```

---

## Performance Tips

1. **Define outputs properly** - More specific outputs = better caching
2. **Use dependsOn correctly** - Avoid unnecessary dependencies
3. **Cache non-deterministic tasks carefully** - Only cache stable outputs
4. **Use --no-cache for debugging** - When you need fresh runs
5. **Monitor cache hits** - Use `--verbose` to see what's cached

---

## Troubleshooting

### Cache not working?

```bash
# Verify cache is enabled in orca.json
orca info --json

# Clear cache and try again
orca clean
orca run build
```

### Tasks running in wrong order?

```bash
# Check dependencies
orca info --json

# View execution details
orca run build --verbose
```

### Tasks not completing?

```bash
# Run with verbose output
orca run build --verbose

# Run specific workspace
orca run build apps/web

# Disable cache
orca run build --no-cache
```

---

## Advanced Usage

### CI/CD Integration

```bash
# GitHub Actions
- run: orca run build
- run: orca run test

# GitLab CI
script:
  - orca run build
  - orca run test
```

### Workspace Filtering

```bash
# Run in specific workspaces
orca run build apps/web apps/api

# Run with glob pattern
orca run build --filter "packages/*"
```

### Environment Variables

Define environment variables in `orca.json` to invalidate cache when they change:

```json
{
  "tasks": {
    "build": {
      "env": ["NODE_ENV", "API_URL"]
    }
  }
}
```

---

## Related Resources

- 📖 [Installation Guide](./INSTALL_GUIDE.md)
- 🔧 [Configuration Guide](./CONFIGURATION.md)
- 📋 [Examples & Use Cases](./EXAMPLES.md)
- 🚀 [CI/CD Setup](./CI_CD_SETUP.md)
- 🧪 [Testing Guide](./TESTING.md)

---

## Support

- 🐛 [Report Issues](https://github.com/fasunle/orca/issues)
- 💬 [Discussions](https://github.com/fasunle/orca/discussions)
- 📧 [Email](mailto:kfasunle@gmail.com)

---

## License

MIT © 2024 Kehinde Fasunle
