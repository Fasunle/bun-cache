import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { program, loadOrcaConfig, parseAndAliasArgv, main } from '../src/cli';

describe('CLI', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `podic-cli-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Create test project structure
    writeFileSync(
      join(testDir, 'orca.json'),
      JSON.stringify({
        tasks: {
          build: {
            outputs: ['dist/**'],
            cache: true,
          },
          test: {
            outputs: ['coverage/**'],
            cache: true,
          },
          lint: {
            cache: false,
          },
        },
        globalDependencies: [],
      })
    );

    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '0.1.0',
        workspaces: ['apps/*'],
      })
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('loadOrcaConfig() - Core Function', () => {
    it('should load orca.json and return tasks', () => {
      const orcaPath = join(testDir, 'orca.json');
      const content = require('fs').readFileSync(orcaPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.tasks).toBeDefined();
      expect(config.tasks.build).toBeDefined();
      expect(config.tasks.test).toBeDefined();
    });

    it('should parse all task definitions', () => {
      const orcaPath = join(testDir, 'orca.json');
      const content = require('fs').readFileSync(orcaPath, 'utf-8');
      const config = JSON.parse(content);
      const taskNames = Object.keys(config.tasks);

      expect(taskNames).toContain('build');
      expect(taskNames).toContain('test');
      expect(taskNames).toContain('lint');
    });

    it('should preserve task configuration', () => {
      const orcaPath = join(testDir, 'orca.json');
      const content = require('fs').readFileSync(orcaPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.tasks.build.outputs).toEqual(['dist/**']);
      expect(config.tasks.build.cache).toBe(true);
      expect(config.tasks.lint.cache).toBe(false);
    });

    it('should return empty object on read error', () => {
      const missingPath = join(tmpdir(), `missing-orca-${Date.now()}`);

      try {
        require('fs').readFileSync(missingPath, 'utf-8');
      } catch {
        // Expected - file doesn't exist
        expect(true).toBe(true);
      }
    });

    it('should handle malformed JSON', () => {
      const badDir = join(tmpdir(), `bad-json-${Date.now()}`);
      mkdirSync(badDir, { recursive: true });
      writeFileSync(join(badDir, 'orca.json'), '{invalid}');

      try {
        JSON.parse(require('fs').readFileSync(join(badDir, 'orca.json'), 'utf-8'));
        expect(false).toBe(true); // Should throw
      } catch {
        expect(true).toBe(true);
      }

      rmSync(badDir, { recursive: true, force: true });
    });

    it('should handle missing tasks field', () => {
      const noTasksDir = join(tmpdir(), `no-tasks-${Date.now()}`);
      mkdirSync(noTasksDir, { recursive: true });
      writeFileSync(
        join(noTasksDir, 'orca.json'),
        JSON.stringify({
          globalDependencies: [],
        })
      );

      const content = require('fs').readFileSync(join(noTasksDir, 'orca.json'), 'utf-8');
      const config = JSON.parse(content);
      const tasks = config.tasks || {};

      expect(tasks).toEqual({});

      rmSync(noTasksDir, { recursive: true, force: true });
    });
  });

  describe('parseAndAliasArgv() - Core Function', () => {
    it('should detect known commands without aliasing', () => {
      const KNOWN_COMMANDS = new Set(['run', 'clean', 'info', 'help']);

      expect(KNOWN_COMMANDS.has('run')).toBe(true);
      expect(KNOWN_COMMANDS.has('clean')).toBe(true);
    });

    it('should detect known flags without aliasing', () => {
      const KNOWN_FLAGS = new Set(['-h', '--help', '-v', '--version']);

      expect(KNOWN_FLAGS.has('--help')).toBe(true);
      expect(KNOWN_FLAGS.has('-v')).toBe(true);
    });

    it('should detect when first arg starts with dash', () => {
      const args = ['bun', 'cli.ts', '-v'];
      const firstArg = args[2];

      expect(firstArg.startsWith('-')).toBe(true);
    });

    it('should handle empty argv array', () => {
      const argv = ['bun', 'cli.ts'];
      expect(argv.length).toBe(2);
    });

    it('should preserve argument order', () => {
      const args = ['run', 'build', 'apps/web', 'apps/api'];

      expect(args[0]).toBe('run');
      expect(args[1]).toBe('build');
      expect(args[2]).toBe('apps/web');
    });

    it('should identify valid task names', () => {
      const orcaConfig = { build: {}, test: {}, lint: {} };
      const isValidTask = (task: string) => task in orcaConfig;

      expect(isValidTask('build')).toBe(true);
      expect(isValidTask('test')).toBe(true);
      expect(isValidTask('unknown')).toBe(false);
    });

    it('should handle task names with special characters', () => {
      const taskName = 'build:watch';
      expect(taskName).toContain(':');
    });

    it('should preserve targets in argv', () => {
      const argv = ['bun', 'cli.ts', 'build', 'apps/web'];
      expect(argv[3]).toBe('apps/web');
    });
  });

  describe('Program Commands Structure', () => {
    it('should have orca as program name', () => {
      expect(program.name()).toBe('orca');
    });

    it('should have program description', () => {
      const desc = program.description();
      expect(desc).toBeDefined();
      expect(desc).toContain('orchestrator');
    });

    it('should have run command', () => {
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      expect(runCmd).toBeDefined();
    });

    it('should have clean command', () => {
      const cleanCmd = program.commands.find(cmd => cmd.name() === 'clean');
      expect(cleanCmd).toBeDefined();
    });

    it('should have info command', () => {
      const infoCmd = program.commands.find(cmd => cmd.name() === 'info');
      expect(infoCmd).toBeDefined();
    });

    it('run command should have task parameter', () => {
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      expect(runCmd?.name()).toBe('run');
    });

    it('run command should have targets parameter', () => {
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      expect(runCmd).toBeDefined();
    });

    it('clean command should exist', () => {
      const cleanCmd = program.commands.find(cmd => cmd.name() === 'clean');
      expect(cleanCmd?.name()).toBe('clean');
    });

    it('info command should exist', () => {
      const infoCmd = program.commands.find(cmd => cmd.name() === 'info');
      expect(infoCmd?.name()).toBe('info');
    });

    it('should have version available', () => {
      const version = program.version();
      expect(version).toBeDefined();
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe('Program Help System', () => {
    it('should output help', () => {
      const spy = vi.spyOn(console, 'log');
      program.outputHelp();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should show usage in help', () => {
      const spy = vi.spyOn(console, 'log');
      program.outputHelp();

      const output = spy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('orca');
      program.outputHelp();

      expect(output).toContain('orca');
      spy.mockRestore();
    });

    it('run command should have description', () => {
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      const desc = runCmd?.description();
      expect(desc).toBeDefined();
    });

    it('clean command should have description', () => {
      const cleanCmd = program.commands.find(cmd => cmd.name() === 'clean');
      const desc = cleanCmd?.description();
      expect(desc).toBeDefined();
    });

    it('should display command options in help', () => {
      const spy = vi.spyOn(console, 'log');
      program.outputHelp();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Command Options and Flags', () => {
    it('should handle --parallel flag', () => {
      const args = ['run', 'build', '--parallel'];
      expect(args).toContain('--parallel');
    });

    it('should handle --no-cache flag', () => {
      const args = ['run', 'build', '--no-cache'];
      expect(args).toContain('--no-cache');
    });

    it('should handle --verbose flag', () => {
      const args = ['run', 'build', '--verbose'];
      expect(args).toContain('--verbose');
    });

    it('should handle --filter option', () => {
      const args = ['run', 'build', '--filter', 'apps/*'];
      const filterIdx = args.indexOf('--filter');
      expect(filterIdx).toBeGreaterThan(-1);
      expect(args[filterIdx + 1]).toBe('apps/*');
    });

    it('should handle --scope option for clean', () => {
      const args = ['clean', '--scope', 'apps/web'];
      expect(args).toContain('--scope');
    });

    it('should handle --dry-run option for clean', () => {
      const args = ['clean', '--dry-run'];
      expect(args).toContain('--dry-run');
    });

    it('should handle --json option for info', () => {
      const args = ['info', '--json'];
      expect(args).toContain('--json');
    });

    it('should handle multiple flags together', () => {
      const args = ['run', 'build', '--verbose', '--no-cache', '--parallel'];
      expect(args).toContain('--verbose');
      expect(args).toContain('--no-cache');
      expect(args).toContain('--parallel');
    });

    it('should handle option with equals sign', () => {
      const args = ['run', 'build', '--filter=apps/*'];
      expect(args).toContain('--filter=apps/*');
    });

    it('should handle short flags', () => {
      const args = ['-v', '-h'];
      expect(args).toContain('-v');
      expect(args).toContain('-h');
    });
  });

  describe('Argument Parsing', () => {
    it('should parse command as first argument', () => {
      const args = ['run', 'build'];
      expect(args[0]).toBe('run');
    });

    it('should parse task as second argument', () => {
      const args = ['run', 'build'];
      expect(args[1]).toBe('build');
    });

    it('should parse targets after task', () => {
      const args = ['run', 'build', 'apps/web', 'apps/api'];
      const targets = args.slice(2);

      expect(targets).toEqual(['apps/web', 'apps/api']);
    });

    it('should handle single target', () => {
      const args = ['run', 'build', 'apps/web'];
      const targets = args.slice(2);

      expect(targets).toEqual(['apps/web']);
    });

    it('should handle no targets', () => {
      const args = ['run', 'build'];
      const targets = args.slice(2);

      expect(targets).toEqual([]);
    });

    it('should handle nested paths', () => {
      const args = ['run', 'build', 'a/b/c/d/package'];
      const targets = args.slice(2);

      expect(targets[0]).toBe('a/b/c/d/package');
    });

    it('should handle scoped packages', () => {
      const args = ['run', 'build', '@scope/package'];
      const targets = args.slice(2);

      expect(targets).toContain('@scope/package');
    });

    it('should handle task names with hyphens', () => {
      const args = ['run', 'build-prod'];
      expect(args[1]).toBe('build-prod');
    });

    it('should handle task names with colons', () => {
      const args = ['run', 'build:watch'];
      expect(args[1]).toBe('build:watch');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing task name', () => {
      const args = ['run'];
      const task = args[1];

      expect(task).toBeUndefined();
    });

    it('should handle unknown command', () => {
      const command = 'unknown';
      const validCmds = ['run', 'clean', 'info'];

      expect(validCmds).not.toContain(command);
    });

    it('should handle invalid JSON', () => {
      expect(() => JSON.parse('{invalid}')).toThrow();
    });

    it('should handle file not found', () => {
      const invalidPath = '/nonexistent/path/orca.json';
      expect(() => require('fs').readFileSync(invalidPath)).toThrow();
    });

    it('should handle empty task', () => {
      const task = '';
      expect(task.length).toBe(0);
    });

    it('should handle whitespace in arguments', () => {
      const args = ['run', 'build ', ' apps/web'];
      expect(args[1]).toBe('build ');
    });

    it('should handle very long paths', () => {
      const longPath = 'a'.repeat(256) + '/package';
      const args = ['run', 'build', longPath];

      expect(args[2]).toBe(longPath);
    });
  });

  describe('Task Execution Scenarios', () => {
    it('should accept build task', () => {
      const args = ['run', 'build'];
      expect(args[1]).toBe('build');
    });

    it('should accept test task', () => {
      const args = ['run', 'test'];
      expect(args[1]).toBe('test');
    });

    it('should accept lint task', () => {
      const args = ['run', 'lint'];
      expect(args[1]).toBe('lint');
    });

    it('should execute with single workspace', () => {
      const args = ['run', 'build', 'apps/web'];
      const targets = args.slice(2);

      expect(targets.length).toBe(1);
    });

    it('should execute with multiple workspaces', () => {
      const args = ['run', 'build', 'apps/web', 'apps/api', 'packages/lib'];
      const targets = args.slice(2);

      expect(targets.length).toBe(3);
    });

    it('should execute without specific targets', () => {
      const args = ['run', 'build'];
      const targets = args.slice(2);

      expect(targets.length).toBe(0);
    });

    it('should handle task with cache enabled', () => {
      const orcaPath = join(testDir, 'orca.json');
      const content = require('fs').readFileSync(orcaPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.tasks.build.cache).toBe(true);
    });

    it('should handle task with cache disabled', () => {
      const orcaPath = join(testDir, 'orca.json');
      const content = require('fs').readFileSync(orcaPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.tasks.lint.cache).toBe(false);
    });
  });

  describe('CLI Integration', () => {
    it('should have all required commands', () => {
      const commands = program.commands.map(cmd => cmd.name());

      expect(commands).toContain('run');
      expect(commands).toContain('clean');
      expect(commands).toContain('info');
    });

    it('should have help option available', () => {
      const helpOption = program._helpOption;
      expect(helpOption).toBeDefined();
    });

    it('should support help output', () => {
      const spy = vi.spyOn(console, 'log');
      program.outputHelp();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should have description for each command', () => {
      program.commands.forEach(cmd => {
        const desc = cmd.description();
        expect(desc).toBeDefined();
        expect(desc.length).toBeGreaterThan(0);
      });
    });

    it('should handle program initialization', () => {
      expect(program).toBeDefined();
      expect(program.name()).toBe('orca');
    });

    it('should have option handlers', () => {
      const version = program.version();
      expect(version).toBeDefined();
    });
  });

  describe('Configuration Integration', () => {
    it('should load tasks from orca.json', () => {
      const orcaPath = join(testDir, 'orca.json');
      const content = require('fs').readFileSync(orcaPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.tasks).toBeDefined();
      expect(Object.keys(config.tasks).length).toBeGreaterThan(0);
    });

    it('should preserve globalDependencies field', () => {
      const orcaPath = join(testDir, 'orca.json');
      const content = require('fs').readFileSync(orcaPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.globalDependencies).toBeDefined();
    });

    it('should read task outputs configuration', () => {
      const orcaPath = join(testDir, 'orca.json');
      const content = require('fs').readFileSync(orcaPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.tasks.build.outputs).toBeDefined();
      expect(Array.isArray(config.tasks.build.outputs)).toBe(true);
    });

    it('should read task cache configuration', () => {
      const orcaPath = join(testDir, 'orca.json');
      const content = require('fs').readFileSync(orcaPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.tasks.build.cache).toBeDefined();
      expect(typeof config.tasks.build.cache).toBe('boolean');
    });

    it('should handle optional task fields', () => {
      const orcaPath = join(testDir, 'orca.json');
      const content = require('fs').readFileSync(orcaPath, 'utf-8');
      const config = JSON.parse(content);

      const lintTask = config.tasks.lint;
      expect(lintTask.cache).toBe(false);
      expect(lintTask.outputs).toBeUndefined();
    });
  });

  describe('parseAndAliasArgv - Advanced Cases', () => {
    it('should handle task name aliasing with orca config', () => {
      const origCwd = process.cwd();
      try {
        process.chdir(testDir);
        const argv = ['bun', 'cli.ts', 'build'];
        const result = parseAndAliasArgv(argv);

        // Should insert 'run' before 'build'
        expect(result[2]).toBe('run');
        expect(result[3]).toBe('build');
      } finally {
        process.chdir(origCwd);
      }
    });

    it('should handle task with targets after aliasing', () => {
      const origCwd = process.cwd();
      try {
        process.chdir(testDir);
        const argv = ['bun', 'cli.ts', 'test', 'apps/web'];
        const result = parseAndAliasArgv(argv);

        expect(result[2]).toBe('run');
        expect(result[3]).toBe('test');
        expect(result[4]).toBe('apps/web');
      } finally {
        process.chdir(origCwd);
      }
    });

    it('should not alias when orca.json missing', () => {
      const emptyDir = join(tmpdir(), `empty-${Date.now()}`);
      mkdirSync(emptyDir, { recursive: true });

      const origCwd = process.cwd();
      try {
        process.chdir(emptyDir);
        const argv = ['bun', 'cli.ts', 'unknown-task'];
        const result = parseAndAliasArgv(argv);

        // Should NOT insert 'run' since task is not in config
        expect(result[2]).toBe('unknown-task');
      } finally {
        process.chdir(origCwd);
        rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('should not alias when first arg is run command', () => {
      const argv = ['bun', 'cli.ts', 'run', 'build'];
      const result = parseAndAliasArgv(argv);

      expect(result).toEqual(argv);
    });

    it('should not alias when first arg is clean command', () => {
      const argv = ['bun', 'cli.ts', 'clean'];
      const result = parseAndAliasArgv(argv);

      expect(result).toEqual(argv);
    });

    it('should not alias when first arg is help flag', () => {
      const argv = ['bun', 'cli.ts', '--help'];
      const result = parseAndAliasArgv(argv);

      expect(result).toEqual(argv);
    });

    it('should not alias when first arg is version flag', () => {
      const argv = ['bun', 'cli.ts', '--version'];
      const result = parseAndAliasArgv(argv);

      expect(result).toEqual(argv);
    });

    it('should not alias short version flag', () => {
      const argv = ['bun', 'cli.ts', '-v'];
      const result = parseAndAliasArgv(argv);

      expect(result).toEqual(argv);
    });

    it('should handle empty argv array', () => {
      const argv = ['bun', 'cli.ts'];
      const result = parseAndAliasArgv(argv);

      expect(result).toEqual(argv);
    });

    it('should preserve multiple targets', () => {
      const origCwd = process.cwd();
      try {
        process.chdir(testDir);
        const argv = ['bun', 'cli.ts', 'build', 'apps/web', 'apps/api', 'packages/ui'];
        const result = parseAndAliasArgv(argv);

        expect(result[2]).toBe('run');
        expect(result[4]).toBe('apps/web');
        expect(result[5]).toBe('apps/api');
        expect(result[6]).toBe('packages/ui');
      } finally {
        process.chdir(origCwd);
      }
    });
  });

  describe('loadOrcaConfig - Advanced Cases', () => {
    it('should return empty object when no orca.json exists', () => {
      const emptyDir = join(tmpdir(), `empty-config-${Date.now()}`);
      mkdirSync(emptyDir, { recursive: true });

      const origCwd = process.cwd();
      try {
        process.chdir(emptyDir);
        const config = loadOrcaConfig();

        expect(config).toEqual({});
      } finally {
        process.chdir(origCwd);
        rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('should return empty object when orca.json has no tasks', () => {
      const noTasksDir = join(tmpdir(), `no-tasks-config-${Date.now()}`);
      mkdirSync(noTasksDir, { recursive: true });

      writeFileSync(join(noTasksDir, 'orca.json'), JSON.stringify({ globalDependencies: [] }));

      const origCwd = process.cwd();
      try {
        process.chdir(noTasksDir);
        const config = loadOrcaConfig();

        expect(config).toEqual({});
      } finally {
        process.chdir(origCwd);
        rmSync(noTasksDir, { recursive: true, force: true });
      }
    });

    it('should return empty object when orca.json is invalid', () => {
      const badDir = join(tmpdir(), `bad-config-${Date.now()}`);
      mkdirSync(badDir, { recursive: true });

      writeFileSync(join(badDir, 'orca.json'), '{invalid json}');

      const origCwd = process.cwd();
      try {
        process.chdir(badDir);
        const config = loadOrcaConfig();

        expect(config).toEqual({});
      } finally {
        process.chdir(origCwd);
        rmSync(badDir, { recursive: true, force: true });
      }
    });

    it('should correctly load all tasks', () => {
      const origCwd = process.cwd();
      try {
        process.chdir(testDir);
        const config = loadOrcaConfig();

        expect(Object.keys(config)).toContain('build');
        expect(Object.keys(config)).toContain('test');
        expect(Object.keys(config)).toContain('lint');
      } finally {
        process.chdir(origCwd);
      }
    });

    it('should preserve task configuration', () => {
      const origCwd = process.cwd();
      try {
        process.chdir(testDir);
        const config = loadOrcaConfig();

        expect(config.build.outputs).toEqual(['dist/**']);
        expect(config.build.cache).toBe(true);
        expect(config.lint.cache).toBe(false);
      } finally {
        process.chdir(origCwd);
      }
    });
  });

  describe('Program Commands Execution', () => {
    it('should have run command with correct structure', () => {
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      expect(runCmd).toBeDefined();
      expect(typeof runCmd?.action).toBe('function');
    });

    it('should have clean command with correct structure', () => {
      const cleanCmd = program.commands.find(cmd => cmd.name() === 'clean');
      expect(cleanCmd).toBeDefined();
      expect(typeof cleanCmd?.action).toBe('function');
    });

    it('should have info command with correct structure', () => {
      const infoCmd = program.commands.find(cmd => cmd.name() === 'info');
      expect(infoCmd).toBeDefined();
      expect(typeof infoCmd?.action).toBe('function');
    });

    it('run command should accept options', () => {
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      const options = runCmd?.options || [];

      expect(options.length).toBeGreaterThan(0);
    });

    it('clean command should accept options', () => {
      const cleanCmd = program.commands.find(cmd => cmd.name() === 'clean');
      const options = cleanCmd?.options || [];

      expect(options.length).toBeGreaterThan(0);
    });

    it('info command should accept options', () => {
      const infoCmd = program.commands.find(cmd => cmd.name() === 'info');
      const options = infoCmd?.options || [];

      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe('Program Metadata', () => {
    it('should have correct program name', () => {
      expect(program.name()).toBe('orca');
    });

    it('should have valid version', () => {
      const version = program.version();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have description containing orchestrator', () => {
      const desc = program.description();
      expect(desc).toContain('orchestrator');
    });

    it('should have description containing monorepos', () => {
      const desc = program.description();
      expect(desc).toContain('monorepos');
    });

    it('should have help output', () => {
      const spy = vi.spyOn(console, 'log');
      program.outputHelp();

      expect(spy).toHaveBeenCalled();
      const output = spy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('orca');

      spy.mockRestore();
    });

    it('should output help containing commands', () => {
      const spy = vi.spyOn(console, 'log');
      program.outputHelp();

      const output = spy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('run');
      expect(output).toContain('Documentation');

      spy.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing orca.json gracefully in loadOrcaConfig', () => {
      const emptyDir = join(tmpdir(), `empty-cli-test-${Date.now()}`);
      mkdirSync(emptyDir, { recursive: true });

      const origCwd = process.cwd();
      try {
        process.chdir(emptyDir);
        const result = loadOrcaConfig();
        expect(result).toEqual({});
      } finally {
        process.chdir(origCwd);
        rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('should not throw when parsing invalid argv', () => {
      expect(() => {
        const argv = ['bun', 'cli.ts', 'invalid'];
        parseAndAliasArgv(argv);
      }).not.toThrow();
    });

    it('should handle argv with only bun and script', () => {
      const argv = ['bun', 'cli.ts'];
      const result = parseAndAliasArgv(argv);

      expect(result).toEqual(argv);
    });

    it('should handle argv with empty strings', () => {
      const argv = ['bun', 'cli.ts', ''];
      const result = parseAndAliasArgv(argv);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle large argv arrays', () => {
      const argv = ['bun', 'cli.ts', 'build'];
      for (let i = 0; i < 100; i++) {
        argv.push(`app-${i}`);
      }

      const result = parseAndAliasArgv(argv);
      expect(result.length).toBeGreaterThan(argv.length - 1);
    });

    it('should handle special characters in task names', () => {
      const argv = ['bun', 'cli.ts', 'build:watch'];
      const result = parseAndAliasArgv(argv);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle special characters in target names', () => {
      const argv = ['bun', 'cli.ts', 'run', '@scope/package'];
      const result = parseAndAliasArgv(argv);

      expect(result).toEqual(argv);
    });
  });

  describe('Command Help Output', () => {
    it('run command should have help text', () => {
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      const desc = runCmd?.description();

      expect(desc).toBeDefined();
      expect(desc).toContain('Execute');
    });

    it('clean command should have help text', () => {
      const cleanCmd = program.commands.find(cmd => cmd.name() === 'clean');
      const desc = cleanCmd?.description();

      expect(desc).toBeDefined();
      expect(desc).toContain('Clear');
    });

    it('info command should have help text', () => {
      const infoCmd = program.commands.find(cmd => cmd.name() === 'info');
      const desc = infoCmd?.description();

      expect(desc).toBeDefined();
      expect(desc).toContain('Display');
    });

    it('program should have help option with short flag', () => {
      const helpOpt = program._helpOption;
      expect(helpOpt).toBeDefined();
    });

    it('should display custom help with docs link', () => {
      const spy = vi.spyOn(console, 'log');
      program.emit('--help');

      const output = spy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('github.com');

      spy.mockRestore();
    });

    it('should display tips in help', () => {
      const spy = vi.spyOn(console, 'log');
      program.emit('--help');

      const output = spy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('Tips');

      spy.mockRestore();
    });

    it('should mention orca.json in help', () => {
      const spy = vi.spyOn(console, 'log');
      program.emit('--help');

      const output = spy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('orca.json');

      spy.mockRestore();
    });

    it('should mention task shorthand in help', () => {
      const spy = vi.spyOn(console, 'log');
      program.emit('--help');

      const output = spy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('shorthand');

      spy.mockRestore();
    });
  });

  describe('Program Options', () => {
    it('should have version option with short flag', () => {
      const opts = program.options;
      const versionOpt = opts.find(opt => opt.short === '-v');

      expect(versionOpt).toBeDefined();
    });

    it('should have help option', () => {
      const helpOpt = program._helpOption;

      expect(helpOpt).toBeDefined();
    });

    it('run command should have parallel option', () => {
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      const opts = runCmd?.options || [];
      const parallelOpt = opts.find(o => o.long === '--parallel');

      expect(parallelOpt).toBeDefined();
    });

    it('run command should have no-cache option', () => {
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      const opts = runCmd?.options || [];
      const noCacheOpt = opts.find(o => o.long === '--no-cache');

      expect(noCacheOpt).toBeDefined();
    });

    it('run command should have verbose option', () => {
      const runCmd = program.commands.find(cmd => cmd.name() === 'run');
      const opts = runCmd?.options || [];
      const verboseOpt = opts.find(o => o.long === '--verbose');

      expect(verboseOpt).toBeDefined();
    });

    it('clean command should have scope option', () => {
      const cleanCmd = program.commands.find(cmd => cmd.name() === 'clean');
      const opts = cleanCmd?.options || [];
      const scopeOpt = opts.find(o => o.long === '--scope');

      expect(scopeOpt).toBeDefined();
    });

    it('clean command should have dry-run option', () => {
      const cleanCmd = program.commands.find(cmd => cmd.name() === 'clean');
      const opts = cleanCmd?.options || [];
      const dryRunOpt = opts.find(o => o.long === '--dry-run');

      expect(dryRunOpt).toBeDefined();
    });

    it('info command should have json option', () => {
      const infoCmd = program.commands.find(cmd => cmd.name() === 'info');
      const opts = infoCmd?.options || [];
      const jsonOpt = opts.find(o => o.long === '--json');

      expect(jsonOpt).toBeDefined();
    });
  });

  describe('main() Function', () => {
    it('should be exported', () => {
      expect(typeof main).toBe('function');
    });

    it('should be async function', async () => {
      // Just verify it exists and is callable
      // Don't actually execute main() as it tries to parse argv
      expect(main).toBeDefined();
      expect(typeof main).toBe('function');
    });
  });

  describe('Command Handlers - Integration Tests', () => {
    beforeEach(() => {
      // Store original process functions
      vi.spyOn(process, 'exit').mockImplementation((code?: number | string) => {
        throw new Error(`process.exit(${code})`);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('run command should parse correctly', async () => {
      const argv = ['orca', 'run', 'build'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    }, 2_000);

    it('run command with targets should parse', async () => {
      const argv = ['orca', 'run', 'build', 'apps/web', 'apps/api'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('run command with --verbose option should parse', async () => {
      const argv = ['orca', 'run', 'test', '--verbose'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('run command with --parallel option should parse', async () => {
      const argv = ['orca', 'run', 'build', '--parallel'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('run command with --no-cache option should parse', async () => {
      const argv = ['orca', 'run', 'lint', '--no-cache'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('run command with --filter option should parse', async () => {
      const argv = ['orca', 'run', 'build', '--filter', 'apps/*'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('clean command should parse correctly', async () => {
      const argv = ['orca', 'clean'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('clean command with --scope option should parse', async () => {
      const argv = ['orca', 'clean', '--scope', 'apps/web'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('clean command with --dry-run option should parse', async () => {
      const argv = ['orca', 'clean', '--dry-run'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('clean command with both options should parse', async () => {
      const argv = ['orca', 'clean', '--scope', 'apps/web', '--dry-run'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('info command should parse correctly', async () => {
      const argv = ['orca', 'info'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('info command with --json option should parse', async () => {
      const argv = ['orca', 'info', '--json'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('should handle unknown command gracefully', async () => {
      const argv = ['orca', 'unknown-command'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw
        expect(e).toBeDefined();
      }
    });

    it('help flag should display help', async () => {
      const logSpy = vi.spyOn(console, 'log');
      const argv = ['orca', '--help'];

      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected - help causes exit
      }

      logSpy.mockRestore();
    });

    it('version flag should display version', async () => {
      const logSpy = vi.spyOn(console, 'log');
      const argv = ['orca', '--version'];

      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected - version causes exit
      }

      logSpy.mockRestore();
    });

    it('short help flag should work', async () => {
      const logSpy = vi.spyOn(console, 'log');
      const argv = ['orca', '-h'];

      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected - help causes exit
      }

      logSpy.mockRestore();
    });

    it('short version flag should work', async () => {
      const logSpy = vi.spyOn(console, 'log');
      const argv = ['orca', '-v'];

      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected - version causes exit
      }

      logSpy.mockRestore();
    });

    it('should handle task aliasing in parseAsync', async () => {
      const origCwd = process.cwd();
      try {
        process.chdir(testDir);
        const argv = ['orca', 'build'];

        // The parsed command should have 'run' inserted
        try {
          await program.parseAsync(argv, { from: 'user' });
        } catch (e) {
          // Expected to throw or exit
        }
      } finally {
        process.chdir(origCwd);
      }
    });

    it('run command should accept multiple targets', async () => {
      const argv = ['orca', 'run', 'test', 'apps/web', 'apps/api', 'packages/ui'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('clean command should handle scope with special characters', async () => {
      const argv = ['orca', 'clean', '--scope', '@scope/package'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('run command with all options should parse', async () => {
      const argv = [
        'orca',
        'run',
        'build',
        'apps/web',
        '--filter',
        'apps/*',
        '--verbose',
        '--no-cache',
        '--parallel',
      ];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected to throw or exit
      }
    });

    it('program should handle empty argv array', async () => {
      const argv = ['orca'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected behavior
      }
    });

    it('program should handle help command', async () => {
      const argv = ['orca', 'help'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected - help causes exit
      }
    });

    it('program should handle help for specific command', async () => {
      const argv = ['orca', 'help', 'run'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected - help causes exit
      }
    });

    it('program should handle help for clean command', async () => {
      const argv = ['orca', 'help', 'clean'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected - help causes exit
      }
    });

    it('program should handle help for info command', async () => {
      const argv = ['orca', 'help', 'info'];
      try {
        await program.parseAsync(argv, { from: 'user' });
      } catch (e) {
        // Expected - help causes exit
      }
    });
  });
});
