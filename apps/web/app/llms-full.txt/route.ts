import fs from "node:fs/promises"
import path from "node:path"

export const dynamic = "force-static"

// Written by `bun run generate`: every published note as portable Markdown.
export async function GET() {
  const body = await fs.readFile(path.join(process.cwd(), ".generated", "llms-full.txt"), "utf-8")
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
