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
    <aside
      className={cn(
        "relative hidden lg:block shrink-0 border-r transition-[width] duration-200 overflow-hidden",
        open ? "w-[var(--sidebar-width)]" : "w-10"
      )}
    >
      {/* Toggle button — always visible at top */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "absolute top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
          open ? "right-2" : "left-1.5"
        )}
        title={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        {open ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeftOpen className="h-4 w-4" />
        )}
      </button>

      {/* Content — fades out when collapsed */}
      <div
        className={cn(
          "transition-opacity duration-150",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <ScrollArea className="sticky top-14 h-[calc(100vh-3.5rem)]">
          <div className="px-4 pt-12 pb-4">
            <NavSidebar tree={tree} />
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}
