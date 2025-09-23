import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [presetWind3()],
  theme: {
    colors: {
      bg: {
        light: '#ffff',
        dark: '#1F1E1E'
      }
    }
  }
})