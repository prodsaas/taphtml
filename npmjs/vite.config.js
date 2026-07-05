import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import path from "node:path";

export default defineConfig({
    plugins: [preact()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        minify: false,
        lib: {
            entry: {
                index: path.resolve(__dirname, "src/index.jsx"),
                widget: path.resolve(__dirname, "src/main.jsx")
            },
            formats: ["es"]
        },
        rollupOptions: {
            external: [],
            output: {
                entryFileNames: "[name].js",
                chunkFileNames: "chunks/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash].[ext]"
            }
        }
    }
});