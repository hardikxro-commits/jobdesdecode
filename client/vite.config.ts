/*
 * Copyright (c) 2026 Hardik Nishad (@hardikxro-commits)
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
