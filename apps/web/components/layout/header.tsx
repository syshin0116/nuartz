"use client"

import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileNav } from "./mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import type { FileTreeNode } from "nuartz"

interface HeaderProps {
  title?: string
  tree: FileTreeNode[]
}

export function Header({ title = "nuartz", tree }: HeaderProps) {
  const openSearch = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-4">
        <MobileNav tree={tree} />

        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span>{title}</span>
        </Link>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-muted-foreground"
          onClick={openSearch}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search</span>
          <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ⌘K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" className="sm:hidden" onClick={openSearch}>
          <Search className="h-4 w-4" />
        </Button>

        <ThemeToggle />
      </div>
    </header>
  )
}
