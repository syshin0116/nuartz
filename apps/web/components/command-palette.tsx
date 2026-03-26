"use client"

import { useEffect, useState, useCallback, useRef, useDeferredValue } from "react"
import { useRouter } from "next/navigation"
import { FileText, Hash, Loader2 } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

interface Result {
  slug: string
  title: string
  excerpt: string
  type: "note" | "tag"
}

interface PagefindResult {
  id: string
  data: () => Promise<{
    url: string
    meta?: { title?: string }
    excerpt?: string
  }>
}

interface PagefindResponse {
  results: PagefindResult[]
}

interface Pagefind {
  init: () => Promise<void>
  search: (query: string) => Promise<PagefindResponse>
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [indexReady, setIndexReady] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const pagefindRef = useRef<Pagefind | null>(null)
  const deferredQuery = useDeferredValue(query)

  // Load Pagefind on mount
  useEffect(() => {
    async function loadPagefind() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pf = await (Function('return import("/pagefind/pagefind.js")')() as Promise<any>) as Pagefind
        await pf.init()
        pagefindRef.current = pf
        setIndexReady(true)
      } catch {
        // Pagefind not available (dev mode) — fall back to API search
        setIndexReady(true)
      }
    }
    loadPagefind()
  }, [])

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
    async (q: string) => {
      if (!q.trim()) { setResults([]); return }

      const pf = pagefindRef.current
      if (!pf) {
        // Fallback: API-based search for dev mode
        try {
          const res = await fetch(`/api/search`)
          const entries = await res.json() as Array<{
            slug: string; title: string; content: string; tags: string[]
            description?: string
          }>

          // Tag search mode
          if (q.startsWith("#")) {
            const lower = q.slice(1).toLowerCase()
            const tags = [...new Set(entries.flatMap((e) => e.tags))]
              .filter((t) => t.toLowerCase().includes(lower))
              .slice(0, 5)
              .map((t) => ({ slug: `tags/${t}`, title: `#${t}`, excerpt: "Browse tag", type: "tag" as const }))
            setResults(tags)
            return
          }

          const lower = q.toLowerCase()
          const tokens = lower.split(/\s+/).filter(Boolean)
          const found = entries
            .filter(e => {
              const text = `${e.title} ${e.content} ${e.tags.join(' ')}`.toLowerCase()
              return tokens.every(t => text.includes(t))
            })
            .slice(0, 7)
            .map(e => {
              const pos = e.content.toLowerCase().indexOf(tokens[0])
              const start = Math.max(0, pos - 50)
              const excerpt = pos >= 0
                ? "…" + e.content.slice(start, start + 120) + "…"
                : (e.description ?? e.content.slice(0, 120) + "…")
              return { slug: e.slug, title: e.title, excerpt, type: "note" as const }
            })
          setResults(found)
        } catch {
          setResults([])
        }
        return
      }

      // Pagefind search
      setIsSearching(true)
      try {
        const response = await pf.search(q)
        const items: Result[] = []

        const top = response.results.slice(0, 7)
        const dataPromises = top.map(r => r.data())
        const dataResults = await Promise.all(dataPromises)

        for (const data of dataResults) {
          // Convert pagefind URL to slug
          let slug = data.url
            .replace(/^\//, "")
            .replace(/\/index\.html$/, "")
            .replace(/\.html$/, "")

          // Skip non-content pages
          if (slug === "" || slug === "_global-error") continue

          const title = data.meta?.title || slug.split("/").pop() || slug
          const excerpt = data.excerpt
            ? data.excerpt.replace(/<[^>]*>/g, "").slice(0, 120)
            : ""

          items.push({ slug, title, excerpt, type: "note" })
        }

        setResults(items)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    },
    []
  )

  useEffect(() => { search(deferredQuery) }, [deferredQuery, search])

  const handleSelect = (slug: string) => {
    router.push(`/${slug}`)
    setOpen(false)
    setQuery("")
  }

  const isPending = query !== deferredQuery || isSearching
  const hasResults = results.length > 0
  const tags = results.filter(r => r.type === "tag")
  const notes = results.filter(r => r.type === "note")

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Search notes or type # for tags…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {/* Loading state: index not ready yet */}
        {!indexReady && query.trim() && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading search index…
          </div>
        )}

        {/* Searching indicator */}
        {isPending && indexReady && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching…
          </div>
        )}

        {/* No results */}
        {!isPending && indexReady && query.trim() && !hasResults && (
          <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>
        )}

        {/* Results with fade-in animation */}
        <div className={hasResults ? "animate-in fade-in-0 duration-200" : ""}>
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
        </div>
      </CommandList>
    </CommandDialog>
  )
}
