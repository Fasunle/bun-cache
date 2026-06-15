import { ParallelExecutionResult } from '../benchmark.type.js';
import { BaseBenchmark } from './base.benchmark.js';
import os from 'os';

export interface ParallelBenchmarkConfig {
  concurrencyLevels?: number[];
  taskCount?: number;
  taskDuration?: number;
}

export class ParallelExecutionBenchmark extends BaseBenchmark {
  private concurrencyLevels: number[];
  private taskCount: number;
  private taskDuration: number;

  constructor(config: ParallelBenchmarkConfig = {}, verbose: boolean = false) {
    super('ParallelExecutionBenchmark', verbose);
    this.concurrencyLevels = config.concurrencyLevels || [1, 2, 4, 8, 16];
    this.taskCount = config.taskCount || 200;
    this.taskDuration = config.taskDuration || 20;
  }

  public async run(): Promise<ParallelExecutionResult[]> {
    this.log(`Starting parallel execution benchmarks with ${this.taskCount} tasks`);
    this.log(`Task duration: ${this.taskDuration}ms per task`);

    const results: ParallelExecutionResult[] = [];

    for (const concurrency of this.concurrencyLevels) {
      this.log(`Testing concurrency level: ${concurrency}`);
      const result = await this.testConcurrencyLevel(concurrency);
      results.push(result);

      if (this.verbose) {
        this.log(
          `Concurrency ${concurrency}: ${result.tasksPerSecond} tasks/s, ${result.efficiency}% efficiency`,
          'debug'
        );
      }
    }

    this.log('Parallel execution benchmarks completed');
    return results;
  }

  private async testConcurrencyLevel(concurrency: number): Promise<ParallelExecutionResult> {
    const startMemory = process.memoryUsage();
    const startTime = Date.now();

    // Use Bun's worker threads
    const workers: Worker[] = [];
    const tasksPerWorker = Math.ceil(this.taskCount / concurrency);

    for (let i = 0; i < concurrency; i++) {
      const worker = new Worker(new URL('../workers/task.worker.ts', import.meta.url));
      workers.push(worker);
    }

    // Distribute tasks
    const taskPromises: Promise<any>[] = [];
    for (let i = 0; i < workers.length; i++) {
      const worker = workers[i];
      const workerTasks = [];
      const startIdx = i * tasksPerWorker;
      const endIdx = Math.min(startIdx + tasksPerWorker, this.taskCount);

      for (let j = startIdx; j < endIdx; j++) {
        workerTasks.push(
          new Promise(resolve => {
            worker.onmessage = event => {
              resolve(event.data);
            };
            worker.postMessage({ duration: this.taskDuration, id: j });
          })
        );
      }

      taskPromises.push(...workerTasks);
    }

    await Promise.all(taskPromises);

    // Cleanup workers
    for (const worker of workers) {
      worker.terminate();
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;

    const memoryUsed = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;
    const tasksPerSecond = (this.taskCount / duration) * 1000;
    const efficiency = this.calculateEfficiency(concurrency, duration);

    return {
      concurrency,
      duration,
      durationMs: (duration / 1000).toFixed(2),
      tasksPerSecond: tasksPerSecond.toFixed(2),
      memoryUsed,
      efficiency: efficiency.toFixed(2),
    };
  }

  private calculateEfficiency(concurrency: number, totalTime: number): number {
    const optimalTime = (this.taskCount * this.taskDuration) / concurrency;
    return (optimalTime / totalTime) * 100;
  }
}
