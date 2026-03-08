import path from "node:path"
import { defineConfig } from "nuartz"

export default defineConfig({
  contentDir: path.join(process.cwd(), "content"),
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
