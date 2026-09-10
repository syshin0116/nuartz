import { expect, test } from "vitest"
import path from "node:path"
import { getAllMarkdownFiles } from "nuartz"
import config from "../nuartz.config"

test("starter content directory resolves outside the app working directory", async () => {
  expect(path.basename(config.contentDir)).toBe("content")
  expect(path.basename(path.dirname(config.contentDir))).toBe("web")
  expect((await getAllMarkdownFiles(config.contentDir)).some(file => file.slug === "index")).toBe(true)
})
