import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import SemiPlugin from "vite-plugin-semi-theme";
import path from 'node:path'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig(async ({ isPreview }) => {
  const preloadPlugins = []
  if (isPreview) {
    const analyzer = (await import('vite-bundle-analyzer')).analyzer()
    preloadPlugins.push(analyzer)
  }
  return {
    plugins: [
      preact(),
      SemiPlugin({
        theme: '@semi-bot/semi-theme-retroblue'
      }),
      UnoCSS(),
      ...preloadPlugins
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      outDir: path.resolve(__dirname, '../server/internal/static/web-dist'),
    }
  }
});
