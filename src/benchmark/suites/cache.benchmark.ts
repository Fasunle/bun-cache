import NodeCache from 'node-cache';
import {
  CacheBenchmarkResult,
  CacheOperationResult,
  MemoryEfficiencyResult,
  ParallelCacheResult,
} from '../benchmark.type.js';
import { BaseBenchmark } from './base.benchmark.js';

export class CacheBenchmark extends BaseBenchmark {
  private cache: NodeCache;

  constructor(verbose: boolean = false) {
    super('CacheBenchmark', verbose);
    this.cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
  }

  public async run(): Promise<CacheBenchmarkResult> {
    this.log('Starting cache performance benchmarks');

    const results: CacheBenchmarkResult = {
      readHit: await this.testCacheRead(true),
      readMiss: await this.testCacheRead(false),
      write: await this.testCacheWrite(),
      parallel: await this.testParallelCache(),
      memory: await this.testMemoryEfficiency(),
    };

    this.log('Cache benchmarks completed');
    return results;
  }

  private async testCacheRead(shouldHit: boolean): Promise<CacheOperationResult> {
    const key = 'benchmark-key';

    if (shouldHit) {
      this.cache.set(key, { data: 'test', timestamp: Date.now() });
    } else {
      this.cache.del(key);
    }

    const iterations = 10000;

    const { result: operations, duration } = await this.measureAsync(
      `cache-read-${shouldHit ? 'hit' : 'miss'}`,
      async () => {
        for (let i = 0; i < iterations; i++) {
          const value = this.cache.get(key);
          if (shouldHit && !value) {
            throw new Error('Cache miss when hit expected');
          }
        }
        return iterations;
      }
    );

    return {
      type: shouldHit ? 'hit' : 'miss',
      operations,
      durationMs: duration.toFixed(2),
      opsPerSecond: ((operations / duration) * 1000).toFixed(0),
      avgLatencyUs: ((duration / operations) * 1000).toFixed(2),
    };
  }

  private async testCacheWrite(): Promise<CacheOperationResult> {
    const iterations = 5000;

    const { result: operations, duration } = await this.measureAsync('cache-write', async () => {
      for (let i = 0; i < iterations; i++) {
        this.cache.set(`key-${i}`, { value: i, timestamp: Date.now() });
      }
      return iterations;
    });

    return {
      type: 'write',
      operations,
      durationMs: duration.toFixed(2),
      opsPerSecond: ((operations / duration) * 1000).toFixed(0),
      avgLatencyUs: ((duration / operations) * 1000).toFixed(2),
    };
  }

  private async testParallelCache(): Promise<ParallelCacheResult> {
    const numOperations = 1000;

    const { result: operations, duration } = await this.measureAsync('cache-parallel', async () => {
      const promises: Promise<any>[] = [];

      for (let i = 0; i < numOperations; i++) {
        promises.push(
          Promise.all([
            this.cache.set(`parallel-${i}`, { data: i }),
            this.cache.get(`parallel-${i - 1}`),
            this.cache.del(`parallel-${i - 2}`),
          ])
        );
      }

      await Promise.all(promises);
      return numOperations;
    });

    const speedup = this.calculateSpeedup(numOperations, duration);

    return {
      operations,
      durationMs: duration.toFixed(2),
      opsPerSecond: ((operations / duration) * 1000).toFixed(0),
      speedup: speedup.toFixed(2),
    };
  }

  private async testMemoryEfficiency(): Promise<MemoryEfficiencyResult> {
    const initialMemory = process.memoryUsage().heapUsed;
    const numItems = 10000;

    await this.measureAsync('cache-memory-fill', async () => {
      for (let i = 0; i < numItems; i++) {
        this.cache.set(`mem-${i}`, {
          data: 'x'.repeat(100),
          metadata: { index: i, created: Date.now() },
        });
      }
      return numItems;
    });

    const afterFillMemory = process.memoryUsage().heapUsed;
    const memoryPerItem = (afterFillMemory - initialMemory) / numItems;

    // Clear cache
    this.cache.flushAll();

    return {
      itemsCached: numItems,
      totalMemoryMB: ((afterFillMemory - initialMemory) / 1024 / 1024).toFixed(2),
      memoryPerItemKB: (memoryPerItem / 1024).toFixed(2),
    };
  }

  private calculateSpeedup(operations: number, duration: number): number {
    const singleThreadTime = operations * 0.05;
    return singleThreadTime / duration;
  }
}
