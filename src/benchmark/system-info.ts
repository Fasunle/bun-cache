import { SystemInfo } from './benchmark.type';

export class SystemInfoCollector {
  public static async collect(): Promise<SystemInfo> {
    const os = await import('os');
    const cpus = os.cpus();
    const totalMem = os.totalmem() / 1024 / 1024 / 1024;
    const freeMem = os.freemem() / 1024 / 1024 / 1024;

    // Get Bun version
    let bunVersion = 'unknown';
    try {
      const proc = Bun.spawnSync(['bun', '--version']);
      bunVersion = proc.stdout.toString().trim();
    } catch (error) {
      bunVersion = 'not found';
    }

    return {
      nodeVersion: process.version,
      bunVersion,
      platform: `${os.platform()} ${os.release()}`,
      cpus: cpus.length,
      cpuModel: cpus[0]?.model ?? 'Unknown',
      totalMemoryGB: totalMem.toFixed(2),
      freeMemoryGB: freeMem.toFixed(2),
      loadAverage: os.loadavg(),
    };
  }
}
