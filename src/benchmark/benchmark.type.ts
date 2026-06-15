export interface BenchmarkConfig {
  verbose: boolean;
  updateReadme: boolean;
  output?: string;
  stressOnly?: boolean;
  cacheOnly?: boolean;
  parallelOnly?: boolean;
  quick?: boolean;
  concurrencyLevels?: number[];
  taskCount?: number;
  taskDuration?: number;
  stressDuration?: number;
  stressConcurrency?: number;
  targetRPS?: number;
}

export interface PerformanceMetric {
  label: string;
  duration: number;
  durationMs: string;
  memoryStart: NodeJS.MemoryUsage;
  memoryEnd: NodeJS.MemoryUsage;
  memoryDelta: MemoryDelta;
  timestamp: string;
}

export interface MemoryDelta {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface CacheBenchmarkResult {
  readHit: CacheOperationResult;
  readMiss: CacheOperationResult;
  write: CacheOperationResult;
  parallel: ParallelCacheResult;
  memory: MemoryEfficiencyResult;
}

export interface CacheOperationResult {
  type: 'hit' | 'miss' | 'write';
  operations: number;
  durationMs: string;
  opsPerSecond: string;
  avgLatencyUs: string;
}

export interface ParallelCacheResult {
  operations: number;
  durationMs: string;
  opsPerSecond: string;
  speedup: string;
}

export interface MemoryEfficiencyResult {
  itemsCached: number;
  totalMemoryMB: string;
  memoryPerItemKB: string;
}

export interface ParallelExecutionResult {
  concurrency: number;
  duration: number;
  durationMs: string;
  tasksPerSecond: string;
  memoryUsed: number;
  efficiency: string;
}

export interface StressTestResult {
  summary: StressSummary;
  latency: LatencyMetrics;
  throughput: ThroughputMetrics;
  memory: MemoryMetrics;
  errors: StressError[];
}

export interface StressSummary {
  totalDuration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: string;
}

export interface LatencyMetrics {
  avgMs: string;
  p50Ms: string;
  p95Ms: string;
  p99Ms: string;
}

export interface ThroughputMetrics {
  avgRPS: string;
  peakRPS: string;
}

export interface MemoryMetrics {
  peakMB: string;
  avgMB: string;
}

export interface StressError {
  timestamp: number;
  error: string;
}

export interface SystemInfo {
  nodeVersion: string;
  bunVersion: string;
  platform: string;
  cpus: number;
  cpuModel: string;
  totalMemoryGB: string;
  freeMemoryGB: string;
  loadAverage: number[];
}

export interface BenchmarkResults {
  basicMetrics: PerformanceMetric;
  cache: CacheBenchmarkResult;
  parallel: ParallelExecutionResult[];
  stress: StressTestResult;
  system: SystemInfo;
  timestamp: string;
  duration: number;
}

export interface ThroughputSample {
  timestamp: number;
  requests: number;
  duration: number;
  rps: number;
}
