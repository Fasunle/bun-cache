import { BaseBenchmark } from './base.benchmark.js';
import { PerformanceMetric } from '../benchmark.type';

export class MetricsBenchmark extends BaseBenchmark {
  constructor(verbose: boolean = false) {
    super('MetricsBenchmark', verbose);
  }

  public async run(): Promise<PerformanceMetric> {
    this.log('Running basic performance metrics');

    const handle = this.tracker.start('basic-metrics');

    // Run various operations
    await this.runSyncOperations();
    await this.runAsyncOperations();

    const metric = this.tracker.end(handle);

    this.log(`Basic metrics completed in ${metric.durationMs}ms`);
    return metric;
  }

  private async runSyncOperations(): Promise<void> {
    this.measureSync('sync-loop-1M', () => {
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }
      return sum;
    });

    this.measureSync('json-stringify-10K', () => {
      const obj = { test: 'data', array: Array(1000).fill('x') };
      return JSON.stringify(obj);
    });

    this.measureSync('array-operations', () => {
      const arr = Array.from({ length: 10000 }, (_, i) => i);
      return arr
        .filter(x => x % 2 === 0)
        .map(x => x * 2)
        .reduce((a, b) => a + b, 0);
    });
  }

  private async runAsyncOperations(): Promise<void> {
    await this.measureAsync('promise-all-100', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => Promise.resolve(i * 2));
      return Promise.all(promises);
    });

    await this.measureAsync('bun-sleep-10ms', async () => {
      await this.sleep(10);
      return;
    });
  }
}
