import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from "vite-plugin-compression";

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
      mode === 'development' && componentTagger(),
      mode === 'production' && viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240, // Only compress files larger than 10kb
        deleteOriginFile: false
      }),
      mode === 'production' && viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks for better caching
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-ui';
              }
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'vendor-maps';
              }
              if (id.includes('jspdf') || id.includes('pdf-lib') || id.includes('html2canvas')) {
                return 'vendor-pdf';
              }
              if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
                return 'vendor-forms';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-animation';
              }
              if (id.includes('xlsx') || id.includes('browser-image-compression')) {
                return 'vendor-utils';
              }
              // All other node_modules in vendor chunk
              return 'vendor';
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
        }
      },
      sourcemap: false
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
