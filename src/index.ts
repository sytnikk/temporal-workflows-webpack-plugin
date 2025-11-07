import path from 'path';
import fs from 'fs';
import type { Compiler } from 'webpack';
import { bundleWorkflowCode, BundleOptions } from '@temporalio/worker';

import type { TemporalWorkflowsPluginOptions, WorkflowBundleConfig } from './types';
export type { TemporalWorkflowsPluginOptions, WorkflowBundleConfig } from './types';

export class TemporalWorkflowsPlugin {
  private readonly options: TemporalWorkflowsPluginOptions;

  private logger!: ReturnType<Compiler['getInfrastructureLogger']>;

  constructor(options: TemporalWorkflowsPluginOptions) {
    this.options = options;
  }

  private async bundleWorkflow(
    context: string,
    workflow: WorkflowBundleConfig
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const workflowsPath = path.resolve(context, workflow.workflowsPath);

      const bundleOptions: BundleOptions = {
        workflowsPath,
        ...this.options.globalBundleOptions,
        ...workflow.bundleOptions,
      };

      const bundle = await bundleWorkflowCode(bundleOptions);

      const defaultName = path.basename(workflow.workflowsPath, path.extname(workflow.workflowsPath));
      const outputPath =
        workflow.outputPath ??
        path.join(this.options.defaultOutputDir, `${workflow.name ?? defaultName}.js`);
      const dist = path.resolve(context, outputPath);

      const dir = path.dirname(dist);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(dist, bundle.code, 'utf8');
      this.logger.info(`✓ Bundled: ${workflow.workflowsPath} → ${outputPath}`);

      return { success: true };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`✗ Failed to bundle: ${workflow.workflowsPath}`);
      this.logger.error(`  Error: ${err.message}`);

      return { success: false, error: err };
    }
  }

  async bundleWorkflows(context: string): Promise<void> {
    this.logger.info('Bundling workflows...');

    const results = await Promise.all(
      this.options.workflows.map((workflow) => this.bundleWorkflow(context, workflow))
    );

    const failures = results.filter((r) => !r.success);

    if (failures.length > 0) {
      const total = this.options.workflows.length;
      const succeeded = total - failures.length;

      this.logger.error(`\nWorkflow bundling failed: ${succeeded}/${total} succeeded`);

      const errorMessages = failures.map((f) => f.error?.message).join('\n  - ');
      throw new Error(`Failed to bundle ${failures.length} workflow(s):\n  - ${errorMessages}`);
    }

    this.logger.info(`✓ Successfully bundled ${this.options.workflows.length} workflow(s)`);
  }

  apply(compiler: Compiler): void {
    const context = compiler.context || process.cwd();
    this.logger = compiler.getInfrastructureLogger('TemporalWorkflowsPlugin');

    compiler.hooks.beforeRun.tapAsync(
      'TemporalWorkflowsPlugin',
      async (_compiler: Compiler, callback: (error?: Error | null) => void) => {
        try {
          await this.bundleWorkflows(context);
          callback();
        } catch (error) {
          callback(error as Error);
        }
      }
    );

    compiler.hooks.watchRun.tapAsync(
      'TemporalWorkflowsPlugin',
      async (_compiler: Compiler, callback: (error?: Error | null) => void) => {
        try {
          await this.bundleWorkflows(context);
          callback();
        } catch (error) {
          callback(error as Error);
        }
      }
    );
  }
}

export default TemporalWorkflowsPlugin;
