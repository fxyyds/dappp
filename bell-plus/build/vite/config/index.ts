import type { DefineConfig, VbenViteConfig } from '../typing.js';

import { defineApplicationConfig } from './application.js';

export { defineApplicationConfig } from './application.js';

function defineConfig(userConfigPromise?: DefineConfig): VbenViteConfig {
  return defineApplicationConfig(userConfigPromise);
}

export { defineConfig };
