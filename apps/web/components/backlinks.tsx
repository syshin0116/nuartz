import Link from "next/link"
import type { BacklinkEntry } from "nuartz"

interface BacklinksProps {
  backlinks: BacklinkEntry[]
}

export function Backlinks({ backlinks }: BacklinksProps) {
  if (!backlinks.length) return null

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Linked from ({backlinks.length})
      </h2>
      <BacklinkList backlinks={backlinks.slice(0, 4)} />
      {backlinks.length > 4 && <details className="mt-4"><summary className="mb-3 cursor-pointer text-sm text-muted-foreground">Show {backlinks.length - 4} more references</summary><BacklinkList backlinks={backlinks.slice(4)} /></details>}
    </section>
  )
}

function BacklinkList({ backlinks }: BacklinksProps) {
  return <ul className="space-y-3">
        {backlinks.map((bl) => (
          <li key={bl.slug}>
            <Link
              href={bl.slug === "index" ? "/" : `/${bl.slug}`}
              className="group block rounded-lg border p-3 hover:bg-muted transition-colors"
            >
              <div className="text-sm font-medium group-hover:underline">{bl.title}</div>
              <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {bl.excerpt}
              </div>
            </Link>
          </li>
        ))}
      </ul>
}
