// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const tanstackPrerenderServerAliasPlugin = {
  name: "tanstack-prerender-server-alias",
  apply: "build" as const,
  closeBundle() {
    const serverDir = join(process.cwd(), "dist", "server");
    const indexEntryPath = join(serverDir, "index.js");
    const aliasEntryPath = join(serverDir, "server.js");

    if (!existsSync(indexEntryPath) || existsSync(aliasEntryPath)) {
      return;
    }

    writeFileSync(aliasEntryPath, 'export { default } from "./index.js";\n');
  },
};

export default defineConfig({
  tanstackStart: {
    prerender: {
      enabled: true,
      crawlLinks: true,
      failOnError: true,
    },
  },
  vite: {
    plugins: [tanstackPrerenderServerAliasPlugin],
    optimizeDeps: {
      exclude: ["@react-three/drei"],
    },
  },
});
