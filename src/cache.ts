import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, cpSync, statSync } from 'fs';
import { join } from 'path';

export class CacheManager {
  private cacheDir: string;
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.cacheDir = join(rootDir, '.orca');
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  get(hash: string): boolean {
    const metaPath = join(this.cacheDir, `${hash}.json`);
    if (!existsSync(metaPath)) return false;

    // Validate that all outputs still exist
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      if (!meta.outputs || !Array.isArray(meta.outputs)) return false;

      // Check if all outputs exist
      return meta.outputs.every((output: string) => existsSync(output));
    } catch (error) {
      return false;
    }
  }

  save(hash: string, outputs: string[], workspacePath: string): void {
    const meta = {
      timestamp: Date.now(),
      outputs: outputs,
    };

    const metaPath = join(this.cacheDir, `${hash}.json`);
    const hashCacheDir = join(this.cacheDir, hash);

    // Create cache directory for this hash
    mkdirSync(hashCacheDir, { recursive: true });

    // Copy outputs to cache
    outputs.forEach(output => {
      const fullOutputPath = join(workspacePath, output);
      if (existsSync(fullOutputPath)) {
        const cachedOutputPath = join(hashCacheDir, 'outputs', output);
        mkdirSync(join(hashCacheDir, 'outputs', output, '..'), { recursive: true });

        const stats = statSync(fullOutputPath);
        if (stats.isDirectory()) {
          cpSync(fullOutputPath, cachedOutputPath, { recursive: true, force: true });
        } else {
          cpSync(fullOutputPath, cachedOutputPath, { force: true });
        }
      }
    });

    writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }

  restore(hash: string, workspacePath: string): void {
    const metaPath = join(this.cacheDir, `${hash}.json`);
    if (!existsSync(metaPath)) return;

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    const hashCacheDir = join(this.cacheDir, hash);

    // Copy cached outputs back to workspace
    meta.outputs.forEach((output: string) => {
      const cachedPath = join(hashCacheDir, 'outputs', output);
      const workspaceOutputPath = join(workspacePath, output);

      if (existsSync(cachedPath)) {
        // Remove existing output to avoid conflicts
        if (existsSync(workspaceOutputPath)) {
          rmSync(workspaceOutputPath, { recursive: true, force: true });
        }

        const stats = statSync(cachedPath);
        if (stats.isDirectory()) {
          cpSync(cachedPath, workspaceOutputPath, { recursive: true });
        } else {
          cpSync(cachedPath, workspaceOutputPath);
        }
      }
    });
  }

  clean(): void {
    rmSync(this.cacheDir, { recursive: true, force: true });
  }
}
