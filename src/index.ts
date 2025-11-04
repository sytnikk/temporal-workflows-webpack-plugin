import path from 'path';
import fs from 'fs';
import type { Compiler } from 'webpack';
import { bundleWorkflowCode, BundleOptions } from '@temporalio/worker';

import type { TemporalWorkflowsPluginOptions, WorkflowBundleConfig } from './types';
export type { TemporalWorkflowsPluginOptions, WorkflowBundleConfig } from './types';

export class TemporalWorkflowsPlugin {
  private readonly options: TemporalWorkflowsPluginOptions;

  private watchedFiles: Set<string> = new Set();

  private logger!: ReturnType<Compiler['getInfrastructureLogger']>;

  constructor(options: TemporalWorkflowsPluginOptions) {
    this.options = options;
  }

  private async bundleWorkflow(context: string, workflow: WorkflowBundleConfig) {
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
  }

  async bundleWorkflows(context: string) {
    this.logger.info('Bundling workflows...');

    for (const workflow of this.options.workflows) {
      const workflowPath = path.resolve(context, workflow.workflowsPath);

      await this.bundleWorkflow(context, workflow);
      this.watchedFiles.add(workflowPath);
    }
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
