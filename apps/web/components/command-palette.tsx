"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FileText, Hash } from "lucide-react"
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

export function CommandPalette({ entries }: CommandPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

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

  const getResults = useCallback(
    (q: string): { notes: Result[]; tags: Result[] } => {
      if (!q.trim()) return { notes: [], tags: [] }
      const lower = q.toLowerCase()

      const notes: Result[] = entries
        .filter(
          (e) =>
            e.title.toLowerCase().includes(lower) ||
            e.content.toLowerCase().includes(lower) ||
            e.tags.some((t) => t.toLowerCase().includes(lower))
        )
        .slice(0, 6)
        .map((e) => {
          const idx = e.content.toLowerCase().indexOf(lower)
          const start = Math.max(0, idx - 50)
          const excerpt =
            idx >= 0
              ? "…" + e.content.slice(start, start + 100) + "…"
              : (e.description ?? e.content.slice(0, 100) + "…")
          return { slug: e.slug, title: e.title, excerpt, type: "note" as const }
        })

      const tags: Result[] = q.startsWith("#")
        ? [...new Set(entries.flatMap((e) => e.tags))]
            .filter((t) => t.toLowerCase().includes(lower.slice(1)))
            .slice(0, 4)
            .map((t) => ({
              slug: `tags/${t}`,
              title: `#${t}`,
              excerpt: "Browse tag",
              type: "tag" as const,
            }))
        : []

      return { notes, tags }
    },
    [entries]
  )

  const { notes, tags } = getResults(query)

  const handleSelect = (slug: string) => {
    router.push(`/${slug}`)
    setOpen(false)
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
        {tags.length > 0 && (
          <CommandGroup heading="Tags">
            {tags.map((r) => (
              <CommandItem key={r.slug} value={r.slug} onSelect={() => handleSelect(r.slug)}>
                <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{r.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {tags.length > 0 && notes.length > 0 && <CommandSeparator />}
        {notes.length > 0 && (
          <CommandGroup heading="Notes">
            {notes.map((r) => (
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
