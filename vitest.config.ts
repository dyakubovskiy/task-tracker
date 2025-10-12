import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

const resolvedViteConfig =
  typeof viteConfig === 'function' ? viteConfig({ command: 'build', mode: 'test' }) : viteConfig

export default mergeConfig(
  resolvedViteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        exclude: [
          'playwright.config.ts',
          'vite.config.ts',
          'vitest.config.ts',
          'eslint.config.ts',
          'env.d.ts',
          'dist/**',
          'coverage/**',
          'src/main.ts',
          'src/app/**',
          'src/**/index.ts'
        ]
      }
    }
  })
)
