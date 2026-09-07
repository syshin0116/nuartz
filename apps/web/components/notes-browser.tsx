"use client"

import { useSearchParams } from "next/navigation"
import { NotesList } from "@/components/notes-list"
import { filterNotes, getTotalPages, paginateNotes, type NoteEntry } from "@/lib/notes"

export function NotesBrowser({ notes }: { notes: NoteEntry[] }) {
  const params = useSearchParams()
  const tag = params.get("tag") ?? ""
  const sort = params.get("sort") === "title" ? "title" : "recent"
  const filtered = filterNotes(notes, tag, sort)
  const totalPages = getTotalPages(filtered.length)
  const page = Math.max(1, Math.min(totalPages, Math.floor(Number(params.get("page"))) || 1))
  const tags = [...new Set(notes.flatMap(note => note.tags))].sort()
  const href = (updates: Record<string, string>) => {
    const query = new URLSearchParams(params)
    for (const [key, value] of Object.entries(updates)) {
      if (!value || (key === "page" && value === "1")) query.delete(key)
      else query.set(key, value)
    }
    return `/notes${query.size ? `?${query}` : ""}`
  }
  const navigate = (url: string) => window.history.pushState(null, "", url)
  return <div onClickCapture={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = (event.target as HTMLElement).closest("a")
    if (!link || link.origin !== location.origin || link.pathname !== "/notes") return
    event.preventDefault()
    navigate(link.href)
    window.scrollTo({ top: 0 })
  }}><NotesList title="All notes" notes={paginateNotes(filtered, page)} totalCount={filtered.length} currentPage={page} totalPages={totalPages} pageHref={page => href({ page: String(page) })} controls={
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <label className="flex min-w-36 flex-1 flex-col gap-1.5 text-xs text-muted-foreground">Tag
        <select value={tag} onChange={event => navigate(href({ tag: event.target.value, page: "1" }))} className="h-10 rounded-md border bg-background px-3 text-sm text-foreground">
          <option value="">All tags</option>
          {tag && !tags.includes(tag) && <option value={tag}>{tag}</option>}
          {tags.map(tag => <option key={tag} value={tag}>#{tag}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">Sort by
        <select value={sort} onChange={event => navigate(href({ sort: event.target.value, page: "1" }))} className="h-10 rounded-md border bg-background px-3 text-sm text-foreground">
          <option value="recent">Newest first</option><option value="title">Title A-Z</option>
        </select>
      </label>
      {tag && <button className="h-10 px-2 text-sm underline underline-offset-4" onClick={() => navigate(href({ tag: "", page: "1" }))}>Clear filter</button>}
    </div>
  } /></div>
}
