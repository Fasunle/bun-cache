import { BenchmarkConfig, BenchmarkResults } from './benchmark.type';
import { CacheBenchmark } from './suites/cache.benchmark.js';
import { ParallelExecutionBenchmark } from './suites/parallel.benchmark.js';
import { StressTestBenchmark } from './suites/stress.benchmark.js';
import { MetricsBenchmark } from './suites/metrics.benchmark.js';
import { SystemInfoCollector } from './utils/system-info';
import { CLIReporter } from './reporters/cli.reporter.js';
import { ReadmeReporter } from './reporters/readme.reporter';

export class BenchmarkOrchestrator {
  private config: BenchmarkConfig;

  constructor(config: BenchmarkConfig) {
    this.config = config;
  }

  public async run(): Promise<BenchmarkResults> {
    const startTime = Date.now();

    console.log(chalk.bold.cyan('\n🚀 Orca Performance Benchmark Suite'));
    console.log(chalk.gray('='.repeat(60)));

    const results: Partial<BenchmarkResults> = {};

    try {
      // Collect system info
      results.system = await SystemInfoCollector.collect();

      // Run basic metrics
      if (!this.config.stressOnly && !this.config.cacheOnly && !this.config.parallelOnly) {
        const metricsBench = new MetricsBenchmark(this.config.verbose);
        results.basicMetrics = await metricsBench.run();
      }

      // Run cache benchmarks
      if (!this.config.stressOnly && !this.config.parallelOnly) {
        const cacheBench = new CacheBenchmark(this.config.verbose);
        results.cache = await cacheBench.run();
      }

      // Run parallel execution benchmarks
      if (!this.config.stressOnly && !this.config.cacheOnly) {
        const parallelBench = new ParallelExecutionBenchmark(
          {
            concurrencyLevels: this.config.concurrencyLevels,
            taskCount: this.config.quick ? 50 : this.config.taskCount,
            taskDuration: this.config.quick ? 10 : this.config.taskDuration,
          },
          this.config.verbose
        );
        results.parallel = await parallelBench.run();
      }

      // Run stress test
      if (!this.config.cacheOnly && !this.config.parallelOnly) {
        const stressBench = new StressTestBenchmark(
          {
            duration: this.config.quick ? 10000 : this.config.stressDuration,
            concurrency: this.config.stressConcurrency,
            targetRPS: this.config.quick ? 200 : this.config.targetRPS,
          },
          this.config.verbose
        );
        results.stress = await stressBench.run();
      }

      const endTime = Date.now();

      const fullResults: BenchmarkResults = {
        basicMetrics: results.basicMetrics!,
        cache: results.cache!,
        parallel: results.parallel!,
        stress: results.stress!,
        system: results.system!,
        timestamp: new Date().toISOString(),
        duration: endTime - startTime,
      };

      // Generate report
      CLIReporter.generateReport(fullResults);

      // Update README if requested
      if (this.config.updateReadme || process.env.CI) {
        await ReadmeReporter.updateReadme(fullResults);
      }

      // Export results if requested
      if (this.config.output) {
        const { writeFile } = await import('fs/promises');
        await writeFile(this.config.output, JSON.stringify(fullResults, null, 2));
        console.log(`\n📁 Results exported to ${this.config.output}`);
      }

      return fullResults;
    } catch (error) {
      console.error('Benchmark failed:', error);
      throw error;
    }
  }
}

// Import chalk for the console output
import chalk from 'chalk';
