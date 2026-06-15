import chalk from 'chalk';

export class Logger {
  /**
   * Log execution start with task count and layers
   */
  static startExecution(totalTasks: number, totalLayers: number): void {
    console.log(
      `\n${chalk.cyan.bold('📦 Starting task execution')} ${chalk.gray(`(${totalTasks} tasks across ${totalLayers} layers)`)}\n`
    );
  }

  /**
   * Log layer header
   */
  static layerHeader(currentLayer: number, totalLayers: number, taskCount: number): void {
    console.log(`\n${chalk.bgCyan.black('─'.repeat(50))}`);
    console.log(
      `${chalk.cyan.bold(`📍 Layer ${currentLayer}/${totalLayers}`)} ${chalk.gray(`- ${taskCount} task(s)`)}`
    );
    console.log(`${chalk.bgCyan.black('─'.repeat(50))}\n`);
  }

  /**
   * Log cache hit
   */
  static cacheHit(executed: number, total: number, workspace: string, task: string): void {
    console.log(
      `  ${chalk.yellow('⚡')} [${chalk.bold(executed)}/${total}] ${chalk.yellow('Cache hit:')} ${chalk.cyan(workspace)}${chalk.gray(':')}${chalk.cyan(task)}`
    );
  }

  /**
   * Log task execution start
   */
  static executing(executed: number, total: number, workspace: string, task: string): void {
    console.log(
      `  ${chalk.blue('🔨')} [${chalk.bold(executed)}/${total}] ${chalk.blue('Executing:')} ${chalk.cyan(workspace)}${chalk.gray(':')}${chalk.cyan(task)}`
    );
  }

  /**
   * Log task completion
   */
  static completed(
    executed: number,
    total: number,
    workspace: string,
    task: string,
    duration: number
  ): void {
    console.log(
      `  ${chalk.green('✓')} [${chalk.bold(executed)}/${total}] ${chalk.green('Completed:')} ${chalk.cyan(workspace)}${chalk.gray(':')}${chalk.cyan(task)} ${chalk.gray(`(${duration}ms)`)}`
    );
  }

  /**
   * Log task failure
   */
  static failed(executed: number, total: number, workspace: string, task: string): void {
    console.error(
      `  ${chalk.red('✗')} [${chalk.bold(executed)}/${total}] ${chalk.red('Failed:')} ${chalk.cyan(workspace)}${chalk.gray(':')}${chalk.cyan(task)}`
    );
  }

  /**
   * Log error message
   */
  static error(message: string): void {
    console.error(`    ${chalk.red(message)}`);
  }

  /**
   * Log all tasks completed successfully
   */
  static allTasksCompleted(): void {
    console.log(`\n${chalk.green.bold('✅ All tasks completed successfully!')}\n`);
  }

  /**
   * Log warning message
   */
  static warn(message: string): void {
    console.warn(`${chalk.yellow('⚠️  Warning:')} ${message}`);
  }

  /**
   * Log info message
   */
  static info(message: string): void {
    console.log(`${chalk.cyan.bold('ℹ️  Info:')} ${message}`);
  }

  /**
   * Log success message
   */
  static success(message: string): void {
    console.log(`${chalk.green('✓')} ${message}`);
  }

  /**
   * Log help text
   */
  static help(): void {
    console.log(`
${chalk.cyan.bold('orca')} ${chalk.gray('- Task orchestrator with intelligent caching')}

${chalk.bold('Usage:')}
  ${chalk.cyan('orca run <task> [targets...]')}
  ${chalk.cyan('orca clean')}

${chalk.bold('Examples:')}
  ${chalk.gray('orca run build')}
  ${chalk.gray('orca run test apps/web')}
  ${chalk.gray('orca clean')}
    `);
  }

  /**
   * Log error with context
   */
  static errorWithContext(title: string, message: string): void {
    console.error(`${chalk.red(`❌ ${title}:`)} ${message}`);
  }

  /**
   * Log cache clearing
   */
  static clearingCache(): void {
    console.log(`${chalk.yellow('🧹')} Clearing cache...`);
  }

  /**
   * Log task not found error
   */
  static taskNotFound(task: string): void {
    this.errorWithContext('Error', `Task "${chalk.cyan(task)}" not defined in orca.json`);
  }

  /**
   * Log target not found warning
   */
  static targetNotFound(target: string): void {
    console.warn(
      `${chalk.yellow('⚠️  Warning:')} Target "${chalk.cyan(target)}" not found in workspaces`
    );
  }

  /**
   * Log no package.json error
   */
  static noPackageJson(workspace: string): void {
    this.errorWithContext('Error', `No package.json in ${chalk.cyan(workspace)}`);
  }

  /**
   * Log missing script error
   */
  static noScript(task: string, workspace: string): void {
    this.errorWithContext(
      'Error',
      `No script "${chalk.cyan(task)}" found in ${chalk.cyan(workspace)}`
    );
  }

  /**
   * Log circular dependency error
   */
  static circularDependency(): void {
    this.errorWithContext('Error', 'Circular dependency detected in task graph');
  }
}
