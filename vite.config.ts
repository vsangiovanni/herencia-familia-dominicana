import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": "http://127.0.0.1:3001",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("react-router-dom")) return "router";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("@supabase/supabase-js")) return "supabase";
          if (id.includes("tesseract.js")) return "ocr";
          if (id.includes("html2canvas")) return "html2canvas";
          if (id.includes("jspdf")) return "jspdf";
          if (id.includes("recharts")) return "charts";
          if (id.includes("@radix-ui") || id.includes("lucide-react")) return "ui-kit";
          if (id.includes("react") || id.includes("react-dom")) return "react-vendor";
        },
      },
    },
  },
});
