import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isWidgetBuild = process.env.WIDGET_BUILD === 'true';
  // Generate a version string based on current timestamp and git hash for cache busting
  const timestamp = Date.now().toString();
  const gitHash = process.env.GIT_HASH || 'dev';
  const buildVersion = `${timestamp}-${gitHash}`;

  console.log('isWidgetBuild', isWidgetBuild);
  if (isWidgetBuild) {
    console.log('Widget build version:', buildVersion);
  }

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
        minify: 'esbuild',
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
            // Keep CSS filename simple (version will be added as query param when loading)
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'style.css') {
                return 'style.css';
              }
              return assetInfo.name || 'asset';
            },
            // IIFE format configuration
            format: 'iife',
            name: 'GridixWidget',
            // Don't extend window, replace it
            extend: false,
            // Use only default export
            exports: 'default',
          }
        }
      },
      define: {
        'process.env.NODE_ENV': '"production"',
        'process.env': '{}',
        '__WIDGET_VERSION__': JSON.stringify(buildVersion)
      }
    } : {})
  });
});
