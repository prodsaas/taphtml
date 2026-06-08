import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export default defineConfig({
  plugins: [
    preact(),
    {
      configureServer(server) {
        // Build widget
        spawn("vite", ["build", "--watch"], {
          shell: true,
          stdio: "inherit"
        });
        // Serve dist directory
        server.middlewares.use((req, res, next) => {
          const urlPath = req.url.split("?")[0];
          const filePath = path.join(process.cwd(), "dist", urlPath);

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            if (urlPath.endsWith(".js")) {
              res.setHeader("Content-Type", "application/javascript");
            }
            res.setHeader("Access-Control-Allow-Origin", "*");
            fs.createReadStream(filePath).pipe(res);
          }
          else next();
        });
      },
    },
  ],
  server: {
    port: 5175,
    cors: true
  },
  base: "./",
  build: {
    rollupOptions: {
      input: "src/main.jsx",
      output: {
        format: "module",
        entryFileNames: "widget.js",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("preact")) return "preact";
            if (id.includes("socket.io-client")) return "socket";
            return "vendor";
          }
        },
      },
    },
  }
});