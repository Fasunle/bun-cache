import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger } from '../src/logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('startExecution', () => {
    it('should log execution start with task and layer counts', () => {
      Logger.startExecution(4, 2);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('📦');
      expect(call).toContain('4 tasks');
      expect(call).toContain('2 layers');
    });

    it('should handle single task and layer', () => {
      Logger.startExecution(1, 1);
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('1 tasks');
      expect(call).toContain('1 layers');
    });

    it('should handle large numbers', () => {
      Logger.startExecution(1000, 100);
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('1000 tasks');
      expect(call).toContain('100 layers');
    });

    it('should handle zero tasks and layers', () => {
      Logger.startExecution(0, 0);
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('0 tasks');
      expect(call).toContain('0 layers');
    });
  });

  describe('layerHeader', () => {
    it('should log layer header with correct information', () => {
      Logger.layerHeader(1, 3, 5);
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      const calls = consoleLogSpy.mock.calls.map((c: string[]) => c[0]);
      expect(calls[0]).toContain('─');
      expect(calls[1]).toContain('📍');
      expect(calls[1]).toContain('Layer 1/3');
      expect(calls[1]).toContain('5 task(s)');
      expect(calls[2]).toContain('─');
    });

    it('should log final layer', () => {
      Logger.layerHeader(3, 3, 2);
      const calls = consoleLogSpy.mock.calls.map((c: string[]) => c[0]);
      expect(calls[1]).toContain('Layer 3/3');
      expect(calls[1]).toContain('2 task(s)');
    });

    it('should handle single task in layer', () => {
      Logger.layerHeader(1, 1, 1);
      const calls = consoleLogSpy.mock.calls.map((c: string[]) => c[0]);
      expect(calls[1]).toContain('1 task(s)');
    });

    it('should create proper visual separator', () => {
      Logger.layerHeader(1, 2, 3);
      const calls = consoleLogSpy.mock.calls.map((c: string[]) => c[0]);
      expect(calls[0]).toContain('─');
      expect(calls[2]).toContain('─');
    });
  });

  describe('cacheHit', () => {
    it('should log cache hit with proper format', () => {
      Logger.cacheHit(1, 4, 'apps/web', 'build');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('⚡'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cache hit:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1/4'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('apps/web'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('build'));
    });

    it('should handle different execution counts', () => {
      Logger.cacheHit(5, 10, 'apps/api', 'test');
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('5/10');
    });

    it('should handle workspace with slashes', () => {
      Logger.cacheHit(2, 5, 'packages/utils/core', 'build');
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('packages/utils/core');
      expect(call).toContain('build');
    });

    it('should format workspace and task correctly', () => {
      Logger.cacheHit(3, 8, 'apps/mobile', 'format');
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('apps/mobile');
      expect(call).toContain('format');
    });
  });

  describe('executing', () => {
    it('should log task execution with proper format', () => {
      Logger.executing(1, 4, 'apps/web', 'build');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🔨'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Executing:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1/4'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('apps/web'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('build'));
    });

    it('should handle last task in sequence', () => {
      Logger.executing(10, 10, 'packages/core', 'test');
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('10/10');
    });

    it('should display workspace and task names', () => {
      Logger.executing(2, 6, 'apps/dashboard', 'lint');
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('apps/dashboard');
      expect(call).toContain('lint');
    });
  });

  describe('completed', () => {
    it('should log task completion with duration', () => {
      Logger.completed(1, 4, 'apps/web', 'build', 1234);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Completed:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1/4'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('apps/web'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('build'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1234ms'));
    });

    it('should handle very fast completion', () => {
      Logger.completed(1, 5, 'apps/api', 'test', 50);
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('50ms');
    });

    it('should handle slow completion', () => {
      Logger.completed(3, 10, 'packages/core', 'build', 45000);
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('45000ms');
    });

    it('should handle zero duration', () => {
      Logger.completed(1, 3, 'apps/test', 'test', 0);
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('0ms');
    });
  });

  describe('failed', () => {
    it('should log task failure with proper format', () => {
      Logger.failed(2, 4, 'apps/web', 'build');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed:'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('2/4'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('apps/web'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('build'));
    });

    it('should use console.error for failures', () => {
      Logger.failed(1, 5, 'apps/api', 'test');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should show task count in progress', () => {
      Logger.failed(5, 10, 'packages/utils', 'clean');
      const call = consoleErrorSpy.mock.calls[0][0] as string;
      expect(call).toContain('5/10');
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      Logger.error('Something went wrong');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));
    });

    it('should format error with indentation', () => {
      Logger.error('Test error');
      const call = consoleErrorSpy.mock.calls[0][0] as string;
      expect(call).toMatch(/^\s+/); // starts with whitespace
    });

    it('should handle long error messages', () => {
      const longError = 'A very long error message that explains what went wrong in detail';
      Logger.error(longError);
      const call = consoleErrorSpy.mock.calls[0][0] as string;
      expect(call).toContain(longError);
    });

    it('should handle special characters in error', () => {
      Logger.error('Error: "quotes" and \'apostrophes\' and \\backslashes\\');
      const call = consoleErrorSpy.mock.calls[0][0] as string;
      expect(call).toContain('quotes');
    });
  });

  describe('allTasksCompleted', () => {
    it('should log successful completion', () => {
      Logger.allTasksCompleted();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✅'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('All tasks completed successfully')
      );
    });

    it('should be called once', () => {
      Logger.allTasksCompleted();
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      Logger.warn('This is a warning');
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('This is a warning'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Warning:'));
    });

    it('should use console.warn', () => {
      Logger.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle long warning messages', () => {
      Logger.warn('A comprehensive warning message with important information');
      const call = consoleWarnSpy.mock.calls[0][0] as string;
      expect(call).toContain('comprehensive');
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      Logger.info('Information message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Information message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ️'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Info:'));
    });

    it('should use console.log for info', () => {
      Logger.info('Test info');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('should log success message', () => {
      Logger.success('Operation succeeded');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Operation succeeded'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
    });

    it('should not include title prefix', () => {
      Logger.success('Test success');
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('✓');
      expect(call).toContain('Test success');
    });
  });

  describe('help', () => {
    it('should log help text', () => {
      Logger.help();
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('orca');
      expect(call).toContain('Usage:');
      expect(call).toContain('run');
      expect(call).toContain('clean');
    });

    it('should include examples', () => {
      Logger.help();
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('Examples:');
      expect(call).toContain('orca run build');
    });

    it('should describe purpose', () => {
      Logger.help();
      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain('Task orchestrator with intelligent caching');
    });
  });

  describe('errorWithContext', () => {
    it('should log error with title and message', () => {
      Logger.errorWithContext('TestError', 'Something failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('TestError'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Something failed'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌'));
    });

    it('should use console.error', () => {
      Logger.errorWithContext('Error', 'test');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should format with colon separator', () => {
      Logger.errorWithContext('ValidationError', 'Invalid input');
      const call = consoleErrorSpy.mock.calls[0][0] as string;
      expect(call).toContain('ValidationError:');
    });
  });

  describe('clearingCache', () => {
    it('should log cache clearing message', () => {
      Logger.clearingCache();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🧹'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Clearing cache'));
    });

    it('should be called once per clear', () => {
      Logger.clearingCache();
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('taskNotFound', () => {
    it('should log task not found error', () => {
      Logger.taskNotFound('build');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('build'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('orca.json'));
    });

    it('should use errorWithContext', () => {
      Logger.taskNotFound('custom-task');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include task name in message', () => {
      Logger.taskNotFound('deploy');
      const call = consoleErrorSpy.mock.calls[0][0] as string;
      expect(call).toContain('deploy');
    });
  });

  describe('targetNotFound', () => {
    it('should log target not found warning', () => {
      Logger.targetNotFound('apps/unknown');
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Warning'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('apps/unknown'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('workspaces'));
    });

    it('should use console.warn', () => {
      Logger.targetNotFound('target');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('noPackageJson', () => {
    it('should log package.json missing error', () => {
      Logger.noPackageJson('apps/web');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('package.json'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('apps/web'));
    });

    it('should indicate workspace in error', () => {
      Logger.noPackageJson('packages/utils');
      const call = consoleErrorSpy.mock.calls[0][0] as string;
      expect(call).toContain('packages/utils');
    });
  });

  describe('noScript', () => {
    it('should log missing script error', () => {
      Logger.noScript('build', 'apps/web');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('build'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('apps/web'));
    });

    it('should specify both task and workspace', () => {
      Logger.noScript('test', 'packages/core');
      const call = consoleErrorSpy.mock.calls[0][0] as string;
      expect(call).toContain('test');
      expect(call).toContain('packages/core');
    });
  });

  describe('circularDependency', () => {
    it('should log circular dependency error', () => {
      Logger.circularDependency();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Circular dependency'));
    });

    it('should be informative about the issue', () => {
      Logger.circularDependency();
      const call = consoleErrorSpy.mock.calls[0][0] as string;
      expect(call).toContain('Circular');
      expect(call).toContain('dependency');
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings gracefully', () => {
      expect(() => Logger.warn('')).not.toThrow();
      expect(() => Logger.info('')).not.toThrow();
      expect(() => Logger.error('')).not.toThrow();
      expect(() => Logger.success('')).not.toThrow();
    });

    it('should handle special characters in workspace and task names', () => {
      expect(() => Logger.executing(1, 5, 'apps/@scoped/pkg', 'build:prod')).not.toThrow();
      expect(() => Logger.completed(1, 5, 'apps/@scoped/pkg', 'build:prod', 100)).not.toThrow();
    });

    it('should handle very large numbers', () => {
      expect(() => Logger.startExecution(999999, 9999)).not.toThrow();
      expect(() => Logger.completed(1000, 1000, 'app', 'task', 999999999)).not.toThrow();
    });

    it('should handle unicode characters', () => {
      expect(() => Logger.warn('⚡ Lightning fast')).not.toThrow();
      expect(() => Logger.success('✨ Sparkles')).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle a complete workflow sequence', () => {
      Logger.startExecution(2, 1);
      Logger.layerHeader(1, 1, 2);
      Logger.executing(1, 2, 'apps/web', 'build');
      Logger.completed(1, 2, 'apps/web', 'build', 1500);
      Logger.executing(2, 2, 'apps/api', 'build');
      Logger.completed(2, 2, 'apps/api', 'build', 2000);
      Logger.allTasksCompleted();

      expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(5);
    });

    it('should handle workflow with cache hits', () => {
      Logger.startExecution(2, 1);
      Logger.layerHeader(1, 1, 2);
      Logger.cacheHit(1, 2, 'apps/web', 'build');
      Logger.executing(2, 2, 'apps/api', 'build');
      Logger.completed(2, 2, 'apps/api', 'build', 1000);
      Logger.allTasksCompleted();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cache hit:'));
    });

    it('should handle workflow with failure', () => {
      Logger.startExecution(2, 1);
      Logger.layerHeader(1, 1, 2);
      Logger.executing(1, 2, 'apps/web', 'build');
      Logger.failed(1, 2, 'apps/web', 'build');
      Logger.error('Build process exited with code 1');

      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(0);
    });
  });
});
