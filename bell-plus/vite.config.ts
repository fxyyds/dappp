import { resolve } from 'node:path';

import { defineConfig } from './build/vite/index.js';

// 自行取消注释来启用按需导入功能
// import { AntdvNextResolver } from '@antdv-next/auto-import-resolver'
// import Components from 'unplugin-vue-components/vite';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        // Components({
        //   dirs: [], // 默认会导入src/components目录下所有组件 不需要
        //   dts: './types/components.d.ts', // 输出类型文件
        //   resolvers: [
        //     AntdvNextResolver({
        //       // 需要排除Button组件 全局已经默认导入了
        //       exclude: ['Button'],
        //     }),
        //   ],
        // }),
      ],
      resolve: {
        alias: {
          '@': resolve(import.meta.dirname, 'src'),
          // sm-crypto 的 rng.js 在 Node 环境 require('crypto') 兜底,浏览器端实际走 window.crypto,
          // 用浏览器 shim 替换,消除 "Module crypto has been externalized" 打包警告
          crypto: resolve(import.meta.dirname, 'build/vite/shims/crypto.ts'),
        },
      },
      server: {
        proxy: {
          // 不要用/api 会跟snail-ai的路径冲突
          '/dev-api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/dev-api/, ''),
            // mock代理目标地址
            target: 'http://127.0.0.1:8080',
            ws: true,
          },
        },
      },
    },
  };
});
