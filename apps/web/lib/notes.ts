import notesList from "@/.generated/notes-list.json"

export const NOTES_PER_PAGE = 10

export type NoteEntry = (typeof notesList)[number]

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
