import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Uncomment for static export (GitHub Pages, etc.):
  // output: "export",
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
