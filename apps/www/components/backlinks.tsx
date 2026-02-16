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
      <ul className="space-y-3">
        {backlinks.map((bl) => (
          <li key={bl.slug}>
            <Link
              href={`/${bl.slug}`}
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
    </section>
  )
}
