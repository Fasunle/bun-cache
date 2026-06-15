import { PerformanceTracker } from '../utils/performance-tracker';

export abstract class BaseBenchmark {
  protected name: string;
  protected verbose: boolean;
  protected tracker: PerformanceTracker;

  constructor(name: string, verbose: boolean = false) {
    this.name = name;
    this.verbose = verbose;
    this.tracker = new PerformanceTracker();
  }

  public abstract run(): Promise<any>;

  protected log(message: string, level: 'info' | 'debug' | 'error' = 'info'): void {
    if (level === 'debug' && !this.verbose) {
      return;
    }

    const prefix = level === 'error' ? '❌' : level === 'debug' ? '🔍' : '📊';
    console.log(`${prefix} [${this.name}] ${message}`);
  }

  protected async measureAsync<T>(
    label: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const handle = this.tracker.start(label);
    const result = await operation();
    const metric = this.tracker.end(handle);

    if (this.verbose) {
      this.log(`${label} completed in ${metric.durationMs}ms`, 'debug');
    }

    return { result, duration: metric.duration };
  }

  protected measureSync<T>(label: string, operation: () => T): { result: T; duration: number } {
    const handle = this.tracker.start(label);
    const result = operation();
    const metric = this.tracker.end(handle);

    if (this.verbose) {
      this.log(`${label} completed in ${metric.durationMs}ms`, 'debug');
    }

    return { result, duration: metric.duration };
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
