import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages はサブパス配信（https://tonbiattack.github.io/type-duel/）なので
// 本番ビルドとプレビューでは base を固定する。
// `vite dev` だけはルート配信なので `/` にする。
export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : "/type-duel/",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 4173,
    strictPort: false,
  },
}));
