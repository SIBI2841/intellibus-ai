import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return "vendor-react";
          }

          if (/[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/.test(id)) {
            return "vendor-maps";
          }

          if (id.includes("@tensorflow/tfjs-backend-webgl")) {
            return "tf-webgl";
          }

          if (id.includes("@tensorflow/tfjs-backend-cpu")) {
            return "tf-cpu";
          }

          if (id.includes("@tensorflow/tfjs-converter")) {
            return "tf-converter";
          }

          if (id.includes("@tensorflow/tfjs-data")) {
            return "tf-data";
          }

          if (id.includes("@tensorflow/tfjs-layers")) {
            return "tf-layers";
          }

          if (id.includes("@tensorflow/tfjs-core")) {
            return "tf-core";
          }

          if (id.includes("@tensorflow-models/coco-ssd")) {
            return "tf-coco-ssd";
          }
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
