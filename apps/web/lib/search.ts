export interface SearchEntry {
  slug: string
  title: string
  content: string
  tags: string[]
  description?: string
}

export function searchNotes(entries: SearchEntry[], query: string) {
  const tokens = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
  return entries.filter(entry => tokens.every(token =>
    `${entry.title} ${entry.slug} ${entry.content} ${entry.tags.join(" ")}`.toLocaleLowerCase().includes(token)))
    .sort((a, b) => Number(b.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())) - Number(a.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())) || a.title.localeCompare(b.title))
    .map(entry => {
      const position = entry.content.toLocaleLowerCase().indexOf(tokens[0] ?? "")
      const start = Math.max(0, position - 60)
      const text = position < 0 && entry.description ? entry.description : entry.content
      return { ...entry, excerpt: `${start ? "…" : ""}${text.slice(start, start + 220)}${text.length > start + 220 ? "…" : ""}` }
    })
}
