import type { RenderOptions } from "./types.js"

export interface NuartzConfig {
  /** Absolute path to the content directory */
  contentDir: string

  /** Site metadata */
  site: {
    title: string
    description?: string
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

const DEFAULT_FEATURES: Required<NuartzConfig["features"]> = {
  wikilinks: true,
  callouts: true,
  tags: true,
  backlinks: true,
  toc: true,
  search: true,
  darkMode: true,
}

export function defineConfig(config: NuartzConfig): NuartzConfig {
  return {
    ...config,
    features: { ...DEFAULT_FEATURES, ...config.features },
  }
}
