import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  server: { port: 5174 },
  build: {
    outDir: process.env.VITE_OUTDIR || "dist",
    emptyOutDir: true
  }
})