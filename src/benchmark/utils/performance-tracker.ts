import { MemoryDelta, PerformanceMetric } from '../benchmark.type';

export interface TrackerHandle {
  label: string;
  startTime: number;
  startMemory: NodeJS.MemoryUsage;
}

export class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];

  public start(label: string): TrackerHandle {
    // Attempt to trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }

    return {
      label,
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
    };
  }

  public end(handle: TrackerHandle): PerformanceMetric {
    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const memoryDelta: MemoryDelta = {
      heapUsed: endMemory.heapUsed - handle.startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - handle.startMemory.heapTotal,
      external: endMemory.external - handle.startMemory.external,
      rss: endMemory.rss - handle.startMemory.rss,
    };

    const metric: PerformanceMetric = {
      label: handle.label,
      duration: endTime - handle.startTime,
      durationMs: (endTime - handle.startTime).toFixed(2),
      memoryStart: handle.startMemory,
      memoryEnd: endMemory,
      memoryDelta,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(metric);
    return metric;
  }

  public getMetrics(): ReadonlyArray<PerformanceMetric> {
    return [...this.metrics];
  }

  public clear(): void {
    this.metrics = [];
  }
}
