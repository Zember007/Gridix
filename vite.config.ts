import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from "vite-plugin-compression";
import Inspect from "vite-plugin-inspect";


export default defineConfig(({ mode }) => {
  const isWidgetBuild = process.env.WIDGET_BUILD === "true";
  const timestamp = Date.now().toString();
  const gitHash = process.env.GIT_HASH || "dev";
  const buildVersion = `${timestamp}-${gitHash}`;

  console.log(`🔧 Mode: ${mode}`);
  console.log(`🧩 Widget build: ${isWidgetBuild}`);
  if (isWidgetBuild) console.log(`📦 Build version: ${buildVersion}`);

  const baseConfig = {
    base: '/', // Ensure assets load from root domain, not relative to current path
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
      Inspect(),
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
        outDir: 'public/widget',
        cssCodeSplit: false,
        minify: "esbuild",
        lib: {
          entry: path.resolve(__dirname, "src/widget.tsx"),
          name: "GridixWidget",
          formats: ["iife"],
          fileName: () => "index.js",
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
      sourcemap: false
    },
  };
});
