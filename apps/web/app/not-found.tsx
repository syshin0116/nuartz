import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { OpenSearchButton } from "@/components/open-search-button"
import config from "@/nuartz.config"

export const metadata: Metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-6 py-24">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold tracking-tight">This note does not exist</h1>
      <p className="text-muted-foreground">It may have been renamed, moved, or kept private.</p>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button asChild><Link href="/">Home</Link></Button>
        <Button asChild variant="outline"><Link href="/notes">All notes</Link></Button>
        {config.features.search && <OpenSearchButton />}
      </div>
    </div>
  )
}
