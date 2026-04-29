import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';


export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: (source: string, filename: string) => {
          const normalizedFilename = filename.replace(/\\/g, '/');
          if (normalizedFilename.endsWith('/src/assets/styles/main.scss')) {
            return source;
          }
          return `@use "@/assets/styles/main.scss" as *;\n${source}`;
        },
      },
    },
  },
});
