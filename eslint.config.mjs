// typescript-eslint cannot load TypeScript 7, so the root `typescript` dependency
// is an alias to TypeScript 6. Workspaces still compile with TypeScript 7.

import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    settings: { next: { rootDir: "apps/web" } },
  },
  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/dist/**",
    "**/coverage/**",
    "refs/**",
    "apps/web/.generated/**",
    "apps/web/public/**",
    "apps/web/next-env.d.ts",
  ]),
])
