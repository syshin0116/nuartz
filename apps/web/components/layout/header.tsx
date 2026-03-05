"use client"

import Link from "next/link"
import { Search, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileNav } from "./mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import type { FileTreeNode } from "nuartz"

interface HeaderProps {
  title?: string
  tree: FileTreeNode[]
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
}

export function Header({
  title = "nuartz",
  tree,
  sidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const openSearch = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-1 px-3">
        {/* Sidebar toggle — desktop only */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "hidden lg:flex h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground",
              !sidebarOpen && "text-foreground"
            )}
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Mobile nav */}
        <MobileNav tree={tree} />

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 px-1 text-base font-semibold tracking-tight"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background text-xs font-bold select-none">
            N
          </span>
          <span>{title}</span>
        </Link>

        <div className="flex-1" />

        {/* Search */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-muted-foreground h-8 px-3 text-sm"
          onClick={openSearch}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-muted-foreground/70">Search...</span>
          <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ⌘K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8" onClick={openSearch}>
          <Search className="h-4 w-4" />
        </Button>

        <ThemeToggle />
      </div>
    </header>
  )
}
