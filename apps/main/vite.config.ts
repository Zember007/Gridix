import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import viteCompression from "vite-plugin-compression";
import Inspect from "vite-plugin-inspect";

/** Инструкции партнёрки — единственный источник в пакете @gridix/partner-program */
const partnerInstructionsDir = path.resolve(
  __dirname,
  "../../packages/partner-program/public/instructions",
);

function partnerInstructionsPlugin() {
  return {
    name: "partner-instructions",
    configureServer(server: {
      middlewares: {
        use: (
          fn: (
            req: import("http").IncomingMessage,
            res: import("http").ServerResponse,
            next: () => void,
          ) => void,
        ) => void;
      };
    }) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (req.method !== "GET" || !url.startsWith("/instructions/")) {
          next();
          return;
        }
        const subPath = url
          .slice("/instructions/".length)
          .replace(/^\/+/, "")
          .replace(/\.\./g, "");
        const filePath = path.join(partnerInstructionsDir, subPath);
        if (
          !filePath.startsWith(partnerInstructionsDir) ||
          !fs.existsSync(filePath) ||
          !fs.statSync(filePath).isFile()
        ) {
          next();
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime: Record<string, string> = {
          ".pdf": "application/pdf",
          ".mp4": "video/mp4",
        };
        if (mime[ext]) res.setHeader("Content-Type", mime[ext]);
        fs.createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const dest = path.join(outDir, "instructions");
      if (fs.existsSync(partnerInstructionsDir)) {
        fs.mkdirSync(dest, { recursive: true });
        const copy = (src: string, d: string) => {
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (const e of entries) {
            const s = path.join(src, e.name);
            const d2 = path.join(d, e.name);
            if (e.isDirectory()) {
              fs.mkdirSync(d2, { recursive: true });
              copy(s, d2);
            } else {
              fs.copyFileSync(s, d2);
            }
          }
        };
        copy(partnerInstructionsDir, dest);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const isWidgetBuild = process.env.WIDGET_BUILD === "true";
  const timestamp = Date.now().toString();
  const gitHash = process.env.GIT_HASH || "dev";
  const buildVersion = `${timestamp}-${gitHash}`;

  console.log(`🔧 Mode: ${mode}`);
  console.log(`🧩 Widget build: ${isWidgetBuild}`);
  if (isWidgetBuild) console.log(`📦 Build version: ${buildVersion}`);

  const baseConfig = {
    base: "/", // Ensure assets load from root domain, not relative to current path
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api/widget": {
          target: "http://localhost:54321/functions/v1/widget-api",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/widget/, ""),
        },
      },
    },
    plugins: [
      Inspect(),
      react(),
      !isWidgetBuild && partnerInstructionsPlugin(),
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
        outDir: "public/widget",
        cssCodeSplit: false,
        minify: "esbuild",
        lib: {
          entry: path.resolve(__dirname, "src/app/entries/widget/index.tsx"),
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
              assetInfo.name === "style.css"
                ? "style.css"
                : assetInfo.name || "asset",
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
          pure_funcs: [
            "console.log",
            "console.info",
            "console.debug",
            "console.trace",
          ],
        },
      },
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, "/");

            if (normalizedId.includes("node_modules")) {
              if (
                normalizedId.includes("/@tanstack/") ||
                normalizedId.includes("/@supabase/") ||
                normalizedId.includes("/zod/")
              ) {
                return "vendor-data";
              }

              if (
                normalizedId.includes("/i18next/") ||
                normalizedId.includes("/react-i18next/") ||
                normalizedId.includes("/next-themes/")
              ) {
                return "vendor-i18n";
              }

              if (
                normalizedId.includes("/@radix-ui/") ||
                normalizedId.includes("/lucide-react/") ||
                normalizedId.includes("/sonner/") ||
                normalizedId.includes("/class-variance-authority/") ||
                normalizedId.includes("/tailwind-merge/") ||
                normalizedId.includes("/cmdk/") ||
                normalizedId.includes("/embla-carousel-react/")
              ) {
                return "vendor-ui";
              }

              if (
                normalizedId.includes("/leaflet/") ||
                normalizedId.includes("/react-leaflet/")
              ) {
                return "vendor-map";
              }

              if (
                normalizedId.includes("/recharts/") ||
                normalizedId.includes("/date-fns/")
              ) {
                return "vendor-analytics";
              }

              if (
                normalizedId.includes("/pdfjs-dist/") ||
                normalizedId.includes("/jspdf/") ||
                normalizedId.includes("/pdf-lib/") ||
                normalizedId.includes("/html2canvas/") ||
                normalizedId.includes("/pizzip/") ||
                normalizedId.includes("/mammoth/") ||
                normalizedId.includes("/xlsx/") ||
                normalizedId.includes("/html-docx-js-typescript/")
              ) {
                return "vendor-docs";
              }

              if (
                normalizedId.includes("/framer-motion/") ||
                normalizedId.includes("/@tsparticles/") ||
                normalizedId.includes("/dotted-map/") ||
                normalizedId.includes("/@paper-design/")
              ) {
                return "vendor-effects";
              }
            }

            const localeMatch = normalizedId.match(
              /\/src\/locales\/(ru|en|ka|ar|he|tr)\//,
            );
            if (localeMatch?.[1]) {
              return `locale-${localeMatch[1]}`;
            }

            if (
              normalizedId.includes("/src/components/visualization/") ||
              normalizedId.includes("/src/features/visualization/")
            ) {
              return "app-visualization";
            }
          },
        },
      },
    },
  };
});
