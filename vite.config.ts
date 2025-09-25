import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isWidgetBuild = process.env.WIDGET_BUILD === 'true';

  console.log('isWidgetBuild', isWidgetBuild);

  return ({
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api/widget': {
          target: 'http://localhost:54321/functions/v1/widget-api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/widget/, '')
        }
      }
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    ...(isWidgetBuild ? {
      optimizeDeps: {
        esbuildOptions: {
          define: {
            'process.env.NODE_ENV': '"production"',
            'process.env': '{}'
          }
        }
      },
      build: {
        outDir: 'dist-widget',
        cssCodeSplit: false,
        lib: {
          entry: path.resolve(__dirname, 'src/widget.tsx'),
          name: 'GridixWidget',
          formats: ['iife'],
          fileName: () => 'widget.js',
        },
        rollupOptions: {
          // Ensure no externalization to bundle everything into a single file
          external: [],
          output: {
            inlineDynamicImports: true,
          }
        }
      },
      define: {
        'process.env.NODE_ENV': '"production"',
        'process.env': '{}'
      }
    } : {})
  });
});
