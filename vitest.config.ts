import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import { transform } from '@swc/core';
import type { Plugin } from 'vite';

const swcPlugin: Plugin = {
  name: 'swc-decorator-transform',
  enforce: 'pre',
  async transform(code, id) {
    if (!/\.[cm]?tsx?$/.test(id) || id.includes('node_modules')) return;
    const result = await transform(code, {
      filename: id,
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'es2022',
      },
      sourceMaps: true,
    });
    return { code: result.code, map: result.map };
  },
};

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [swcPlugin],
});