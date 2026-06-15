#!/usr/bin/env bun

import { Command } from 'commander';
import { rimraf } from 'rimraf';
import { Orchestrator } from './orchestrator';
import { Logger } from './logger';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = resolve(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

/**
 * Load orca.json to get available tasks
 */
export function loadOrcaConfig() {
  try {
    const orcaPath = resolve(process.cwd(), 'orca.json');
    const orcaContent = readFileSync(orcaPath, 'utf-8');
    const orcaConfig = JSON.parse(orcaContent);
    return orcaConfig.tasks || {};
  } catch {
    return {};
  }
}

/**
 * Known CLI commands that should not be aliased
 */
const KNOWN_COMMANDS = new Set(['run', 'clean', 'info', 'help']);
const KNOWN_FLAGS = new Set(['-h', '--help', '-v', '--version']);

/**
 * Smart argv parser: if first argument is a task name (from orca.json),
 * automatically prepend 'run' so user can use `orca build` instead of `orca run build`
 */
export function parseAndAliasArgv(argv: string[]) {
  const args = [...argv];
  const firstArg = args[2]; // Skip 'bun' and script path

  // If no arguments or first arg is a known command/flag, return as-is
  if (!firstArg || KNOWN_COMMANDS.has(firstArg) || KNOWN_FLAGS.has(firstArg)) {
    return args;
  }

  // Check if first arg starts with a flag
  if (firstArg.startsWith('-')) {
    return args;
  }

  // Check if it's a task name in orca.json
  const orcaConfig = loadOrcaConfig();
  if (orcaConfig[firstArg]) {
    // Insert 'run' before the task name
    args.splice(2, 0, 'run');
  }

  return args;
}

/**
 * Main CLI application for orca
 * Task orchestrator with intelligent caching for monorepos
 */
export const program = new Command();

program
  .name('orca')
  .description('⚡ Task orchestrator with intelligent caching for monorepos using Bun')
  .version(packageJson.version, '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help for command')
  .helpCommand('help [command]', 'Display help for command');

/**
 * RUN command - Execute tasks in workspaces
 *
 * Usage:
 *   orca run <task> [targets...]
 *   orca run build
 *   orca run test apps/web apps/api
 */
program
  .command('run <task> [targets...]')
  .description('Execute a task across workspaces')
  .option(
    '--filter <pattern>',
    'Filter workspaces by name or glob pattern (legacy, use targets instead)'
  )
  .option('--parallel', 'Run tasks in parallel (default: true)', true)
  .option('--no-cache', 'Disable caching for this run')
  .option('--verbose', 'Show detailed execution information')
  .addHelpText(
    'after',
    `
Examples:
  $ orca run build
  Run build task in all workspaces

  $ orca run test apps/web
  Run test task only in apps/web

  $ orca run lint --no-cache
  Run lint without using cache
`
  )
  .action(async (task: string, targets: string[], options: any) => {
    try {
      const rootDir = process.cwd();
      const orchestrator = new Orchestrator(rootDir);

      if (options.verbose) {
        Logger.info(`Running task: ${task}`);
        if (targets.length > 0) {
          Logger.info(`Target workspaces: ${targets.join(', ')}`);
        }
        if (!options.cache) {
          Logger.info('Cache disabled for this run');
        }
      }

      await orchestrator.run(task, targets);
    } catch (error) {
      Logger.errorWithContext(
        'Task Execution Failed',
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

/**
 * CLEAN command - Clear build cache
 *
 * Usage:
 *   orca clean
 */
program
  .command('clean')
  .description('Clear the build cache')
  .option('--scope <workspace>', 'Clear cache for specific workspace only')
  .option('--dry-run', 'Show what would be deleted without deleting')
  .addHelpText(
    'after',
    `
Examples:
  $ orca clean
  Clear all cached files

  $ orca clean --scope apps/web
  Clear cache for specific workspace
`
  )
  .action((options: any) => {
    try {
      if (options.dryRun) {
        Logger.info('🔍 Dry run enabled - no files will be deleted');
      }

      Logger.clearingCache();

      if (options.scope) {
        Logger.info(`Clearing cache for workspace: ${options.scope}`);
      } else {
        Logger.info('Clearing all cached files');
      }

      if (options.dryRun) {
        Logger.info('Dry run complete - no files were deleted');
        return;
      }

      rimraf.sync('.orca'); // Clear the entire cache directory
      Logger.success('Cache cleared successfully');
    } catch (error) {
      Logger.errorWithContext(
        'Cache Cleanup Failed',
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

/**
 * INFO command - Display configuration info
 *
 * Usage:
 *   orca info
 */
program
  .command('info')
  .description('Display monorepo configuration and task information')
  .option('--json', 'Output as JSON')
  .addHelpText(
    'after',
    `
Examples:
  $ orca info
  Show current configuration

  $ orca info --json
  Output configuration as JSON
`
  )
  .action((options: any) => {
    try {
      const rootDir = process.cwd();

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              version: packageJson.version,
              rootDir,
              // Add more info as needed
            },
            null,
            2
          )
        );
      } else {
        Logger.info(`@fasunle/orca v${packageJson.version}`);
        Logger.info(`Root directory: ${rootDir}`);
      }
    } catch (error) {
      Logger.errorWithContext(
        'Info Command Failed',
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

/**
 * INIT command - generate orca.json
 *
 * Usage:
 *   orca init
 */
program
  .command('init')
  .description('Generate orca.json configuration file')
  .option('--json', 'Output as JSON')
  .addHelpText(
    'after',
    `
Examples:
  $ orca init
  Generate orca.json configuration file

  $ orca init --json
  Output configuration as JSON
`
  )
  .action((options: any) => {
    try {
      const rootDir = process.cwd();

      const filePath = resolve(rootDir, 'orca.json');

      if (existsSync(filePath)) {
        Logger.errorWithContext(
          'Init Command Failed',
          'orca.json already exists in the current directory'
        );

        return;
      }

      const content = JSON.stringify(
        {
          tasks: {
            build: {
              dependsOn: ['^build'],
              outputs: ['dist/**', 'build/**'],
              inputs: ['src/**', 'package.json', 'tsconfig.json'],
            },
            test: {
              dependsOn: ['build'],
              outputs: ['coverage/**'],
              cache: true,
            },
            dev: {
              cache: false,
              persistent: true,
            },
          },
          globalDependencies: ['tsconfig.json', '.eslintrc.json'],
        },
        null,
        2
      );

      writeFileSync(resolve(rootDir, 'orca.json'), content);
      Logger.info(`@fasunle/orca v${packageJson.version}`);
      Logger.success(`Configuration file created: ${filePath}\n${content}\n`);
    } catch (error) {
      Logger.errorWithContext(
        'Init Command Failed',
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

/**
 * Custom help formatting
 */
program.on('--help', () => {
  console.log('');
  console.log('📚 Documentation:');
  console.log('  https://github.com/fasunle/orca#readme');
  console.log('');
  console.log('💡 Tips:');
  console.log('  • Use "orca.json" to configure tasks');
  console.log('  • Cache is automatically enabled for tasks with outputs defined');
  console.log('  • Use [targets...] to run tasks in specific workspaces');
  console.log('  • Task shorthand: "orca build" is equivalent to "orca run build"');
  console.log('');
});

/**
 * Handle unknown commands
 */
program.on('command:*', (command: string[]) => {
  Logger.errorWithContext(
    'Unknown Command',
    `"${command[0]}" is not a valid command. Use "orca --help" for available commands.`
  );
  process.exit(1);
});

/**
 * Parse CLI arguments and run
 */
export async function main() {
  try {
    // Apply smart aliasing: convert 'orca build' to 'orca run build'
    const aliasedArgv = parseAndAliasArgv(process.argv);

    // Show help if no arguments provided
    if (aliasedArgv.length < 3) {
      program.outputHelp();
      process.exit(0);
    }

    await program.parseAsync(aliasedArgv);
  } catch (error) {
    Logger.errorWithContext('CLI Error', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Only run main if this is the entry point (not being imported in tests)
// Use a more robust check that works with bundled files
if (process.argv[1] && process.argv[1].endsWith('cli.js')) {
  main().catch(error => {
    Logger.errorWithContext(
      'Unhandled Error',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  });
}
