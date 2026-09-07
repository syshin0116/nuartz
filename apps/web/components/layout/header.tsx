"use client"

import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ReaderModeToggle } from "@/components/reader-mode-toggle"
import { TooltipProvider } from "@/components/ui/tooltip"
import { MobileNav } from "./mobile-nav"
import type { FileTreeNode } from "nuartz"

type NavLink = { label: string; href: string; external?: boolean }

export function Header({ title = "Nuartz", tree, links = [] }: { title?: string; tree: FileTreeNode[]; links?: NavLink[] }) {
  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-2 px-4 sm:px-6">
          <Link href="/" className="mr-auto flex min-w-0 items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded bg-foreground text-xs text-background">{title[0]}</span>
            <span className="truncate">{title}</span>
          </Link>
          <Button variant="outline" size="sm" className="hidden gap-2 text-muted-foreground sm:flex" onClick={() => window.dispatchEvent(new Event("nuartz:search"))}>
            <Search className="size-4" /><span>Search notes</span><kbd className="ml-4 rounded border px-1 text-[10px]">⌘K</kbd>
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search notes" onClick={() => window.dispatchEvent(new Event("nuartz:search"))}><Search className="size-4" /></Button>
          <nav aria-label="Site links" className="hidden items-center gap-4 px-3 text-sm lg:flex">
            {links.map(link => <a key={link.href} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined} className="text-muted-foreground hover:text-foreground">{link.label}</a>)}
          </nav>
          <div className="hidden items-center lg:flex"><ReaderModeToggle /><ThemeToggle /></div>
          <MobileNav tree={tree} title={title} links={links} />
        </div>
      </header>
    </TooltipProvider>
  )
}
