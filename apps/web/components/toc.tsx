"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { ArrowUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TocEntry } from "nuartz"

export function TableOfContents({ toc, className, children, mobile = false }: {
  toc: TocEntry[]; className?: string; children?: React.ReactNode; mobile?: boolean
}) {
  const [activeId, setActiveId] = useState("")
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const pathname = usePathname()
  useEffect(() => {
    let frame = 0
    const headings = [...document.querySelectorAll<HTMLElement>("article.prose :is(h1,h2,h3,h4,h5,h6)[id]")]
    const update = () => {
      frame = 0
      setActiveId(headings.findLast(heading => heading.getBoundingClientRect().top <= 120)?.id ?? headings[0]?.id ?? "")
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame) }
  }, [toc, pathname])
  if (!toc.length && !children) return null

  const findActive = (entries: TocEntry[]): string => {
    for (const entry of entries) {
      if (entry.id === activeId) return entry.text
      const child = findActive(entry.children)
      if (child) return child
    }
    return ""
  }
  const nav = toc.length > 0 && <nav aria-label="Table of contents" onClick={event => {
    if (mobile && (event.target as HTMLElement).closest("a") && detailsRef.current) detailsRef.current.open = false
  }}><TocList entries={toc} activeId={activeId} /></nav>

  if (mobile) return <details ref={detailsRef} className="reading-toc mb-6 rounded-lg border bg-muted/20 xl:hidden">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 text-sm font-medium"><span className="shrink-0">On this page</span><span className="ml-auto truncate text-xs font-normal text-muted-foreground">{findActive(toc)}</span><ChevronDown className="size-4 shrink-0" /></summary>
    <div className="max-h-[60dvh] overflow-y-auto px-3 pb-3">{nav}{children}</div>
  </details>
  return <aside className={cn("hidden w-[var(--toc-width)] shrink-0 xl:block", className)}>
    <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-4 pl-3">
      {toc.length > 0 && <><p className="mb-3 text-xs font-semibold text-muted-foreground">On this page</p>{nav}<a href="#main-content" className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowUp className="size-3" />Back to top</a></>}
      {children}
    </div>
  </aside>
}

function TocList({ entries, activeId, nested = false }: { entries: TocEntry[]; activeId: string; nested?: boolean }) {
  return <ul className={cn("space-y-0.5", nested && "ml-3")}>
    {entries.map(entry => <li key={entry.id}>
      <a href={`#${entry.id}`} aria-current={activeId === entry.id ? "location" : undefined} className={cn("block border-l-2 py-1.5 pl-3 text-[13px] leading-snug hover:text-foreground", activeId === entry.id ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground")}>{entry.text}</a>
      {!!entry.children.length && <TocList entries={entry.children} activeId={activeId} nested />}
    </li>)}
  </ul>
}
