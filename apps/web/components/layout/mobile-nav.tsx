"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ReaderModeToggle } from "@/components/reader-mode-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavSidebar } from "./nav-sidebar"
import type { FileTreeNode } from "nuartz"

export function MobileNav({ tree, title, links }: {
  tree: FileTreeNode[]
  title: string
  links: { label: string; href: string; external?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => { setOpen(false) }, [pathname])
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></Button></SheetTrigger>
      <SheetContent side="left" className="w-[min(90vw,360px)] gap-0">
        <SheetHeader className="border-b"><SheetTitle>{title}</SheetTitle><SheetDescription className="sr-only">Browse notes and site links.</SheetDescription></SheetHeader>
        <div className="flex-1 overflow-y-auto p-4" onClick={event => { if ((event.target as HTMLElement).closest("a")) setOpen(false) }}><NavSidebar tree={tree} /></div>
        <div className="flex items-center gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <nav aria-label="Site links" className="mr-auto flex flex-wrap gap-3 text-sm">{links.map(link => <a key={link.href} href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined}>{link.label}</a>)}</nav>
          <ReaderModeToggle /><ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  )
}
