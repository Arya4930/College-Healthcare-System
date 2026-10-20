import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    // GitHub Pages serves this project under its repository subdirectory.
    // Set VITE_BASE_PATH only when a future static host uses a different path.
    base: env.VITE_BASE_PATH || "/College-Healthcare-System/",
  };
});
