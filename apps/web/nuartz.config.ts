import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "nuartz"

export default defineConfig({
  contentDir: path.join(path.dirname(fileURLToPath(import.meta.url)), "content"),
  site: {
    title: "Nuartz",
    description: "Publish your Obsidian vault as a Next.js website",
    // Full public URL including any sub-path, e.g. https://user.github.io/repo
    baseUrl: process.env.NUARTZ_SITE_URL ?? "https://nuartz.vercel.app",
    // Search Console token for nuartz.vercel.app. Replace or remove for your site.
    verification: { google: "j5FT4jTGt4vceZ-Tgn0gf5q1VHp1VNTtBcbYC1VUBFE" },
  },
  homePage: "index",
  features: {
    wikilinks: true,
    callouts: true,
    tags: true,
    backlinks: true,
    toc: true,
    search: true,
    darkMode: true,
  },
  nav: {
    links: [
      { label: "GitHub", href: "https://github.com/syshin0116/nuartz", external: true },
    ],
  },
})
