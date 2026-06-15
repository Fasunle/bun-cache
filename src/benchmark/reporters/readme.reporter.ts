import { BenchmarkResults } from '../benchmark.type';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

export class ReadmeReporter {
  public static async updateReadme(results: BenchmarkResults): Promise<void> {
    const readmePath = join(process.cwd(), 'README.md');

    try {
      let readme = await readFile(readmePath, 'utf-8');
      const benchmarkSection = this.generateBenchmarkSection(results);

      const benchmarkMarker = '<!-- BENCHMARK_START -->';
      const endMarker = '<!-- BENCHMARK_END -->';

      if (readme.includes(benchmarkMarker)) {
        const regex = new RegExp(`${benchmarkMarker}[\\s\\S]*?${endMarker}`);
        readme = readme.replace(regex, `${benchmarkMarker}\n${benchmarkSection}\n${endMarker}`);
      } else {
        readme += `\n\n## Performance Benchmarks\n\n${benchmarkSection}\n`;
      }

      await writeFile(readmePath, readme, 'utf-8');
      console.log('✅ README updated with benchmark results');
    } catch (error) {
      console.error('Failed to update README:', error);
    }
  }

  private static generateBenchmarkSection(results: BenchmarkResults): string {
    const date = new Date(results.timestamp).toISOString().split('T')[0];

    return `
### Latest Benchmark Results (${date})

#### System Configuration
- **Bun Version**: ${results.system.bunVersion}
- **Node.js**: ${results.system.nodeVersion}
- **Platform**: ${results.system.platform}
- **CPUs**: ${results.system.cpus} cores
- **Memory**: ${results.system.freeMemoryGB}GB / ${results.system.totalMemoryGB}GB free

#### Cache Performance
| Metric | Value |
|--------|-------|
| Read Hit | ${results.cache.readHit.opsPerSecond} ops/s |
| Read Miss | ${results.cache.readMiss.opsPerSecond} ops/s |
| Write Speed | ${results.cache.write.opsPerSecond} ops/s |
| Parallel Ops | ${results.cache.parallel.opsPerSecond} ops/s (${results.cache.parallel.speedup}x) |
| Memory per Item | ${results.cache.memory.memoryPerItemKB} KB |

#### Parallel Execution
| Concurrency | Duration (s) | Tasks/Sec | Efficiency |
|-------------|--------------|-----------|------------|
${results.parallel.map(r => `| ${r.concurrency} | ${r.durationMs} | ${r.tasksPerSecond} | ${r.efficiency}% |`).join('\n')}

#### Stress Test Results
- **Success Rate**: ${results.stress.summary.successRate}%
- **Total Requests**: ${results.stress.summary.totalRequests.toLocaleString()}
- **Peak RPS**: ${results.stress.throughput.peakRPS}
- **P95 Latency**: ${results.stress.latency.p95Ms}ms
- **Peak Memory**: ${results.stress.memory.peakMB}MB

#### Performance Score: ${this.calculateScore(results)}/100

---
*Benchmarks automatically run on every push to main branch*
`;
  }

  private static calculateScore(results: BenchmarkResults): number {
    const cacheScore = this.getCacheScore(results.cache);
    const parallelScore = this.getParallelScore(results.parallel);
    const stressScore = this.getStressScore(results.stress);
    return cacheScore + parallelScore + stressScore;
  }

  private static getCacheScore(cache: BenchmarkResults['cache']): number {
    const cacheOps = parseInt(cache.readHit.opsPerSecond);
    if (cacheOps > 50000) return 30;
    if (cacheOps > 20000) return 20;
    if (cacheOps > 5000) return 10;
    return 5;
  }

  private static getParallelScore(parallel: BenchmarkResults['parallel']): number {
    const bestEfficiency = Math.max(...parallel.map(r => parseFloat(r.efficiency)));
    if (bestEfficiency > 80) return 30;
    if (bestEfficiency > 60) return 20;
    if (bestEfficiency > 40) return 10;
    return 5;
  }

  private static getStressScore(stress: BenchmarkResults['stress']): number {
    const successRate = parseFloat(stress.summary.successRate);
    const peakRPS = parseFloat(stress.throughput.peakRPS);

    if (successRate > 99 && peakRPS > 500) return 40;
    if (successRate > 95 && peakRPS > 200) return 30;
    if (successRate > 90) return 20;
    return 10;
  }
}
