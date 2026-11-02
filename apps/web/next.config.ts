import type { NextConfig } from "next"

// `bun run build:static` sets these; see docs/hosting. Keep NUARTZ_BASE_PATH in
// sync with prebuild, which bakes it into note HTML.
const staticExport = process.env.NUARTZ_OUTPUT === "export"
const basePath = (process.env.NUARTZ_BASE_PATH ?? "").replace(/\/+$/, "")

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: true,
  },
  output: staticExport ? "export" : undefined,
  basePath: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_EXPORT: staticExport ? "1" : "",
  },
  transpilePackages: ["nuartz"],
  serverExternalPackages: [
    "@beoe/rehype-graphviz",
    "@beoe/rehype-d2",
    "@beoe/rehype-code-hook",
    "@beoe/rehype-code-hook-img",
    "@hpcc-js/wasm",
    "@node-rs/xxhash",
  ],
}

export default nextConfig
