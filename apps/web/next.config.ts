import type { NextConfig } from "next"
import path from "node:path"

const nextConfig: NextConfig = {
  transpilePackages: ["nuartz"],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
}

export default nextConfig
