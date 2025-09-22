import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import SemiPlugin from "vite-plugin-semi-theme";
import path from 'node:path'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), SemiPlugin({
    theme: '@semi-bot/semi-theme-retroblue'
  }), UnoCSS()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
