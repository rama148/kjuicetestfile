import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Saat pengembangan lokal, panggilan /api diteruskan ke Vercel dev server
    // supaya perilakunya sama persis dengan di produksi.
    proxy: { "/api": "http://localhost:3000" },
  },
  build: {
    // File App.jsx sangat besar (23.800+ baris). Batas peringatan dinaikkan supaya
    // build tidak dipenuhi peringatan yang memang sudah diketahui.
    chunkSizeWarningLimit: 2000,
  },
});
