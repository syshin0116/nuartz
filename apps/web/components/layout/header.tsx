"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Search, Github, Moon, Sun, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { NavSidebar } from "./nav-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { ReaderModeToggle } from "@/components/reader-mode-toggle"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import type { FileTreeNode } from "nuartz"

interface HeaderProps {
  title?: string
  tree: FileTreeNode[]
}

export function Header({ title = "Nuartz", tree }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = usePathname()

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  const openSearch = () => {
    setMenuOpen(false)
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    )
  }

  const toggleReaderMode = () => {
    const isActive = document.documentElement.classList.toggle("reader-mode")
    localStorage.setItem("reader-mode", String(isActive))
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-2 px-6 lg:px-8">
          <TooltipProvider>
            <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background text-xs font-bold select-none">
                N
              </span>
              <span>{title}</span>
            </Link>

            <div className="flex-1" />

            {/* Desktop: search bar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 text-muted-foreground h-8 px-3"
                  onClick={openSearch}
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="text-sm text-muted-foreground/70">Search...</span>
                  <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    ⌘K
                  </kbd>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search notes</TooltipContent>
            </Tooltip>

            {/* Mobile: search icon */}
            <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8" onClick={openSearch}>
              <Search className="h-4 w-4" />
            </Button>

            {/* Desktop only: GitHub, Reader, Theme */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden lg:flex h-8 w-8" asChild>
                  <a href="https://github.com/syshin0116/nuartz" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>GitHub</TooltipContent>
            </Tooltip>

            <div className="hidden lg:flex">
              <ReaderModeToggle />
            </div>
            <div className="hidden lg:flex">
              <ThemeToggle />
            </div>

            {/* Mobile: hamburger ↔ X */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <div className="relative h-4 w-4">
                <span
                  className="absolute left-0 top-0.5 h-[2px] w-4 rounded-full bg-current transition-all duration-300 origin-center"
                  style={menuOpen ? { top: "7px", transform: "rotate(45deg)" } : {}}
                />
                <span
                  className="absolute left-0 top-[7px] h-[2px] w-4 rounded-full bg-current transition-all duration-300"
                  style={menuOpen ? { opacity: 0 } : {}}
                />
                <span
                  className="absolute left-0 bottom-0.5 h-[2px] w-4 rounded-full bg-current transition-all duration-300 origin-center"
                  style={menuOpen ? { bottom: "7px", transform: "rotate(-45deg)" } : {}}
                />
              </div>
            </Button>
          </TooltipProvider>
        </div>
      </header>

      {/* Mobile nav overlay */}
      <div
        className="lg:hidden fixed left-0 right-0 bottom-0 flex-col bg-background"
        style={{
          top: "3.5rem",
          zIndex: 40,
          display: menuOpen ? "flex" : "none",
        }}
      >
        <button
          onClick={openSearch}
          className="flex items-center gap-2 mx-4 mt-4 px-3 py-2 rounded-md border text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-auto text-[10px] border rounded px-1.5 py-0.5 bg-muted">⌘K</kbd>
        </button>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <NavSidebar tree={tree} />
        </div>

        <Separator />
        <div className="flex items-center justify-end gap-1 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href="https://github.com/syshin0116/nuartz" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleReaderMode}>
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </>
  )
}
