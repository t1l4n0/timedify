import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals({ nativeFetch: true });

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 3000,
    },
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
    }),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
    cssCodeSplit: true,
  },
});
