"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, Hash, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
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
  const [results, setResults] = useState<Result[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
        setQuery("")
        setResults([])
        setSelected(0)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10)
  }, [open])

  const runSearch = useCallback(
    (q: string) => {
      if (!q.trim()) { setResults([]); return }
      const lower = q.toLowerCase()

      const noteResults: Result[] = entries
        .filter((e) =>
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
              : e.description ?? e.content.slice(0, 100) + "…"
          return { slug: e.slug, title: e.title, excerpt, type: "note" as const }
        })

      // Tag shortcuts: if query starts with #
      const tagResults: Result[] = q.startsWith("#")
        ? [...new Set(entries.flatMap((e) => e.tags))]
            .filter((t) => t.toLowerCase().includes(lower.slice(1)))
            .slice(0, 3)
            .map((t) => ({ slug: `tags/${t}`, title: `#${t}`, excerpt: "Browse tag", type: "tag" as const }))
        : []

      setResults([...tagResults, ...noteResults])
      setSelected(0)
    },
    [entries]
  )

  useEffect(() => { runSearch(query) }, [query, runSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === "Enter" && results[selected]) {
      router.push(`/${results[selected].slug}`)
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes or type # for tags…"
            className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-xs text-muted-foreground">esc</kbd>
        </div>

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto p-1.5">
            {results.map((r, i) => (
              <li key={r.slug}>
                <button
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    i === selected ? "bg-muted" : "hover:bg-muted/60"
                  )}
                  onClick={() => { router.push(`/${r.slug}`); setOpen(false) }}
                  onMouseEnter={() => setSelected(i)}
                >
                  {r.type === "tag" ? (
                    <Hash className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{r.title}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {r.excerpt}
                    </div>
                  </div>
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {query && !results.length && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No results for &ldquo;{query}&rdquo;
          </p>
        )}

        <div className="flex items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground">
          <span><kbd className="rounded border px-1">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border px-1">↵</kbd> open</span>
          <span><kbd className="rounded border px-1">esc</kbd> close</span>
          <span><kbd className="rounded border px-1">#</kbd> search tags</span>
        </div>
      </div>
    </div>
  )
}
