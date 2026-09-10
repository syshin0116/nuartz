import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "nuartz"

export default defineConfig({
  contentDir: path.join(path.dirname(fileURLToPath(import.meta.url)), "content"),
  site: {
    title: "Nuartz",
    description: "Publish your Obsidian vault as a Next.js website",
    baseUrl: "https://nuartz.vercel.app",
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
