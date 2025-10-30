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
          // Use explicit mappings for known heavy libraries only.
          // Let Rollup handle the rest to avoid incorrect dependency ordering.
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tooltip', '@radix-ui/react-toast'],
            'vendor-charts': ['recharts'],
            'vendor-maps': ['leaflet', 'react-leaflet'],
            'vendor-pdf': ['jspdf', 'pdf-lib', 'html2canvas'],
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-animation': ['framer-motion'],
            'vendor-utils': ['xlsx', 'browser-image-compression']
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
