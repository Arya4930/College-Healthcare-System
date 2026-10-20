import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    // GitHub Pages serves this project under its repository subdirectory.
    // The explicit AWS mode is served from the custom domain root.
    base: env.VITE_BASE_PATH || (mode === "aws" ? "/" : "/College-Healthcare-System/"),
  };
});
