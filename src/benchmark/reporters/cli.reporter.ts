import { BenchmarkResults } from '../benchmark.type';
import chalk from 'chalk';
import Table from 'cli-table3';

export class CLIReporter {
  public static generateReport(results: BenchmarkResults): void {
    console.log('\n' + chalk.bold.cyan('🚀 ORCA PERFORMANCE BENCHMARK REPORT'));
    console.log(chalk.gray('='.repeat(80)));
    console.log(chalk.gray(`Run at: ${new Date(results.timestamp).toLocaleString()}`));
    console.log(chalk.gray(`Duration: ${(results.duration / 1000).toFixed(2)}s`));

    this.displaySystemInfo(results.system);
    this.displayCachePerformance(results.cache);
    this.displayParallelExecution(results.parallel);
    this.displayStressTest(results.stress);
    this.displayPerformanceScore(results);
    this.displayRecommendations(results);
  }

  private static displaySystemInfo(system: BenchmarkResults['system']): void {
    console.log('\n' + chalk.yellow.bold('💻 System Configuration:'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  ${chalk.cyan('Bun Version:')} ${system.bunVersion}`);
    console.log(`  ${chalk.cyan('Node.js:')} ${system.nodeVersion}`);
    console.log(`  ${chalk.cyan('Platform:')} ${system.platform}`);
    console.log(`  ${chalk.cyan('CPUs:')} ${system.cpus} cores`);
    console.log(`  ${chalk.cyan('CPU Model:')} ${system.cpuModel}`);
    console.log(
      `  ${chalk.cyan('Memory:')} ${system.freeMemoryGB}GB / ${system.totalMemoryGB}GB free`
    );
    console.log(
      `  ${chalk.cyan('Load Average:')} ${system.loadAverage.map(l => l.toFixed(2)).join(', ')}`
    );
  }

  private static displayCachePerformance(cache: BenchmarkResults['cache']): void {
    console.log('\n' + chalk.green.bold('💾 Cache Performance:'));
    console.log(chalk.gray('─'.repeat(40)));

    const cacheTable = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('Value')],
      colWidths: [30, 40],
      style: { head: [], border: [] },
    });

    cacheTable.push(
      [
        'Read Hit',
        `${chalk.green(cache.readHit.opsPerSecond)} ops/s (${cache.readHit.avgLatencyUs}μs)`,
      ],
      [
        'Read Miss',
        `${chalk.yellow(cache.readMiss.opsPerSecond)} ops/s (${cache.readMiss.avgLatencyUs}μs)`,
      ],
      ['Write', `${chalk.cyan(cache.write.opsPerSecond)} ops/s (${cache.write.avgLatencyUs}μs)`],
      [
        'Parallel Ops',
        `${chalk.magenta(cache.parallel.opsPerSecond)} ops/s (${cache.parallel.speedup}x speedup)`,
      ],
      ['Memory/Item', `${chalk.blue(cache.memory.memoryPerItemKB)} KB`],
      [
        'Total Memory',
        `${chalk.blue(cache.memory.totalMemoryMB)} MB for ${cache.memory.itemsCached} items`,
      ]
    );

    console.log(cacheTable.toString());
  }

  private static displayParallelExecution(parallel: BenchmarkResults['parallel']): void {
    console.log('\n' + chalk.blue.bold('⚡ Parallel Execution:'));
    console.log(chalk.gray('─'.repeat(40)));

    const parallelTable = new Table({
      head: [
        chalk.cyan('Concurrency'),
        chalk.cyan('Duration (s)'),
        chalk.cyan('Tasks/Sec'),
        chalk.cyan('Efficiency'),
        chalk.cyan('Memory (MB)'),
      ],
      colWidths: [15, 15, 15, 15, 15],
      style: { head: [], border: [] },
    });

    for (const result of parallel) {
      const efficiencyColor =
        parseFloat(result.efficiency) > 80
          ? chalk.green
          : parseFloat(result.efficiency) > 60
            ? chalk.yellow
            : chalk.red;

      parallelTable.push([
        result.concurrency.toString(),
        result.durationMs,
        result.tasksPerSecond,
        efficiencyColor(`${result.efficiency}%`),
        result.memoryUsed.toFixed(2),
      ]);
    }

    console.log(parallelTable.toString());
  }

  private static displayStressTest(stress: BenchmarkResults['stress']): void {
    console.log('\n' + chalk.red.bold('🎯 Stress Test Results:'));
    console.log(chalk.gray('─'.repeat(40)));

    const successColor =
      parseFloat(stress.summary.successRate) > 99
        ? chalk.green
        : parseFloat(stress.summary.successRate) > 95
          ? chalk.yellow
          : chalk.red;

    console.log(`  ${chalk.cyan('Success Rate:')} ${successColor(stress.summary.successRate)}%`);
    console.log(
      `  ${chalk.cyan('Total Requests:')} ${stress.summary.totalRequests.toLocaleString()}`
    );
    console.log(
      `  ${chalk.cyan('Failed Requests:')} ${stress.summary.failedRequests.toLocaleString()}`
    );

    console.log('\n  ⏱️  Latency:');
    console.log(`    ${chalk.cyan('Average:')} ${stress.latency.avgMs}ms`);
    console.log(`    ${chalk.cyan('P50:')} ${stress.latency.p50Ms}ms`);
    console.log(`    ${chalk.cyan('P95:')} ${stress.latency.p95Ms}ms`);
    console.log(`    ${chalk.cyan('P99:')} ${stress.latency.p99Ms}ms`);

    console.log('\n  📊 Throughput:');
    console.log(`    ${chalk.cyan('Average RPS:')} ${stress.throughput.avgRPS}`);
    console.log(`    ${chalk.cyan('Peak RPS:')} ${stress.throughput.peakRPS}`);

    console.log('\n  💾 Memory:');
    console.log(`    ${chalk.cyan('Peak:')} ${stress.memory.peakMB}MB`);
    console.log(`    ${chalk.cyan('Average:')} ${stress.memory.avgMB}MB`);
  }

  private static displayPerformanceScore(results: BenchmarkResults): void {
    const score = this.calculateScore(results);
    const scoreColor = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;

    console.log('\n' + chalk.magenta.bold('🏆 Overall Performance Score:'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  ${scoreColor.bold(`${score}/100`)}`);

    // Score breakdown
    const cacheScore = this.getCacheScore(results.cache);
    const parallelScore = this.getParallelScore(results.parallel);
    const stressScore = this.getStressScore(results.stress);

    console.log('\n  Score Breakdown:');
    console.log(`    ${chalk.green('Cache:')} ${cacheScore}/30`);
    console.log(`    ${chalk.blue('Parallel:')} ${parallelScore}/30`);
    console.log(`    ${chalk.red('Stress:')} ${stressScore}/40`);
  }

  private static calculateScore(results: BenchmarkResults): number {
    return (
      this.getCacheScore(results.cache) +
      this.getParallelScore(results.parallel) +
      this.getStressScore(results.stress)
    );
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

  private static displayRecommendations(results: BenchmarkResults): void {
    console.log('\n' + chalk.cyan.bold('💡 Recommendations:'));
    console.log(chalk.gray('─'.repeat(40)));

    const cacheOps = parseInt(results.cache.readHit.opsPerSecond);
    if (cacheOps < 20000) {
      console.log('  • Consider implementing Redis for better cache performance');
    }

    const bestEfficiency = Math.max(...results.parallel.map(r => parseFloat(r.efficiency)));
    if (bestEfficiency < 70) {
      console.log('  • Optimize parallel task distribution to improve efficiency');
    }

    const memUsage = parseFloat(results.stress.memory.peakMB);
    if (memUsage > 500) {
      console.log('  • High memory usage detected - consider implementing streaming');
    }

    const successRate = parseFloat(results.stress.summary.successRate);
    if (successRate < 99) {
      console.log('  • Improve error handling and retry logic for better reliability');
    }
  }
}
