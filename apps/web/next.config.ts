import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["nuartz"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // FlexSearch optionally references worker_threads (Node built-in).
      // Tell webpack to treat it as an empty module in the browser bundle.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        worker_threads: false,
      }
    }
    return config
  },
}

export default nextConfig
