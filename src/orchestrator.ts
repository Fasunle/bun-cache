import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import type { TurboConfig, PipelineTask } from './types';
import { Hasher } from './hasher';
import { CacheManager } from './cache';

interface TaskGraphNode {
  id: string; // "workspace:task"
  task: string;
  workspace: string;
  config: PipelineTask;
  dependencies: Set<string>;
  dependents: Set<string>;
}

interface ExecutionPlan {
  nodes: Map<string, TaskGraphNode>;
  execution: string[][]; // Layers for parallel execution
}

export class Orchestrator {
  private hasher: Hasher;
  private cache: CacheManager;
  private config: TurboConfig;
  private workspaces: string[];
  private rootDir: string;
  private taskGraph: Map<string, TaskGraphNode> = new Map();

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.hasher = new Hasher(rootDir);
    this.cache = new CacheManager(rootDir);

    // Read turbo.json
    const turboPath = join(rootDir, 'turbo.json');
    this.config = JSON.parse(readFileSync(turboPath, 'utf-8'));

    // Read workspaces from package.json
    const pkgPath = join(rootDir, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    this.workspaces = this.expandWorkspaces(pkg.workspaces || []);
  }

  async getWorkspaces(targets?: string[]): Promise<string[]> {
    const workspaces = new Set(this.workspaces);

    // If targets are specified, filter workspaces to only those that match
    if (targets && targets.length > 0) {
      for (const target of targets) {
        if (!workspaces.has(target)) {
          console.warn(`⚠️  Target "${target}" not found in workspaces`);
        }
      }
      return targets.filter(t => workspaces.has(t));
    }
    return this.workspaces;
  }

  async run(taskName: string, targets?: string[]): Promise<void> {
    const toRun = await this.getWorkspaces(targets);

    // Validate task exists
    if (!this.config.pipeline[taskName]) {
      throw new Error(`Task "${taskName}" not defined in turbo.json`);
    }

    // Build task graph dynamically from config
    const plan = this.buildExecutionPlan(taskName, toRun);

    // Execute according to the plan
    await this.executeGraphLayers(plan);
  }

  /**
   * Build execution plan by constructing a task graph with dependencies
   */
  private buildExecutionPlan(rootTask: string, workspaces: string[]): ExecutionPlan {
    this.taskGraph.clear();

    // First pass: create all nodes for requested workspaces and root task
    for (const workspace of workspaces) {
      const hasTask = this.workspaceHasTask(workspace, rootTask);
      if (hasTask) {
        this.createTaskNode(workspace, rootTask);
      }
    }

    // Second pass: recursively add dependency nodes
    this.resolveDependencies(this.taskGraph);

    // Third pass: topological sort into execution layers
    const executionLayers = this.topologicalSort();

    return {
      nodes: this.taskGraph,
      execution: executionLayers,
    };
  }

  /**
   * Create a task node in the graph
   */
  private createTaskNode(workspace: string, task: string): TaskGraphNode {
    const nodeId = `${workspace}:${task}`;

    if (this.taskGraph.has(nodeId)) {
      return this.taskGraph.get(nodeId)!;
    }

    const taskConfig = this.config.pipeline[task];
    if (!taskConfig) {
      throw new Error(`Task "${task}" not found in turbo.json`);
    }

    const node: TaskGraphNode = {
      id: nodeId,
      task,
      workspace,
      config: taskConfig,
      dependencies: new Set(),
      dependents: new Set(),
    };

    this.taskGraph.set(nodeId, node);
    return node;
  }

  /**
   * Resolve all dependencies for all nodes in the graph
   */
  private resolveDependencies(graph: Map<string, TaskGraphNode>): void {
    for (const node of graph.values()) {
      this.resolveDependenciesForNode(node);
    }
  }

  /**
   * Resolve dependencies for a specific node
   */
  private resolveDependenciesForNode(node: TaskGraphNode): void {
    const { task, workspace, config } = node;

    if (!config.dependsOn) return;

    for (const dep of config.dependsOn) {
      // Handle cross-workspace dependencies (e.g., "other-workspace#build")
      if (dep.includes('#')) {
        const [depWorkspace, depTask] = dep.split('#');
        if (this.workspaceHasTask(depWorkspace!, depTask!)) {
          const depNode = this.createTaskNode(depWorkspace!, depTask!);
          node.dependencies.add(depNode.id);
          depNode.dependents.add(node.id);
          this.resolveDependenciesForNode(depNode);
        }
      } else {
        // Same task in all workspaces that have it
        for (const ws of this.workspaces) {
          if (this.workspaceHasTask(ws, dep)) {
            const depNode = this.createTaskNode(ws, dep);
            node.dependencies.add(depNode.id);
            depNode.dependents.add(node.id);
            this.resolveDependenciesForNode(depNode);
          }
        }
      }
    }
  }

  /**
   * Topological sort the graph into execution layers
   */
  private topologicalSort(): string[][] {
    const layers: string[][] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    // Calculate in-degree for each node
    for (const node of this.taskGraph.values()) {
      inDegree.set(node.id, node.dependencies.size);
    }

    // Repeatedly find and process nodes with no dependencies
    while (visited.size < this.taskGraph.size) {
      const layer: string[] = [];

      for (const [nodeId, degree] of inDegree.entries()) {
        if (!visited.has(nodeId) && degree === 0) {
          layer.push(nodeId);
          visited.add(nodeId);
        }
      }

      if (layer.length === 0 && visited.size < this.taskGraph.size) {
        throw new Error('Circular dependency detected in task graph');
      }

      if (layer.length > 0) {
        layers.push(layer);

        // Decrease in-degree for dependent nodes
        for (const nodeId of layer) {
          const node = this.taskGraph.get(nodeId)!;
          for (const dependentId of node.dependents) {
            inDegree.set(dependentId, (inDegree.get(dependentId) || 0) - 1);
          }
        }
      }
    }

    return layers;
  }

  /**
   * Execute tasks according to the execution plan (layer by layer)
   */
  private async executeGraphLayers(plan: ExecutionPlan): Promise<void> {
    for (const layer of plan.execution) {
      // Execute all tasks in a layer in parallel
      const promises = layer.map(nodeId => this.executeTaskNode(plan.nodes.get(nodeId)!));
      await Promise.all(promises);
    }
  }

  /**
   * Execute a single task node
   */
  private async executeTaskNode(node: TaskGraphNode): Promise<void> {
    const { workspace, task, config } = node;

    const hash = this.hasher.generateTaskHash(
      workspace,
      task,
      config.inputs,
      this.config.globalDependencies
    );

    // Check cache first
    if (this.cache.get(hash)) {
      console.log(`✓ Cache hit: ${workspace}:${task}`);
      this.cache.restore(hash);
      return;
    }

    console.log(`⚙️  Executing: ${workspace}:${task}`);
    const start = Date.now();

    try {
      const command = this.getCommand(workspace, task);
      await this.runCommand(workspace, command);

      const duration = Date.now() - start;
      console.log(`✓ Completed: ${workspace}:${task} (${duration}ms)`);

      // Save to cache if caching is enabled for this task
      if (config.cache !== false) {
        this.cache.save(hash, config.outputs || []);
      }
    } catch (error) {
      console.error(
        `✗ Failed: ${workspace}:${task}`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private async runCommand(workspace: string, command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const workspacePath = join(this.rootDir, workspace);
      const pathSeparator = process.platform === 'win32' ? ';' : ':';
      const env = {
        ...process.env,
        PATH: [join(workspacePath, 'node_modules', '.bin'), process.env.PATH].join(pathSeparator),
      };

      const proc = spawn(command, {
        cwd: workspacePath,
        stdio: 'inherit',
        shell: true,
        env,
      });

      proc.on('close', code => {
        code === 0 ? resolve() : reject(new Error(`Command failed with code ${code}`));
      });
    });
  }

  private getCommand(workspace: string, task: string): string {
    const pkgPath = join(this.rootDir, workspace, 'package.json');
    if (!existsSync(pkgPath)) {
      throw new Error(`No package.json in ${workspace}`);
    }

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const script = pkg.scripts?.[task];

    if (!script) {
      throw new Error(`No script "${task}" found in ${workspace}`);
    }

    return script;
  }

  private workspaceHasTask(workspace: string, task: string): boolean {
    const pkgPath = join(this.rootDir, workspace, 'package.json');
    if (!existsSync(pkgPath)) return false;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return !!pkg.scripts?.[task];
  }

  private expandWorkspaces(patterns: string[]): string[] {
    const workspaces: string[] = [];

    for (const pattern of patterns) {
      // Handle glob patterns like "apps/*" or "packages/*"
      if (pattern.includes('*')) {
        const parts = pattern.split('/');
        const dir = parts?.[0] || '';
        const dirPath = join(this.rootDir, dir);

        if (existsSync(dirPath)) {
          try {
            const entries = readdirSync(dirPath, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isDirectory()) {
                workspaces.push(join(dir, entry.name));
              }
            }
          } catch (error) {
            // Directory doesn't exist or can't be read, skip
          }
        }
      } else {
        // Handle exact paths
        if (existsSync(join(this.rootDir, pattern))) {
          workspaces.push(pattern);
        }
      }
    }

    return workspaces;
  }
}
