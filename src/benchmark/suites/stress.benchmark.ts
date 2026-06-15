import { BaseBenchmark } from './base.benchmark.js';
import { StressTestResult, ThroughputSample, StressError } from '../benchmark.type';
import os from 'os';

export interface StressTestConfig {
  duration?: number;
  concurrency?: number;
  rampUpTime?: number;
  targetRPS?: number;
}

export class StressTestBenchmark extends BaseBenchmark {
  private duration: number;
  private concurrency: number;
  private rampUpTime: number;
  private targetRPS: number;

  constructor(config: StressTestConfig = {}, verbose: boolean = false) {
    super('StressTestBenchmark', verbose);
    this.duration = config.duration || 20000;
    this.concurrency = config.concurrency || os.cpus().length * 2;
    this.rampUpTime = config.rampUpTime || 5000;
    this.targetRPS = config.targetRPS || 500;
  }

  public async run(): Promise<StressTestResult> {
    this.log(`Starting stress test with ${this.concurrency} concurrent users`);
    this.log(`Target RPS: ${this.targetRPS}, Duration: ${this.duration / 1000}s`);

    const testFunction = this.createTestFunction();
    const results = await this.runStressTest(testFunction);

    this.log('Stress test completed');
    return results;
  }

  private createTestFunction(): () => Promise<{ result: number; timestamp: number }> {
    return async () => {
      // Simulate real work with variable latency
      await this.sleep(Math.random() * 5);

      // Some CPU work
      let result = 0;
      for (let i = 0; i < 1000; i++) {
        result += Math.random() * Math.random();
      }

      return { result, timestamp: Date.now() };
    };
  }

  private async runStressTest(testFunction: () => Promise<any>): Promise<StressTestResult> {
    const startTime = Date.now();
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const latencies: number[] = [];
    const throughput: ThroughputSample[] = [];
    const errors: StressError[] = [];
    const memorySnapshots: NodeJS.MemoryUsage[] = [];

    // Start resource monitoring
    const monitorInterval = setInterval(() => {
      memorySnapshots.push(process.memoryUsage());
    }, 1000);

    // Execute stress test phases
    const context = {
      totalRequests: () => totalRequests,
      successfulRequests: () => successfulRequests,
      failedRequests: () => failedRequests,
      latencies,
      throughput,
      errors,
    };

    await this.rampUpPhase(testFunction, context);
    await this.steadyStatePhase(testFunction, context);
    await this.cooldownPhase(testFunction, context);

    clearInterval(monitorInterval);

    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;

    return this.analyzeResults({
      totalDuration,
      totalRequests,
      successfulRequests,
      failedRequests,
      latencies,
      throughput,
      memorySnapshots,
      errors,
    });
  }

  private async rampUpPhase(testFunction: () => Promise<any>, context: any): Promise<void> {
    const startRampUp = Date.now();
    let currentConcurrency = 1;
    const step = this.concurrency / 10;

    while (currentConcurrency < this.concurrency && Date.now() - startRampUp < this.rampUpTime) {
      const batchPromises: Promise<any>[] = [];
      const batchStart = Date.now();

      for (let i = 0; i < Math.min(currentConcurrency, this.concurrency); i++) {
        batchPromises.push(this.executeWithMetrics(testFunction, context));
      }

      await Promise.all(batchPromises);

      const batchDuration = Date.now() - batchStart;
      context.throughput.push({
        timestamp: Date.now(),
        requests: batchPromises.length,
        duration: batchDuration,
        rps: (batchPromises.length / batchDuration) * 1000,
      });

      currentConcurrency += step;
      await this.sleep(100);
    }
  }

  private async steadyStatePhase(testFunction: () => Promise<any>, context: any): Promise<void> {
    const steadyStateDuration = this.duration - this.rampUpTime - 5000;
    const startSteadyState = Date.now();

    while (Date.now() - startSteadyState < steadyStateDuration) {
      const batchSize = Math.max(1, Math.floor(this.targetRPS / 10));
      const promises: Promise<any>[] = [];

      for (let i = 0; i < batchSize; i++) {
        promises.push(this.executeWithMetrics(testFunction, context));
      }

      const batchStart = Date.now();
      await Promise.all(promises);
      const batchDuration = Date.now() - batchStart;

      context.throughput.push({
        timestamp: Date.now(),
        requests: batchSize,
        duration: batchDuration,
        rps: (batchSize / batchDuration) * 1000,
      });

      // Maintain target RPS
      const expectedDuration = (batchSize / this.targetRPS) * 1000;
      if (batchDuration < expectedDuration) {
        await this.sleep(expectedDuration - batchDuration);
      }
    }
  }

  private async cooldownPhase(testFunction: () => Promise<any>, context: any): Promise<void> {
    const startCooldown = Date.now();
    const coolDownDuration = 5000;

    while (Date.now() - startCooldown < coolDownDuration) {
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 10; i++) {
        promises.push(this.executeWithMetrics(testFunction, context));
      }
      await Promise.all(promises);
      await this.sleep(100);
    }
  }

  private async executeWithMetrics(testFunction: () => Promise<any>, context: any): Promise<any> {
    const start = performance.now();
    try {
      const result = await testFunction();
      const latency = performance.now() - start;

      context.latencies.push(latency);
      context.successfulRequests++;
      context.totalRequests++;

      return result;
    } catch (error) {
      context.failedRequests++;
      context.totalRequests++;
      context.errors.push({
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private analyzeResults(data: {
    totalDuration: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    latencies: number[];
    throughput: ThroughputSample[];
    memorySnapshots: NodeJS.MemoryUsage[];
    errors: StressError[];
  }): StressTestResult {
    const sortedLatencies = [...data.latencies].sort((a, b) => a - b);
    const avgLatency = sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length;
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] ?? 0;
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] ?? 0;
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] ?? 0;

    const avgThroughput =
      data.throughput.reduce((sum, t) => sum + t.rps, 0) / data.throughput.length;
    const peakThroughput = Math.max(...data.throughput.map(t => t.rps));

    const memoryPeak = Math.max(...data.memorySnapshots.map(m => m.heapUsed)) / 1024 / 1024;
    const memoryAvg =
      data.memorySnapshots.reduce((sum, m) => sum + m.heapUsed, 0) /
      data.memorySnapshots.length /
      1024 /
      1024;

    return {
      summary: {
        totalDuration: data.totalDuration,
        totalRequests: data.totalRequests,
        successfulRequests: data.successfulRequests,
        failedRequests: data.failedRequests,
        successRate: ((data.successfulRequests / data.totalRequests) * 100).toFixed(2),
      },
      latency: {
        avgMs: avgLatency.toFixed(2),
        p50Ms: p50.toFixed(2),
        p95Ms: p95.toFixed(2),
        p99Ms: p99.toFixed(2),
      },
      throughput: {
        avgRPS: avgThroughput.toFixed(2),
        peakRPS: peakThroughput.toFixed(2),
      },
      memory: {
        peakMB: memoryPeak.toFixed(2),
        avgMB: memoryAvg.toFixed(2),
      },
      errors: data.errors.slice(0, 10),
    };
  }
}
