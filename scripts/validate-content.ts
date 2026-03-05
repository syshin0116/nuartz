#!/usr/bin/env bun
/**
 * nuartz content validator
 * Usage: bun scripts/validate-content.ts [content-dir]
 */
import path from "node:path"
import { getAllMarkdownFiles, renderMarkdown } from "nuartz"

const CONTENT_DIR = path.resolve(process.argv[2] ?? "apps/web/content")

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

  const slugSet = new Set(files.map(f => f.slug))

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
      const normalized = link.toLowerCase().replace(/\s+/g, "-")
      const found = [...slugSet].some(
        s => s === normalized || s.endsWith("/" + normalized)
      )
      if (!found) {
        warnings.push(`Broken wikilink: [[${link}]]`)
      }
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
