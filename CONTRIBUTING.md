# Contributing to @fasunle/orca

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Focus on code quality and helpfulness
- Report issues constructively
- Support fellow contributors

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Bun 1.0.0 or higher
- Git

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/fasunle/orca.git
cd orca

# Install dependencies
bun install

# Verify everything works
bun run test:run
bun run build
```

### Project Structure

```
src/
  ├── orchestrator.ts    # Core task execution engine
  ├── cli.ts             # Command-line interface
  ├── cache.ts           # Caching system
  ├── hasher.ts          # Hash generation
  └── types.ts           # TypeScript types

tests/
  ├── orchestrator.test.ts
  ├── cli.test.ts
  ├── cache.test.ts
  └── hasher.test.ts

docs/
  ├── README.md
  ├── CONFIGURATION.md
  ├── EXAMPLES.md
  └── CI_CD_SETUP.md
```

## Development Workflow

### 1. Create a Branch

```bash
# For features
git checkout -b feature/my-new-feature

# For bug fixes
git checkout -b fix/my-bug-fix

# For documentation
git checkout -b docs/my-documentation
```

### 2. Make Changes

Edit files in `src/` directory:

```bash
# Watch mode for development
bun run dev

# Or manually run tests
bun run test
```

### 3. Write Tests

Add tests to `tests/` directory. Use existing tests as examples:

```typescript
import { test, describe, expect } from 'vitest';
import { myNewFunction } from '../src/my-module';

describe('myNewFunction', () => {
  test('should do something', () => {
    const result = myNewFunction('input');
    expect(result).toBe('expected');
  });

  test('should handle edge cases', () => {
    expect(() => myNewFunction(null)).toThrow();
  });
});
```

### 4. Verify Changes

```bash
# Run all tests
bun run test:run

# Check code quality
bun run lint

# Verify build
bun run build

# Check for type errors
bun run type-check
```

### 5. Update Documentation

- Update [README.md](./README.md) if adding features
- Update [CONFIGURATION.md](./CONFIGURATION.md) for config changes
- Update [EXAMPLES.md](./EXAMPLES.md) for new use cases
- Update [CHANGELOG.md](./CHANGELOG.md) with your changes

### 6. Commit Changes

```bash
# Use clear, descriptive commit messages
git add .
git commit -m "feat: add new feature description"
git commit -m "fix: resolve issue with caching"
git commit -m "docs: update configuration guide"
git commit -m "test: add tests for new feature"
```

**Commit Message Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `chore`: Maintenance

**Examples:**

```
feat(orchestrator): add caching strategy option
fix(cli): handle Windows path separators
docs(examples): add React monorepo example
test(hasher): improve hash consistency tests
```

### 7. Push and Create PR

```bash
git push origin feature/my-new-feature
```

Then create a Pull Request on GitHub with:

- Clear title describing the change
- Description of what changed and why
- Link to any related issues
- Screenshots if UI changes

## Code Standards

### TypeScript

- Use strict mode
- Add type annotations for functions
- Use interfaces for objects
- Export types explicitly

```typescript
// ✅ Good
export interface TaskConfig {
  dependsOn?: string[];
  outputs: string[];
  cache?: boolean;
}

export function executeTask(config: TaskConfig): Promise<void> {
  // ...
}
```

```typescript
// ❌ Avoid
function executeTask(config) {
  // Missing types
}
```

### Error Handling

- Throw descriptive errors
- Use consistent error messages
- Log errors appropriately

```typescript
// ✅ Good
if (!config.outputs) {
  throw new Error("Task configuration must specify 'outputs'");
}

// ❌ Avoid
if (!config.outputs) {
  throw new Error('Invalid config');
}
```

### Testing

- Write tests for new features
- Update tests for bug fixes
- Aim for >80% coverage
- Test edge cases

```typescript
// ✅ Good
test('should cache outputs', () => {
  // Test happy path
});

test('should invalidate cache on input change', () => {
  // Test cache invalidation
});

test('should handle missing output directory', () => {
  // Test edge case
});
```

### Documentation

- Add JSDoc comments to exported functions
- Update README for major features
- Include code examples
- Keep documentation current

```typescript
// ✅ Good
/**
 * Execute a task in the given workspace
 * @param task - Task name to execute
 * @param workspace - Workspace directory
 * @param config - Task configuration
 * @returns Promise resolving when task completes
 */
export async function executeTask(
  task: string,
  workspace: string,
  config: TaskConfig
): Promise<void> {
  // ...
}
```

## Testing Guidelines

### Running Tests

```bash
# Watch mode (for development)
bun run test

# Run once (for CI)
bun run test:run

# Run with UI
bun run test:ui

# Run specific file
bun run test hasher.test.ts

# Run matching pattern
bun run test --grep "cache"
```

### Writing Tests

Use Vitest for all tests:

```typescript
import { test, describe, expect, beforeEach, afterEach } from 'vitest';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  afterEach(() => {
    cache.clean();
  });

  test('should save and retrieve data', () => {
    cache.save('key', { data: 'value' });
    expect(cache.get('key')).toEqual({ data: 'value' });
  });

  test('should throw for missing keys', () => {
    expect(() => cache.get('missing')).toThrow();
  });
});
```

## Build and Release

### Local Testing

```bash
# Build locally
bun run build

# Test the CLI
./dist/cli.js run build

# Test global installation
npm link
orca run build
npm unlink
```

### Version Bumping

Versions follow [Semantic Versioning](https://semver.org/):

```bash
# Patch version (0.1.0 -> 0.1.1)
npm run version:patch

# Minor version (0.1.0 -> 0.2.0)
npm run version:minor

# Major version (0.1.0 -> 1.0.0)
npm run version:major
```

### Publishing

Publishing is automated via GitHub Actions:

1. Create a new release on GitHub
2. GitHub Actions will:
   - Run tests
   - Build the project
   - Publish to npm

## Issues & Bug Reports

### Before Creating an Issue

- Check existing issues for duplicates
- Search documentation
- Try reproducing the issue with latest version

### Creating an Issue

Include:

- Clear title
- Description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Your environment (OS, Node version, Bun version)
- Error messages/logs

### Example Issue

```markdown
**Title:** Cache not working with glob patterns

**Description:**
The caching system isn't working correctly with glob patterns in outputs.

**Steps to Reproduce:**

1. Create orca.json with "dist/\*\*" in outputs
2. Run build
3. Run build again

**Expected:**
Second run should use cache

**Actual:**
Build runs again from scratch

**Environment:**

- OS: macOS 13.1
- Node: 18.13.0
- Bun: 1.0.1
- @fasunle/orca: 0.1.0

**Error:**
```

Error: Cache miss for task

```

```

## Performance Considerations

When contributing performance improvements:

1. **Benchmark** - Measure before and after
2. **Document** - Explain the improvement
3. **Test** - Ensure correctness
4. **Profile** - Use profiling tools if needed

```bash
# Profile the CLI
time orca run build

# With verbose output
orca run build --verbose
```

## Documentation Contributions

### Updating README

The README should include:

- Quick start
- Installation options
- Features with examples
- Configuration reference
- Real-world examples
- Troubleshooting

### Adding Examples

Create detailed step-by-step examples in [EXAMPLES.md](./EXAMPLES.md):

- Use cases
- Directory structures
- Configuration files
- Expected output

### Updating Configuration Guide

Document new options in [CONFIGURATION.md](./CONFIGURATION.md):

- Complete schema
- Parameter descriptions
- Usage examples
- Best practices

## Asking for Help

### Discussion Forums

Use GitHub Discussions for:

- Questions
- Ideas
- General discussion

### Issues

Use GitHub Issues for:

- Bug reports
- Feature requests
- Technical problems

### Direct Communication

For urgent matters, contact the maintainers directly.

## Maintainers

- [@fasunle](https://github.com/fasunle) - Creator & Lead Maintainer

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](./LICENSE)).

## Helpful Resources

- [Orca Documentation](https://orca.build/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Bun Documentation](https://bun.sh/docs)

## Recognition

Contributors will be recognized in:

- [CHANGELOG.md](./CHANGELOG.md)
- [GitHub Contributors](https://github.com/fasunle/orca/graphs/contributors)

Thank you for contributing to @fasunle/orca! 🎉
