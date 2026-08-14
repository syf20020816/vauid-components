import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // 与 .dumirc.ts / tsconfig.app.json paths 保持一致，
    // 使 `vauid-components/...` 在 vite dev/build 下也能解析到 ./components/...
    alias: {
      'vauid-components': resolve(__dirname, './components'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VauidComponents',
      fileName: (format) => `vauid-components.${format}.js`
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})
