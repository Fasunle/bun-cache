# Testing Guide for Podic

This project uses **Vitest** for unit testing. All tests are located in the `tests/` directory.

## Setup

Testing dependencies are already included in `package.json`. To install them:

```bash
bun install
```

## Running Tests

### Run all tests

```bash
bun run test
```

### Run tests once (CI mode)

```bash
bun run test:run
```

### Run tests with UI

```bash
bun run test:ui
```

### Run specific test file

```bash
bun run test tests/orchestrator.test.ts
```

### Watch mode (default)

```bash
bun run test
```

## Test Coverage

Test files are organized by component:

### 1. **orchestrator.test.ts** - Orchestrator class

- Task graph construction
- Dependency resolution
- Topological sorting
- Caching behavior
- Error handling

**Key tests:**

- ✅ Loading configuration from orca.json
- ✅ Discovering workspaces with tasks
- ✅ Building execution plans with dependencies
- ✅ Cache hit/miss scenarios
- ✅ Task execution order

### 2. **cli.test.ts** - CLI command handling

- Command parsing (run, clean, help)
- Task validation
- Target specification
- Error handling
- Argument parsing

**Key tests:**

- ✅ Help display
- ✅ Run command with tasks
- ✅ Multiple targets
- ✅ Missing parameters
- ✅ Unknown commands

### 3. **hasher.test.ts** - Hash generation

- Consistent hash generation
- Input file hashing
- Global dependency hashing
- Directory traversal
- Workspace isolation

**Key tests:**

- ✅ Deterministic hash generation
- ✅ Different hashes for different inputs
- ✅ Nested directory hashing
- ✅ File modification detection
- ✅ Edge cases (missing files, empty inputs)

### 4. **cache.test.ts** - Cache management

- Cache directory creation
- Metadata storage
- Cache validation
- Output restoration
- Cache cleanup

**Key tests:**

- ✅ Save and retrieve cached outputs
- ✅ Detect missing cached files
- ✅ Validate all outputs exist
- ✅ Timestamp recording
- ✅ Clean cache directory

## Example Test Run

```bash
$ bun run test:run

 ✓ tests/orchestrator.test.ts (3 tests)
 ✓ tests/cli.test.ts (6 tests)
 ✓ tests/hasher.test.ts (12 tests)
 ✓ tests/cache.test.ts (15 tests)

Test Files  4 passed (4)
     Tests  36 passed (36)
  Start at  10:30:00
  Duration  2.34s
```

## Writing New Tests

All tests follow this structure:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something', () => {
    // Test code
    expect(result).toBe(expected);
  });
});
```

## CI/CD Integration

Run in your CI tasks:

```bash
bun run test:run
```

This runs all tests once and exits with appropriate status codes.

## Debugging Tests

To debug a specific test:

```bash
node --inspect-brk ./node_modules/.bin/vitest tests/orchestrator.test.ts
```

Or enable debugging in your IDE and run `bun run test` in debug mode.

## Coverage Goals

Current test suite covers:

- ✅ Core orchestration logic
- ✅ CLI command handling
- ✅ Hash generation and comparison
- ✅ Cache persistence and validation
- ✅ Error scenarios

Target coverage: **80%+** for core functionality
