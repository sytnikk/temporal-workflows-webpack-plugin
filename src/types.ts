import { BundleOptions } from '@temporalio/worker';

/**
 * Configuration for bundling a single workflow
 */
export interface WorkflowBundleConfig {
  /**
   * Path to the entry file with workflows
   * All exported functions in this path will be registered as workflows
   *
   * @example './src/workflows'
   * @example './src/workflows/index.ts'
   */
  workflowsPath: string;

  /**
   * Name of the output file (without .js extension)
   * Defaults to the basename of workflowsPath
   *
   * @example 'my-workflows' -> 'my-workflows.js'
   */
  name?: string;

  /**
   * Full path to the output file
   * If specified, ignores name and defaultOutputDir
   *
   * @example './dist/custom/location/workflows.js'
   */
  outputPath?: string;

  /**
   * Options for Temporal's bundleWorkflowCode
   * Overrides globalBundleOptions for this specific workflow
   */
  bundleOptions?: Omit<BundleOptions, 'workflowsPath'>;
}

/**
 * Options for TemporalWorkflowsPlugin
 */
export interface TemporalWorkflowsPluginOptions {
  /**
   * Default directory for output files
   * Used when outputPath is not specified in workflow configuration
   *
   * @example './dist/workflows'
   */
  defaultOutputDir: string;

  /**
   * List of workflows to bundle
   */
  workflows: WorkflowBundleConfig[];

  /**
   * Global options for Temporal bundler
   * Applied to all workflows, but can be overridden
   * in bundleOptions of individual workflows
   */
  globalBundleOptions?: Omit<BundleOptions, 'workflowsPath'>;
}
