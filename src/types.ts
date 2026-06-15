export interface OrcaConfig {
  tasks: Record<string, OrcaTask>;
  globalDependencies?: string[];
}

export interface OrcaTask {
  dependsOn?: string[];
  outputs?: string[];
  cache?: boolean;
  inputs?: string[];
}

// Legacy type aliases for backward compatibility
export type OrcaConfig = OrcaConfig;
export type PipelineTask = OrcaTask;

export interface TaskExecution {
  task: string;
  workspace: string;
  command: string;
  hash: string;
}
