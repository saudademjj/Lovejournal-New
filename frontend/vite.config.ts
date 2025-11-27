import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import {tr} from "framer-motion/m";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: "127.0.0.1",
    proxy:{
        "/api":{
            target:"http://127.0.0.1:8000",
            changeOrigin:true,
            rewrite:(path) => path.replace(/^\/api/,"")
        }
    }
  },
});
