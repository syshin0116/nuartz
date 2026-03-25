"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TocEntry } from "nuartz"

interface TocProps {
  toc: TocEntry[]
  className?: string
  children?: React.ReactNode
}

export function TableOfContents({ toc, className, children }: TocProps) {
  const [activeId, setActiveId] = useState<string>("")
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    if (!headings.length) return

    const headingIds = [...headings].map((h) => h.id)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const id = visible[0].target.id
          setActiveId(id)
          setActiveIndex(headingIds.indexOf(id))
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  if (!toc.length && !children) return null

  return (
    <aside
      className={cn(
        "hidden w-[var(--toc-width)] shrink-0 xl:block",
        className
      )}
    >
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pl-4 scroll-mask">
        {/* Graph view sits at the top */}
        {children}
        {toc.length > 0 && (
          <nav aria-label="Table of contents">
            <p className="mb-3 mt-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              On this page
            </p>
            <TocList entries={toc} activeId={activeId} depth={0} />

            {/* Back to top */}
            <button
              onClick={scrollToTop}
              className={cn(
                "mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-200",
                activeIndex >= 2 ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <ArrowUp className="h-3 w-3" />
              Scroll to top
            </button>
          </nav>
        )}
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
    <ul className={cn("space-y-0.5", depth > 0 && "ml-3")}>
      {entries.map((entry) => (
        <li key={entry.id}>
          <a
            href={`#${entry.id}`}
            onClick={(e) => scrollTo(e, entry.id)}
            className={cn(
              "block border-l-2 py-1 pl-3 transition-colors duration-150 hover:text-foreground",
              depth === 0 ? "text-[13px]" : "text-xs",
              activeId === entry.id
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground"
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
