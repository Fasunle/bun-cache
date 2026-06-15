# API Reference

Complete API documentation for using `@fasunle/orca` as a library.

## Table of Contents

- [Installation](#installation)
- [Core Types](#core-types)
- [Main API](#main-api)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Installation

```bash
npm install @fasunle/orca
# or
bun install @fasunle/orca
```

## Core Types

### OrcaConfig

Main configuration interface:

```typescript
interface OrcaConfig {
  tasks: Record<string, PipelineTask>;
  globalDependencies?: string[];
}
```

### PipelineTask

Task configuration:

```typescript
interface PipelineTask {
  dependsOn?: string[];
  outputs?: string[];
  cache?: boolean;
  inputs?: string[];
  persistent?: boolean;
  hashAlgorithm?: 'sha1' | 'sha256' | 'md5';
}
```

### TaskExecution

Task execution details:

```typescript
interface TaskExecution {
  task: string;
  workspace: string;
  command: string;
  hash?: string;
}
```

## Main API

### loadConfig()

Load orca.json configuration:

```typescript
import { loadConfig } from '@fasunle/orca';

const config = await loadConfig('.');
// Returns: OrcaConfig
```

**Parameters:**

- `path` (string): Path to workspace root

**Returns:** Promise<OrcaConfig>

**Example:**

```typescript
const config = await loadConfig('.');
console.log(config.tasks);
```

---

### buildExecutionPlan()

Create execution plan from configuration:

```typescript
import { buildExecutionPlan } from '@fasunle/orca';

const plan = await buildExecutionPlan('.', 'build', ['apps/web']);
```

**Parameters:**

- `workspaceRoot` (string): Root directory
- `task` (string): Task name to execute
- `targets` (string[]): Specific workspaces/packages

**Returns:** Promise<ExecutionPlan>

**Example:**

```typescript
interface ExecutionPlan {
  nodes: Map<string, TaskGraphNode>;
  layers: TaskGraphNode[][]; // Parallel execution layers
}

const plan = await buildExecutionPlan('.', 'build');
console.log(plan.layers); // 2D array of parallel tasks
```

---

### executeGraphLayers()

Execute task graph:

```typescript
import { executeGraphLayers } from '@fasunle/orca';

const results = await executeGraphLayers(plan, '.');
```

**Parameters:**

- `executionPlan` (ExecutionPlan): Execution plan
- `workspaceRoot` (string): Root directory

**Returns:** Promise<Map<string, TaskResult>>

**Example:**

```typescript
const results = await executeGraphLayers(plan, '.');

for (const [taskId, result] of results) {
  console.log(`${taskId}: ${result.status}`);
}
```

---

### generateTaskHash()

Generate cache hash for task:

```typescript
import { generateTaskHash } from '@fasunle/orca';

const hash = await generateTaskHash('build', 'apps/web', ['src/**']);
```

**Parameters:**

- `taskName` (string): Task name
- `workspace` (string): Workspace path
- `inputs` (string[]): Input file patterns
- `globalDeps` (string[], optional): Global dependencies

**Returns:** Promise<string>

**Example:**

```typescript
const hash = await generateTaskHash(
  'build',
  'packages/ui',
  ['src/**', 'package.json'],
  ['tsconfig.json']
);

console.log(`Cache key: ${hash}`);
```

---

### CacheManager

Cache management class:

```typescript
import { CacheManager } from '@fasunle/orca';

const cache = new CacheManager('.orca');

// Get cached outputs
const outputs = cache.get('hash123');

// Save outputs to cache
cache.save('hash123', ['dist/index.js', 'dist/style.css']);

// Restore cached outputs
cache.restore('hash123', 'apps/web');

// Clear cache
cache.clean();
```

**Methods:**

#### `get(hash: string): boolean`

Check if outputs are cached:

```typescript
if (cache.get('hash123')) {
  console.log('Cache hit!');
} else {
  console.log('Cache miss');
}
```

#### `save(hash: string, outputs: string[]): void`

Save outputs to cache:

```typescript
cache.save('hash123', ['dist/index.js', 'dist/style.css']);
```

#### `restore(hash: string, workspace: string): Promise<void>`

Restore cached files:

```typescript
await cache.restore('hash123', 'apps/web');
console.log('Files restored to apps/web/dist');
```

#### `clean(): void`

Clear entire cache:

```typescript
cache.clean();
console.log('Cache cleared');
```

---

## Error Handling

### Common Errors

```typescript
import { loadConfig, buildExecutionPlan, executeGraphLayers } from '@fasunle/orca';

try {
  const config = await loadConfig('.');

  if (!config.tasks.build) {
    throw new Error("'build' task not found in tasks");
  }

  const plan = await buildExecutionPlan('.', 'build');
  const results = await executeGraphLayers(plan, '.');
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  }
}
```

### Error Types

```typescript
// Missing configuration
Error: 'orca.json not found';

// Task not found
Error: "Task 'build' not found in tasks";

// Circular dependencies
Error: 'Circular dependency detected: build -> compile -> build';

// Cache errors
Error: 'Failed to restore cache: Permission denied';

// Execution errors
Error: 'Task execution failed with exit code 1';
```

---

## Examples

### Complete Build Process

```typescript
import {
  loadConfig,
  buildExecutionPlan,
  executeGraphLayers,
  CacheManager,
  generateTaskHash,
} from '@fasunle/orca';

async function buildMonorepo() {
  try {
    // 1. Load configuration
    const config = await loadConfig('.');
    console.log('Configuration loaded');

    // 2. Create execution plan
    const plan = await buildExecutionPlan('.', 'build');
    console.log(`Build plan: ${plan.layers.length} layers`);

    // 3. Execute tasks
    const results = await executeGraphLayers(plan, '.');

    // 4. Log results
    for (const [taskId, result] of results) {
      console.log(`${taskId}: ${result.status}`);
    }

    console.log('✓ Build completed successfully');
  } catch (error) {
    console.error(`✗ Build failed: ${error.message}`);
    process.exit(1);
  }
}

buildMonorepo();
```

### Programmatic Task Execution

```typescript
import { buildExecutionPlan, executeGraphLayers } from '@fasunle/orca';

async function runTests() {
  const plan = await buildExecutionPlan('.', 'test', ['apps/web']);
  const results = await executeGraphLayers(plan, '.');

  let passed = 0;
  let failed = 0;

  for (const [taskId, result] of results) {
    if (result.status === 'completed') {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(`Tests: ${passed} passed, ${failed} failed`);
  return failed === 0;
}
```

### Custom Build Script

```typescript
import { loadConfig, buildExecutionPlan, executeGraphLayers, CacheManager } from '@fasunle/orca';

async function customBuild(taskName: string, targets?: string[]) {
  const config = await loadConfig('.');

  if (!config.tasks[taskName]) {
    throw new Error(`Task '${taskName}' not found`);
  }

  // Create execution plan for specific targets
  const plan = await buildExecutionPlan('.', taskName, targets || []);

  // Print execution plan
  console.log(`Executing '${taskName}':`);
  plan.layers.forEach((layer, i) => {
    console.log(`Layer ${i}:`);
    layer.forEach(node => {
      console.log(`  - ${node.workspace}:${node.task}`);
    });
  });

  // Execute
  const results = await executeGraphLayers(plan, '.');

  // Report results
  for (const [taskId, result] of results) {
    const status = result.status === 'completed' ? '✓' : '✗';
    console.log(`${status} ${taskId}`);
  }
}

// Usage
await customBuild('build', ['apps/web', 'packages/ui']);
```

### Cache Statistics

```typescript
import { CacheManager } from '@fasunle/orca';
import { promises as fs } from 'fs';

async function getCacheStats() {
  const cache = new CacheManager('.orca');

  const cacheDir = '.orca';
  const files = await fs.readdir(cacheDir);

  let totalSize = 0;
  for (const file of files) {
    const stat = await fs.stat(`${cacheDir}/${file}`);
    totalSize += stat.size;
  }

  console.log(`Cache Statistics:`);
  console.log(`- Files: ${files.length}`);
  console.log(`- Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Location: ${cacheDir}`);
}

getCacheStats();
```

### Monitoring Task Execution

```typescript
import { buildExecutionPlan, executeGraphLayers } from '@fasunle/orca';

async function monitorBuild() {
  const plan = await buildExecutionPlan('.', 'build');

  console.time('Build duration');

  const results = await executeGraphLayers(plan, '.');

  console.timeEnd('Build duration');

  // Analyze results
  let cached = 0;
  let executed = 0;

  for (const [taskId, result] of results) {
    if (result.cached) {
      cached++;
    } else {
      executed++;
    }
  }

  console.log(`Summary:`);
  console.log(`- Cached: ${cached}`);
  console.log(`- Executed: ${executed}`);
  console.log(`- Total: ${results.size}`);
  console.log(`- Hit rate: ${((cached / results.size) * 100).toFixed(1)}%`);
}

monitorBuild();
```

### Dependency Analysis

```typescript
import { loadConfig, buildExecutionPlan } from '@fasunle/orca';

async function analyzeDependencies(task: string) {
  const plan = await buildExecutionPlan('.', task);

  // Build dependency map
  const deps = new Map<string, string[]>();

  for (const [id, node] of plan.nodes) {
    const nodeDeps = Array.from(node.dependencies).map(
      depId => plan.nodes.get(depId)?.workspace || depId
    );
    deps.set(id, nodeDeps);
  }

  // Print dependency tree
  console.log(`Dependencies for '${task}':`);
  for (const [task, dependencies] of deps) {
    console.log(`\n${task}:`);
    if (dependencies.length === 0) {
      console.log('  (no dependencies)');
    } else {
      dependencies.forEach(dep => {
        console.log(`  → ${dep}`);
      });
    }
  }
}

analyzeDependencies('build');
```

---

## Type Definitions

### TaskGraphNode

```typescript
interface TaskGraphNode {
  id: string;
  task: string;
  workspace: string;
  config: PipelineTask;
  dependencies: Set<string>;
  dependents: Set<string>;
}
```

### ExecutionPlan

```typescript
interface ExecutionPlan {
  nodes: Map<string, TaskGraphNode>;
  layers: TaskGraphNode[][];
}
```

### TaskResult

```typescript
interface TaskResult {
  task: string;
  workspace: string;
  status: 'completed' | 'failed' | 'skipped';
  cached: boolean;
  duration: number;
  error?: Error;
}
```

---

## Best Practices

1. **Always handle errors:**

   ```typescript
   try {
     const plan = await buildExecutionPlan('.', 'build');
   } catch (error) {
     console.error(`Failed: ${error.message}`);
   }
   ```

2. **Check task existence:**

   ```typescript
   const config = await loadConfig('.');
   if (!config.tasks.myTask) {
     throw new Error('Task not found');
   }
   ```

3. **Monitor execution:**

   ```typescript
   for (const [taskId, result] of results) {
     console.log(`${taskId}: ${result.status}`);
   }
   ```

4. **Clean cache periodically:**

   ```typescript
   const cache = new CacheManager('.orca');
   cache.clean(); // For testing
   ```

5. **Use specific targets:**
   ```typescript
   const plan = await buildExecutionPlan(
     '.',
     'build',
     ['apps/web'] // Specific target
   );
   ```

---

## Performance Considerations

- Cache hash generation is ~50ms per task
- Execution planning is ~100ms for large monorepos
- Actual task execution depends on your scripts
- Use `layers` to understand parallelization

---

**For more examples, see [EXAMPLES.md](./EXAMPLES.md)**
