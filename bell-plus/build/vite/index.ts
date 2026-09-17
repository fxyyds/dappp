export { defineApplicationConfig, defineConfig } from './config/index.js';
export {
  loadApplicationPlugins,
  viteArchiverPlugin,
  viteCompressPlugin,
  viteDayjsPlugin,
  viteHtmlPlugin,
  viteVisualizerPlugin,
  viteVxeTableImportsPlugin,
} from './plugins/index.js';
export type {
  ApplicationPluginOptions,
  ArchiverPluginOptions,
  CommonPluginOptions,
  ConditionPlugin,
  DefineApplicationOptions,
  DefineConfig,
  HtmlPluginOptions,
  PrintPluginOptions,
  VbenViteConfig,
} from './typing.js';
export { loadAndConvertEnv } from './utils/env.js';
