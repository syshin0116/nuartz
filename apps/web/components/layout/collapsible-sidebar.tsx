"use client"

import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NavSidebar } from "./nav-sidebar"
import { cn } from "@/lib/utils"
import type { FileTreeNode } from "nuartz"

export function CollapsibleSidebar({ tree }: { tree: FileTreeNode[] }) {
  const [open, setOpen] = useState(true)

  return (
    <div
      className={cn(
        "relative hidden lg:flex shrink-0 transition-[width] duration-200",
        open ? "w-[var(--sidebar-width)]" : "w-0"
      )}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors"
        title={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        {open ? (
          <PanelLeftClose className="h-3 w-3" />
        ) : (
          <PanelLeftOpen className="h-3 w-3" />
        )}
      </button>

      <aside
        className={cn(
          "w-full border-r transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <ScrollArea className="sticky top-14 h-[calc(100vh-3.5rem)]">
          <div className="p-4">
            <NavSidebar tree={tree} />
          </div>
        </ScrollArea>
      </aside>
    </div>
  )
}
