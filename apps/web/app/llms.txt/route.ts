import config from "@/nuartz.config"
import notesList from "@/.generated/notes-list.json"

export const dynamic = "force-static"

export async function GET() {
  const published = notesList.filter((f) => !f.draft)

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
    const url = `${config.site.baseUrl}/${file.slug}`
    lines.push(`- [${file.title}](${url})${file.description ? `: ${file.description}` : ""}`)
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
