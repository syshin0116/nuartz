"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { TocEntry } from "nuartz"

interface TocProps {
  toc: TocEntry[]
  className?: string
  children?: React.ReactNode
}

export function TableOfContents({ toc, className, children }: TocProps) {
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    if (!headings.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [])

  if (!toc.length) return null

  return (
    <aside
      className={cn(
        "hidden w-[var(--toc-width)] shrink-0 xl:block",
        className
      )}
    >
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pl-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </p>
        <TocList entries={toc} activeId={activeId} depth={0} />
        {children}
      </div>
    </aside>
  )
}

function TocList({
  entries,
  activeId,
  depth,
}: {
  entries: TocEntry[]
  activeId: string
  depth: number
}) {
  function scrollTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    history.pushState(null, "", `#${id}`)
  }

  return (
    <ul className="space-y-1">
      {entries.map((entry) => (
        <li key={entry.id} style={{ paddingLeft: `${depth * 12}px` }}>
          <a
            href={`#${entry.id}`}
            onClick={(e) => scrollTo(e, entry.id)}
            className={cn(
              "block text-sm leading-snug transition-colors hover:text-foreground",
              activeId === entry.id
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
          >
            {entry.text}
          </a>
          {entry.children.length > 0 && (
            <TocList entries={entry.children} activeId={activeId} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  )
}
