import { describe, expect, it } from "vitest"
import { defineConfig } from "../config"

describe("defineConfig", () => {
  it("fills defaults without overriding disabled features", () => {
    const config = defineConfig({
      contentDir: "/notes",
      site: { title: "Garden" },
      features: { search: false, darkMode: false },
    })

    expect(config.site.baseUrl).toBe("http://localhost:3000")
    expect(config.features).toEqual({
      wikilinks: true,
      callouts: true,
      tags: true,
      backlinks: true,
      toc: true,
      search: false,
      darkMode: false,
    })
  })
})
