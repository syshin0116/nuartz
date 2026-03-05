"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { NavSidebar } from "./nav-sidebar"
import { cn } from "@/lib/utils"
import type { FileTreeNode } from "nuartz"

interface CollapsibleSidebarProps {
  tree: FileTreeNode[]
  open: boolean
}

export function CollapsibleSidebar({ tree, open }: CollapsibleSidebarProps) {
  return (
    <aside
      className={cn(
        "relative hidden lg:block shrink-0 border-r transition-[width] duration-200 overflow-hidden",
        open ? "w-[var(--sidebar-width)]" : "w-0"
      )}
    >
      <div
        className={cn(
          "transition-opacity duration-150",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <ScrollArea className="sticky top-14 h-[calc(100vh-3.5rem)]">
          <div className="px-3 py-4">
            <NavSidebar tree={tree} />
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}
