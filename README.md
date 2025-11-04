# Temporal Workflows Webpack Plugin

<div align="center">
  <a href="https://www.npmjs.com/package/temporal-workflows-webpack-plugin">
    <img src="https://img.shields.io/npm/v/temporal-workflows-webpack-plugin.svg?style=flat-square" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/temporal-workflows-webpack-plugin">
    <img src="https://img.shields.io/npm/dm/temporal-workflows-webpack-plugin.svg?style=flat-square" alt="npm downloads" />
  </a>
  <a href="https://github.com/sytnikk/temporal-workflows-webpack-plugin/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/temporal-workflows-webpack-plugin.svg?style=flat-square" alt="license" />
  </a>
  <a href="https://github.com/sytnikk/temporal-workflows-webpack-plugin/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/sytnikk/temporal-workflows-webpack-plugin/ci.yml?branch=main&style=flat-square" alt="build status" />
  </a>
  <img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square" alt="semantic-release" />
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PR's Welcome" />
  </a>
</div>

<br />

Webpack plugin for automatic bundling of [Temporal](https://temporal.io/) workflows using `@temporalio/worker`.

## Why do you need this?

Temporal workflows require special bundling via `bundleWorkflowCode` because they:
- Run in an isolated V8 isolate
- Cannot use Node.js APIs directly
- Must be deterministic

Typically, developers handle this manually through separate npm scripts. This plugin integrates the bundling process directly into your webpack build pipeline.

## Features

- ✅ **Automatic bundling** of workflows during project build
- ⚡ **Watch mode** with incremental rebuilds (only changed workflows)
- 🎯 **Full support** for all `BundleOptions` from `@temporalio/worker`
- 🔧 **Flexible configuration** - global and per-workflow options
- 📦 **TypeScript** typings out of the box
- 🚀 **Zero config** for simple cases

## Installation

```bash
npm install --save-dev temporal-workflows-webpack-plugin
# or
yarn add -D temporal-workflows-webpack-plugin
# or
pnpm add -D temporal-workflows-webpack-plugin
```

## Quick Start

```javascript
// webpack.config.js
const TemporalWorkflowsPlugin = require('temporal-workflows-webpack-plugin');

module.exports = {
  // ... your webpack config
  plugins: [
    new TemporalWorkflowsPlugin({
      defaultOutputDir: './dist/workflows',
      workflows: [
        { workflowsPath: './src/workflows' }
      ]
    })
  ]
};
```

This will create `./dist/workflows/workflows.js` with all workflows from `./src/workflows`.

## Usage

### Basic Configuration

```javascript
new TemporalWorkflowsPlugin({
  defaultOutputDir: './dist/workflows',
  workflows: [
    { 
      workflowsPath: './src/workflows/orders',
      name: 'order-workflows' 
    },
    { 
      workflowsPath: './src/workflows/payments',
      name: 'payment-workflows'
    }
  ]
})
```

### With Temporal Bundler Options

```javascript
new TemporalWorkflowsPlugin({
  defaultOutputDir: './dist/workflows',
  
  // Global options apply to all workflows
  globalBundleOptions: {
    ignoreModules: ['some-problematic-module'],
    workflowInterceptorModules: ['./src/workflow-interceptors']
  },
  
  workflows: [
    { 
      workflowsPath: './src/workflows/critical',
      name: 'critical',
      // Local options override global ones
      bundleOptions: {
        webpackConfigHook: (config) => ({
          ...config,
          optimization: { minimize: true }
        })
      }
    }
  ]
})
```

### TypeScript

```typescript
import TemporalWorkflowsPlugin, { 
  TemporalWorkflowsPluginOptions 
} from 'temporal-workflows-webpack-plugin';
import { Configuration } from 'webpack';

const config: Configuration = {
  plugins: [
    new TemporalWorkflowsPlugin({
      defaultOutputDir: './dist/workflows',
      workflows: [
        { workflowsPath: './src/workflows' }
      ]
    } as TemporalWorkflowsPluginOptions)
  ]
};
```

## API

### `TemporalWorkflowsPluginOptions`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `defaultOutputDir` | `string` | ✅ | Default directory for output files |
| `workflows` | `WorkflowBundleConfig[]` | ✅ | List of workflows to bundle |
| `globalBundleOptions` | `Omit<BundleOptions, 'workflowsPath'>` | ❌ | Global options for all workflows |

### `WorkflowBundleConfig`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `workflowsPath` | `string` | ✅ | Path to entry file with workflows |
| `name` | `string` | ❌ | Output file name (without .js) |
| `outputPath` | `string` | ❌ | Full path to output file |
| `bundleOptions` | `Omit<BundleOptions, 'workflowsPath'>` | ❌ | Bundler options for this workflow |

### `BundleOptions` (from `@temporalio/worker`)

See the full list of options in [Temporal documentation](https://typescript.temporal.io/api/interfaces/worker.BundleOptions).

Main options:
- `ignoreModules` - modules to exclude from bundle
- `webpackConfigHook` - function to modify webpack config
- `workflowInterceptorModules` - paths to workflow interceptors
- `payloadConverterPath` - path to custom payload converter
- `failureConverterPath` - path to custom failure converter

## Examples

More examples available in [examples.md](./examples.md).

### Simple Project

```javascript
new TemporalWorkflowsPlugin({
  defaultOutputDir: './dist/workflows',
  workflows: [
    { workflowsPath: './src/workflows' }
  ]
})
```

### Multiple Workflows

```javascript
new TemporalWorkflowsPlugin({
  defaultOutputDir: './dist/workflows',
  workflows: [
    { workflowsPath: './src/workflows/orders', name: 'orders' },
    { workflowsPath: './src/workflows/payments', name: 'payments' },
    { workflowsPath: './src/workflows/notifications', name: 'notifications' }
  ]
})
```

### With Module Ignoring

```javascript
new TemporalWorkflowsPlugin({
  defaultOutputDir: './dist/workflows',
  globalBundleOptions: {
    ignoreModules: ['bull', 'amqplib', 'ioredis']
  },
  workflows: [
    { workflowsPath: './src/workflows' }
  ]
})
```

### With Custom Webpack Config

```javascript
new TemporalWorkflowsPlugin({
  defaultOutputDir: './dist/workflows',
  workflows: [
    { 
      workflowsPath: './src/workflows',
      bundleOptions: {
        webpackConfigHook: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            alias: {
              ...config.resolve?.alias,
              '@utils': path.resolve(__dirname, 'src/utils')
            }
          }
        })
      }
    }
  ]
})
```

## How It Works

1. **Build mode**: When running webpack (`webpack build`), the plugin bundles all specified workflows
2. **Watch mode**: When files change (`webpack watch`), the plugin determines which workflow is affected and rebuilds only that one
3. **Output**: A separate .js file with bundled code is created for each workflow

## Troubleshooting

### Module cannot be used in workflow

If you see an error like "Cannot use module X in workflow":

```javascript
globalBundleOptions: {
  ignoreModules: ['problematic-module']
}
```

### Need source maps

Source maps are enabled by default in Temporal bundler.

### Workflow not rebuilding in watch mode

Make sure webpack is properly tracking changes in your workflow files.

## Compatibility

- Node.js: >= 14
- Webpack: ^4.0.0 || ^5.0.0
- @temporalio/worker: ^1.0.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Created with ❤️ for the Temporal community
