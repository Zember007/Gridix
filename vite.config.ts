import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from "vite-plugin-compression";

export default defineConfig(({ mode }) => {
  const isWidgetBuild = process.env.WIDGET_BUILD === "true";
  const timestamp = Date.now().toString();
  const gitHash = process.env.GIT_HASH || "dev";
  const buildVersion = `${timestamp}-${gitHash}`;

  console.log(`🔧 Mode: ${mode}`);
  console.log(`🧩 Widget build: ${isWidgetBuild}`);
  if (isWidgetBuild) console.log(`📦 Build version: ${buildVersion}`);

  const baseConfig = {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api/widget': {
          target: 'http://localhost:54321/functions/v1/widget-api',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/widget/, '')
        }
      }
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      ...(mode === "production"
        ? [
            viteCompression({
              algorithm: "gzip",
              ext: ".gz",
              threshold: 10240,
              deleteOriginFile: false,
            }),
            viteCompression({
              algorithm: "brotliCompress",
              ext: ".br",
              threshold: 10240,
              deleteOriginFile: false,
            }),
          ]
        : []),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };

  if (isWidgetBuild) {
    return {
      ...baseConfig,
      optimizeDeps: {
        esbuildOptions: {
          define: {
            "process.env.NODE_ENV": '"production"',
            "process.env": "{}",
          },
        },
      },
      build: {
        outDir: "dist-widget",
        cssCodeSplit: false,
        minify: "esbuild",
        lib: {
          entry: path.resolve(__dirname, "src/widget.tsx"),
          name: "GridixWidget",
          formats: ["iife"],
          fileName: () => "widget.js",
        },
        rollupOptions: {
          external: [],
          output: {
            inlineDynamicImports: true,
            format: "iife",
            name: "GridixWidget",
            extend: false,
            exports: "default",
            assetFileNames: (assetInfo) =>
              assetInfo.name === "style.css" ? "style.css" : assetInfo.name || "asset",
          },
        },
      },
      define: {
        "process.env.NODE_ENV": '"production"',
        "process.env": "{}",
        __WIDGET_VERSION__: JSON.stringify(buildVersion),
      },
    };
  }

  return {
    ...baseConfig,
    build: {
      chunkSizeWarningLimit: 1000,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug", "console.trace"],
        },
      },
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ui": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-select",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-toast",
            ],
            "vendor-maps": ["leaflet", "react-leaflet"],
            "vendor-pdf": ["pdf-lib"],
            "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-animation": ["framer-motion"],
            "vendor-utils": ["xlsx", "browser-image-compression"],
          },
        },
      },
    },
  };
});
