#!/usr/bin/env bun

import { $ } from 'bun';

async function buildBenchmark() {
  console.log('🔨 Building benchmark module...');

  // Build benchmark entry point
  await $`bun build ./src/benchmark/index.ts --outdir ./dist --target node --format esm`;

  // Build worker files
  await $`bun build ./src/benchmark/workers/task.worker.ts --outdir ./dist/benchmark/workers --target node --format esm`;

  console.log('✅ Benchmark build complete');
}

buildBenchmark().catch(console.error);
