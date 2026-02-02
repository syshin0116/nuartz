import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Allow importing from nuartz workspace package
  transpilePackages: ["nuartz"],
}

export default nextConfig
