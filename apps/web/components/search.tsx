"use client"

import { useEffect, useState, useCallback } from "react"
import { Search as SearchIcon, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SearchEntry {
  slug: string
  title: string
  content: string
  tags: string[]
}

interface SearchResult {
  slug: string
  title: string
  excerpt: string
}

interface SearchProps {
  entries: SearchEntry[]
}

export function SearchDialog({ entries }: SearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const search = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([])
        return
      }
      const lower = q.toLowerCase()
      const matched = entries
        .filter(
          (e) =>
            e.title.toLowerCase().includes(lower) ||
            e.content.toLowerCase().includes(lower) ||
            e.tags.some((t) => t.toLowerCase().includes(lower))
        )
        .slice(0, 8)
        .map((e) => {
          const idx = e.content.toLowerCase().indexOf(lower)
          const start = Math.max(0, idx - 60)
          const excerpt =
            idx >= 0
              ? "…" + e.content.slice(start, start + 120) + "…"
              : e.content.slice(0, 120) + "…"
          return { slug: e.slug, title: e.title, excerpt }
        })
      setResults(matched)
    },
    [entries]
  )

  useEffect(() => {
    search(query)
  }, [query, search])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b px-4">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto p-2">
            {results.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/${r.slug}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 hover:bg-muted transition-colors"
                  )}
                >
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {r.excerpt}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {query && results.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No results for &ldquo;{query}&rdquo;
          </p>
        )}

        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex gap-3">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
