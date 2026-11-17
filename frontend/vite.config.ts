import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// plugin-react lets Vite understand JSX (the HTML-like syntax in React files)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }, // the backend's CORS setting expects this port
});
