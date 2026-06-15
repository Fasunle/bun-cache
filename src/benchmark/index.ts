#!/usr/bin/env bun

import { Command } from 'commander';
import { BenchmarkOrchestrator } from './orchestrator';
import { BenchmarkConfig } from './benchmark.type';

const program = new Command();

program
  .name('orca-benchmark')
  .description('Performance benchmarking suite for Orca')
  .version('0.1.0');

program
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('-u, --update-readme', 'Update README with results', false)
  .option('-o, --output <path>', 'Export results to JSON file')
  .option('--stress-only', 'Run only stress tests', false)
  .option('--cache-only', 'Run only cache benchmarks', false)
  .option('--parallel-only', 'Run only parallel execution benchmarks', false)
  .option('--quick', 'Run quick benchmark suite', false)
  .option('--concurrency-levels <levels>', 'Comma-separated concurrency levels', '1,2,4,8,16')
  .option('--task-count <count>', 'Number of tasks for parallel benchmark', '200')
  .option('--task-duration <ms>', 'Task duration in milliseconds', '20')
  .option('--stress-duration <ms>', 'Stress test duration in milliseconds', '20000')
  .option('--stress-concurrency <num>', 'Stress test concurrency', '8')
  .option('--target-rps <rps>', 'Target requests per second', '500');

async function main() {
  const options = program.parse().opts();

  const config: BenchmarkConfig = {
    verbose: options.verbose,
    updateReadme: options.updateReadme,
    output: options.output,
    stressOnly: options.stressOnly,
    cacheOnly: options.cacheOnly,
    parallelOnly: options.parallelOnly,
    quick: options.quick,
    concurrencyLevels: options.concurrencyLevels.split(',').map(Number),
    taskCount: parseInt(options.taskCount),
    taskDuration: parseInt(options.taskDuration),
    stressDuration: parseInt(options.stressDuration),
    stressConcurrency: parseInt(options.stressConcurrency),
    targetRPS: parseInt(options.targetRPS),
  };

  const orchestrator = new BenchmarkOrchestrator(config);

  try {
    await orchestrator.run();
    process.exit(0);
  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

main();
