"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { FileText, Hash } from "lucide-react"
import FlexSearch from "flexsearch"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import type { SearchEntry } from "nuartz"

interface CommandPaletteProps {
  entries: SearchEntry[]
}

interface Result {
  slug: string
  title: string
  excerpt: string
  type: "note" | "tag"
}

// CJK-aware tokenizer — each Korean/Japanese/Chinese character is its own token
function cjkEncoder(str: string): string[] {
  const tokens: string[] = []
  let buf = ""
  for (const char of str.toLowerCase()) {
    const cp = char.codePointAt(0)!
    const isCJK =
      (cp >= 0x3040 && cp <= 0x309f) ||
      (cp >= 0x30a0 && cp <= 0x30ff) ||
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0xac00 && cp <= 0xd7af)
    const isSpace = cp === 32 || cp === 9 || cp === 10 || cp === 13
    if (isCJK) {
      if (buf) { tokens.push(buf); buf = "" }
      tokens.push(char)
    } else if (isSpace) {
      if (buf) { tokens.push(buf); buf = "" }
    } else {
      buf += char
    }
  }
  if (buf) tokens.push(buf)
  return tokens
}

type IndexDoc = { id: number; slug: string; title: string; content: string; tags: string[] }

export function CommandPalette({ entries }: CommandPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ notes: Result[]; tags: Result[] }>({ notes: [], tags: [] })
  const indexRef = useRef<FlexSearch.Document<IndexDoc> | null>(null)

  // Build FlexSearch index once
  useEffect(() => {
    const idx = new FlexSearch.Document<IndexDoc>({
      encode: cjkEncoder,
      document: {
        id: "id",
        index: [
          { field: "title", tokenize: "forward" },
          { field: "content", tokenize: "forward" },
          { field: "tags", tokenize: "forward" },
        ],
      },
    })
    entries.forEach((e, i) => idx.add({ id: i, slug: e.slug, title: e.title, content: e.content, tags: e.tags }))
    indexRef.current = idx
  }, [entries])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const search = useCallback(
    (q: string) => {
      if (!q.trim()) { setResults({ notes: [], tags: [] }); return }

      // Tag search mode
      if (q.startsWith("#")) {
        const lower = q.slice(1).toLowerCase()
        const tags = [...new Set(entries.flatMap((e) => e.tags))]
          .filter((t) => t.toLowerCase().includes(lower))
          .slice(0, 5)
          .map((t) => ({ slug: `tags/${t}`, title: `#${t}`, excerpt: "Browse tag", type: "tag" as const }))
        setResults({ notes: [], tags })
        return
      }

      // Full-text search
      const idx = indexRef.current
      if (!idx) return

      // Split query into individual tokens and intersect results (AND logic)
      const tokens = q.trim().split(/\s+/).filter(Boolean)
      const tokenSets = tokens.map((token) => {
        const raw = idx.search(token, { limit: 100, enrich: false }) as Array<{ field: string; result: number[] }>
        const set = new Set<number>()
        for (const r of raw) for (const id of r.result) set.add(id)
        return set
      })
      const ids: number[] = tokenSets.length === 0 ? [] :
        [...tokenSets[0]].filter((id) => tokenSets.every((s) => s.has(id))).slice(0, 8)

      const lower = q.toLowerCase()
      const notes: Result[] = ids.slice(0, 7).map((id) => {
        const e = entries[id]
        const pos = e.content.toLowerCase().indexOf(lower)
        const start = Math.max(0, pos - 50)
        const excerpt = pos >= 0
          ? "…" + e.content.slice(start, start + 120) + "…"
          : (e.description ?? e.content.slice(0, 120) + "…")
        return { slug: e.slug, title: e.title, excerpt, type: "note" as const }
      })

      setResults({ notes, tags: [] })
    },
    [entries]
  )

  useEffect(() => { search(query) }, [query, search])

  const handleSelect = (slug: string) => {
    router.push(`/${slug}`)
    setOpen(false)
    setQuery("")
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search notes or type # for tags…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>
        {results.tags.length > 0 && (
          <CommandGroup heading="Tags">
            {results.tags.map((r) => (
              <CommandItem key={r.slug} value={r.slug} onSelect={() => handleSelect(r.slug)}>
                <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{r.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.tags.length > 0 && results.notes.length > 0 && <CommandSeparator />}
        {results.notes.length > 0 && (
          <CommandGroup heading="Notes">
            {results.notes.map((r) => (
              <CommandItem key={r.slug} value={r.slug} onSelect={() => handleSelect(r.slug)}>
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.excerpt}</div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
