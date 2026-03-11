import { getAllMarkdownFiles, buildSearchIndex } from "nuartz"
import path from "node:path"

const CONTENT_DIR = path.join(process.cwd(), "content")

export const dynamic = "force-static"

export async function GET() {
  const files = await getAllMarkdownFiles(CONTENT_DIR)
  const entries = buildSearchIndex(files)
  return Response.json(entries)
}
