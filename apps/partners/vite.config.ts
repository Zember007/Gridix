import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

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
          for (const e of fs.readdirSync(src, { withFileTypes: true })) {
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

export default defineConfig({
  plugins: [react(), partnerInstructionsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8082,
  },
});
