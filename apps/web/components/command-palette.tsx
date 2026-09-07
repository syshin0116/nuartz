"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Hash, Loader2, Search } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { searchNotes, type SearchEntry } from "@/lib/search"

interface Result { slug: string; title: string; excerpt: string; type: "note" | "tag" }
interface Pagefind {
  init: () => Promise<void>
  search: (query: string) => Promise<{ results: { data: () => Promise<{ url: string; meta?: { title?: string }; excerpt?: string }> }[] }>
}
let pagefind: Promise<Pagefind | null> | undefined
let searchIndex: Promise<SearchEntry[]> | undefined
function loadIndex() {
  return searchIndex ??= fetch("/api/search").then(response => {
    if (!response.ok) throw new Error("Search unavailable")
    return response.json() as Promise<SearchEntry[]>
  }).catch(error => { searchIndex = undefined; throw error })
}
function loadPagefind() {
  return pagefind ??= (Function('return import("/pagefind/pagefind.js")')() as Promise<Pagefind>)
    .then(async module => { await module.init(); return module }).catch(() => null)
}
function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.replace(/^#/, "").trim().split(/\s+/).filter(Boolean)
  if (!words.length) return text
  const pattern = new RegExp(`(${words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi")
  return text.split(pattern).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part)
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") { event.preventDefault(); setOpen(value => !value) }
    }
    const show = () => setOpen(true)
    document.addEventListener("keydown", keyboard)
    window.addEventListener("nuartz:search", show)
    return () => { document.removeEventListener("keydown", keyboard); window.removeEventListener("nuartz:search", show) }
  }, [])

  useEffect(() => {
    if (!open) return
    void loadPagefind()
    if (!query.trim()) { setResults([]); setTotal(0); setBusy(false); setError(false); return }
    let cancelled = false
    setBusy(true)
    setError(false)
    setResults([])
    const timer = setTimeout(async () => {
      try {
        const q = query.trim()
        const pf = await loadPagefind()
        let found: Result[], count: number
        if (q.startsWith("#")) {
          found = [...new Set((await loadIndex()).flatMap(entry => entry.tags))]
            .filter(tag => tag.toLocaleLowerCase().includes(q.slice(1).toLocaleLowerCase())).sort()
            .map(tag => ({ slug: `tags/${encodeURIComponent(tag)}`, title: `#${tag}`, excerpt: "Browse tagged notes", type: "tag" }))
          count = found.length
          found = found.slice(0, limit)
        } else if (pf) {
          const response = await pf.search(q)
          count = response.results.length
          found = (await Promise.all(response.results.slice(0, limit).map(result => result.data()))).map(data => {
            const slug = new URL(data.url, location.origin).pathname.replace(/^\//, "").replace(/(?:\/index)?\.html$/, "").replace(/\/$/, "")
            return { slug, title: data.meta?.title ?? decodeURIComponent(slug), excerpt: new DOMParser().parseFromString(data.excerpt ?? "", "text/html").body.textContent ?? "", type: "note" as const }
          })
        } else {
          const matches = searchNotes(await loadIndex(), q)
          count = matches.length
          found = matches.slice(0, limit).map(entry => ({ ...entry, type: "note" }))
        }
        if (!cancelled) { setResults(found); setTotal(count) }
      } catch { if (!cancelled) { setResults([]); setError(true) } }
      finally { if (!cancelled) setBusy(false) }
    }, 150)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [open, query, limit, attempt])

  return <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false} title="Search notes" description="Search by title, path, content, or tag.">
    <CommandInput placeholder="Search notes or type # for tags…" value={query} onValueChange={value => { setQuery(value); setLimit(20) }} />
    <CommandList className="max-h-[65dvh]">
      {!query.trim() && <div className="flex items-center gap-3 p-6 text-sm text-muted-foreground"><Search className="size-4" />Find a note by title, path, or content.</div>}
      {busy && <div role="status" className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Searching…</div>}
      {error && <div className="p-4 text-sm">Search is unavailable. <button className="underline" onClick={() => setAttempt(value => value + 1)}>Retry</button></div>}
      {!busy && !error && query.trim() && !results.length && <CommandEmpty>No results for “{query}”.</CommandEmpty>}
      {!!results.length && <CommandGroup heading={`${total} ${total === 1 ? "result" : "results"}`}>
        {results.map(result => <CommandItem key={result.slug} value={result.slug || "index"} className="items-start gap-3 px-3 py-3" onSelect={() => {
          router.push(result.slug === "index" ? "/" : `/${result.slug}`); setOpen(false); setQuery("")
        }}>
          {result.type === "tag" ? <Hash className="mt-1 size-4" /> : <FileText className="mt-1 size-4" />}
          <div className="min-w-0 flex-1">
            <div className="font-medium"><Highlight text={result.title} query={query} /></div>
            {result.type === "note" && <div className="mt-0.5 truncate text-[11px] text-muted-foreground"><Highlight text={decodeURIComponent(result.slug) || "Home"} query={query} /></div>}
            <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"><Highlight text={result.excerpt} query={query} /></div>
          </div>
        </CommandItem>)}
        {total > results.length && <CommandItem value="load-more" onSelect={() => setLimit(value => value + 20)} className="justify-center py-3">Show more results ({total - results.length} remaining)</CommandItem>}
      </CommandGroup>}
    </CommandList>
    <div className="flex gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground"><span>↑ ↓ to move</span><span>↵ to open</span><span className="ml-auto">Esc to close</span></div>
  </CommandDialog>
}
