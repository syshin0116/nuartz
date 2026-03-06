import { getAllMarkdownFiles } from "nuartz"
import path from "node:path"
import config from "@/nuartz.config"

export const dynamic = "force-static"

const CONTENT_DIR = path.join(process.cwd(), "content")

export async function GET() {
  const files = await getAllMarkdownFiles(CONTENT_DIR)
  const published = files.filter((f) => !f.frontmatter.draft)

  const lines: string[] = [
    `# ${config.site.title}`,
    "",
    `> ${config.site.description ?? ""}`,
    "",
    config.site.baseUrl ?? "",
    "",
    "## Notes",
    "",
  ]

  for (const file of published) {
    const title = (file.frontmatter.title as string | undefined) ?? file.slug
    const desc = (file.frontmatter.description as string | undefined) ?? ""
    const url = `${config.site.baseUrl}/${file.slug}`
    lines.push(`- [${title}](${url})${desc ? `: ${desc}` : ""}`)
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
