import fs from "node:fs/promises"
import path from "node:path"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { z } from "zod"
import config from "@/nuartz.config"
import searchIndex from "@/.generated/search.json"
import notesList from "@/.generated/notes-list.json"
import { searchNotes, type SearchEntry } from "@/lib/search"

// Read-only MCP server over the published notes, so agents can search and read
// the garden. Stateless: every request builds a fresh server.
const entries = searchIndex as SearchEntry[]
const slugs = new Set(entries.map(entry => entry.slug))
const siteUrl = config.site.baseUrl.replace(/\/+$/, "")
const noteUrl = (slug: string) => `${siteUrl}/${slug === "index" ? "" : slug.split("/").map(encodeURIComponent).join("/")}`
const text = (value: unknown) => ({ content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] })

function createServer() {
  const server = new McpServer({ name: config.site.title, version: "1.0.0" })

  server.registerTool("search_notes", {
    title: "Search notes",
    description: `Full-text search over the published notes of ${config.site.title}. Returns slugs to pass to read_note.`,
    inputSchema: { query: z.string().min(1), limit: z.number().int().min(1).max(50).optional() },
    annotations: { readOnlyHint: true },
  }, async ({ query, limit = 10 }) => text(searchNotes(entries, query).slice(0, limit)
    .map(({ slug, title, excerpt, tags }) => ({ slug, title, url: noteUrl(slug), tags, excerpt }))))

  server.registerTool("read_note", {
    title: "Read a note",
    description: "Returns a published note as Markdown, with wikilinks converted to absolute links.",
    inputSchema: { slug: z.string().min(1) },
    annotations: { readOnlyHint: true },
  }, async ({ slug }) => {
    const key = slug.replace(/^\/+|\/+$/g, "").replace(/\.md$/, "") || "index"
    // Only known slugs reach the filesystem.
    if (!slugs.has(key)) return { ...text(`No published note "${slug}". Use search_notes or list_notes.`), isError: true }
    return text(await fs.readFile(path.join(process.cwd(), "public", "md", `${key}.md`), "utf-8"))
  })

  server.registerTool("list_notes", {
    title: "List notes",
    description: "Lists published notes, newest first, optionally under one folder.",
    inputSchema: { folder: z.string().optional(), limit: z.number().int().min(1).max(500).optional() },
    annotations: { readOnlyHint: true },
  }, async ({ folder, limit = 100 }) => {
    const prefix = folder?.replace(/^\/+|\/+$/g, "")
    return text(notesList.filter(note => !note.draft && (!prefix || note.slug.startsWith(`${prefix}/`))).slice(0, limit)
      .map(({ slug, title, description, date, tags }) => ({ slug, title, url: noteUrl(slug), description, date, tags })))
  })

  return server
}

async function handle(request: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await createServer().connect(transport)
  return transport.handleRequest(request)
}

export { handle as GET, handle as POST, handle as DELETE }
