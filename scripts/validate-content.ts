#!/usr/bin/env bun
/**
 * nuartz content validator
 * Usage: bun scripts/validate-content.ts [--strict] [content-dir]
 * --strict reports broken links as errors (exit code 1) instead of warnings.
 */
import path from "node:path"
import { assignPageSlugs, createNoteResolver, getAllMarkdownFiles, getContentFiles } from "nuartz"
import { renderMarkdown } from "nuartz/markdown"

const args = process.argv.slice(2)
const STRICT = args.includes("--strict")
const CONTENT_DIR = path.resolve(args.find(arg => !arg.startsWith("--")) ?? "apps/web/content")

async function main() {
  console.log(`\nValidating content in: ${CONTENT_DIR}\n`)

  let files
  try {
    files = await getAllMarkdownFiles(CONTENT_DIR)
  } catch {
    console.error(`Could not read content directory: ${CONTENT_DIR}`)
    process.exit(1)
  }

  if (files.length === 0) {
    console.log("No markdown files found.")
    process.exit(0)
  }

  // Resolve links exactly as the site does (scripts/prebuild.ts): notes, then
  // canvas and base pages linked with their extension, e.g. [[overview.canvas]].
  const pageFiles = await getContentFiles(CONTENT_DIR, [".canvas", ".base"])
  const pageSlugs = assignPageSlugs(pageFiles.map(f => f.path), files.map(f => f.slug))
  const resolveNote = createNoteResolver([...files, ...pageFiles.map(f => ({ slug: pageSlugs.get(f.path)!, frontmatter: {}, path: f.path }))])
  const folders = new Set(files.flatMap(f => f.slug.split("/").slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join("/").toLowerCase())))
  const isKnown = (link: string, from: string) => Boolean(resolveNote(link, from))
    || folders.has(link.toLowerCase().replace(/\/+$/, "")) || /^tags(\/|$)/i.test(link)

  const results: {
    slug: string
    errors: string[]
    warnings: string[]
  }[] = []

  for (const file of files) {
    const errors: string[] = []
    const warnings: string[] = []

    if (!file.frontmatter.title) {
      warnings.push("Missing frontmatter title")
    }

    let result
    try {
      result = await renderMarkdown(file.raw)
    } catch (e) {
      errors.push(`Render error: ${e instanceof Error ? e.message : String(e)}`)
      results.push({ slug: file.slug, errors, warnings })
      continue
    }

    for (const link of result.links) {
      if (!isKnown(link, `${file.slug}.md`)) (STRICT ? errors : warnings).push(`Broken link: ${link}`)
    }

    results.push({ slug: file.slug, errors, warnings })
  }

  const failures = results.filter(r => r.errors.length > 0)
  const withWarnings = results.filter(r => r.warnings.length > 0)

  if (failures.length === 0 && withWarnings.length === 0) {
    console.log(`All ${files.length} files validated successfully!\n`)
  } else {
    if (failures.length > 0) {
      console.log(`\nERRORS (${failures.length} files):\n`)
      for (const r of failures) {
        console.log(`  ${r.slug}`)
        for (const e of r.errors) console.log(`    [error] ${e}`)
      }
    }

    if (withWarnings.length > 0) {
      console.log(`\nWARNINGS (${withWarnings.length} files):\n`)
      for (const r of withWarnings) {
        console.log(`  ${r.slug}`)
        for (const w of r.warnings) console.log(`    [warn] ${w}`)
      }
    }
  }

  console.log(`\nSummary: ${results.length} files | ${failures.length} errors | ${withWarnings.length} with warnings\n`)

  if (failures.length > 0) process.exit(1)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
