import type { RenderOptions } from "./types.js"

export interface NuartzConfig {
  /** Absolute path to the content directory */
  contentDir: string

  /** Site metadata */
  site: {
    title: string
    description?: string
    /** Production URL, e.g. "https://example.com". Defaults to "http://localhost:3000". */
    baseUrl?: string
    locale?: string
  }

  /** Markdown rendering options */
  markdown?: RenderOptions

  /** Features to enable/disable */
  features?: {
    wikilinks?: boolean
    callouts?: boolean
    tags?: boolean
    backlinks?: boolean
    toc?: boolean
    search?: boolean
    darkMode?: boolean
  }

  /**
   * What to show on the home page (`/`).
   * - `"index"` — render `content/index.md` (default). Falls back to recent notes if the file doesn't exist.
   * - `"recent"` — show a list of all notes sorted by date.
   */
  homePage?: "index" | "recent"

  /** Navigation */
  nav?: {
    /** Extra links in the header */
    links?: Array<{ label: string; href: string; external?: boolean }>
  }
}

export type ResolvedNuartzConfig = Omit<NuartzConfig, "site" | "features"> & {
  site: NuartzConfig["site"] & { baseUrl: string }
  features: Required<NonNullable<NuartzConfig["features"]>>
}

const DEFAULT_FEATURES: Required<NonNullable<NuartzConfig["features"]>> = {
  wikilinks: true,
  callouts: true,
  tags: true,
  backlinks: true,
  toc: true,
  search: true,
  darkMode: true,
}

export function defineConfig(config: NuartzConfig): ResolvedNuartzConfig {
  return {
    ...config,
    site: {
      baseUrl: "http://localhost:3000",
      ...config.site,
    },
    features: {
      wikilinks: config.features?.wikilinks ?? DEFAULT_FEATURES.wikilinks,
      callouts: config.features?.callouts ?? DEFAULT_FEATURES.callouts,
      tags: config.features?.tags ?? DEFAULT_FEATURES.tags,
      backlinks: config.features?.backlinks ?? DEFAULT_FEATURES.backlinks,
      toc: config.features?.toc ?? DEFAULT_FEATURES.toc,
      search: config.features?.search ?? DEFAULT_FEATURES.search,
      darkMode: config.features?.darkMode ?? DEFAULT_FEATURES.darkMode,
    },
  }
}
