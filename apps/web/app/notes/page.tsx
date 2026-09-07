import { Suspense } from "react"
import { NotesBrowser } from "@/components/notes-browser"
import { getSortedNotes } from "@/lib/notes"

export const metadata = { title: "All notes" }

export default async function NotesPage() {
  return <Suspense fallback={<p role="status" className="p-6 text-muted-foreground">Loading notes…</p>}><NotesBrowser notes={await getSortedNotes()} /></Suspense>
}
