import notesList from "../.generated/notes-list.json"

export const NOTES_PER_PAGE = 10

export interface NoteEntry {
  slug: string
  title: string
  description: string | null
  summary: string | null
  date: string | null
  dateRaw: string | null
  tags: string[]
  draft: boolean
}

export function filterNotes(notes: NoteEntry[], tag: string, sort: string) {
  return notes.filter(note => !tag || note.tags.includes(tag)).sort((a, b) =>
    (sort === "title" ? a.title.localeCompare(b.title) : (b.dateRaw ?? "").localeCompare(a.dateRaw ?? "")) || a.slug.localeCompare(b.slug))
}

export async function getSortedNotes() {
  return notesList.filter((f) => !f.draft)
}

export function getTotalPages(totalNotes: number): number {
  return Math.max(1, Math.ceil(totalNotes / NOTES_PER_PAGE))
}

export function paginateNotes<T>(notes: T[], page: number): T[] {
  const start = (page - 1) * NOTES_PER_PAGE
  return notes.slice(start, start + NOTES_PER_PAGE)
}
